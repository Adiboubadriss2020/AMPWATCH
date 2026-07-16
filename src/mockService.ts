import type { Machine, Reading, EventLogItem, KPIs, MachineStatus } from './types';

// ─── Gabarit machine ─────────────────────────────────────────────────────────
const MACHINE_TEMPLATES = [
  {
    machineId: 'COMP-01',
    machineName: 'Compresseur Air 1',
    normalKw: 50,
    scenario: 'FUITE',
    anomalyType: 'FUITE_AIR',
    cause: 'Compresseur tourne en continu (détection fuite)',
    baseTemp: 24.8,
    basePression: 1013.4,
    baseHumidite: 55.2,
  }
];

// ─── Constantes ───────────────────────────────────────────────────────────────
const FACTEUR_CO2 = 0.7;          // kg CO₂ par kWh (mix électrique Maroc)
const COOLDOWN_DURATION = 300;    // secondes (anti-doublon alerte)

// ─── Logique métier identique au backend ──────────────────────────────────────
function computeFields(
  kw: number,
  normalKw: number,
  temp: number,
  humidite: number,
  heure: number,
  scenario: string,
  forceAnomalie = false
): Omit<Machine,
  'machineId'|'machineName'|'timestamp'|'date'|'time'|'current'|'voltage'|
  'pression'|'powerFactor'|'scenario'|'status'|'anomaly'|'cause'|
  'potRaw'|'wifi_rssi'|'relay'|'cooldown_remaining'
> {
  const deviation = normalKw > 0 ? Math.round(((kw - normalKw) / normalKw) * 100) : 0;

  // FEATURE 2 – CO₂ temps réel
  const co2ParHeure  = Math.round(kw * FACTEUR_CO2 * 100) / 100;
  const co2ParJour   = Math.round(co2ParHeure * 8 * 100) / 100;
  const co2Economise = Math.round(Math.max(0, normalKw - kw) * FACTEUR_CO2 * 100) / 100;

  // FEATURE 4 – Tarification HP/HC Maroc
  const isHP = heure >= 7 && heure <= 22;
  const tarifKwh      = isHP ? 0.15 : 0.08;
  const costPerHour   = Math.round(kw * tarifKwh * 100) / 100;
  const trancheHoraire = isHP ? 'HEURES_PLEINES' : 'HEURES_CREUSES';
  const conseilTarif  = isHP && kw > normalKw * 0.8
    ? `Décaler cette charge en HC pour économiser ${Math.round((0.15 - 0.08) * kw * 100) / 100} DH/h`
    : '';

  // FEATURE 1 – Score usure / maintenance prédictive
  let scoreUsure = 0;
  if (kw > normalKw * 1.1)  scoreUsure += Math.round((kw - normalKw) * 0.5);
  if (temp > 35)             scoreUsure += Math.round((temp - 35) * 3);
  if (humidite > 70)         scoreUsure += Math.round((humidite - 70) * 1);
  if (deviation > 20)        scoreUsure += Math.round(deviation * 0.3);
  scoreUsure = Math.min(100, Math.max(0, scoreUsure));

  const prochaineMaintenance = scoreUsure > 80
    ? 'URGENT — planifier cette semaine'
    : scoreUsure > 60
    ? 'Planifier sous 2 semaines'
    : scoreUsure > 40
    ? 'Prochain arrêt programmé'
    : 'Aucune requise';
  const dureeVieEstimee = Math.max(0, 100 - scoreUsure);

  // FEATURE 3 – Dérive lente
  const driftPct    = deviation;
  const driftAlerte = Math.abs(driftPct) > 5;
  const driftMessage = driftPct > 15
    ? 'DÉRIVE FORTE : consommation en hausse significative'
    : driftPct > 5
    ? 'DÉRIVE LÉGÈRE : tendance à la hausse'
    : driftPct < -15
    ? 'SOUS-CONSOMMATION : vérifier si machine en panne partielle'
    : 'Stable';

  // ── Détection anomalie (toutes règles) ──
  let isAnomaly   = false;
  let anomalyType = 'NONE';
  let severity    = 'NORMAL';

  // Regle 1 : Surconsommation > 115%
  if (kw > normalKw * 1.15) {
    isAnomaly = true; anomalyType = 'SURCONSOMMATION';
    severity  = kw > normalKw * 1.5 ? 'CRITIQUE' : 'ATTENTION';
  }
  if (temp > 80) { isAnomaly = true; anomalyType = 'SURCHAUFFE'; severity = 'CRITIQUE'; }
  if (scenario === 'PAUSE'    && kw > normalKw * 0.3) { isAnomaly = true; anomalyType = 'MACHINE_ACTIVE_PAUSE'; severity = 'CRITIQUE'; }
  if (scenario === 'FUITE'    && kw > normalKw * 0.8) { isAnomaly = true; anomalyType = 'FUITE_AIR'; severity = 'CRITIQUE'; }
  if (scenario === 'SURCHARGE'&& kw > normalKw * 1.0) {
    isAnomaly = true; anomalyType = 'SURCHARGE_MOTEUR';
    severity  = kw > normalKw * 1.3 ? 'CRITIQUE' : 'ATTENTION';
  }

  // FEATURE 7 – Hors production
  const horsProduction = heure >= 20 || heure < 6;
  if (horsProduction && kw > 10) { isAnomaly = true; anomalyType = 'HORS_PRODUCTION'; severity = 'CRITIQUE'; }

  // Dérive légère (si pas déjà anomalie)
  if (driftAlerte && !isAnomaly) { isAnomaly = true; anomalyType = 'DERIVE_LENTE'; severity = 'ATTENTION'; }

  if (forceAnomalie) { isAnomaly = true; anomalyType = 'DEMO_FORCEE'; severity = 'CRITIQUE'; }

  return {
    kw, normalKw, deviation,
    temp, humidite,
    costPerHour, tarifKwh, trancheHoraire, conseilTarif,
    co2ParHeure, co2ParJour, co2Economise,
    scoreUsure, prochaineMaintenance, dureeVieEstimee,
    driftPct, driftAlerte, driftMessage,
    horsProduction, heure,
    isAnomaly, anomalyType, severity,
  };
}

