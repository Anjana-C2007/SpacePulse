const http = require("http");
const express = require("express");
const path = require("path");
const WebSocket = require("ws");
const { DatabaseSync } = require("node:sqlite");

const PORT = process.env.PORT || 3000;
const CREW = "hari"; // schedule progress is saved for this crew member

// ---------- Database ----------
const db = new DatabaseSync(path.join(__dirname, "spacepulse.db"));
db.exec(`
  CREATE TABLE IF NOT EXISTS readings (id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER, data TEXT);
  CREATE TABLE IF NOT EXISTS alerts (id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER,
    category TEXT, label TEXT, value TEXT, normal TEXT, tip TEXT);
  CREATE TABLE IF NOT EXISTS done_tasks (username TEXT, day TEXT, task INTEGER,
    PRIMARY KEY (username, day, task));
`);

// ---------- Web server and API ----------
const app = express();
app.use(express.json());
app.get("/", (req, res) => res.redirect("/dashboard.html"));
app.use(express.static(path.join(__dirname, "..", "frontend")));

app.get("/api/alerts", (req, res) => {
  res.json(db.prepare("SELECT * FROM alerts ORDER BY id DESC LIMIT 200").all());
});

app.delete("/api/alerts", (req, res) => {
  db.exec("DELETE FROM alerts");
  res.json({ ok: true });
});

// Past values of one vital: /api/history?key=heartRate&limit=60
app.get("/api/history", (req, res) => {
  const key = String(req.query.key || "");
  const limit = Math.min(Number(req.query.limit) || 60, 500);
  const rows = db.prepare("SELECT ts, data FROM readings ORDER BY id DESC LIMIT ?").all(limit);
  res.json(rows.reverse().map((r) => ({ ts: r.ts, value: JSON.parse(r.data)[key] })));
});

// Schedule progress, saved per local day
const today = () => {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
};

app.get("/api/schedule", (req, res) => {
  const rows = db.prepare("SELECT task FROM done_tasks WHERE username = ? AND day = ?").all(CREW, today());
  res.json(rows.map((r) => r.task));
});

app.post("/api/schedule/:task", (req, res) => {
  const task = Number(req.params.task);
  if (!Number.isInteger(task)) return res.status(400).json({ error: "Bad task" });
  const has = db.prepare("SELECT 1 FROM done_tasks WHERE username = ? AND day = ? AND task = ?")
    .get(CREW, today(), task);
  if (has) {
    db.prepare("DELETE FROM done_tasks WHERE username = ? AND day = ? AND task = ?").run(CREW, today(), task);
  } else {
    db.prepare("INSERT INTO done_tasks (username, day, task) VALUES (?, ?, ?)").run(CREW, today(), task);
  }
  res.json({ done: !has });
});

// Demo scenarios: each overrides some readings for 20 seconds
const SCENARIOS = {
  co2: { co2: 1.1 },
  radiation: { radiation: 1.6 },
  heart: { heartRate: 128 },
  oxygen: { spo2: 91 },
};
let scenario = null;
let scenarioUntil = 0;

app.post("/api/demo/:name", (req, res) => {
  const chosen = SCENARIOS[req.params.name];
  if (!chosen) return res.status(400).json({ error: "Unknown scenario" });
  scenario = chosen;
  scenarioUntil = Date.now() + 20000;
  res.json({ ok: true });
});

// One server for the website, the API and the live WebSocket
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
server.listen(PORT, () => console.log("Website, API and live data on port " + PORT));

// ---------- Mock sensor ----------
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const s = {
  heartRate: 75, spo2: 98, temperature: 36.8, systolic: 118, diastolic: 76, respRate: 16,
  co2: 0.5, radiation: 0.6, gravity: 0.01,
  workload: 60, schedule: 92,
};
function drift(key, step, min, max, decimals = 0) {
  s[key] = clamp(s[key] + (Math.random() - 0.5) * step, min, max);
  const f = Math.pow(10, decimals);
  return Math.round(s[key] * f) / f;
}

