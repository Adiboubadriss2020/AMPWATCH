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
          height: '30px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          borderBottom: isOpen ? '1px solid var(--color-hairline)' : 'none',
          color: 'var(--color-cyan)',
          fontSize: '0.68rem',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          userSelect: 'none',
          backgroundColor: 'rgba(41,211,240,0.04)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {isOpen ? '▼  SIMULATOR CONTROL CONSOLE  ▼' : '▲  SIMULATOR CONTROL CONSOLE  ▲'}
      </div>

      {/* Control Body */}
      <div className="sim-control-body" style={{ justifyContent: 'space-between' }}>
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
              fontSize: '0.8rem',
              backgroundColor: 'var(--color-amber-dim)',
              border: '1px solid var(--color-amber)',
              borderRadius: '6px',
              color: 'var(--color-amber)',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.04em',
              cursor: 'pointer',
              transition: 'box-shadow 0.2s',
              boxShadow: '0 0 8px rgba(242,184,75,0.2)',
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 16px rgba(242,184,75,0.5)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 8px rgba(242,184,75,0.2)')}
          >
            ⚠ Warning (+35%)
          </button>

          <button
            onClick={() => handleTriggerAnomaly('CRITIQUE')}
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.8rem',
              backgroundColor: 'var(--color-red-dim)',
              border: '1px solid var(--color-red)',
              borderRadius: '6px',
              color: 'var(--color-red)',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.04em',
              cursor: 'pointer',
              transition: 'box-shadow 0.2s',
              boxShadow: '0 0 8px rgba(255,75,75,0.25)',
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 18px rgba(255,75,75,0.55)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 8px rgba(255,75,75,0.25)')}
          >
            🔴 Critique (+75%)
          </button>

          <button
            onClick={handleTriggerNominal}
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.8rem',
              backgroundColor: 'var(--color-green-dim)',
              border: '1px solid var(--color-green)',
              borderRadius: '6px',
              color: 'var(--color-green)',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.04em',
              cursor: 'pointer',
              transition: 'box-shadow 0.2s',
              boxShadow: '0 0 8px rgba(63,209,107,0.2)',
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 16px rgba(63,209,107,0.5)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 8px rgba(63,209,107,0.2)')}
          >
            ✓ Force Nominal
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
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                backgroundColor: speed === s ? 'var(--color-cyan)' : 'var(--color-bg)',
                border: '1px solid',
                borderColor: speed === s ? 'var(--color-cyan)' : 'var(--color-hairline)',
                color: speed === s ? '#050B14' : 'var(--color-text)',
                borderRadius: '4px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: speed === s ? '0 0 8px rgba(41,211,240,0.4)' : 'none',
                transition: 'all 0.15s',
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
