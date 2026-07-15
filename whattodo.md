# AMPWATCH — Frontend Specification
### Factory Machine Overconsumption Detection · Fusion AI Hackathon

This document translates the BPMN workflow (IoT Layer → Fusion AI Workflow Engine → Outputs) into concrete frontend requirements: screens, components, data contracts, and real-time behavior.

---

## 1. What the frontend actually needs to show

The BPMN has 3 lanes. The frontend lives entirely in **Lane 3 (Outputs)**, but needs to visually represent what happens in Lane 2 so a non-technical viewer understands the system is "thinking," not just displaying numbers.

| BPMN Step | Frontend responsibility |
|---|---|
| 1. Sensor data reception (MQTT) | Not shown directly — implied by live readings appearing |
| 2–3. Message conversion, threshold detection | Not shown directly — happens backend-side |
| 4. Classification (normal / warning / critical) | **Core visual language** — every machine card, every reading, every event uses this 3-state color system |
| 5. Storage (Google Sheets / DB) | Powers the history view and charts — not shown as "storage" itself |
| 6. Live dashboard update | **Main screen** — real-time per-machine view |
| 7. Operational alert (Slack) | Represented in the live event log |
| 8. Notification (email) | Represented in the live event log + a "notified" indicator |
| 9. Command back to IoT system | Optional small indicator: "Command sent to device" |
| 10. Duplicate alert limiting | Represented as a cooldown badge/timer on repeated anomalies |

---

## 2. Screens

### 2.1 Main Dashboard (single screen, no navigation needed for a hackathon demo)

Three-column command-center layout:

```
┌─────────────┬─────────────────────────────┬──────────────┐
│  FLEET LIST  │      HERO / LIVE CHART       │  IMPACT KPIs │
│  (left)      │      (center)                │  (right)     │
│              │                              │              │
│  Machine 1   │  Selected machine's live      │  Savings     │
│  Machine 2   │  reading vs. baseline chart   │  Detection   │
│  Machine 3   │                              │  time        │
│  ...         │  ── Live Event Log ──         │  Alerts today│
│              │  (scrolling feed)             │  Uptime      │
└─────────────┴─────────────────────────────┴──────────────┘
```

### 2.2 Optional second screen — Machine Detail
Only if time allows: clicking a machine in the fleet list opens a focused view with its full history chart and its own event log, filtered.

---

## 3. Components

### 3.1 `MachineCard` (left column, repeated per machine)
**Data needed per card:**
```json
{
  "machine_id": "PRESS_04",
  "status": "critical",       // "normal" | "warning" | "critical"
  "current_kwh": 68.2,
  "deviation_percent": 70,
  "last_updated": "14:20:07"
}
```
**Visual states:**
- `normal` → green dot, no deviation text, muted subtext ("Nominal · within baseline")
- `warning` → amber dot, "+X% vs. baseline · watching"
- `critical` → red dot (pulsing), "+X% vs. baseline · flagged HH:MM"

Clicking a card sets it as the "selected machine" for the hero chart.

---

### 3.2 `HeroChart` (center column)
**Purpose:** show the selected machine's live reading against its learned normal range, and freeze/annotate the moment an anomaly occurs.

**Data needed:**
```json
{
  "machine_id": "PRESS_04",
  "baseline_min": 34,
  "baseline_max": 46,
  "series": [
    { "t": "14:14:00", "kwh": 41.2 },
    { "t": "14:14:03", "kwh": 40.8 },
    ...
    { "t": "14:20:07", "kwh": 68.2 }
  ],
  "anomaly_index": 59
}
```
**Visual behavior:**
- Shaded horizontal band = baseline normal range
- Line renders in blue while within baseline
- Line switches to red exactly at `anomaly_index` onward
- A glowing marker + callout box appears at the anomaly point, containing the **agent's diagnosis text** (see 3.4)

**Update strategy:** append new points via WebSocket; only re-render the last N points (e.g. 60) to keep it a rolling live window, not an ever-growing chart.

---

### 3.3 `EventLog` (below hero chart)
Scrolling list, newest on top, one row per event pulled from steps 6–9 of the BPMN.

```json
{
  "time": "14:20:07",
  "tag": "critical",          // "critical" | "warning" | "resolved" | "normal"
  "machine_id": "PRESS_04",
  "message": "68.2 kWh, 70% above baseline. Report generated, energy manager notified."
}
```
Tag colors match the 3-state system (green/amber/red), plus a neutral "resolved" state (grey/green) for when a machine returns to baseline.

