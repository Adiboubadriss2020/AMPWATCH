import React, { useState } from 'react';
import { mockTelemetryService } from '../mockService';

interface SimulationControlProps {
  machines: Array<{ machineId: string; status: string }>;
  selectedMachineId: string;
}

export const SimulationControl: React.FC<SimulationControlProps> = ({ machines, selectedMachineId }) => {
  const [speed, setSpeed] = useState<number>(1);
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [targetId, setTargetId] = useState<string>(selectedMachineId || machines[0]?.machineId || '');

  // Keep targetId in sync if selectedMachineId changes
  React.useEffect(() => {
    if (selectedMachineId) {
      setTargetId(selectedMachineId);
    }
  }, [selectedMachineId]);

  const handleTriggerAnomaly = (status: 'AVERTISSEMENT' | 'CRITIQUE') => {
    if (!targetId) return;
    mockTelemetryService.triggerAnomaly(targetId, status);
  };

  const handleTriggerNominal = () => {
    if (!targetId) return;
    mockTelemetryService.triggerNominal(targetId);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    mockTelemetryService.setSimulationSpeed(newSpeed);
  };

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'var(--color-bg-alpha)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--color-hairline)',
        boxShadow: '0 -8px 24px var(--color-shadow)',
        zIndex: 100,
        transition: 'transform 0.3s ease-in-out',
        transform: isOpen ? 'translateY(0)' : 'translateY(calc(100% - 32px))',
      }}
    >
      {/* Toggle Tab */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          height: '32px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          borderBottom: isOpen ? '1px solid var(--color-hairline)' : 'none',
          color: 'var(--color-blue)',
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          userSelect: 'none',
          backgroundColor: 'var(--color-bg-subtle)',
        }}
      >
        {isOpen ? '▼ HIDE DEMO SIMULATOR CONTROL CONSOLE' : '▲ SHOW DEMO SIMULATOR CONTROL CONSOLE'}
      </div>

      {/* Control Body */}
      <div 
        style={{
          padding: '1rem 2rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
        }}
      >
        {/* Machine selection and injection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--color-muted)', fontWeight: 600 }}>
            FAULT INJECTION TARGET:
          </label>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            style={{
              backgroundColor: 'var(--color-bg)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-hairline)',
              borderRadius: '4px',
              padding: '0.35rem 0.75rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          >
            {machines.map((m) => (
              <option key={m.machineId} value={m.machineId}>
                {m.machineId} ({m.status})
              </option>
            ))}
          </select>

          <button
            onClick={() => handleTriggerAnomaly('AVERTISSEMENT')}
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.85rem',
              backgroundColor: 'var(--color-amber-dim)',
              border: '1px solid var(--color-amber)',
              borderRadius: '4px',
              color: 'var(--color-amber)',
              fontWeight: 600,
            }}
          >
            Inject Warning (+35%)
          </button>

          <button
            onClick={() => handleTriggerAnomaly('CRITIQUE')}
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.85rem',
              backgroundColor: 'var(--color-red-dim)',
              border: '1px solid var(--color-red)',
              borderRadius: '4px',
              color: 'var(--color-red)',
              fontWeight: 600,
            }}
          >
            Inject Anomaly (+75%)
          </button>

          <button
            onClick={handleTriggerNominal}
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.85rem',
              backgroundColor: 'var(--color-green-dim)',
              border: '1px solid var(--color-green)',
              borderRadius: '4px',
              color: 'var(--color-green)',
              fontWeight: 600,
            }}
          >
            Force Nominal (Clear Fault)
          </button>
        </div>

        {/* Speed settings */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-muted)', fontWeight: 600 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-critical)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            SIMULATION SPEED:
          </span>
          {[1, 2, 5, 15, 60].map((s) => (
            <button
              key={s}
              onClick={() => handleSpeedChange(s)}
              style={{
                width: '36px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                backgroundColor: speed === s ? 'var(--color-blue)' : 'var(--color-bg)',
                border: '1px solid',
                borderColor: speed === s ? 'var(--color-blue)' : 'var(--color-hairline)',
                color: speed === s ? '#0B0E13' : 'var(--color-text)',
                borderRadius: '4px',
                fontWeight: 700,
              }}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Cooldown cheat explanation */}
        <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', maxWidth: '280px', lineBreak: 'strict' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <span style={{ color: 'var(--color-blue)', fontWeight: 600 }}>Tip:</span> Increase speed to <b>15x</b> or <b>60x</b> to watch the 300s alert cooldown suppress timers countdown in real-time.
        </span>
        </div>
      </div>
    </div>
  );
};
export default SimulationControl;
