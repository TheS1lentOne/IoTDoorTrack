#include <WiFi.h>
#include <WiFiManager.h>
#include <NTPClient.h>
#include <WiFiUDP.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ─── Pins ───────────────────────────────────────────────
const int LED_PIN   = 3;
const int SENSOR_PIN = 2;   // reed switch (INPUT_PULLUP)
const int ALARM_PIN  = 23;

// ─── Χρονόμετρο (5 λεπτά) ───────────────────────────────
const unsigned long DOOR_LIMIT = 300000UL; // 5 min σε ms

// ─── NTP ────────────────────────────────────────────────
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "time.google.com", 0, 60000);

// ─── State ──────────────────────────────────────────────
int  lastState        = -1;
unsigned long doorOpenedTime = 0;
bool alarmSent        = false;  

// ─── Αποστολή εγγραφής στη βάση ─────────────────────────
int sendAlert() {
  if (WiFi.status() != WL_CONNECTED) return -1;

  HTTPClient http;
  http.begin("https://my-door-app.vercel.app/api/data");
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<200> doc;
  doc["deviceId"] = "door1";
  doc["time"]     = (unsigned long)timeClient.getEpochTime();
  doc["event"]    = "door_open_timeout"; 

  String body;
  serializeJson(doc, body);
  Serial.println("POST → " + body);

  int code = http.POST(body);
  Serial.print("HTTP: "); Serial.println(code);
  Serial.println(http.getString());
  http.end();
  return code;
}


void setup() {
  Serial.begin(115200);
  delay(300);

  pinMode(SENSOR_PIN, INPUT_PULLUP);
  pinMode(LED_PIN,    OUTPUT);
  pinMode(ALARM_PIN,  OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // WiFiManager – portal "ESP32-Setup" αν δεν υπάρχει αποθηκευμένο δίκτυο
  WiFiManager wm;
  wm.setDebugOutput(false);
  wm.setConfigPortalTimeout(180);

  if (wm.autoConnect("ESP32-Setup")) {
    digitalWrite(LED_PIN, HIGH);
    Serial.println("WiFi συνδέθηκε!");

    timeClient.begin();
    timeClient.update();
    while (!timeClient.isTimeSet()) {
      timeClient.update();
      delay(500);
    }
    Serial.print("Epoch time: ");
    Serial.println(timeClient.getEpochTime());
  } else {
    Serial.println("Αποτυχία σύνδεσης – επανεκκίνηση...");
    delay(3000);
    ESP.restart();
  }
}

void loop() {
  // Ανανέωση NTP
  if (WiFi.status() == WL_CONNECTED) timeClient.update();

  int currentState = digitalRead(SENSOR_PIN);

  // 1.αλλαγή κατάστασης
  if (currentState != lastState) {

    if (currentState == HIGH) {
      // ── Πόρτα άνοιξε ──
      Serial.println("Η πόρτα άνοιξε!");
      digitalWrite(LED_PIN, HIGH);
      doorOpenedTime = millis();
      alarmSent      = false;   // reset για νέο κύκλο

    } else {
      // ── Πόρτα έκλεισε ──
      Serial.println("Η πόρτα έκλεισε!");
      digitalWrite(LED_PIN, LOW);
      noTone(ALARM_PIN);
      doorOpenedTime = 0;
      alarmSent      = false;
    }

    lastState = currentState;
  }

  // 2. Έλεγχος χρόνου 
  if (currentState == HIGH && doorOpenedTime != 0) {
    unsigned long elapsed = millis() - doorOpenedTime;

    if (elapsed >= DOOR_LIMIT) {
      // Συναγερμός ήχου (συνεχής)
      tone(ALARM_PIN, 300);

      // Αποστολή εγγραφής 
      if (!alarmSent) {
        Serial.println("ΣΥΝΑΓΕΡΜΟΣ! Πόρτα ανοιχτή > 5 λεπτά – αποστολή...");
        int code = sendAlert();
        if (code == 200) {
          Serial.println("Εγγραφή αποστάλθηκε OK");
        } else {
          Serial.print("Σφάλμα αποστολής: ");
          Serial.println(code);
        }
        alarmSent = true;
      }
    }
  }

  delay(100);
}