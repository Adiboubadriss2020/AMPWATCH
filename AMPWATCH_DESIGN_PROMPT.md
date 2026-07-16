# AMPWATCH — Visual Design System & Build Prompt
### Extracted from reference: "AI Smart Energy Platform" infographic style

Use this document as the prompt for any agent (Claude, GPT, Cursor, etc.) building or restyling the AMPWATCH dashboard/pitch materials. It defines the exact visual language to replicate — palette, typography, layout grammar, component patterns, and content structure — so every output stays consistent.

---

## 1. Overall Aesthetic

A dark, high-tech "industrial command center" style: near-black backgrounds, glowing cyan/blue and green accents, glassy panel cards with thin luminous borders, circuit-board/network motifs, and a confident enterprise-SaaS tone. It should read as **premium industrial software**, not a hackathon mockup — the kind of screen a plant manager or CFO would trust.

**One-line prompt to give an agent:**
> "Design a dark, glassmorphic industrial energy-monitoring dashboard with glowing cyan and green accent lines, circuit/network background motifs, rounded card panels with thin luminous borders, circular KPI gauges, and a clean enterprise SaaS typography system — evoking Industry 4.0 command centers, not a generic dark-mode admin panel."

---

## 2. Color Palette

| Role | Hex | Usage |
|---|---|---|
| Base background | `#050B14` | page/canvas background, near-black navy |
| Panel background | `#0B1524` | card containers |
| Panel border (glow) | `#1E5A8A` at low opacity, or gradient cyan→transparent | card outlines, glassy edge |
| Primary accent (cyan) | `#29D3F0` | primary data lines, icons, highlight text |
| Secondary accent (blue) | `#2E7FE8` | secondary data series, buttons, gauges |
| Success/positive (green) | `#3FD16B` | positive KPIs, "solution" checkmarks, uptime |
| Warning (amber) | `#F2B84B` | medium-severity flags |
| Critical (red) | `#FF4B4B` | anomaly alerts, high-severity states, challenge icons |
| Text primary | `#F3F6FA` | headings, key numbers |
| Text muted | `#8C9AB0` | labels, secondary copy |
| Divider/hairline | `#16233A` | section separators |

Gradients: subtle radial glow behind gauges and network nodes (cyan/blue fading to transparent), never a hard flat color on interactive elements.

---

## 3. Typography

- **Headings / big numbers:** a geometric, slightly technical sans-serif (e.g. Space Grotesk, Sora, or Eurostile-like) — bold weight, tight letter-spacing, all-caps for section titles.
- **Body / labels:** clean neutral sans-serif (Inter or similar), medium weight for labels, regular for descriptions.
- **Data / metrics:** monospace (JetBrains Mono or Roboto Mono) for anything numeric — kWh readings, percentages, timestamps — to reinforce "live telemetry" feeling.
- Section headers styled as: `ICON  SMALL-CAPS TITLE` with a colored underline or left accent bar.

---

## 4. Layout Grammar

The reference uses a strict **modular grid of bordered panels**, stacked in horizontal bands. Replicate this structure:

```
┌───────────────────────────────────────────────────────────┐
│  TOP BAR: logo + product name + tagline + partner badge     │
├───────────────────┬───────────────────────────────────────┤
│  CHALLENGE panel   │  HERO VISUAL                           │
│  (icon+text list)  │  (industrial skyline + device mockups) │
│  ROOT CAUSE panel  │  SOLUTION panel (icon+text checklist)  │
├───────────────────┴───────────────────────────────────────┤
│  KEY METRICS ROW — 5-6 circular gauge KPIs with sparkline    │
├───────────────┬───────────────┬─────────────────────────────┤
│ REAL-TIME      │ ANOMALY        │ ENERGY FORECASTING           │
│ OVERVIEW       │ DETECTION      │ + CONSUMPTION BREAKDOWN       │
│ (line chart +  │ (radar/scatter │ (forecast chart + donut)      │
│ bar breakdown) │ + alert card)  │                               │
├───────────────────┬───────────────────────────────────────┤
│  SYSTEM ARCHITECTURE (pipeline diagram)  │ TECH STACK (icon grid) │
└───────────────────────────────────────────────────────────┘
```

Every panel = rounded corners (~12–16px), 1px glowing border, dark fill, generous internal padding, small icon + label header.

---

## 5. Component Patterns to Replicate

### 5.1 Circular KPI Gauge
- Ring-style progress indicator (conic gradient cyan→blue or green→cyan)
- Big bold percentage/number centered inside the ring
- Small icon above the ring, label below
- Thin sparkline mini-chart under each gauge card
- Example set for AMPWATCH: **Energy Efficiency, Energy Savings, Cost Reduction, Equipment Uptime, Anomaly Detection Rate, Data Reliability**

### 5.2 Challenge / Solution List Panel
- Left panel: red/amber warning icons + short problem statements (bullet list, icon-led)
- Right panel: green checkmark icons + short solution statements (same bullet format)
- A distinct "Root Cause" callout box below the challenge list, boxed with its own border, single paragraph

