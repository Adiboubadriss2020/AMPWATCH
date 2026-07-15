import type { Machine, Reading, EventLogItem, KPIs, MachineStatus } from './types';

// Predefined machine templates
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
  },
  {
    machineId: 'PRESS-04',
    machineName: 'Presse Stamping 4',
    normalKw: 40,
    scenario: 'SURCHAUFFE',
    anomalyType: 'EFFORT_MECANIQUE',
    cause: 'Surchauffe moteur par frottement mécanique (palier usé)',
    baseTemp: 35.2,
    basePression: 1010.1,
    baseHumidite: 48.5,
  },
  {
    machineId: 'WELD-01',
    machineName: 'Sonde Welder 1',
    normalKw: 25,
    scenario: 'NOZZLE_OBST',
    anomalyType: 'OBSTRUCTION_BUSE',
    cause: 'Buse de soudure partiellement obstruée (surintensité)',
    baseTemp: 22.1,
    basePression: 1012.0,
    baseHumidite: 50.1,
  },
  {
    machineId: 'HVAC-02',
    machineName: 'Centrale Ventilation 2',
    normalKw: 15,
    scenario: 'FILTRE',
    anomalyType: 'FILTRE_ENCRASSE',
    cause: 'Filtre à air encrassé entraînant une perte de charge',
    baseTemp: 19.5,
    basePression: 998.5,
    baseHumidite: 60.2,
  },
  {
    machineId: 'CNC-12',
    machineName: 'Fraiseuse CNC 12',
    normalKw: 60,
    scenario: 'POMPE_LUB',
    anomalyType: 'DEFAUT_LUBRIFICATION',
    cause: 'Pompe de lubrification en panne, échauffement broche',
    baseTemp: 28.0,
    basePression: 1011.5,
    baseHumidite: 45.3,
  }
];

// Energy Tariff in MAD per kWh
const ENERGY_TARIFF = 1.45;

// COOLDOWN Duration in seconds (Step 10 of BPMN - Duplicate alert limiting)
const COOLDOWN_DURATION = 300; 

class TelemetrySimulator {
  private machines: Machine[] = [];
  private histories: Map<string, Reading[]> = new Map();
  private events: EventLogItem[] = [];
  private callbacks: Set<(data: { type: 'reading' | 'event'; payload: any }) => void> = new Set();
  
  // Stats counters for KPIs
  private totalAlertsCount = 0;
  private confirmedAlertsCount = 0;
  private dismissedAlertsCount = 0;
  private nominalSeconds = 0;
  private totalSeconds = 0;
  private accumulatedWaste = 0;

  // Simulator control variables
  private intervalId: any = null;
  private cooldownTimerId: any = null;
  private updateRateMs = 1500; // Live update every 1.5 seconds

  constructor() {
    this.init();
  }

