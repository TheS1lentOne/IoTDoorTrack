# IoTDoorTrack
IoT system developed for International Hellenic University project related with IoT
# Smart Door Monitoring System

This project is a real-time IoT solution designed to monitor door states and alert users via Telegram if a door is left open for too long. It was developed as a university project to demonstrate the integration of hardware, serverless backend architecture, and real-time messaging services.

### Project Overview
The system tracks a door's status using a magnetic sensor. Unlike standard monitors that log every movement, this device uses local logic to trigger an alert only when a specific condition is met: if the door remains open for more than 5 minutes (configurable), the system sends a notification and logs the event.

### Core Components
The project is divided into three main logical parts:

* Firmware (ESP32): The hardware layer uses an ESP32 microcontroller and a reed switch. It features a local timer that starts the moment a door is opened. To keep the code portable, I implemented WiFiManager for easy network setup and NTP for precise timestamping.
* Database & Logic (SpacetimeDB): I used SpacetimeDB to store the history of these alerts. This database provides an out-of-the-box WebSocket connection, ensuring that any new alert recorded in the database is instantly visible on the frontend.
* Dashboard & Notifications: The web interface provides a live view of these "timeout" events. For the alerting mechanism, I integrated a Telegram Bot API. When the ESP32 detects the 5-minute limit has been reached, the backend triggers a message directly to the user's Telegram.

### System Architecture & Data Flow
1. Detection & Timing: The ESP32 detects the door is open. It waits for 5 minutes. If the door isn't closed during this window, it prepares an alert.
2. Transmission: The device sends an HTTP POST request containing the device ID and the exact epoch time to a Vercel serverless function.
3. Storage & Alerting: The Vercel function logs the "door_open_timeout" event in SpacetimeDB and simultaneously calls the Telegram Bot API to notify the user.
4. Live Update: The database pushes the new record to the React Dashboard via WebSockets for real-time monitoring.

### Repository Structure
The code is organized into three distinct modules:
* /esp32: The Arduino/C++ source code, including the local timer logic and sensor debouncing.
* /database: The SpacetimeDB schema and the server-side reducers for data insertion.
* /web: The React application and the Vercel API functions that bridge the hardware to the bot and database.

### Deployment Summary
The system is designed to be low-maintenance, using Vercel for serverless hosting. To link the components securely, the following environment variables must be configured in Vercel:
* SPACETIMEDB_TOKEN: The private token required to authenticate and write to your SpacetimeDB instance.
* TELEGRAM_BOT_TOKEN: The unique token from BotFather.
* TELEGRAM_CHAT_ID: The specific ID where the alerts will be sent.