// ─── Mapping severity → MachineStatus ────────────────────────────────────────
function severityToStatus(severity: string): MachineStatus {
  if (severity === 'CRITIQUE') return 'CRITIQUE';
  if (severity === 'ATTENTION') return 'AVERTISSEMENT';
  return 'NOMINAL';
}

// ─────────────────────────────────────────────────────────────────────────────
class TelemetrySimulator {
  private machines: Machine[] = [];
  private histories: Map<string, Reading[]> = new Map();
  private events: EventLogItem[] = [];
  private callbacks: Set<(data: { type: 'reading' | 'event'; payload: any }) => void> = new Set();

  // Compteurs KPI
  private totalAlerts     = 0;
  private confirmedAlerts = 0;
  private dismissedAlerts = 0;
  private nominalSeconds  = 0;
  private totalSeconds    = 0;
  private accumulatedCo2Saved = 0;
  private accumulatedCoutEvite = 0;

  private intervalId: any = null;
  private cooldownTimerId: any = null;
  private updateRateMs = 1500;

  constructor() { this.init(); }

  // ── Initialisation ──────────────────────────────────────────────────────────
  private init() {
    const now = new Date();
    const heure = now.getHours();

    this.machines = MACHINE_TEMPLATES.map((tmpl) => {
      const kw       = Math.round(tmpl.normalKw * (0.95 + Math.random() * 0.1) * 10) / 10;
      const voltage  = 380 + Math.round((Math.random() * 6 - 3) * 10) / 10;
      const pf       = 0.85 + Math.random() * 0.08;
      const current  = Math.round((kw * 1000) / (voltage * 1.732 * pf) * 10) / 10;
      const temp     = Math.round((tmpl.baseTemp + Math.random() * 2) * 10) / 10;
      const humidite = Math.round((tmpl.baseHumidite + Math.random() * 4 - 2) * 10) / 10;
      const pression = Math.round((tmpl.basePression + Math.random() * 6 - 3) * 10) / 10;

      const computed = computeFields(kw, tmpl.normalKw, temp, humidite, heure, tmpl.scenario);

      // Historique initial (60 points)
      const historyList: Reading[] = [];
      for (let i = 59; i >= 0; i--) {
        const tp = new Date(now.getTime() - i * 3000);
        const ptKw = Math.round(tmpl.normalKw * (0.95 + Math.random() * 0.1) * 10) / 10;
        historyList.push({ t: this.formatTime(tp), kw: ptKw, status: 'NOMINAL' });
      }
      this.histories.set(tmpl.machineId, historyList);

      return {
        machineId: tmpl.machineId,
        machineName: tmpl.machineName,
        timestamp: now.toISOString(),
        date: now.toLocaleDateString('fr-FR'),
        time: now.toLocaleTimeString('fr-FR'),
        voltage: Math.round(voltage),
        current,
        powerFactor: Math.round(pf * 100) / 100,
        pression,
        scenario: tmpl.scenario,
        status: 'NOMINAL' as MachineStatus,
        anomaly: false,
        cause: undefined,
        wifi_rssi: -60 + Math.round(Math.random() * 10),
        relay: false,
        cooldown_remaining: null,
        ...computed,
      };

    });

    this.events = [];
    this.nominalSeconds = 5 * 60;
    this.totalSeconds   = 5 * 60;

    this.startSimulation();
    this.startCooldownTimer();
  }

