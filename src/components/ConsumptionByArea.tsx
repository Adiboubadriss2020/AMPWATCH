import React from 'react';
import type { Machine } from '../types';

interface ConsumptionByAreaProps {
  machines: Machine[];
}

export const ConsumptionByArea: React.FC<ConsumptionByAreaProps> = ({ machines }) => {
  // Sort machines by energy consumption
  const sorted = [...machines].sort((a, b) => b.kw - a.kw);
  const totalKw = machines.reduce((acc, m) => acc + m.kw, 0) || 1;

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.85rem' }}>
      <span className="section-label">⚡ Energy Consumption by Area</span>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
        {sorted.map((m) => {
          const pct = Math.min(100, Math.round((m.kw / totalKw) * 100));
          const color = m.status === 'CRITIQUE' ? 'var(--color-red)'
            : m.status === 'AVERTISSEMENT' ? 'var(--color-amber)'
            : 'var(--color-cyan)';

          return (
            <div key={m.machineId} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {/* Row: label and values */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-text-sub)' }}>
                  {m.machineId} <span style={{ fontSize: '0.65rem', fontWeight: 500, color: 'var(--color-text-dim)' }}>({m.machineName})</span>
                </span>
                <span className="mono" style={{ fontWeight: 700, color }}>
                  {m.kw.toFixed(1)} kW
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)' }}>
                    {' '}({pct}%) · {m.costPerHour.toFixed(2)} MAD/h · {m.deviation > 0 ? '+' : ''}{m.deviation}%
                  </span>
                </span>
              </div>
              
              {/* Progress bar container */}
              <div style={{
                height: '8px',
                width: '100%',
                backgroundColor: 'var(--color-hairline)',
                borderRadius: '4px',
                overflow: 'hidden',
                position: 'relative',
              }}>
                <div style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, var(--color-blue) 0%, ${color} 100%)`,
                  borderRadius: '4px',
                  transition: 'width 0.5s ease-in-out',
                  boxShadow: `0 0 6px ${color}80`,
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default ConsumptionByArea;