---

### 3.4 `AnomalyAnnotation` (overlay on hero chart)
This is the moment that sells the pitch — the AI agent's explanation, shown inline on the chart, not buried in a report.

```json
{
  "diagnosis": "Consumption 70% above learned baseline with no matching production increase. Pattern consistent with mechanical strain or bearing wear.",
  "risk_score": 82
}
```
Comes from step 4's "Agent IA Gemini analyse" branch in the BPMN — whatever the agent returns should be rendered here, not just logged.

---

### 3.5 `KPIPanel` (right column)
Four to five cards, all backend-computed, frontend just displays:

| KPI | Source |
|---|---|
| Estimated waste avoided (MAD) | Computed from deviation × duration × energy tariff |
| Time to detection | Timestamp of anomaly minus timestamp of last "normal" reading |
| Anomalies this week | Count of critical-tagged events in DB |
| False alert rate | Manually confirmed vs. total flagged (needs a confirm/dismiss action somewhere — see 4.3) |
| Fleet uptime | % of time all machines reported "normal" |

---

### 3.6 `DuplicateAlertBadge` (step 10 — cooldown indicator)
When a machine is in its cooldown window after an alert, show a small badge on its `MachineCard`:
```
🔕 Alert suppressed for 4:12 (cooldown active)
```
This visually proves step 10 of the BPMN is working, which is otherwise invisible.

---

## 4. Data flow & endpoints the frontend depends on

### 4.1 On page load (history)
```
GET /machines/list
GET /machines/{id}/history?limit=60
GET /events/recent?limit=20
GET /kpis/summary
```

### 4.2 Live updates
```
WS /ws/live
```
Message shape pushed from backend on every new reading:
```json
{
  "type": "reading",
  "machine_id": "PRESS_04",
  "kwh": 68.2,
  "status": "critical",
  "time": "14:20:07",
  "deviation_percent": 70,
  "diagnosis": "...",       // only present when status = critical
  "risk_score": 82          // only present when status = critical
}
```
Separate event message for the log:
```json
{
  "type": "event",
  "tag": "critical",
  "machine_id": "PRESS_04",
  "message": "68.2 kWh, 70% above baseline...",
  "time": "14:20:07"
}
```

### 4.3 Optional action (strengthens the "false alert rate" KPI)
```
POST /events/{event_id}/confirm   { "was_real_anomaly": true }
```
A small "Confirm / Dismiss" pair of buttons on critical event rows — lets the energy manager validate the AI's call, which is exactly what your handbook's evaluation criteria rewards ("measurement method and frequency are defined").

---

## 5. Visual system (tokens to reuse across every component)

| Token | Value | Usage |
|---|---|---|
| Background | `#0B0E13` | page background |
| Panel | `#131822` | cards, chart container |
| Hairline | `#232B38` | borders, dividers |
| Text | `#E7ECF3` | primary text |
| Muted | `#7C8798` | secondary text |
| Green (normal) | `#2FD98C` | status dot, normal tag |
| Amber (warning) | `#F2AE3D` | status dot, warning tag |
| Red (critical) | `#FF4D5E` | status dot, critical tag, anomaly line |
| Blue (brand/data) | `#3E8EFF` | brand mark, baseline line, primary actions |

Fonts: **Space Grotesk** (headings), **Inter** (body/labels), **JetBrains Mono** (every number, timestamp, reading — makes data read as live telemetry).

---

## 6. Build priority for the hackathon (in order)

1. `MachineCard` list with static/mock data — proves the visual system works
2. `HeroChart` with a hardcoded anomaly (like the demo mockup) — this is your money shot for the pitch
3. `EventLog` — static list first, then wire to real events
4. `KPIPanel` — can stay partially hardcoded if backend KPIs aren't ready in time
5. WebSocket wiring — swap all static/mock data for the live feed last, once the pipeline (backend → model → agent) is actually producing real events

**Rule of thumb:** build the frontend against fake/mock JSON matching section 4's shapes first, so it never blocks on the backend team being ready — then swap the data source, not the components, once real endpoints exist.

---

## 7. Tech recommendation

- **React** (matches earlier team decision, gives you the polish this pitch needs)
- **Recharts** or a small hand-rolled canvas chart for the hero (canvas gives more control over the "frozen anomaly moment" look)
- **Native WebSocket API** — no extra library needed for this scope
- Keep all styling in one design-token file (CSS variables or a `theme.js`) so the 3-state color system stays consistent everywhere it's reused