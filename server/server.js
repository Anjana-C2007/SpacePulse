   const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// current values, each drifts slowly within a realistic range
const s = {
  // Physiology
  heartRate: 75, spo2: 98, temperature: 36.8, systolic: 118, diastolic: 76, respRate: 16,
  // Environment
  co2: 0.5, radiation: 0.6, gravity: 0.01,
  // Behavioral & Cognitive
  workload: 60, schedule: 92,
};

function drift(key, step, min, max, decimals = 0) {
  s[key] = clamp(s[key] + (Math.random() - 0.5) * step, min, max);
  const f = Math.pow(10, decimals);
  return Math.round(s[key] * f) / f;
}

setInterval(() => {
  const spike = Math.random() < 0.05 ? 30 : 0;

  const reading = {
    // Physiology
    heartRate: Math.round(drift("heartRate", 4, 60, 100) + spike),
    spo2: drift("spo2", 0.6, 94, 100, 1),
    temperature: drift("temperature", 0.1, 36.2, 37.6, 1),
    systolic: drift("systolic", 4, 105, 130),
    diastolic: drift("diastolic", 3, 68, 85),
    respRate: drift("respRate", 1.5, 12, 20),
    // Environment
    co2: drift("co2", 0.1, 0.3, 0.9, 2),
    radiation: drift("radiation", 0.1, 0.3, 1.2, 2),
    gravity: drift("gravity", 0.004, 0, 0.02, 3),
    // Behavioral & Cognitive
    workload: drift("workload", 6, 30, 95),
    schedule: drift("schedule", 4, 70, 100),
    timestamp: Date.now(),
  };

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify(reading));
  });
}, 1000);

console.log("Mock sensor server running on ws://localhost:8080");