  private init() {
    const now = new Date();
    
    this.machines = MACHINE_TEMPLATES.map((tmpl) => {
      // CNC-12 starts warning for demo representation
      const isCNC = tmpl.machineId === 'CNC-12';
      const status: MachineStatus = isCNC ? 'AVERTISSEMENT' : 'NOMINAL';
      
      const kw = isCNC 
        ? tmpl.normalKw * 1.25 
        : tmpl.normalKw * (0.95 + Math.random() * 0.1);
      
      const voltage = 380 + Math.round((Math.random() * 6 - 3) * 10) / 10;
      const powerFactor = 0.85 + Math.random() * 0.08;
      const current = (kw * 1000) / (voltage * 1.732 * powerFactor);
      const costPerHour = kw * ENERGY_TARIFF;

      // Generate history
      const historyList: Reading[] = [];
      for (let i = 59; i >= 0; i--) {
        const timePoint = new Date(now.getTime() - i * 3000);
        const timeStr = this.formatTime(timePoint);
        
        let ptKw = tmpl.normalKw * (0.95 + Math.random() * 0.1);
        let ptStatus: MachineStatus = 'NOMINAL';
        
        if (isCNC && i < 15) {
          ptKw = tmpl.normalKw * 1.22 + Math.random() * 3;
          ptStatus = 'AVERTISSEMENT';
        }
        
        historyList.push({
          t: timeStr,
          kw: Math.round(ptKw * 10) / 10,
          status: ptStatus
        });
      }
      this.histories.set(tmpl.machineId, historyList);

      return {
        machineId: tmpl.machineId,
        machineName: tmpl.machineName,
        timestamp: now.toISOString(),
        kw: Math.round(kw * 10) / 10,
        current: Math.round(current * 10) / 10,
        voltage: Math.round(voltage),
        temp: Math.round((isCNC ? tmpl.baseTemp + 8.5 : tmpl.baseTemp + Math.random() * 2) * 10) / 10,
        humidite: Math.round((tmpl.baseHumidite + Math.random() * 4 - 2) * 10) / 10,
        pression: Math.round((isCNC ? tmpl.basePression - 15 : tmpl.basePression + Math.random() * 6 - 3) * 10) / 10,
        powerFactor: Math.round(powerFactor * 100) / 100,
        costPerHour: Math.round(costPerHour * 100) / 100,
        normalKw: tmpl.normalKw,
        scenario: tmpl.scenario,
        status,
        anomaly: isCNC,
        anomalyType: isCNC ? tmpl.anomalyType : undefined,
        cause: isCNC ? tmpl.cause : undefined,
        potRaw: 3000 + Math.round(Math.random() * 300),
        wifi_rssi: -60 + Math.round(Math.random() * 10),
        relay: isCNC,
        cooldown_remaining: isCNC ? COOLDOWN_DURATION - 60 : null,
      };
    });

    // Seed initial events log
    const cncEventTime = new Date(now.getTime() - 15 * 3000);
    this.events = [
      {
        id: 'evt_init_1',
        time: this.formatTime(cncEventTime),
        tag: 'AVERTISSEMENT',
        machineId: 'CNC-12',
        message: 'CNC-12: 73.2 kW, 22% above baseline. Pompe de lubrification en panne, échauffement broche. Scenario: POMPE_LUB.',
        was_real_anomaly: null
      }
    ];

    this.totalAlertsCount = 1;
    this.nominalSeconds = 5 * 60 * 4;
    this.totalSeconds = 5 * 60 * 5;
    this.accumulatedWaste = 12.5;

    this.startSimulation();
    this.startCooldownTimer();
  }

  private formatTime(date: Date): string {
    return date.toTimeString().split(' ')[0];
  }

  private startSimulation() {
    if (this.intervalId) clearInterval(this.intervalId);
    
    this.intervalId = setInterval(() => {
      this.tick();
    }, this.updateRateMs);
  }

  private startCooldownTimer() {
    if (this.cooldownTimerId) clearInterval(this.cooldownTimerId);
    
    this.cooldownTimerId = setInterval(() => {
      let changed = false;
      this.machines = this.machines.map((m) => {
        if (m.cooldown_remaining !== null && m.cooldown_remaining > 0) {
          changed = true;
          return {
            ...m,
            cooldown_remaining: m.cooldown_remaining - 1
          };
        } else if (m.cooldown_remaining === 0) {
          changed = true;
          return {
            ...m,
            cooldown_remaining: null
          };
        }
        return m;
      });

      if (changed) {
        this.emit({ type: 'reading', payload: this.machines });
      }
    }, 1000);
  }

