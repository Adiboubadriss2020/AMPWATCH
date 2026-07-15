import React from 'react';
import type { Machine } from '../types';

interface MachineCardProps {
  machine: Machine;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export const MachineCard: React.FC<MachineCardProps> = ({ machine, isSelected, onSelect }) => {
  const { machineId, machineName, status, kw, normalKw, timestamp, cooldown_remaining } = machine;

  // Format cooldown time (e.g. 4:12)
  const formatCooldown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Parse ISO timestamp or time string for card header
  const formatCardTime = (ts: string): string => {
    if (ts.includes('T')) {
      const date = new Date(ts);
      return date.toTimeString().split(' ')[0].substring(0, 5);
    }
    return ts.substring(0, 5);
  };

  // Calculate deviation relative to baseline target (normalKw)
  const deviationPercent = normalKw > 0 ? Math.round(((kw - normalKw) / normalKw) * 100) : 0;

  // Determine status configurations
  let subtext = '';
  let deviationText = '';

  switch (status) {
    case 'CRITIQUE':
      deviationText = `+${deviationPercent}% vs limit`;
      subtext = `flagged ${formatCardTime(timestamp)}`;
      break;
    case 'AVERTISSEMENT':
      deviationText = `+${deviationPercent}% vs limit`;
      subtext = 'watching telemetry';
      break;
    case 'NOMINAL':
    default:
      deviationText = '';
      subtext = 'Nominal · within limits';
      break;
  }

  // Map status to CSS colors
  const getStatusColor = (s: string) => {
    if (s === 'CRITIQUE') return 'var(--color-red)';
    if (s === 'AVERTISSEMENT') return 'var(--color-amber)';
    return 'var(--color-green)';
  };

  return (
    <button
      onClick={() => onSelect(machineId)}
      className={`machine-card ${isSelected ? 'selected' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        padding: '1rem',
        backgroundColor: isSelected ? 'var(--color-hairline)' : 'var(--color-panel)',
        border: '1px solid',
        borderColor: isSelected ? 'var(--color-blue)' : 'var(--color-hairline)',
        borderRadius: '8px',
        textAlign: 'left',
        transition: 'all 0.2s ease',
        gap: '0.5rem',
        marginBottom: '0.75rem',
      }}
    >
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span 
            className={status === 'CRITIQUE' ? 'pulse-critical' : ''}
            style={{
              width: '8px',
              height: '8px',
              backgroundColor: getStatusColor(status),
              display: 'inline-block',
              borderRadius: '50%',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', fontFamily: 'var(--font-heading)' }}>
              {machineId}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
              {machineName}
            </span>
          </div>
        </div>
        <span className="timestamp" style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
          {formatCardTime(timestamp)}
        </span>
      </div>

      {/* Reading Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
          <span className="number" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
            {kw.toFixed(1)}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>kW</span>
        </div>

        {deviationText && (
          <span 
            className="number"
            style={{ 
              fontSize: '0.85rem', 
              fontWeight: 600, 
              color: getStatusColor(status) 
            }}
          >
            {deviationText}
          </span>
        )}
      </div>

      {/* Footer Row / Subtext */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', fontSize: '0.8rem' }}>
        <span style={{ color: status === 'NOMINAL' ? 'var(--color-muted)' : 'var(--color-text)', opacity: 0.9 }}>
          {subtext}
        </span>
        <span 
          style={{ 
            fontSize: '0.65rem', 
            fontWeight: 700, 
            backgroundColor: status === 'CRITIQUE' ? 'rgba(255, 77, 94, 0.1)' : status === 'AVERTISSEMENT' ? 'rgba(242, 174, 61, 0.1)' : 'rgba(47, 217, 140, 0.1)',
            color: getStatusColor(status),
            padding: '0.1rem 0.3rem',
            borderRadius: '3px',
            letterSpacing: '0.05em'
          }}
        >
          {status}
        </span>
      </div>

      {/* Suppression Cooldown Badge (Section 3.6 / Step 10) */}
      {cooldown_remaining !== null && (
        <div 
          style={{
            marginTop: '0.25rem',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            backgroundColor: 'rgba(242, 174, 61, 0.1)',
            border: '1px solid rgba(242, 174, 61, 0.2)',
            color: 'var(--color-amber)',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontFamily: 'var(--font-mono)'
          }}
        >
          <span>🔕 Supprimé ({formatCooldown(cooldown_remaining)})</span>
        </div>
      )}
    </button>
  );
};
