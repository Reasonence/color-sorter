const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000"
    }
});

const clients = new Set();

let commandLog = [];

function broadcast(name, ...args) {
    clients.forEach((client) => {
        client.emit('LINE', name, ...args);
    });
}

io.on("connection", (socket) => {
    clients.add(socket);
    console.log("> CLIENT CONNECTED");

    commandLog.forEach(loggedCommand => {
        broadcast(...loggedCommand);
    });

    socket.on('disconnect', () => {
       clients.delete(socket);
    });
});



httpServer.listen(3001);

const { SerialPort } = require('serialport')

const port = new SerialPort({
    path: '/dev/ttyUSB0',
    baudRate: 9600,
});

let buffer = '';

function processBuffer() {
    let i = buffer.indexOf('\n');

    while (i >= 0 && buffer.length > 0) {
        i = buffer.indexOf('\n')

        const line = buffer.substring(0, i + 1).trim();
        const freshLine = line.substring(line.indexOf('>'));
        console.log('LINE:', freshLine);

        if (freshLine[0] === '>') {
            const splitted = freshLine.substring(1).trim().replace(/\s+/ig, ' ').split(' ');

            const name = splitted[0].trim();
            const args = splitted.slice(1).map(arg => arg.trim());

            if (name === 'READY') {
                commandLog = [];
            }

            commandLog.push([name, ...args]);
            broadcast(name, ...args);
        }

        buffer = buffer.substring(i + 1);
    }
}

port.on('data', function (data) {
    const str = `${data}`;
    buffer += str;

    processBuffer();
});