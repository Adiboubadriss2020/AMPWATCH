# AMPWATCH ⚡
> Factory Machine Overconsumption Detector & Predictive Maintenance Dashboard

AMPWATCH is a real-time IoT monitoring dashboard designed to detect electrical overconsumption, analyze machinery health, and validate anomalies using hybrid AI algorithms and Human-in-the-Loop (HITL) workflows.

---

## 📐 System Architecture & Data Flow

Below is the end-to-end telemetry pipeline, connecting physical/simulated sensors, the automation workflow engine (WISSAL), Google Gemini AI, Google Sheets, and the front-end dashboard.

```
                  +--------------------------------+
                  |  Physical IoT Sensor / Device  |
                  +--------------------------------+
                                  |
                                  | POST Raw JSON fields
                                  v
                  +--------------------------------+
                  |      Webhook Trigger Node      |
                  +--------------------------------+
                                  |
                                  v
                  +--------------------------------+
                  |   Transformation Function Node |
                  +--------------------------------+
                                  |
                                  v
                      Is Anomaly Detected?
                     /                    \
             Yes    /                      \   No
                   v                        v
+-----------------------------+    +-----------------------+
| BuildPromptIA (Function 2)  |    |  Log 3 (Ignore/Stop)  |
+-----------------------------+    +-----------------------+
              |
              v
+-----------------------------+
| Google LLM (Gemini Flash)   |
+-----------------------------+
              |
              v
+-----------------------------+
| Parse JSON AI Diagnosis     |
+-----------------------------+
              |
              +--------------------------+
              |                          |
              v                          v
+----------------------------+  +----------------------------+
| Google Sheets Log (Append) |  | React Dashboard UI (Live)  |
+----------------------------+  +----------------------------+
```

---

## 📊 Data Schemas

### 1. Raw IoT Webhook Payload (Input to Workflow)
Sent directly from sensors as an array of raw label-value pairs:
```json
{
  "data": {
    "fields": [
      { "label": "kw", "value": "52.3" },
      { "label": "voltage", "value": "381" },
      { "label": "temp", "value": "24.8" }
    ]
  }
}
```

### 2. Workflow Transformed Event (Function Node Output)
Computed by the automation script to evaluate baseline anomalies and physical parameters:
```json
{
  "kw": 52.3,
  "voltage": 381,
  "temp": 24.8,
  "current": 227.4,
  "costPerHour": 6.28,
  "isAnomaly": true,
  "severity": "CRITIQUE",
  "machineId": "COMP-01",
  "timestamp": "2026-07-15T13:10:00.000Z"
}
```

### 3. Dashboard Target Telemetry Payload
The real-time state shape expected by the React frontend dashboard:
```json
{
  "machineId": "COMP-01",
  "machineName": "Compresseur Air 1",
  "timestamp": "2026-07-13T14:32:15Z",
  "kw": 52.3,
  "current": 227.4,
  "voltage": 381,
  "temp": 24.8,
  "humidite": 55.2,
  "pression": 1013.4,
  "powerFactor": 0.89,
  "costPerHour": 6.28,
  "normalKw": 50,
  "scenario": "FUITE",
  "status": "CRITIQUE",
  "anomaly": true,
  "anomalyType": "FUITE_AIR",
  "cause": "Compresseur tourne en continu (détection fuite)",
  "potRaw": 3200,
  "wifi_rssi": -58,
  "relay": false
}
```

---

## 🧠 AI Diagnosis Specification
When an anomaly is flagged, Google Gemini evaluates the metrics and returns the diagnostic structure:
```json
{
  "diagnostic": "Description du problème probable...",
  "cause_probable": "Cause racine estimée...",
  "risque_panne": "faible | moyen | eleve | imminent",
  "action_immediate": "Action à prendre immédiatement...",
  "action_planifiee": "Maintenance à planifier...",
  "perte_estimee_jour": 250,
  "score_risque": 85,
  "recommandation_hitl": "Message pour le responsable de maintenance..."
}
```

---

## 🚀 How to Run the Dashboard Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

---

## 📦 How to Push to GitHub

Prepare and push your code to the designated repository: [Adiboubadriss2020/AMPWATCH](https://github.com/Adiboubadriss2020/AMPWATCH).

Run the following commands in your terminal:

```bash
# 1. Initialize git (if not already done)
git init

# 2. Add files
git add .

# 3. Commit changes
git commit -m "feat: implement real-time telemetry schema, custom charts and AI diagnosis dashboard"

# 4. Link to remote repository
git remote add origin https://github.com/Adiboubadriss2020/AMPWATCH.git

# 5. Push to main branch
git branch -M main
git push -u origin main
```
