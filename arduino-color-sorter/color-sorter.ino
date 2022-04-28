
#include <Servo.h>

#define S0 4
#define S1 2
#define S2 12
#define S3 7
#define sensorOut 8

#define echoPin 5
#define trigPin 3

Servo mainServo;
Servo releaseServo;

long duration;
int distance;
 
double r = 0;
double g = 0;
double b = 0;

double arm_a = 9.5;
double arm_b = 12.5;

int initialSamples = 20;

int ar = 0;
int ag = 0;
int ab = 0;

void setup() {
  // SONAR
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);

  // SERVO
  mainServo.attach(9);
  releaseServo.attach(11);

  releaseServo.write(0);
  mainServo.write(180);

  // MISC
  Serial.begin(9600);

  // COLOR
  pinMode(S0, OUTPUT);
  pinMode(S1, OUTPUT);
  pinMode(S2, OUTPUT);
  pinMode(S3, OUTPUT);
  
  pinMode(sensorOut, INPUT);
  
  digitalWrite(S0,HIGH);
  digitalWrite(S1,LOW);

  long long int rsum = 0;
  long long int gsum = 0;
  long long int bsum = 0;

  for (int i = 0; i < initialSamples; i++) {
    delay(100);
    rsum += getRedPW();
    
    delay(100);
    gsum += getGreenPW();
    
    delay(100);
    bsum += getBluePW();
  }

  ar = rsum / initialSamples;
  ag = gsum / initialSamples;
  ab = bsum / initialSamples;

  Serial.println("> READY");
}

double cap(int val) {
  return val < 0 ? val * -1.0 : 0.0;
}

void writeServo(Servo servo, int pos) {
  servo.write(pos);
}

void tweenServo(int servoIndex, int from, int to, int del = 40) {
  Servo servo = servoIndex == 0 ? mainServo : releaseServo;
  
  if (from > to) {
    for (int i = from; i >= to; i -= 1) {
      writeServo(servo, i);

      Serial.print("> SERVO ");
      Serial.print(servoIndex == 0 ? "MAIN " : "RELEASE ");
      Serial.println(i);
      
      delay(del);
    }
  } else {
    for (int i = from; i <= to; i += 1) {
      writeServo(servo, i);

      Serial.print("> SERVO ");
      Serial.print(servoIndex == 0 ? "MAIN " : "RELEASE ");
      Serial.println(i);

      delay(del);
    }
  }
}

int getStationAngle(int station) {
  return station == 0 ? 180 : station == 1 ? 35 : 5;
}

void mainTravel(int fromStation, int toStation) {
  Serial.print("> STATION ");
  Serial.print(fromStation);
  Serial.print(" ");
  Serial.println(toStation);
  
  if (fromStation != toStation) {
    tweenServo(0, getStationAngle(fromStation), getStationAngle(toStation));
  }
}

int lastStation = 0;
int loopCount = 0;

int concensus = 5;
int colorCounts[3];

int measureDistance() {
  // SONAR code
  // Clears the trigPin condition
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  
  // Sets the trigPin HIGH (ACTIVE) for 10 microseconds
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  // Reads the echoPin, returns the sound wave travel time in microseconds
  duration = pulseIn(echoPin, HIGH);
  distance = duration * 0.034 / 2;
  
  Serial.print("> DIST ");
  Serial.println(distance);

  return distance;
}

void openGate() {
  Serial.println("> GATE OPEN");
  tweenServo(1, 0, 60, 15);
}

void closeGate() {
  Serial.println("> GATE CLOSE");
  tweenServo(1, 60, 0, 15);
}

void loop() {
  delay(200);
  
  r = cap(getRedPW() - ar);
  delay(50);
  
  g = cap(getGreenPW() - ag);
  delay(50);
  
  b = cap(getBluePW() - ab);
  delay(50);

  if ((r + g + b) > 30) {
    double hue = rgbToHue(r, g, b);

    Serial.print("> HUE ");
    Serial.println(hue);

    if (hue <= 200.0 && hue > 165.0) {
      // BLUE
      Serial.println("> COLOR B");
      colorCounts[0]++;
    } else if (hue <= 100) {
      // ORANGE
      Serial.println("> COLOR O");
      colorCounts[1]++;
    } else {
      // GREEN
      Serial.println("> COLOR G");
      colorCounts[2]++;
    }
  }

  loopCount++;

  if (loopCount == concensus) {
    loopCount = 0;

    if (colorCounts[0] + colorCounts[1] + colorCounts[2] >= concensus) {
      if (colorCounts[0] > colorCounts[1] && colorCounts[0] > colorCounts[2]) {
        // BLUE - Sation 0
        lastStation = 0;
      } else if (colorCounts[1] > colorCounts[0] && colorCounts[1] > colorCounts[2]) {
        // ORANGE - Sation 1
        lastStation = 1;
      } else {
        // GREEN - Sation 2
        lastStation = 2;
      }

      mainTravel(0, lastStation);
      Serial.print("> REACH ");
      Serial.println(lastStation);
  
      int dist = measureDistance();
      Serial.print("> STATION-DISTANCE ");
      Serial.print(lastStation);
      Serial.print(" ");
      Serial.println(distance);
      
      openGate();
      closeGate();
  
      mainTravel(lastStation, 0);
      Serial.println("> REACH 0");
    }

    colorCounts[0] = colorCounts[1] = colorCounts[2] = 0;
  }
}
 

int getRedPW() {
  digitalWrite(S2, LOW);
  digitalWrite(S3, LOW);
  
  int PW;

  PW = pulseIn(sensorOut, LOW);
  
  return PW;
}
 

int getGreenPW() {
  digitalWrite(S2, HIGH);
  digitalWrite(S3, HIGH);

  int PW;

  PW = pulseIn(sensorOut, LOW);
  
  return PW;
}

int getBluePW() {
  digitalWrite(S2, LOW);
  digitalWrite(S3, HIGH);
  
  int PW;

  PW = pulseIn(sensorOut, LOW);
  
  return PW;
}

double rgbToHue(double r, double g, double b) {
  double l = max(r, max(g, b));
  double s = l - min(r, min(g, b));

  double h = s
    ? l == r
    ? (g - b) / s
    : l == g
    ? 2.0 + (b - r) / s
    : 4.0 + (r - g) / s
    : 0;

  return 60.0 * h < 0.0 ? 60.0 * h + 360.0 : 60.0 * h;
}
