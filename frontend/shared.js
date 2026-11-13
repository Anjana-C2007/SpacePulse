// To add a vital: add one line here (and the same key in server/server.js)
const CONFIG = {
  physiology: { title: "Physiology", vitals: [
    { key: "heartRate", label: "Heart Rate", unit: "bpm", min: 50, max: 110, tip: "Rest, breathe slowly, and recheck in 5 minutes. Report if it stays abnormal." },
    { key: "spo2", label: "Oxygen (SpO2)", unit: "%", min: 95, max: 100, tip: "Check cabin O2 and CO2, then recheck. Report low readings right away." },
    { key: "temperature", label: "Body Temperature", unit: "°C", min: 36, max: 37.5, tip: "Check cabin temperature, hydrate, and recheck. Report persistent fever." },
    { key: "systolic", label: "Blood Pressure (Sys)", unit: "mmHg", min: 90, max: 140, tip: "Sit and rest for 5 minutes, then remeasure." },
    { key: "diastolic", label: "Blood Pressure (Dia)", unit: "mmHg", min: 60, max: 90, tip: "Sit and rest for 5 minutes, then remeasure." },
    { key: "respRate", label: "Respiratory Rate", unit: "/min", min: 12, max: 20, tip: "Check CO2 level and air flow. Report if breathing feels difficult." },
  ]},
  environment: { title: "Environment", vitals: [
    { key: "co2", label: "Cabin CO2 Level", unit: "%", min: 0, max: 0.8, tip: "Check scrubbers and ventilation. High CO2 can cause headaches and fatigue." },
    { key: "radiation", label: "Radiation", unit: "mSv/day", min: 0, max: 1, tip: "Move to the shielded area and limit exposure time." },
    { key: "gravity", label: "Gravity Condition", unit: "g", min: 0, max: 0.015, tip: "Check for unusual accelerations. Do the planned exercise to protect bone and muscle." },
  ]},
  behavioral: { title: "Behavioral & Cognitive", vitals: [
    { key: "workload", label: "Workload", unit: "% of capacity", min: 40, max: 85, tip: "Postpone non-critical tasks and take a rest break." },
    { key: "schedule", label: "Schedule Adherence", unit: "%", min: 80, max: 100, tip: "Review the schedule and reprioritise overdue tasks." },
  ]},
};

function getAlerts() {
  try { return JSON.parse(localStorage.getItem("alerts")) || []; } catch (e) { return []; }
}

// Call with every new reading. Logs an alert when a vital turns abnormal.
function checkAlerts(d) {
  let active = [];
  try { active = JSON.parse(localStorage.getItem("activeAlerts")) || []; } catch (e) {}
  const alerts = getAlerts();
  const nowActive = [];

  Object.values(CONFIG).forEach((cat) => cat.vitals.forEach((v) => {
    const value = d[v.key];
    if (value === undefined) return;
    if (value < v.min || value > v.max) {
      nowActive.push(v.key);
      if (!active.includes(v.key)) {
        alerts.unshift({
          time: d.timestamp, category: cat.title, label: v.label,
          value: value + " " + v.unit, normal: v.min + " to " + v.max + " " + v.unit, tip: v.tip,
        });
      }
    }
  }));

  localStorage.setItem("activeAlerts", JSON.stringify(nowActive));
  localStorage.setItem("alerts", JSON.stringify(alerts.slice(0, 200)));
}

function requireLogin() {
  if (sessionStorage.getItem("loggedIn") !== "true") window.location.href = "login.html";
}
function logout() {
  sessionStorage.removeItem("loggedIn");
  window.location.href = "login.html";
}