import React, { useEffect, useState } from 'react';

interface RadarScannerProps {
  hasAnomaly: boolean;
  anomalyType: string;
}

export const RadarScanner: React.FC<RadarScannerProps> = ({ hasAnomaly, anomalyType }) => {
  const [sweepAngle, setSweepAngle] = useState(0);

  useEffect(() => {
    let animId: number;
    const tick = () => {
      setSweepAngle((prev) => (prev + 1.5) % 360);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Static target coordinate when anomaly is active
  const targetX = 190;
  const targetY = 90;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      minHeight: '180px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      background: 'radial-gradient(circle, rgba(11,21,36,0.5) 0%, rgba(5,11,20,0.8) 100%)',
    }}>
      <svg width="100%" height="100%" viewBox="0 0 300 200" style={{ overflow: 'visible' }}>
        {/* Concentric Radar Rings */}
        {[30, 60, 90, 120].map((r) => (
          <circle
            key={r}
            cx="150"
            cy="100"
            r={r}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="1"
            strokeOpacity="0.25"
          />
        ))}

        {/* Crosshairs */}
        <line x1="30" y1="100" x2="270" y2="100" stroke="var(--color-border)" strokeWidth="1" strokeOpacity="0.2" />
        <line x1="150" y1="20" x2="150" y2="180" stroke="var(--color-border)" strokeWidth="1" strokeOpacity="0.2" />

        {/* Diagonal guides */}
        <line x1="65" y1="35" x2="235" y2="165" stroke="var(--color-border)" strokeWidth="1" strokeOpacity="0.1" strokeDasharray="2 3" />
        <line x1="65" y1="165" x2="235" y2="35" stroke="var(--color-border)" strokeWidth="1" strokeOpacity="0.1" strokeDasharray="2 3" />

        {/* Rotating sweep line */}
        <line
          x1="150"
          y1="100"
          x2={(150 + 120 * Math.cos((sweepAngle * Math.PI) / 180)).toFixed(1)}
          y2={(100 + 120 * Math.sin((sweepAngle * Math.PI) / 180)).toFixed(1)}
          stroke="var(--color-cyan)"
          strokeWidth="1.5"
          strokeOpacity="0.75"
          style={{ filter: 'drop-shadow(0 0 3px var(--color-cyan))' }}
        />

        {/* Sonar sweep gradient wedge (simulated with fading paths) */}
        <path
          d={`M 150 100 
              L ${(150 + 120 * Math.cos(((sweepAngle - 20) * Math.PI) / 180)).toFixed(1)} ${(100 + 120 * Math.sin(((sweepAngle - 20) * Math.PI) / 180)).toFixed(1)} 
              A 120 120 0 0 1 ${(150 + 120 * Math.cos((sweepAngle * Math.PI) / 180)).toFixed(1)} ${(100 + 120 * Math.sin((sweepAngle * Math.PI) / 180)).toFixed(1)} 
              Z`}
          fill="rgba(41,211,240,0.07)"
        />

        {/* Pulsing center node */}
        <circle cx="150" cy="100" r="4" fill="var(--color-green)" style={{ filter: 'drop-shadow(0 0 4px var(--color-green))' }} />
        <circle cx="150" cy="100" r="8" fill="none" stroke="var(--color-green)" strokeWidth="1" style={{ animation: 'pulse-ring 2s infinite' }} />

        {/* Active anomaly target lock */}
        {hasAnomaly && (
          <>
            {/* Target lines */}
            <circle cx={targetX} cy={targetY} r="10" fill="none" stroke="var(--color-red)" strokeWidth="1.5" style={{ animation: 'pulse-ring 1.5s infinite' }} />
            <circle cx={targetX} cy={targetY} r="4" fill="var(--color-red)" style={{ filter: 'drop-shadow(0 0 4px var(--color-red))' }} />
            {/* Reticle brackets */}
            <path d={`M ${targetX - 12} ${targetY} L ${targetX - 7} ${targetY}`} stroke="var(--color-red)" strokeWidth="1.5" />
            <path d={`M ${targetX + 7} ${targetY} L ${targetX + 12} ${targetY}`} stroke="var(--color-red)" strokeWidth="1.5" />
            <path d={`M ${targetX} ${targetY - 12} L ${targetX} ${targetY - 7}`} stroke="var(--color-red)" strokeWidth="1.5" />
            <path d={`M ${targetX} ${targetY + 7} L ${targetX} ${targetY + 12}`} stroke="var(--color-red)" strokeWidth="1.5" />
            
            {/* Label */}
            <text
              x={targetX + 16}
              y={targetY + 4}
              fill="var(--color-red)"
              style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}
            >
              LOCK: {anomalyType}
            </text>
          </>
        )}
      </svg>
    </div>
  );
};
export default RadarScanner;
