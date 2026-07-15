import { useState, useEffect } from 'react';
import { mockTelemetryService } from './mockService';
import type { Machine, Reading, EventLogItem, KPIs } from './types';
import { MachineCard } from './components/MachineCard';
import { HeroChart } from './components/HeroChart';
import { EventLog } from './components/EventLog';
import { KPIPanel } from './components/KPIPanel';
import { SimulationControl } from './components/SimulationControl';

function App() {
  // State management
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState<string>('COMP-01');
  const [events, setEvents] = useState<EventLogItem[]>([]);
  const [kpis, setKpis] = useState<KPIs>({
    waste_avoided: 0,
    time_to_detection: 0,
    anomalies_this_week: 0,
    false_alert_rate: 0,
    fleet_uptime: 100,
  });

  // Selected machine's chart series history
  const [activeHistory, setActiveHistory] = useState<{
    series: Reading[];
    baseline_min: number;
    baseline_max: number;
    anomaly_index: number;
  } | null>(null);

  // Load initial data
  useEffect(() => {
    const initialMachines = mockTelemetryService.getMachines();
    setMachines(initialMachines);

    const initialEvents = mockTelemetryService.getRecentEvents();
    setEvents(initialEvents);

    const initialKPIs = mockTelemetryService.getKPIs();
    setKpis(initialKPIs);
  }, []);

  // Fetch active history when selected machine changes, or when machines list is updated (to get latest reading)
  useEffect(() => {
    if (!selectedMachineId) return;
    const history = mockTelemetryService.getHistory(selectedMachineId);
    setActiveHistory(history);
  }, [selectedMachineId, machines]);

  // Subscribe to live WebSocket-like telemetry events
  useEffect(() => {
    const unsubscribe = mockTelemetryService.subscribeTelemetry((message) => {
      if (message.type === 'reading') {
        const updatedMachines = message.payload as Machine[];
        setMachines(updatedMachines);
        // Recalculate KPIs
        setKpis(mockTelemetryService.getKPIs());
      } else if (message.type === 'event') {
        // Refresh events and KPIs
        setEvents(mockTelemetryService.getRecentEvents());
        setKpis(mockTelemetryService.getKPIs());
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Handle alert validation action
  const handleConfirmEvent = (eventId: string, wasReal: boolean) => {
    mockTelemetryService.confirmEvent(eventId, wasReal);
    // Reload events & KPIs
    setEvents(mockTelemetryService.getRecentEvents());
    setKpis(mockTelemetryService.getKPIs());
  };

  // Find selected machine details
  const selectedMachine = machines.find((m) => m.machineId === selectedMachineId);

  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
        width: '100vw',
        maxWidth: '100%',
        margin: '0',
        padding: '0 0 100px 0', // padding at bottom to avoid overlapping with simulation bar
        backgroundColor: 'var(--color-bg)',
        overflowX: 'hidden',
      }}
    >
      {/* Header bar */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.85rem 1.5rem',
          borderBottom: '1px solid var(--color-hairline)',
          backgroundColor: 'rgba(19, 24, 34, 0.7)',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div 
            style={{ 
              width: '14px', 
              height: '14px', 
              borderRadius: '3px', 
              backgroundColor: 'var(--color-blue)',
              boxShadow: '0 0 10px rgba(62, 142, 255, 0.4)'
            }} 
          />
          <h1 
            style={{ 
              margin: 0, 
              fontSize: '1.25rem', 
              fontWeight: 700, 
              fontFamily: 'var(--font-heading)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'var(--color-text)'
            }}
          >
            AMPWATCH
          </h1>
          <span style={{ color: 'var(--color-hairline)', fontSize: '0.85rem' }}>|</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontWeight: 500 }}>
            Factory Machine Overconsumption Detector
          </span>
        </div>

        {/* Live status badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span 
            style={{
              width: '6px',
              height: '6px',
              backgroundColor: 'var(--color-green)',
              borderRadius: '50%',
              display: 'inline-block',
              boxShadow: '0 0 6px var(--color-green)',
            }}
          />
          <span 
            className="mono"
            style={{ 
              fontSize: '0.75rem', 
              color: 'var(--color-muted)',
              fontWeight: 600,
              letterSpacing: '0.05em'
            }}
          >
            CAPTORS WS_LIVE: SECURE_CONN
          </span>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 300px) 1fr minmax(260px, 280px)',
          gap: '1rem',
          padding: '1rem 1.5rem',
          flexGrow: 1,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Left Column: Fleet List (Section 2.1) & Live Activity Journal */}
        <section 
          id="fleet-list"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Fleet Monitor</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 600 }}>
              {machines.length} NODES ONLINE
            </span>
          </div>
          
          <div 
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              paddingRight: '0.25rem'
            }}
          >
            {machines.map((machine) => (
              <MachineCard
                key={machine.machineId}
                machine={machine}
                isSelected={machine.machineId === selectedMachineId}
                onSelect={setSelectedMachineId}
              />
            ))}
          </div>

          <EventLog 
            events={events} 
            onConfirm={handleConfirmEvent} 
          />
        </section>

        {/* Center Column: Telemetry Hero Chart & Live Log (Section 2.1) */}
        <section 
          id="telemetry-hero"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}
        >
          {activeHistory && selectedMachine && (
            <HeroChart
              machine={selectedMachine}
              series={activeHistory.series}
              anomalyIndex={activeHistory.anomaly_index}
            />
          )}
        </section>

        {/* Right Column: Impact KPIs (Section 2.1 & 3.5) */}
        <section 
          id="impact-kpis"
          style={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <KPIPanel kpis={kpis} />
        </section>
      </main>

      {/* Simulator fault-injection control console overlay */}
      <SimulationControl 
        machines={machines.map(m => ({ machineId: m.machineId, status: m.status }))} 
        selectedMachineId={selectedMachineId} 
      />
    </div>
  );
}

export default App;
