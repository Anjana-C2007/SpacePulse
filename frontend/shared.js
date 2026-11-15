 // To add a vital: add one line here (and the same key in RANGES in server/server.js)
const CONFIG = {
  physiology: { title: "Physiology", vitals: [
    { key: "heartRate", label: "Heart Rate", unit: "bpm", min: 50, max: 110 },
    { key: "spo2", label: "Oxygen (SpO2)", unit: "%", min: 95, max: 100 },
    { key: "temperature", label: "Body Temperature", unit: "°C", min: 36, max: 37.5 },
    { key: "systolic", label: "Blood Pressure (Sys)", unit: "mmHg", min: 90, max: 140 },
    { key: "diastolic", label: "Blood Pressure (Dia)", unit: "mmHg", min: 60, max: 90 },
    { key: "respRate", label: "Respiratory Rate", unit: "/min", min: 12, max: 20 },
  ]},
  environment: { title: "Environment", vitals: [
    { key: "co2", label: "Cabin CO2 Level", unit: "%", min: 0, max: 0.8 },
    { key: "radiation", label: "Radiation", unit: "mSv/day", min: 0, max: 1 },
    { key: "gravity", label: "Gravity Condition", unit: "g", min: 0, max: 0.015 },
  ]},
  behavioral: { title: "Behavioral & Cognitive", vitals: [
    { key: "workload", label: "Workload", unit: "% of capacity", min: 40, max: 85 },
    { key: "schedule", label: "Schedule Adherence", unit: "%", min: 80, max: 100 },
  ]},
};

// The server records alerts now, so this does nothing (kept so older pages don't break)
function checkAlerts() {}

// Calls the backend with the login token. Sends you to the login page if the token is invalid.
async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + sessionStorage.getItem("token"),
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) { logout(); throw new Error("Not logged in"); }
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

function requireLogin() {}
function logout() {
  sessionStorage.removeItem("loggedIn");
  sessionStorage.removeItem("token");
  window.location.href = "login.html";
}
document.addEventListener("DOMContentLoaded", () => {
  const b = document.getElementById("logout");
  if (b) b.remove();
});