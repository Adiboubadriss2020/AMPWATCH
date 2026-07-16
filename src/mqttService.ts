/**
 * MQTT Live Sensor Integration Service
 * Prepared for real-time factory broker connection.
 *
 * To activate, install mqtt client:
 * `npm install mqtt --save`
 *
 * And import this file in `src/App.tsx` to switch from the simulation loop to the live broker stream.
 */

/*
import mqtt from 'mqtt';
import type { Machine, Reading } from './types';

// MQTT Client Configuration
const MQTT_CONFIG = {
  brokerUrl: 'wss://broker.hivemq.com:8000/mqtt', // Standard WebSocket-MQTT broker URL
  options: {
    clientId: `ampwatch_dashboard_${Math.random().toString(16).substr(2, 8)}`,
    username: '', // Add credentials if needed
    password: '',
    clean: true,
    connectTimeout: 4000,
  },
  topic: 'ampwatch/factory/telemetry/#' // Subscribe to all machine telemetry streams
};

export class MqttSensorService {
  private client: mqtt.MqttClient | null = null;
  private onMessageCallback: ((data: Machine) => void) | null = null;

  constructor() {
    // Constructor prepared
  }

  // Connect to the MQTT Broker
  public connect(onMessage: (data: Machine) => void) {
    this.onMessageCallback = onMessage;
    
    console.log(`[MQTT] Connecting to broker at ${MQTT_CONFIG.brokerUrl}...`);
    this.client = mqtt.connect(MQTT_CONFIG.brokerUrl, MQTT_CONFIG.options);

    this.client.on('connect', () => {
      console.log('[MQTT] Connected successfully to broker.');
      // Subscribe to target channel
      this.client?.subscribe(MQTT_CONFIG.topic, (err) => {
        if (!err) {
          console.log(`[MQTT] Subscribed to topic: ${MQTT_CONFIG.topic}`);
        } else {
          console.error('[MQTT] Subscription error:', err);
        }
      });
    });

    this.client.on('message', (topic, message) => {
      try {
        const payloadStr = message.toString();
        const data = JSON.parse(payloadStr);

        let now = new Date();
        let options: Intl.DateTimeFormatOptions = { timeZone: 'Africa/Casablanca' };
        let dateStr = now.toLocaleDateString('fr-FR', options);
        let timeStr = now.toLocaleTimeString('fr-FR', options);
        let heure = now.getHours();

        // ── Normalisation donnees capteurs ──
        let kw = parseFloat(data.kw) || 0;
        let current = parseFloat(data.current) || 0;
        let voltage = parseFloat(data.voltage) || 380;
        let temp = parseFloat(data.temp) || 0;
        let humidite = parseFloat(data.humidite) || 50;
        let pression = parseFloat(data.pression) || 1013;
        let powerFactor = parseFloat(data.powerFactor) || 0.85;
        let normalKw = parseFloat(data.normalKw) || 50;
        let deviation = Math.round(((kw - normalKw) / normalKw) * 100);

        // ══════════════════════════════════════════
        // FEATURE 2 : Calcul CO2 temps reel
        // ══════════════════════════════════════════
        let facteurCO2 = 0.7;  // kg CO2 par kWh (mix electrique Maroc)
        let co2ParHeure = Math.round(kw * facteurCO2 * 100) / 100;
        let co2ParJour = Math.round(co2ParHeure * 8 * 100) / 100;
        let co2Economise = Math.round(Math.max(0, normalKw - kw) * facteurCO2 * 100) / 100;

        // ══════════════════════════════════════════
        // FEATURE 4 : Tarification HP/HC Maroc
        // ══════════════════════════════════════════
        let isHP = (heure >= 7 && heure <= 22);
        let tarifKwh = isHP ? 0.15 : 0.08;  // DH/kWh heures pleines vs creuses
        let costPerHour = Math.round(kw * tarifKwh * 100) / 100;
        let trancheHoraire = isHP ? "HEURES_PLEINES" : "HEURES_CREUSES";
        let conseilTarif = "";
        if (isHP && kw > normalKw * 0.8) {
            conseilTarif = "Decaler cette charge en HC pour economiser " + Math.round((0.15 - 0.08) * kw * 100) / 100 + " DH/h";
        }

        // ══════════════════════════════════════════
        // FEATURE 1 : Score usure maintenance predictive
        // ══════════════════════════════════════════
        let scoreUsure = 0;
        if (kw > normalKw * 1.1) scoreUsure += Math.round((kw - normalKw) * 0.5);
        if (temp > 35) scoreUsure += Math.round((temp - 35) * 3);
        if (humidite > 70) scoreUsure += Math.round((humidite - 70) * 1);
        if (deviation > 20) scoreUsure += Math.round(deviation * 0.3);
        scoreUsure = Math.min(100, Math.max(0, scoreUsure));

        let prochaineMaintenance = "Aucune requise";
        if (scoreUsure > 80) prochaineMaintenance = "URGENT — planifier cette semaine";
        else if (scoreUsure > 60) prochaineMaintenance = "Planifier sous 2 semaines";
        else if (scoreUsure > 40) prochaineMaintenance = "Prochain arret programme";
        let dureeVieEstimee = Math.max(0, 100 - scoreUsure);

        // ══════════════════════════════════════════
        // FEATURE 3 : Drift Detection (derive lente)
        // ══════════════════════════════════════════
        let driftPct = deviation;
        let driftAlerte = Math.abs(driftPct) > 5;
        let driftMessage = "";
        if (driftPct > 15) driftMessage = "DERIVE FORTE : consommation en hausse significative";
        else if (driftPct > 5) driftMessage = "DERIVE LEGERE : tendance a la hausse";
        else if (driftPct < -15) driftMessage = "SOUS-CONSOMMATION : verifier si machine en panne partielle";
        else driftMessage = "Stable";

        // ══════════════════════════════════════════
        // Detection anomalie (toutes les regles)
        // ══════════════════════════════════════════
        let isAnomaly = false;
        let anomalyType = "NONE";
        let severity = "NORMAL";

        // Regle 1 : Surconsommation > 105%
        if (kw > normalKw * 1.05) {
            isAnomaly = true;
            anomalyType = "SURCONSOMMATION";
            severity = kw > normalKw * 1.5 ? "CRITIQUE" : "ATTENTION";
        }

        // Regle 2 : Surchauffe
        if (temp > 80) {
            isAnomaly = true;
            anomalyType = "SURCHAUFFE";
            severity = "CRITIQUE";
        }

        // Regle 3 : Scenario PAUSE
        if (data.scenario === "PAUSE" && kw > normalKw * 0.3) {
            isAnomaly = true;
            anomalyType = "MACHINE_ACTIVE_PAUSE";
            severity = "CRITIQUE";
        }

        // Regle 4 : Scenario FUITE
        if (data.scenario === "FUITE" && kw > normalKw * 0.8) {
            isAnomaly = true;
            anomalyType = "FUITE_AIR";
            severity = "CRITIQUE";
        }

        // Regle 5 : Scenario SURCHARGE
        if (data.scenario === "SURCHARGE" && kw > normalKw * 1.0) {
            isAnomaly = true;
            anomalyType = "SURCHARGE_MOTEUR";
            severity = kw > normalKw * 1.3 ? "CRITIQUE" : "ATTENTION";
        }

        // FEATURE 7 : Mode Nuit / Hors production
        let horsProduction = (heure >= 20 || heure < 6);
        if (horsProduction && kw > 10) {
            isAnomaly = true;
            anomalyType = "HORS_PRODUCTION";
            severity = "CRITIQUE";
        }

        // Regle 6 : Drift alert
        if (driftAlerte && !isAnomaly) {
            isAnomaly = true;
            anomalyType = "DERIVE_LENTE";
            severity = "ATTENTION";
        }

        // Regle 7 : Force anomalie (Button2)
        if (data.forceAnomalie === true) {
            isAnomaly = true;
            anomalyType = "DEMO_FORCEE";
            severity = "CRITIQUE";
        }

        // Normalize raw payload to fit frontend Machine state model
        const machineData: Machine = {
          machineId: data.machineId || 'COMP-01',
          machineName: data.machineName || 'Compresseur Air 1',
          timestamp: now.toISOString(),
          date: dateStr,
          time: timeStr,
          heure: heure,
          kw: kw,
          current: current,
          voltage: Math.round(voltage),
          temp: temp,
          humidite: humidite,
          pression: pression,
          powerFactor: powerFactor,
          costPerHour: costPerHour,
          normalKw: normalKw,
          deviation: deviation,
          isAnomaly: isAnomaly,
          severity: severity,
          scenario: data.scenario || 'normal',
          co2ParHeure: co2ParHeure,
          co2ParJour: co2ParJour,
          co2Economise: co2Economise,
          tarifKwh: tarifKwh,
          trancheHoraire: trancheHoraire,
          conseilTarif: conseilTarif,
          scoreUsure: scoreUsure,
          prochaineMaintenance: prochaineMaintenance,
          dureeVieEstimee: dureeVieEstimee,
          driftPct: driftPct,
          driftAlerte: driftAlerte,
          driftMessage: driftMessage,
          horsProduction: horsProduction,
          // Maps status strings
          status: severity === 'CRITIQUE' ? 'CRITIQUE' 
            : severity === 'ATTENTION' || severity === 'AVERTISSEMENT' ? 'AVERTISSEMENT' 
            : 'NOMINAL',
          anomaly: isAnomaly === true || severity === 'CRITIQUE',
          anomalyType: anomalyType !== 'NONE' ? anomalyType : undefined,
          cause: severity === 'CRITIQUE' ? 'Alerte surcharge de puissance' : undefined,
          wifi_rssi: typeof data.wifi_rssi === 'number' ? data.wifi_rssi : -58,
          relay: data.relay === true || false,
          cooldown_remaining: null
        };

        if (this.onMessageCallback) {
          this.onMessageCallback(machineData);
        }
      } catch (err) {
        console.error('[MQTT] Failed to process message from topic:', topic, err);
      }
    });

    this.client.on('error', (err) => {
      console.error('[MQTT] Connection error:', err);
    });

    this.client.on('close', () => {
      console.log('[MQTT] Connection closed.');
    });
  }

  // Disconnect from the Broker
  public disconnect() {
    if (this.client) {
      console.log('[MQTT] Disconnecting client...');
      this.client.end();
      this.client = null;
    }
  }
}

export const mqttSensorService = new MqttSensorService();
*/
export {};
