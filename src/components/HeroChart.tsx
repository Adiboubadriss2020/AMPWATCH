import React, { useRef, useEffect, useState } from 'react';
import type { Reading, Machine } from '../types';

interface HeroChartProps {
  machine: Machine;
  series: Reading[];
  anomalyIndex: number;
}

export const HeroChart: React.FC<HeroChartProps> = ({ machine, series, anomalyIndex }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 220 });
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const {
    machineId,
    machineName,
    normalKw,
    voltage,
    current,
    temp,
    humidite,
    pression,
    powerFactor,
    costPerHour,
    anomalyType,
  } = machine;

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({ width: Math.max(300, entry.contentRect.width), height: 200 });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  if (!series || series.length === 0) {
    return (
      <div className="panel" style={{ height: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-dim)' }}>
        No telemetry data available
      </div>
    );
  }

  const { width, height } = dimensions;
  const pad = { top: 20, right: 30, bottom: 30, left: 55 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const baselineMin = Math.round(normalKw * 0.9);
  const baselineMax = Math.round(normalKw * 1.1);

  const kwValues = series.map(d => d.kw);
  const maxVal = Math.max(...kwValues);
  const minVal = Math.min(...kwValues);
  const yMax = Math.max(baselineMax * 1.35, maxVal * 1.05);
  const yMin = Math.max(0, Math.min(baselineMin * 0.7, minVal * 0.95));
  const yRange = yMax - yMin || 1;

  const getX = (i: number) => pad.left + (i / (series.length - 1)) * plotW;
  const getY = (v: number) => pad.top + plotH - ((v - yMin) / yRange) * plotH;

  const mkPath = (pts: Reading[], from: number, to: number): string => {
    if (pts.length === 0 || from < 0 || to < from) return '';
    return pts.slice(from, to + 1)
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(from + i).toFixed(1)} ${getY(p.kw).toFixed(1)}`)
      .join(' ');
  };

  const mkArea = (pts: Reading[], from: number, to: number, baseY: number): string => {
    if (pts.length === 0 || from < 0 || to < from) return '';
    const line = pts.slice(from, to + 1)
      .map((p, i) => `${getX(from + i).toFixed(1)},${getY(p.kw).toFixed(1)}`)
      .join(' L ');
    return `M ${getX(from).toFixed(1)},${baseY} L ${line} L ${getX(to).toFixed(1)},${baseY} Z`;
  };

  const hasAnomaly = anomalyIndex !== -1 && anomalyIndex < series.length;
  const bottomY = pad.top + plotH;

  const bluePath = hasAnomaly ? mkPath(series, 0, anomalyIndex) : mkPath(series, 0, series.length - 1);
  const blueArea = hasAnomaly ? mkArea(series, 0, anomalyIndex, bottomY) : mkArea(series, 0, series.length - 1, bottomY);
  const redPath = hasAnomaly ? mkPath(series, anomalyIndex, series.length - 1) : '';
  const redArea = hasAnomaly ? mkArea(series, anomalyIndex, series.length - 1, bottomY) : '';

  const ticks = [yMin, baselineMin, baselineMax, yMax].sort((a, b) => a - b)
    .filter((t, i, arr) => i === 0 || t - arr[i - 1] > yRange * 0.08);

  const xLabelIndices = [0, Math.floor(series.length * 0.33), Math.floor(series.length * 0.66), series.length - 1];

  // Latest data for floating tooltip
  const latestKw = series[series.length - 1]?.kw ?? 0;
  const latestX = getX(series.length - 1);
  const latestY = getY(latestKw);

  // Hover tooltip
  const hovPt = hoverIdx !== null ? series[hoverIdx] : null;
  const hovX = hoverIdx !== null ? getX(hoverIdx) : 0;
  const hovY = hoverIdx !== null ? getY(hovPt!.kw) : 0;

  const statusColor = machine.status === 'CRITIQUE' ? 'var(--color-red)'
    : machine.status === 'AVERTISSEMENT' ? 'var(--color-amber)'
    : 'var(--color-cyan)';

  const uniqueId = `hero-${machineId}`;

  return (
    <div ref={containerRef} className="panel" style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="section-label">⚡ Live Telemetry</div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-heading)' }}>
            <span style={{ color: statusColor }}>{machineId}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-sub)', fontWeight: 500 }}>({machineName})</span>
          </h2>
        </div>
        <span style={{
          fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-green)',
          backgroundColor: 'var(--color-green-dim)', padding: '0.2rem 0.6rem',
          borderRadius: '4px', border: '1px solid rgba(63,209,107,0.3)',
          letterSpacing: '0.05em',
        }}>
          ● INGESTING
        </span>
      </div>

      {/* SVG Chart */}
      <div
        style={{ position: 'relative', width: '100%', height: `${height}px` }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const mx = e.clientX - rect.left - pad.left;
          const idx = Math.round((mx / plotW) * (series.length - 1));
          setHoverIdx(Math.max(0, Math.min(series.length - 1, idx)));
        }}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <svg width={width} height={height} style={{ overflow: 'visible', width: '100%', height: '100%' }}>
          <defs>
            {/* Cyan gradient fill */}
            <linearGradient id={`${uniqueId}-grad-blue`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#29D3F0" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#29D3F0" stopOpacity="0.01" />
            </linearGradient>
            {/* Red gradient fill */}
            <linearGradient id={`${uniqueId}-grad-red`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF4B4B" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#FF4B4B" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Horizontal grid */}
          {ticks.map((tick, i) => (
            <line key={i}
              x1={pad.left} y1={getY(tick)}
              x2={width - pad.right} y2={getY(tick)}
              stroke="var(--color-hairline)" strokeWidth={1} strokeDasharray="3 4"
            />
          ))}

          {/* Baseline safe zone */}
          <rect
            x={pad.left} y={getY(baselineMax)}
            width={plotW} height={Math.max(0, getY(baselineMin) - getY(baselineMax))}
            fill="rgba(63,209,107,0.06)"
          />

          {/* Baseline lines */}
          {[baselineMax, baselineMin].map((v, i) => (
            <line key={i}
              x1={pad.left} y1={getY(v)}
              x2={width - pad.right} y2={getY(v)}
              stroke="rgba(63,209,107,0.3)" strokeWidth={1} strokeDasharray="4 3"
            />
          ))}

          {/* Y-axis labels */}
          {ticks.map((tick, i) => (
            <text key={i}
              x={pad.left - 8} y={getY(tick) + 4}
              textAnchor="end"
              fill="var(--color-text-dim)"
              style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)' }}
            >
              {tick.toFixed(0)} kW
            </text>
          ))}

          {/* X-axis labels */}
          {xLabelIndices.map((idx) => idx < series.length && (
            <text key={idx}
              x={getX(idx)} y={height - 6}
              textAnchor="middle"
              fill="var(--color-text-dim)"
              style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)' }}
            >
              {series[idx].t}
            </text>
          ))}

          {/* Gradient area fills */}
          {blueArea && <path d={blueArea} fill={`url(#${uniqueId}-grad-blue)`} />}
          {redArea  && <path d={redArea}  fill={`url(#${uniqueId}-grad-red)`}  />}

          {/* Lines */}
          <path d={bluePath} fill="none" stroke="var(--color-cyan)" strokeWidth={2}
            style={{ filter: 'drop-shadow(0 0 4px rgba(41,211,240,0.6))' }}
          />
          {redPath && (
            <path d={redPath} fill="none" stroke="var(--color-red)" strokeWidth={2}
              strokeDasharray="1 1"
              style={{ filter: 'drop-shadow(0 0 4px rgba(255,75,75,0.6))' }}
            />
          )}

          {/* Anomaly pulse dot */}
          {hasAnomaly && (() => {
            const ax = getX(anomalyIndex);
            const ay = getY(series[anomalyIndex].kw);
            return (
              <>
                <circle cx={ax} cy={ay} r={8} fill="rgba(255,75,75,0.2)" style={{ animation: 'pulse-ring 1.8s infinite' }} />
                <circle cx={ax} cy={ay} r={5} fill="var(--color-red)" style={{ filter: 'drop-shadow(0 0 5px #FF4B4B)' }} />
                <circle cx={ax} cy={ay} r={2.5} fill="#fff" />
              </>
            );
          })()}

          {/* Latest value dot + floating tooltip */}
          <circle cx={latestX} cy={latestY} r={4} fill="var(--color-cyan)"
            style={{ filter: 'drop-shadow(0 0 5px rgba(41,211,240,0.8))' }}
          />

          {/* Hover crosshair */}
          {hoverIdx !== null && (
            <>
              <line x1={hovX} y1={pad.top} x2={hovX} y2={pad.top + plotH}
                stroke="var(--color-cyan)" strokeWidth={1} strokeOpacity={0.4} strokeDasharray="3 3"
              />
              <circle cx={hovX} cy={hovY} r={4} fill="var(--color-cyan)"
                style={{ filter: 'drop-shadow(0 0 5px rgba(41,211,240,0.9))' }}
              />
            </>
          )}
        </svg>

        {/* Floating value tooltip — always shows latest, or hovered */}
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '10px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--r-md)',
          padding: '0.35rem 0.65rem',
          pointerEvents: 'none',
          boxShadow: 'var(--glow-cyan)',
        }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {hoverIdx !== null ? hovPt?.t : 'Current'}
          </div>
          <div className="mono" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-cyan)' }}>
            {(hoverIdx !== null ? hovPt!.kw : latestKw).toFixed(1)}
            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-sub)', fontWeight: 500 }}> kW</span>
          </div>
        </div>

        {/* Anomaly hover card */}
        {hasAnomaly && hoverIdx === anomalyIndex && (
          <div className="fade-in panel panel--critical"
            style={{
              position: 'absolute', top: '10px', left: `${pad.left + 12}px`,
              padding: '0.65rem 0.9rem', maxWidth: '240px', pointerEvents: 'none', zIndex: 10,
              backdropFilter: 'blur(12px)',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
              <span style={{ color: 'var(--color-red)', fontSize: '0.75rem', fontWeight: 700 }}>⚠ {anomalyType}</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-text)', lineHeight: 1.35 }}>
              {machineId} — {machine.cause || 'Anomaly detected'}
            </p>
          </div>
        )}
      </div>

      {/* Telemetry metrics strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '0.5rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--color-hairline)',
      }}>
        {[
          { label: 'Voltage / Current', value: `${voltage} V / ${current} A`, color: 'var(--color-cyan)' },
          { label: 'Power Factor',      value: `${powerFactor.toFixed(2)} cos φ`,  color: 'var(--color-text)' },
          { label: 'Temp / Humidity',   value: `${temp} °C / ${humidite} %`,       color: temp > 60 ? 'var(--color-red)' : 'var(--color-text)' },
          { label: 'Pressure',          value: `${pression.toFixed(1)} hPa`,        color: 'var(--color-text)' },
          { label: 'Cost / Hour',       value: `${costPerHour.toFixed(2)} MAD/h`,   color: 'var(--color-green)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            display: 'flex', flexDirection: 'column',
            padding: '0.45rem 0.6rem',
            backgroundColor: 'var(--color-overlay)',
            borderRadius: '6px',
            border: '1px solid var(--color-hairline)',
          }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--color-text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {label}
            </span>
            <span className="mono" style={{ fontSize: '0.82rem', fontWeight: 600, color, marginTop: '0.15rem' }}>
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