  private tick() {
    const now = new Date();
    const nowStr = this.formatTime(now);
    this.totalSeconds += 1.5 * this.machines.length;

    this.machines = this.machines.map((machine) => {
      const template = MACHINE_TEMPLATES.find(t => t.machineId === machine.machineId)!;
      let kw = 0;
      let status = machine.status;

      if (status === 'NOMINAL') {
        // Random walk normal
        kw = machine.normalKw * (0.95 + Math.random() * 0.1);
        this.nominalSeconds += 1.5;
      } else {
        // Anomaly mode
        const severityMultiplier = status === 'CRITIQUE' ? 1.55 : 1.25;
        kw = machine.normalKw * severityMultiplier + (Math.random() * 4);
        
        const devKwh = kw - machine.normalKw;
        const wasteIncrement = (devKwh * (1.5 / 3600)) * ENERGY_TARIFF;
        this.accumulatedWaste += wasteIncrement;
      }

      kw = Math.round(kw * 10) / 10;
      const deviation_percent = Math.round(((kw - machine.normalKw) / machine.normalKw) * 100);

      // State transitions
      let newStatus: MachineStatus = 'NOMINAL';
      if (kw > machine.normalKw * 1.1) {
        newStatus = deviation_percent >= 35 ? 'CRITIQUE' : 'AVERTISSEMENT';
      }

      // Calculate matching physics
      const voltage = 380 + Math.round((Math.random() * 4 - 2) * 10) / 10;
      const powerFactor = newStatus === 'NOMINAL' ? (0.86 + Math.random() * 0.05) : (0.75 + Math.random() * 0.06);
      const current = (kw * 1000) / (voltage * 1.732 * powerFactor);
      const costPerHour = kw * ENERGY_TARIFF;

      // Handle duplicate alert limiting (BPMN Step 10)
      if (newStatus !== 'NOMINAL' && machine.status === 'NOMINAL') {
        if (machine.cooldown_remaining === null) {
          this.triggerAlert(machine.machineId, newStatus, kw, deviation_percent, nowStr);
          machine.cooldown_remaining = COOLDOWN_DURATION;
          machine.status = newStatus;
          machine.anomaly = true;
          machine.anomalyType = template.anomalyType;
          machine.cause = template.cause;
        } else {
          machine.status = newStatus;
          machine.anomaly = true;
          machine.anomalyType = template.anomalyType;
          machine.cause = template.cause;
        }
      } else if (newStatus === 'NOMINAL' && machine.status !== 'NOMINAL') {
        this.triggerRecovery(machine.machineId, nowStr);
        machine.status = 'NOMINAL';
        machine.anomaly = false;
        machine.anomalyType = undefined;
        machine.cause = undefined;
      }

      // Physics variations based on status
      let temp = machine.temp;
      let pression = machine.pression;
      if (newStatus === 'NOMINAL') {
        temp = Math.round((template.baseTemp + Math.random() * 1.5) * 10) / 10;
        pression = Math.round((template.basePression + Math.random() * 4 - 2) * 10) / 10;
      } else {
        const offset = newStatus === 'CRITIQUE' ? 18.5 : 8.2;
        temp = Math.round((template.baseTemp + offset + Math.random() * 2) * 10) / 10;
        
        // Pressure drops during COMP-01 air leak
        if (machine.machineId === 'COMP-01') {
          pression = Math.round((template.basePression - 85 - Math.random() * 30) * 10) / 10;
        } else {
          pression = Math.round((template.basePression + Math.random() * 4 - 2) * 10) / 10;
        }
      }

      // Update history series
      const history = this.histories.get(machine.machineId) || [];
      const updatedHistory: Reading[] = [...history.slice(1), { t: nowStr, kw, status: machine.status }];
      this.histories.set(machine.machineId, updatedHistory);

      return {
        ...machine,
        timestamp: now.toISOString(),
        kw,
        current: Math.round(current * 10) / 10,
        voltage: Math.round(voltage),
        temp,
        pression,
        humidite: Math.round((template.baseHumidite + Math.random() * 3 - 1.5) * 10) / 10,
        powerFactor: Math.round(powerFactor * 100) / 100,
        costPerHour: Math.round(costPerHour * 100) / 100,
        potRaw: 3000 + Math.round(Math.random() * 250),
        wifi_rssi: -62 + Math.round(Math.random() * 8),
        relay: newStatus !== 'NOMINAL',
      };
    });

    this.emit({ type: 'reading', payload: this.machines });
  }

