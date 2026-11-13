# SpacePulse

A health monitoring dashboard for astronauts on long-duration missions. It collects health indicators, shows them live, and warns the astronaut when a value goes out of range, with a suggested action.

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
1. Install [Node.js](https://nodejs.org).
2. In the project folder: `npm install`
3. Start the sensor server: `node server/server.js`
4. Open `frontend/login.html` in your browser (or with the VS Code Live Server extension).
5. Log in with `hari` / `space123` (demo credentials).

## Project structure
```
server/server.js      mock sensor data over WebSocket
frontend/             login, dashboard, vitals, alerts, profile, schedule
```

## Notes
- Sensor readings are simulated. A real sensor can replace the generator in `server/server.js` as long as it sends the same JSON format.
- The login is a demo and is checked in the browser, so it is not secure.

## Future work
Server-side login, a database for readings and alerts, and real sensor input.