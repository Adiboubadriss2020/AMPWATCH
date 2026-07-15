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
        const rawData = JSON.parse(payloadStr);

        // Normalize raw payload to fit frontend Machine state model
        const machineData: Machine = {
          machineId: rawData.machineId || 'COMP-01',
          machineName: rawData.machineName || 'Compresseur Air 1',
          timestamp: rawData.timestamp || new Date().toISOString(),
          date: rawData.date || new Date().toLocaleDateString('fr-FR'),
          time: rawData.time || new Date().toLocaleTimeString('fr-FR'),
          kw: typeof rawData.kw === 'number' ? rawData.kw : parseFloat(rawData.kw || 0),
          current: typeof rawData.current === 'number' ? rawData.current : parseFloat(rawData.current || 0),
          voltage: typeof rawData.voltage === 'number' ? rawData.voltage : parseInt(rawData.voltage || 380),
          temp: typeof rawData.temp === 'number' ? rawData.temp : parseFloat(rawData.temp || 0),
          humidite: typeof rawData.humidite === 'number' ? rawData.humidite : 55.2,
          pression: typeof rawData.pression === 'number' ? rawData.pression : 1013.4,
          powerFactor: typeof rawData.powerFactor === 'number' ? rawData.powerFactor : parseFloat(rawData.powerFactor || 0.85),
          costPerHour: typeof rawData.costPerHour === 'number' ? rawData.costPerHour : parseFloat(rawData.costPerHour || 0),
          normalKw: typeof rawData.normalKw === 'number' ? rawData.normalKw : 50,
          deviation: typeof rawData.deviation === 'number' ? rawData.deviation : 0,
          isAnomaly: rawData.isAnomaly === true || rawData.severity === 'CRITIQUE' || rawData.severity === 'ATTENTION',
          severity: rawData.severity || 'NORMAL',
          scenario: rawData.scenario || 'normal',
          // Maps status strings
          status: rawData.severity === 'CRITIQUE' ? 'CRITIQUE' 
            : rawData.severity === 'ATTENTION' || rawData.severity === 'AVERTISSEMENT' ? 'AVERTISSEMENT' 
            : 'NOMINAL',
          anomaly: rawData.isAnomaly === true || rawData.severity === 'CRITIQUE',
          anomalyType: rawData.anomalyType !== 'NONE' ? rawData.anomalyType : undefined,
          cause: rawData.severity === 'CRITIQUE' ? 'Alerte surcharge de puissance' : undefined,
          wifi_rssi: typeof rawData.wifi_rssi === 'number' ? rawData.wifi_rssi : -58,
          relay: rawData.relay === true || false,
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
