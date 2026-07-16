import React from 'react';
import type { Machine } from '../types';

interface AnomalyAlertProps {
  machine: Machine;
}

export const AnomalyAlert: React.FC<AnomalyAlertProps> = ({ machine }) => {
  const isAnomaly = machine.status !== 'NOMINAL';

  // Static mock sparkline data for alert visual look matching reference image
  const alertSparkline = [5, 10, 8, 12, 15, 11, 14, 18, 10, 8, 12, 14, 25, 20, 24];

  const formatTime = (ts: string) => {
    if (ts.includes('T')) return new Date(ts).toTimeString().slice(0, 8);
    return ts;
  };

  const border = isAnomaly ? '1px solid var(--color-red)' : '1px solid var(--color-hairline)';
  const bg = isAnomaly ? 'rgba(255,75,75,0.02)' : 'var(--color-surface)';
  const glow = isAnomaly ? 'var(--glow-red)' : 'none';

  return (
    <div className="panel" style={{
      display: 'flex', flexDirection: 'column', gap: '0.65rem',
      padding: '0.85rem', border, backgroundColor: bg, boxShadow: glow,
      transition: 'all 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: isAnomaly ? 'var(--color-red)' : 'var(--color-cyan)' }}>
        <span>⚠</span>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Anomaly Alert
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--color-text-dim)' }}>Equipment:</span>
          <span className="mono" style={{ fontWeight: 600, color: 'var(--color-text)' }}>
            {machine.machineId} ({machine.machineName})
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--color-text-dim)' }}>Type:</span>
          <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
            {isAnomaly ? machine.anomalyType : 'Normal Operation'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--color-text-dim)' }}>Severity:</span>
          <span style={{
            fontWeight: 700,
            color: isAnomaly ? (machine.status === 'CRITIQUE' ? 'var(--color-red)' : 'var(--color-amber)') : 'var(--color-green)'
          }}>
            {isAnomaly ? (machine.status === 'CRITIQUE' ? 'High (CRITIQUE)' : 'Medium (WARNING)') : 'NOMINAL'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--color-text-dim)' }}>Detected at:</span>
          <span className="mono" style={{ fontWeight: 600, color: 'var(--color-text)' }}>
            {formatTime(machine.timestamp)}
          </span>
        </div>
      </div>

      {/* Alert sparkline at the bottom */}
      <div style={{ marginTop: '0.25rem', borderTop: '1px solid var(--color-hairline)', paddingTop: '0.5rem' }}>
        <svg width="100%" height="22" style={{ overflow: 'visible' }}>
          <path
            d={alertSparkline.map((v, i) => {
              const x = (i / (alertSparkline.length - 1)) * 260;
              const y = 20 - (v / 25) * 16;
              return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
            }).join(' ')}
            fill="none"
            stroke={isAnomaly ? 'var(--color-red)' : 'var(--color-cyan)'}
            strokeWidth="1.5"
            style={{ filter: `drop-shadow(0 0 2px ${isAnomaly ? 'var(--color-red)' : 'var(--color-cyan)'})` }}
          />
        </svg>
      </div>
    </div>
  );
};
export default AnomalyAlert;