// Normal ranges, checked on the server so alerts are saved even with no browser open
const RANGES = [
  { key: "heartRate", category: "Physiology", label: "Heart rate", unit: "bpm", min: 50, max: 110, tip: "Rest, breathe slowly, and recheck in 5 minutes. Report if it stays abnormal." },
  { key: "spo2", category: "Physiology", label: "Oxygen (SpO2)", unit: "%", min: 95, max: 100, tip: "Check cabin O2 and CO2, then recheck. Report low readings right away." },
  { key: "temperature", category: "Physiology", label: "Body temperature", unit: "°C", min: 36, max: 37.5, tip: "Check cabin temperature, hydrate, and recheck. Report persistent fever." },
  { key: "systolic", category: "Physiology", label: "Blood pressure (systolic)", unit: "mmHg", min: 90, max: 140, tip: "Sit and rest for 5 minutes, then remeasure." },
  { key: "diastolic", category: "Physiology", label: "Blood pressure (diastolic)", unit: "mmHg", min: 60, max: 90, tip: "Sit and rest for 5 minutes, then remeasure." },
  { key: "respRate", category: "Physiology", label: "Respiratory rate", unit: "/min", min: 12, max: 20, tip: "Check CO2 level and air flow. Report if breathing feels difficult." },
  { key: "co2", category: "Environment", label: "Cabin CO2 level", unit: "%", min: 0, max: 0.8, tip: "Check scrubbers and ventilation. High CO2 can cause headaches and fatigue." },
  { key: "radiation", category: "Environment", label: "Radiation", unit: "mSv/day", min: 0, max: 1, tip: "Move to the shielded area and limit exposure time." },
  { key: "gravity", category: "Environment", label: "Gravity condition", unit: "g", min: 0, max: 0.015, tip: "Check for unusual accelerations. Do the planned exercise to protect bone and muscle." },
  { key: "workload", category: "Behavioral & Cognitive", label: "Workload", unit: "% of capacity", min: 40, max: 85, tip: "Postpone non-critical tasks and take a rest break." },
  { key: "schedule", category: "Behavioral & Cognitive", label: "Schedule adherence", unit: "%", min: 80, max: 100, tip: "Review the schedule and reprioritise overdue tasks." },
];
let activeAlerts = new Set();

function checkAlerts(reading) {
  const nowActive = new Set();
  RANGES.forEach((r) => {
    const value = reading[r.key];
    if (value < r.min || value > r.max) {
      nowActive.add(r.key);
      if (!activeAlerts.has(r.key)) { // only log when it turns abnormal
        db.prepare("INSERT INTO alerts (ts, category, label, value, normal, tip) VALUES (?, ?, ?, ?, ?, ?)")
          .run(reading.timestamp, r.category, r.label, value + " " + r.unit,
               r.min + " to " + r.max + " " + r.unit, r.tip);
      }
    }
  });
  activeAlerts = nowActive;
}

let tick = 0;
setInterval(() => {
  // Ranges here stay inside the normal ranges, so only the demo buttons cause alerts
  const reading = {
    heartRate: Math.round(drift("heartRate", 4, 62, 92)),
    spo2: drift("spo2", 0.6, 96, 100, 1),
    temperature: drift("temperature", 0.1, 36.4, 37.3, 1),
    systolic: drift("systolic", 4, 105, 130),
    diastolic: drift("diastolic", 3, 68, 85),
    respRate: drift("respRate", 1.5, 12, 20),
    co2: drift("co2", 0.1, 0.3, 0.7, 2),
    radiation: drift("radiation", 0.1, 0.3, 0.8, 2),
    gravity: drift("gravity", 0.004, 0, 0.012, 3),
    workload: drift("workload", 6, 40, 80),
    schedule: drift("schedule", 4, 85, 100),
    timestamp: Date.now(),
  };

  if (scenario && Date.now() < scenarioUntil) Object.assign(reading, scenario);

  checkAlerts(reading);
  if (++tick % 5 === 0) { // save one reading every 5 seconds
    db.prepare("INSERT INTO readings (ts, data) VALUES (?, ?)").run(reading.timestamp, JSON.stringify(reading));
  }

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify(reading));
  });
}, 1000);
