# SpacePulse

A health monitoring dashboard for astronauts on long-duration missions. It collects health indicators, shows them live, and warns the astronaut when a value goes out of range, with a suggested action.

## Live demo
https://spacepulse-3xvq.onrender.com

## Features
- Login page
- Dashboard with astronaut profile and live health status
- Live vitals in three categories: Physiology, Environment (cabin CO2, radiation, gravity), Behavioral & Cognitive (workload, schedule adherence)
- Live charts and out-of-range alerts
- Alert history with suggested actions
- Medical profile page with personal notes
- Daily schedule with task tracking

## Tech
HTML, CSS and JavaScript frontend, Chart.js for charts, Node.js with WebSocket (`ws`) for the mock sensor server.

 ## Run it
1. Install [Node.js](https://nodejs.org) (version 22 or newer, because the database is built in).
2. In the project folder, install the dependencies:
   ```
   npm install
   ```
3. Start the server:
   ```
   node server/server.js
   ```
4. Open **http://localhost:3000/login.html** in your browser. Open it this way, not by double-clicking the file or using VS Code's Live Server.
5. Log in with the demo account: username `hari`, password `space123`.

The database file (`server/spacepulse.db`) is created automatically the first time the server starts. If you restart the server, log in again.

## Demo controls
On the dashboard, the **Demo controls** card has buttons (CO2 leak, Solar radiation, High heart rate, Low oxygen) that simulate a problem for 20 seconds. The status changes to "Needs attention", and the alert appears in **Alert History** with a suggested action.

## How it works
- `server/server.js` serves the website and a REST API on port 3000, and streams live readings over WebSocket on port 8080.
- Data is stored in a SQLite database (`server/spacepulse.db`, created automatically): users, readings, alerts and schedule progress.
- Passwords are hashed, and API requests need a login token.
- Out-of-range readings are detected on the server and saved as alerts with a suggested action.

## Project structure
```
server/server.js      mock sensor data over WebSocket
frontend/             login, dashboard, vitals, alerts, profile, schedule
```
## Notes
- Sensor readings are simulated. A real sensor can replace the generator in `server/server.js` as long as it sends the same JSON format.
- This is a hackathon prototype. The alert thresholds and suggested actions are general examples, not medical guidance. 

## Future work
Server-side login, a database for readings and alerts, and real sensor input.