const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });

let value = 75;

setInterval(() => {
  // drift slowly, with the occasional spike
  value += (Math.random() - 0.5) * 4;
  value = Math.max(60, Math.min(100, value));
  const spike = Math.random() < 0.05 ? 30 : 0;

  const reading = {
    sensor: "heart_rate",
    value: Math.round(value + spike),
    timestamp: Date.now(),
  };

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(reading));
    }
  });
}, 1000);

console.log("Mock sensor server running on ws://localhost:8080");