### 5.3 Real-Time Chart Panel
- Line/area chart, dark background, cyan/green gradient fill under the line
- Floating tooltip card showing the current value (e.g. "Power Consumption 1.42 MWh") pinned to the latest point
- X-axis as time-of-day ticks

### 5.4 Anomaly Detection Panel
- Radar/sonar-style circular visualization with concentric rings and a pulsing dot marking the anomaly location — purely decorative/symbolic, reinforces "detection" visually
- Paired with a bordered **Anomaly Alert card** below: red left-border accent, fields laid out as a label/value list (Equipment, Type, Severity, Detected at), plus a small red sparkline underneath

### 5.5 Forecasting Panel
- Dual-line chart: solid line = actual, dashed line = forecast, both in the cyan/green family, clear visual split between historical and predicted zones (shaded differently)

### 5.6 Consumption Breakdown
- Horizontal bar chart (per-zone/per-line breakdown) or donut chart with a color-coded legend list showing percentages — use both patterns interchangeably depending on space (bars for "by area", donut for "by category")

### 5.7 System Architecture Diagram
- Horizontal pipeline: icon nodes connected by arrows — **Sensors → Edge Gateway → Data Ingestion → AI Engine (center, emphasized with a distinct glowing ring/brain icon) → Data Storage → Applications**
- Each node: icon in a bordered square/hex, label underneath, connecting arrows in muted cyan

### 5.8 Tech Stack Grid
- Two labeled sub-groups (e.g. "Platform & Services" / "AI · Data · Analytics")
- Icons only, evenly spaced grid, bordered squares, no text under each icon (keep it a clean icon wall) — this is a "trust bar" pattern, not meant to be read closely

---

## 6. Content Structure for AMPWATCH (mapped from the reference sections)

Use these sections in this order when generating the pitch dashboard/poster:

1. **Header** — AMPWATCH wordmark + tagline ("AI & IoT Platform for Real-Time Factory Energy Monitoring") + category tags (Industry 4.0 · Predictive Maintenance · Energy Compliance)
2. **The Challenge** — undetected overconsumption, no real-time visibility, reactive maintenance, difficulty finding root cause, rising energy cost, (add) ISO 50001 compliance risk
3. **Root Cause** — one-paragraph callout, same tone as your Problem Sheet's "Suspected root cause"
4. **Our Solution** — bullet list: real-time MQTT ingestion, per-machine AI baseline learning, agent-generated root-cause diagnosis, automated PDF reporting, duplicate-alert suppression, live dashboard, compliance-ready audit trail
5. **Key Metrics** — reuse your existing KPI set: Time-to-Detection, Anomalies Caught, False Alert Rate, Fleet Uptime, Estimated Waste Avoided (MAD), Detection Accuracy
6. **Real-Time Overview** — live per-machine chart + consumption-by-machine bar breakdown
7. **Anomaly Detection** — the frozen-spike hero visual + anomaly alert card (equipment, severity, detected-at, agent diagnosis)
8. **Forecasting** (optional, if built) — actual vs. predicted consumption trend
9. **Consumption Breakdown** — donut by machine/zone
10. **System Architecture** — Sensors → Backend (condition check + AI model) → Agent API → Report/Notification/Dashboard, matching your actual BPMN
11. **Tech Stack** — FastAPI, scikit-learn, Claude/agent API, SQLite, WebSocket, React icons, laid out as the icon-wall trust bar

---

## 7. Instruction Block for the Agent (copy-paste ready)

```
Build/restyle the AMPWATCH dashboard using this exact visual system:

- Dark navy background (#050B14), glassy bordered panels (#0B1524, thin glowing cyan border)
- Accent colors: cyan #29D3F0, blue #2E7FE8, green #3FD16B (positive), amber #F2B84B (warning), red #FF4B4B (critical)
- Typography: geometric bold sans for headings (Space Grotesk/Sora), Inter for body, monospace (JetBrains Mono) for every numeric value
- Layout: modular grid of rounded, bordered panels grouped in horizontal bands — challenge/solution row, KPI gauge row, live charts row, architecture + tech stack row
- Components: circular ring KPI gauges with sparklines, icon-led bullet lists for challenge/solution, real-time line chart with floating value tooltip, anomaly alert card with red left-border and label/value fields, pipeline diagram with a centered emphasized AI Engine node, icon-only tech stack grid
- Tone: premium industrial SaaS, not playful — evokes a real Industry 4.0 command center a factory director or investor would trust
- All content should reflect AMPWATCH's real product: real-time per-machine energy anomaly detection via MQTT + AI baseline learning + agent-generated root-cause diagnosis + automated compliance-ready reporting
```

---

## 8. Notes

- This reference is an infographic/pitch poster, not a live app screen — treat sections 6 and 7 as your **pitch deck / landing visual**, and reuse the same color and component tokens (already defined in your existing `FRONTEND_SPEC.md`) for the **actual live dashboard**, so both look like one coherent product line.
- Keep the AMPWATCH dashboard itself (the working app) closer to the command-center layout from `FRONTEND_SPEC.md` — this poster style is best used for the **static pitch slide/one-pager**, not necessarily the live interactive screen.
