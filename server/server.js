  const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// current values, each drifts slowly within a realistic range
const s = {
  heartRate: 75, spo2: 98, temperature: 36.8, systolic: 118, diastolic: 76, respRate: 16,
  cabinTemp: 22, humidity: 45, co2: 0.5, cabinPressure: 101, radiation: 0.6, noise: 48,
  sleepHours: 7, stress: 30, reactionTime: 250, fatigue: 25,
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
    cabinTemp: drift("cabinTemp", 0.3, 20, 25, 1),
    humidity: drift("humidity", 2, 35, 60),
    co2: drift("co2", 0.1, 0.3, 0.9, 2),
    cabinPressure: drift("cabinPressure", 0.4, 99, 103, 1),
    radiation: drift("radiation", 0.1, 0.3, 1.2, 2),
    noise: drift("noise", 3, 42, 62),
    // Behavioral & Cognitive
    sleepHours: drift("sleepHours", 0.2, 5, 8.5, 1),
    stress: drift("stress", 6, 10, 70),
    reactionTime: drift("reactionTime", 20, 200, 380),
    fatigue: drift("fatigue", 5, 10, 70),
    timestamp: Date.now(),
  };

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify(reading));
  });
}, 1000);

console.log("Mock sensor server running on ws://localhost:8080");