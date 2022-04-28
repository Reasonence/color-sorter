import {makeAutoObservable} from "mobx";
import {io} from "socket.io-client";

export const colors = {
    'B': '#29a6ff',
    'O': '#ffc042',
    'G': '#73cc14'
};

const store = new class {
    isReady = false;

    mainServoAngle = 180;
    releaseServoAngle = 0;
    station = 0;

    isTraveling = false;
    startStation = 0;
    endStation = 0;

    lastColor = '';
    lastHue = 0;
    lastHueTime = 0;

    gateOpen = false;

    bucketDistances = [100, 100, 100];

    constructor() {
        makeAutoObservable(this, {}, {autoBind: true})
    }

    ready() {
        this.isReady = true;

        this.mainServoAngle = 180;
        this.releaseServoAngle = 0;
        this.station = 0;
        this.isTraveling = false;
        this.startStation = 0;
        this.endStation = 0;
        this.lastColor = '';
        this.lastHue = 0;
        this.lastHueTime = 0;
        this.gateOpen = false;
        this.bucketDistances = [100, 100, 100];
    }

    setMainServo(angle) {
        this.mainServoAngle = angle;
    }

    setReleaseServo(angle) {
        this.releaseServoAngle = angle;
    }

    reached(station) {
        this.station = station;
        this.isTraveling = false;
    }

    traveling(fromStation, toStation) {
        this.isTraveling = true;
        this.startStation = fromStation;
        this.endStation = toStation;
    }

    setHue(hue) {
        this.lastHue = hue;
        this.lastHueTime = Date.now();
    }

    color(color) {
        this.lastColor = color;
    }

    bucketDistance(station, distance) {
        this.bucketDistances[station] = distance;
    }

    setGate(isOpen) {
        this.gateOpen = isOpen;
    }

    get properColor()  {
        return ({
            'O': 'Orange',
            'B': 'Blue',
            'G': 'Green'
        })[this.lastColor];
    }

    get colorCode() {
        return (colors)[this.lastColor];
    }
};

export default store;

const socket = io("ws://localhost:3001");

socket.on('LINE', (name, ...args) => {
    console.log('LINE:', name, ...args);

    ({
        'READY': () => {
            store.ready()
        },
        'HUE': (rawHue) => {
            const hue = parseFloat(rawHue);
            store.setHue(hue);
        },
        'COLOR': (color) => {
            store.color(color);
        },
        'REACH': (rawStation) => {
            const station = parseInt(rawStation);
            store.reached(station);
            store.color('');
        },
        'STATION-DISTANCE': (rawStation, rawDistance) => {
            const station = parseInt(rawStation);
            const distance = parseInt(rawDistance);

            store.bucketDistance(station, distance);
        },
        'GATE': (state) => {
            store.setGate(state === 'OPEN');
        },
        'SERVO': (servo, rawAngle) => {
            const angle = parseFloat(rawAngle);

            if (servo === 'MAIN') {
                store.setMainServo(angle);
            } else if (servo === 'RELEASE') {
                store.setReleaseServo(angle);
            }
        },
        'STATION': (rawFromStation, rawToStation) => {
            const fromStation = parseInt(rawFromStation);
            const toStation = parseInt(rawToStation);

            store.traveling(fromStation, toStation);
        }
    }[name.trim()] || (() => {}))(...args);
});