  private formatTime(date: Date): string {
    return date.toTimeString().split(' ')[0];
  }

  // ── Boucle simulation ───────────────────────────────────────────────────────
  private startSimulation() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => this.tick(), this.updateRateMs);
  }

  private startCooldownTimer() {
    if (this.cooldownTimerId) clearInterval(this.cooldownTimerId);
    this.cooldownTimerId = setInterval(() => {
      let changed = false;
      this.machines = this.machines.map((m) => {
        if (m.cooldown_remaining !== null) {
          changed = true;
          const next = m.cooldown_remaining - 1;
          return { ...m, cooldown_remaining: next <= 0 ? null : next };
        }
        return m;
      });
      if (changed) this.emit({ type: 'reading', payload: this.machines });
    }, 1000);
  }

  private tick() {
    const now   = new Date();
    const nowStr = this.formatTime(now);
    const heure  = now.getHours();
    this.totalSeconds += 1.5 * this.machines.length;

    this.machines = this.machines.map((machine) => {
      const template = MACHINE_TEMPLATES.find(t => t.machineId === machine.machineId)!;
      let kw: number;

      // Determine nominal vs anomaly based on manual forcedStatus or current status
      const statusToUse = machine.forcedStatus !== undefined ? machine.forcedStatus : machine.status;

      if (statusToUse === 'NOMINAL' || statusToUse === null) {
        kw = Math.round(machine.normalKw * (0.95 + Math.random() * 0.1) * 10) / 10;
        this.nominalSeconds += 1.5;
      } else {
        const mult = statusToUse === 'CRITIQUE' ? 1.55 : 1.25;
        kw = Math.round((machine.normalKw * mult + Math.random() * 4) * 10) / 10;
        const devKwh = kw - machine.normalKw;
        this.accumulatedCoutEvite += (devKwh * (1.5 / 3600)) * 0.15;
      }

      // Compute fields, force anomaly rule outputs if manual override is active
      const isForced = statusToUse !== 'NOMINAL' && statusToUse !== null;
      const computed = computeFields(
        kw, 
        machine.normalKw, 
        machine.temp, 
        machine.humidite ?? 55, 
        heure, 
        machine.scenario,
        isForced
      );

      // CO₂ cumulé
      this.accumulatedCo2Saved += (computed.co2Economise ?? 0) * (1.5 / 3600);

      // Determine final status
      const newStatus = statusToUse !== undefined && statusToUse !== null 
        ? statusToUse 
        : severityToStatus(computed.severity ?? 'NORMAL');

      // Transition NOMINAL → anomalie → émettre alerte
      if (newStatus !== 'NOMINAL' && machine.status === 'NOMINAL' && machine.cooldown_remaining === null) {
        this.triggerAlert(machine.machineId, newStatus, kw, computed.deviation, nowStr);
        machine.cooldown_remaining = COOLDOWN_DURATION;
      } else if (newStatus === 'NOMINAL' && machine.status !== 'NOMINAL') {
        this.triggerRecovery(machine.machineId, nowStr);
      }

      const voltage  = 380 + Math.round((Math.random() * 4 - 2) * 10) / 10;
      const pf       = newStatus === 'NOMINAL' ? 0.86 + Math.random() * 0.05 : 0.75 + Math.random() * 0.06;
      const current  = Math.round((kw * 1000) / (voltage * 1.732 * pf) * 10) / 10;

      let temp     = machine.temp;
      let pression = machine.pression;
      if (newStatus === 'NOMINAL') {
        temp     = Math.round((template.baseTemp + Math.random() * 1.5) * 10) / 10;
        pression = Math.round((template.basePression + Math.random() * 4 - 2) * 10) / 10;
      } else {
        const offset = newStatus === 'CRITIQUE' ? 18.5 : 8.2;
        temp     = Math.round((template.baseTemp + offset + Math.random() * 2) * 10) / 10;
        pression = machine.machineId === 'COMP-01'
          ? Math.round((template.basePression - 85 - Math.random() * 30) * 10) / 10
          : Math.round((template.basePression + Math.random() * 4 - 2) * 10) / 10;
      }

      const history = this.histories.get(machine.machineId) || [];
      this.histories.set(machine.machineId, [...history.slice(1), { t: nowStr, kw, status: newStatus }]);

      return {
        ...machine,
        ...computed,
        timestamp: now.toISOString(),
        date: now.toLocaleDateString('fr-FR'),
        time: now.toLocaleTimeString('fr-FR'),
        heure,
        kw,
        voltage: Math.round(voltage),
        current,
        powerFactor: Math.round(pf * 100) / 100,
        temp,
        pression,
        status: newStatus,
        anomaly: newStatus !== 'NOMINAL',
        anomalyType: newStatus !== 'NOMINAL' ? computed.anomalyType : undefined,
        cause: newStatus !== 'NOMINAL' ? template.cause : undefined,
        relay: newStatus !== 'NOMINAL',
        wifi_rssi: -62 + Math.round(Math.random() * 8),
        potRaw: 3000 + Math.round(Math.random() * 250),
      };
    });

    this.emit({ type: 'reading', payload: this.machines });
  }

  // ── Alerte / rétablissement ─────────────────────────────────────────────────
  private triggerAlert(machineId: string, status: MachineStatus, kw: number, deviation: number, timeStr: string) {
    const template = MACHINE_TEMPLATES.find(t => t.machineId === machineId)!;
    const msg = `${machineId} · ${kw} kW · dérivation ${deviation}% · Cause : « ${template.cause} » [${template.anomalyType}]`;
    const newEvent: EventLogItem = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      time: timeStr,
      tag: status,
      machineId,
      message: msg,
      was_real_anomaly: null,
    };
    this.events = [newEvent, ...this.events].slice(0, 100);
    this.totalAlerts++;
    this.emit({ type: 'event', payload: newEvent });
  }

  private triggerRecovery(machineId: string, timeStr: string) {
    const newEvent: EventLogItem = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      time: timeStr,
      tag: 'resolved',
      machineId,
      message: `${machineId} · Consommation revenue à la normale. Relais nominal.`,
    };
    this.events = [newEvent, ...this.events].slice(0, 100);
    this.emit({ type: 'event', payload: newEvent });
  }

  private emit(data: { type: 'reading' | 'event'; payload: any }) {
    this.callbacks.forEach(cb => cb(data));
  }

  // ── API publique ────────────────────────────────────────────────────────────

  public subscribeTelemetry(callback: (data: { type: 'reading' | 'event'; payload: any }) => void) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  public getMachines(): Machine[] { return this.machines; }

  public getHistory(machineId: string) {
    const series = this.histories.get(machineId) || [];
    const template = MACHINE_TEMPLATES.find(t => t.machineId === machineId) ?? MACHINE_TEMPLATES[0];
    let anomaly_index = -1;
    for (let i = 0; i < series.length; i++) {
      if (series[i].status !== 'NOMINAL') { anomaly_index = i; break; }
    }
    return {
      machineId,
      baseline_min: Math.round(template.normalKw * 0.9),
      baseline_max: Math.round(template.normalKw * 1.1),
      series,
      anomaly_index,
    };
  }

  public getRecentEvents(): EventLogItem[] { return this.events; }

  public getKPIs(): KPIs {
    const total    = this.confirmedAlerts + this.dismissedAlerts;
    const tauxFaux = total > 0 ? Math.round((this.dismissedAlerts / total) * 100) : 0;
    const dispo    = Math.round((this.nominalSeconds / Math.max(1, this.totalSeconds)) * 100);
    const scoreUsureMoyen = this.machines.length > 0
      ? Math.round(this.machines.reduce((sum, m) => sum + (m.scoreUsure ?? 0), 0) / this.machines.length)
      : 0;

    return {
      coutEvite:           Math.round(this.accumulatedCoutEvite * 100) / 100,
      tempsDetection:      1.8,
      anomaliesSemaine:    this.events.filter(e => e.tag === 'CRITIQUE' && e.was_real_anomaly !== false).length,
      tauxFaussesAlertes:  tauxFaux,
      disponibiliteFlotte: Math.min(100, Math.max(70, dispo)),
      co2Evite:            Math.round(this.accumulatedCo2Saved * 1000) / 1000,
      scoreUsureMoyen,
    };
  }

  public confirmEvent(eventId: string, was_real_anomaly: boolean) {
    this.events = this.events.map((evt) => {
      if (evt.id === eventId) {
        if (evt.was_real_anomaly === null) {
          was_real_anomaly ? this.confirmedAlerts++ : this.dismissedAlerts++;
        }
        return { ...evt, was_real_anomaly };
      }
      return evt;
    });
    const updated = this.events.find(e => e.id === eventId);
    if (updated) this.emit({ type: 'event', payload: updated });
  }

  public triggerAnomaly(machineId: string, status: 'AVERTISSEMENT' | 'CRITIQUE') {
    const now    = new Date();
    const nowStr = this.formatTime(now);
    const heure  = now.getHours();

    this.machines = this.machines.map((m) => {
      if (m.machineId !== machineId) return m;
      const template = MACHINE_TEMPLATES.find(t => t.machineId === machineId)!;
      const mult  = status === 'CRITIQUE' ? 1.55 : 1.25;
      const kw    = Math.round((m.normalKw * mult + Math.random() * 2) * 10) / 10;
      const computed = computeFields(kw, m.normalKw, m.temp + (status === 'CRITIQUE' ? 19.5 : 8.5), m.humidite ?? 55, heure, m.scenario, true);
      const deviation = Math.round(((kw - m.normalKw) / m.normalKw) * 100);

      const newEvent: EventLogItem = {
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        time: nowStr, tag: status, machineId,
        message: `${machineId} · ${kw} kW · dérivation ${deviation}% · « ${template.cause} » [${template.anomalyType}]`,
        was_real_anomaly: null,
      };
      this.events = [newEvent, ...this.events].slice(0, 100);
      this.totalAlerts++;
      this.emit({ type: 'event', payload: newEvent });

      const history = this.histories.get(machineId) || [];
      this.histories.set(machineId, [...history.slice(1), { t: nowStr, kw, status }]);

      const voltage = 378 + Math.round(Math.random() * 4 * 10) / 10;
      const pf      = 0.76;
      const current = Math.round((kw * 1000) / (voltage * 1.732 * pf) * 10) / 10;

      return {
        ...m, ...computed,
        timestamp: now.toISOString(), date: now.toLocaleDateString('fr-FR'), time: nowStr, heure,
        kw, current, voltage: Math.round(voltage), powerFactor: pf,
        pression: machineId === 'COMP-01' ? Math.round((template.basePression - 95) * 10) / 10 : m.pression,
        status, anomaly: true,
        anomalyType: template.anomalyType,
        cause: template.cause,
        relay: true,
        cooldown_remaining: COOLDOWN_DURATION,
        forcedStatus: status, // SET FORCED STATUS PERSISTENTLY
      };
    });

    this.emit({ type: 'reading', payload: this.machines });
  }

  public triggerNominal(machineId: string) {
    const now    = new Date();
    const nowStr = this.formatTime(now);
    const heure  = now.getHours();

    this.machines = this.machines.map((m) => {
      if (m.machineId !== machineId || m.status === 'NOMINAL') return m;
      const kw  = Math.round(m.normalKw * (0.95 + Math.random() * 0.1) * 10) / 10;
      const computed = computeFields(kw, m.normalKw, m.temp - 12 > 20 ? m.temp - 12 : 24.5, m.humidite ?? 55, heure, m.scenario);
      this.triggerRecovery(machineId, nowStr);
      const history = this.histories.get(machineId) || [];
      this.histories.set(machineId, [...history.slice(1), { t: nowStr, kw, status: 'NOMINAL' }]);
      const voltage = 380 + Math.round((Math.random() * 4 - 2) * 10) / 10;
      const pf      = 0.88;
      const current = Math.round((kw * 1000) / (voltage * 1.732 * pf) * 10) / 10;
      return {
        ...m, ...computed,
        timestamp: now.toISOString(), date: now.toLocaleDateString('fr-FR'), time: nowStr, heure,
        kw, current, voltage: Math.round(voltage), powerFactor: pf,
        pression: 1013.2,
        status: 'NOMINAL' as MachineStatus,
        anomaly: false, anomalyType: undefined, cause: undefined,
        relay: false, cooldown_remaining: null,
        forcedStatus: 'NOMINAL', // RESET TO NOMINAL FORCED
      };
    });

    this.emit({ type: 'reading', payload: this.machines });
  }

  public setSimulationSpeed(multiplier: number) {
    this.updateRateMs = 1500 / multiplier;
    this.startSimulation();
  }
}

export const mockTelemetryService = new TelemetrySimulator();
