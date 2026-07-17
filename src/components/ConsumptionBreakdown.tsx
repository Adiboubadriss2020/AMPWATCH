import React from 'react';
import type { Machine } from '../types';

interface ConsumptionBreakdownProps {
  machine?: Machine | null;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const ConsumptionBreakdown: React.FC<ConsumptionBreakdownProps> = ({ machine }) => {
  const kw = machine?.kw ?? 0;
  const normalKw = machine?.normalKw ?? 1;
  const deviation = machine?.deviation ?? 0;
  const anomaly = machine?.isAnomaly ?? false;

  const production = clamp((kw / Math.max(normalKw, 1)) * 100, 0, 100);
  const hvac = clamp(Math.max(0, Math.min(100 - production, (Math.abs(deviation) / 5) * 5)), 0, 100);
  const compressors = clamp(Math.max(0, Math.min(100 - production - hvac, anomaly ? 20 : 15)), 0, 100);
  const lighting = clamp(Math.max(0, Math.min(100 - production - hvac - compressors, anomaly ? 10 : 8)), 0, 100);
  const others = clamp(100 - production - hvac - compressors - lighting, 0, 100);

  const data = [
    { label: 'Production', val: Math.round(production), color: '#2E7FE8' },
    { label: 'HVAC', val: Math.round(hvac), color: '#3FD16B' },
    { label: 'Compressors', val: Math.round(compressors), color: '#29D3F0' },
    { label: 'Lighting', val: Math.round(lighting), color: '#F2B84B' },
    { label: 'Others', val: Math.round(others), color: '#8C9AB0' },
  ];

  const total = data.reduce((sum, item) => sum + item.val, 0);
  const normalized = data.map((item) => ({ ...item, val: total > 100 ? Math.round((item.val / total) * 100) : item.val }));
  const normalizedTotal = normalized.reduce((sum, item) => sum + item.val, 0);
  const adjustedData = normalizedTotal > 100 ? normalized.slice(0, -1).map((item, idx) => ({ ...item, val: idx === normalized.length - 2 ? 100 - normalized.slice(0, -1).reduce((sum, current) => sum + current.val, 0) : item.val })) : normalized;

  const radius = 35;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.85rem' }}>
      <span className="section-label">⚡ Consumption Breakdown</span>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '90px', height: '90px' }}>
          <svg width="90" height="90" viewBox="0 0 90 90" style={{ transform: 'rotate(-90deg)' }}>
            {adjustedData.map((item, idx) => {
              const strokeOffset = circumference - (item.val / 100) * circumference;
              const rotation = (accumulatedPercent / 100) * circumference;
              accumulatedPercent += item.val;

              return (
                <circle
                  key={idx}
                  cx="45"
                  cy="45"
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  style={{
                    transformOrigin: '45px 45px',
                    transform: `rotate(${(rotation / circumference) * 360}deg)`,
                    transition: 'all 0.3s ease',
                  }}
                />
              );
            })}
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)', pointerEvents: 'none' }}>
            TOTAL
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flexGrow: 1, minWidth: '120px' }}>
          {adjustedData.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', backgroundColor: item.color }} />
                <span style={{ color: 'var(--color-text-sub)' }}>{item.label}</span>
              </div>
              <span className="mono" style={{ fontWeight: 700, color: 'var(--color-text)' }}>{item.val}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default ConsumptionBreakdown;
