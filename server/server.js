 const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });

let hr = 75, spo2 = 98, temp = 36.8;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

setInterval(() => {
  hr = clamp(hr + (Math.random() - 0.5) * 4, 60, 100);
  spo2 = clamp(spo2 + (Math.random() - 0.5) * 0.6, 94, 100);
  temp = clamp(temp + (Math.random() - 0.5) * 0.1, 36.2, 37.6);
  const spike = Math.random() < 0.05 ? 30 : 0;

  const reading = {
    heartRate: Math.round(hr + spike),
    spo2: Math.round(spo2 * 10) / 10,
    temperature: Math.round(temp * 10) / 10,
    timestamp: Date.now(),
  };

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(reading));
    }
  });
}, 1000);

console.log("Mock sensor server running on ws://localhost:8080");