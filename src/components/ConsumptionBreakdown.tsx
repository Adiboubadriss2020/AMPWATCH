import React from 'react';

export const ConsumptionBreakdown: React.FC = () => {
  // Static distribution matched to reference design mockup
  const data = [
    { label: 'Production', val: 45, color: '#2E7FE8' }, // Blue
    { label: 'HVAC',       val: 20, color: '#3FD16B' }, // Green
    { label: 'Compressors',val: 15, color: '#29D3F0' }, // Cyan
    { label: 'Lighting',   val: 10, color: '#F2B84B' }, // Amber
    { label: 'Others',     val: 10, color: '#8C9AB0' }, // Muted
  ];

  // SVG parameters
  const radius = 35;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  
  let accumulatedPercent = 0;

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.85rem' }}>
      <span className="section-label">⚡ Consumption Breakdown</span>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '1rem', flexWrap: 'wrap' }}>
        {/* Donut graphic */}
        <div style={{ position: 'relative', width: '90px', height: '90px' }}>
          <svg width="90" height="90" viewBox="0 0 90 90" style={{ transform: 'rotate(-90deg)' }}>
            {data.map((item, idx) => {
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
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.55rem', color: 'var(--color-text-dim)',
            fontFamily: 'var(--font-mono)', pointerEvents: 'none',
          }}>
            TOTAL
          </div>
        </div>

        {/* Legend table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flexGrow: 1, minWidth: '120px' }}>
          {data.map((item, idx) => (
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