  private triggerAlert(machineId: string, status: MachineStatus, kw: number, deviation: number, timeStr: string) {
    const template = MACHINE_TEMPLATES.find(t => t.machineId === machineId)!;
    const msg = `${machineId}: ${kw} kW, ${deviation}% above normal limit. Alert generated. AI analysis: "${template.cause}" [Type: ${template.anomalyType}]`;
    
    const newEvent: EventLogItem = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      time: timeStr,
      tag: status,
      machineId,
      message: msg,
      was_real_anomaly: null
    };

    this.events = [newEvent, ...this.events].slice(0, 100);
    this.totalAlertsCount++;

    this.emit({ type: 'event', payload: newEvent });
  }

  private triggerRecovery(machineId: string, timeStr: string) {
    const newEvent: EventLogItem = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      time: timeStr,
      tag: 'resolved',
      machineId,
      message: `${machineId}: Consumption has returned to normal range. Relay nominal.`,
    };

    this.events = [newEvent, ...this.events].slice(0, 100);
    this.emit({ type: 'event', payload: newEvent });
  }

  private emit(data: { type: 'reading' | 'event'; payload: any }) {
    this.callbacks.forEach(cb => cb(data));
  }

  // PUBLIC API ENDPOINTS

  public subscribeTelemetry(callback: (data: { type: 'reading' | 'event'; payload: any }) => void) {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  public getMachines(): Machine[] {
    return this.machines;
  }

  public getHistory(machineId: string): { series: Reading[], baseline_min: number, baseline_max: number, machineId: string, anomaly_index: number } {
    const series = this.histories.get(machineId) || [];
    const template = MACHINE_TEMPLATES.find(t => t.machineId === machineId)
      ?? MACHINE_TEMPLATES[0]; // fallback to first template if ID not found yet
    
    let anomaly_index = -1;
    for (let i = 0; i < series.length; i++) {
      if (series[i].status !== 'NOMINAL') {
        anomaly_index = i;
        break;
      }
    }

    return {
      machineId: machineId,
      baseline_min: Math.round(template.normalKw * 0.9),
      baseline_max: Math.round(template.normalKw * 1.1),
      series,
      anomaly_index
    };
  }

  public getRecentEvents(): EventLogItem[] {
    return this.events;
  }

  public getKPIs(): KPIs {
    const totalReviewed = this.confirmedAlertsCount + this.dismissedAlertsCount;
    const falseAlertRate = totalReviewed > 0 
      ? Math.round((this.dismissedAlertsCount / totalReviewed) * 100) 
      : 0;
    
    const fleetUptime = Math.round((this.nominalSeconds / Math.max(1, this.totalSeconds)) * 100);

    return {
      waste_avoided: Math.round(this.accumulatedWaste * 100) / 100,
      time_to_detection: 1.8,
      anomalies_this_week: this.events.filter(e => e.tag === 'CRITIQUE' && e.was_real_anomaly !== false).length,
      false_alert_rate: falseAlertRate,
      fleet_uptime: Math.min(100, Math.max(70, fleetUptime))
    };
  }

  public confirmEvent(eventId: string, was_real_anomaly: boolean) {
    this.events = this.events.map((evt) => {
      if (evt.id === eventId) {
        if (evt.was_real_anomaly === null) {
          if (was_real_anomaly) {
            this.confirmedAlertsCount++;
          } else {
            this.dismissedAlertsCount++;
          }
        }
        return { ...evt, was_real_anomaly };
      }
      return evt;
    });

    const updatedEvt = this.events.find(e => e.id === eventId);
    if (updatedEvt) {
      this.emit({ type: 'event', payload: updatedEvt });
    }
  }

  // SIMULATOR CONTROLS FOR DEMO

  public triggerAnomaly(machineId: string, status: 'AVERTISSEMENT' | 'CRITIQUE') {
    const now = new Date();
    const nowStr = this.formatTime(now);
    
    this.machines = this.machines.map((m) => {
      if (m.machineId === machineId) {
        const template = MACHINE_TEMPLATES.find(t => t.machineId === machineId)!;
        
        const multiplier = status === 'CRITIQUE' ? 1.55 : 1.25;
        const kw = Math.round((m.normalKw * multiplier + Math.random() * 2) * 10) / 10;
        const deviation_percent = Math.round(((kw - m.normalKw) / m.normalKw) * 100);

        const newEvent: EventLogItem = {
          id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          time: nowStr,
          tag: status,
          machineId,
          message: `${machineId}: ${kw} kW, ${deviation_percent}% above normal limit. Alert generated. AI analysis: "${template.cause}" [Type: ${template.anomalyType}]`,
          was_real_anomaly: null
        };

        this.events = [newEvent, ...this.events].slice(0, 100);
        this.totalAlertsCount++;
        
        this.emit({ type: 'event', payload: newEvent });

        const history = this.histories.get(machineId) || [];
        const updatedHistory: Reading[] = [...history.slice(1), { t: nowStr, kw, status }];
        this.histories.set(machineId, updatedHistory);

        // Adjust physics values
        const voltage = 378 + Math.round(Math.random() * 4 * 10) / 10;
        const powerFactor = 0.76;
        const current = (kw * 1000) / (voltage * 1.732 * powerFactor);
        const costPerHour = kw * ENERGY_TARIFF;

        return {
          ...m,
          status,
          kw,
          current: Math.round(current * 10) / 10,
          voltage: Math.round(voltage),
          temp: Math.round((template.baseTemp + (status === 'CRITIQUE' ? 19.5 : 8.5)) * 10) / 10,
          pression: Math.round((machineId === 'COMP-01' ? template.basePression - 95 : template.basePression) * 10) / 10,
          powerFactor,
          costPerHour: Math.round(costPerHour * 100) / 100,
          cooldown_remaining: COOLDOWN_DURATION,
          anomaly: true,
          anomalyType: template.anomalyType,
          cause: template.cause,
          relay: true
        };
      }
      return m;
    });

    this.emit({ type: 'reading', payload: this.machines });
  }

  public triggerNominal(machineId: string) {
    const now = new Date();
    const nowStr = this.formatTime(now);

    this.machines = this.machines.map((m) => {
      if (m.machineId === machineId && m.status !== 'NOMINAL') {
        const kw = Math.round((m.normalKw * (0.95 + Math.random() * 0.1)) * 10) / 10;
        
        this.triggerRecovery(machineId, nowStr);
        
        const history = this.histories.get(machineId) || [];
        const updatedHistory: Reading[] = [...history.slice(1), { t: nowStr, kw, status: 'NOMINAL' }];
        this.histories.set(machineId, updatedHistory);

        const voltage = 380 + Math.round((Math.random() * 4 - 2) * 10) / 10;
        const powerFactor = 0.88;
        const current = (kw * 1000) / (voltage * 1.732 * powerFactor);
        const costPerHour = kw * ENERGY_TARIFF;

        return {
          ...m,
          status: 'NOMINAL',
          kw,
          current: Math.round(current * 10) / 10,
          voltage: Math.round(voltage),
          temp: m.temp - 12 > m.normalKw ? m.temp - 12 : 24.5,
          pression: 1013.2,
          powerFactor,
          costPerHour: Math.round(costPerHour * 100) / 100,
          cooldown_remaining: null,
          anomaly: false,
          anomalyType: undefined,
          cause: undefined,
          relay: false
        };
      }
      return m;
    });

    this.emit({ type: 'reading', payload: this.machines });
  }

  public setSimulationSpeed(multiplier: number) {
    this.updateRateMs = 1500 / multiplier;
    this.startSimulation();
  }
}

export const mockTelemetryService = new TelemetrySimulator();
