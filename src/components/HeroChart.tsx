import React, { useRef, useEffect, useState } from 'react';
import type { Reading, Machine } from '../types';
import { formatLabel } from '../formatLabel';
import {
  IconPowerFactor,
  IconPressure,
  IconTelemetry,
  IconTemp,
  IconVoltage,
} from './Icons';

interface HeroChartProps {
  machine: Machine;
  series: Reading[];
  anomalyIndex: number;
}

export const HeroChart: React.FC<HeroChartProps> = ({ machine, series, anomalyIndex }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Keep the chart compact so the panel height matches `AnomalyAlert` (240–320px).
  const [dimensions, setDimensions] = useState({ width: 600, height: 140 });
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
    anomalyType,
  } = machine;

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = Math.max(300, entry.contentRect.width);
        // Scales with width but stays in a safe band for the compact layout.
        const computedHeight = Math.round(width * 0.28);
        const height = Math.max(110, Math.min(160, computedHeight));
        setDimensions({ width, height });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  if (!series || series.length === 0) {
    return (
      <div
        className="panel"
        style={{
          minHeight: '240px',
          maxHeight: '320px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text)',
          overflow: 'hidden',
        }}
      >
        No live data available
      </div>
    );
  }

  const { width, height } = dimensions;
  const pad = { top: 24, right: 36, bottom: 28, left: 55 };
  const plotW = Math.max(1, width - pad.left - pad.right);
  const plotH = Math.max(1, height - pad.top - pad.bottom);

  const baselineMin = Math.round(normalKw * 0.9);
  const baselineMax = Math.round(normalKw * 1.1);

  const kwValues = series.map((d) => d.kw);
  const maxVal = Math.max(...kwValues, normalKw > 0 ? baselineMax : 0);
  const minVal = Math.min(...kwValues, 0);
  // Fit ALL live points + baseline with padding — avoid crushing new samples at the edge
  const span = Math.max(1, maxVal - minVal);
  const yPad = Math.max(span * 0.12, 2);
  const yMax = maxVal + yPad;
  const yMin = Math.max(0, minVal - yPad);
  const yRange = yMax - yMin || 1;

  const n = series.length;
  const getX = (i: number) => {
    if (n <= 1) return pad.left + plotW; // first sample sits at the live edge
    return pad.left + (i / (n - 1)) * plotW;
  };
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

  const ticks = [yMin, ...(normalKw > 0 ? [baselineMin, normalKw, baselineMax] : []), yMax]
    .sort((a, b) => a - b)
    .filter((t, i, arr) => i === 0 || Math.abs(t - arr[i - 1]) > yRange * 0.08);

  // Unique indices only — short series used to produce [0,0,0,0] and React key collisions
  const xLabelIndices = Array.from(
    new Set(
      [0, Math.floor((series.length - 1) * 0.33), Math.floor((series.length - 1) * 0.66), series.length - 1].filter(
        (idx) => idx >= 0 && idx < series.length,
      ),
    ),
  );

  const normalLineY = getY(normalKw);

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
    <div
      ref={containerRef}
      className="panel panel--live widget-enter"
      style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        minHeight: '240px',
        maxHeight: '320px',
        height: '100%',
        overflow: 'visible',
      }}
    >

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="section-label">
            <span className="widget-icon"><IconTelemetry size={14} /></span>
            Live Power
          </div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-heading)' }}>
            <span style={{ color: statusColor }}>{machineId}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-sub)', fontWeight: 600 }}>({machineName})</span>
          </h2>
        </div>
        <span
          className="ingest-badge"
          style={{
            fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-green)',
            backgroundColor: 'var(--color-green-dim)', padding: '0.25rem 0.65rem',
            borderRadius: '4px', border: '1px solid rgba(63,209,107,0.3)',
            letterSpacing: '0.05em',
          }}
        >
          ● INGESTING
        </span>
      </div>

      {/* SVG Chart */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: `${height}px`,
          flexShrink: 0,
          overflow: 'visible',
        }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const mx = e.clientX - rect.left - pad.left;
          const denom = Math.max(1, series.length - 1);
          const idx = Math.round((mx / plotW) * denom);
          setHoverIdx(Math.max(0, Math.min(series.length - 1, idx)));
        }}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          style={{ overflow: 'visible', width: '100%', height: '100%', display: 'block' }}
        >
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
            <line key={`grid-${i}-${tick}`}
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

          {/* Normal baseline line */}
          <line
            x1={pad.left}
            y1={normalLineY}
            x2={width - pad.right}
            y2={normalLineY}
            stroke="var(--color-green)"
            strokeWidth={1.5}
            strokeDasharray="5 4"
          />
          <text
            x={width - pad.right - 8}
            y={normalLineY - 8}
            textAnchor="end"
            fill="var(--color-green)"
            style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
          >
            Baseline
          </text>

          {/* Y-axis labels */}
          {ticks.map((tick, i) => (
            <text key={`y-tick-${i}-${tick}`}
              x={pad.left - 8} y={getY(tick) + 4}
              textAnchor="end"
              fill="var(--color-text)"
              style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}
            >
              {tick.toFixed(0)} kW
            </text>
          ))}

          {/* X-axis labels */}
          {xLabelIndices.map((idx) => (
            <text key={`x-label-${idx}`}
              x={getX(idx)} y={height - 6}
              textAnchor="middle"
              fill="var(--color-text)"
              style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}
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
          <div style={{ fontSize: '0.68rem', color: 'var(--color-text)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {hoverIdx !== null ? hovPt?.t : 'Current'}
          </div>
          <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-cyan)' }}>
            {(hoverIdx !== null ? hovPt!.kw : latestKw).toFixed(1)}
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-sub)', fontWeight: 600 }}> kW</span>
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
              <span style={{ color: 'var(--color-red)', fontSize: '0.75rem', fontWeight: 700 }}>⚠ {formatLabel(anomalyType)}</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-text)', lineHeight: 1.35 }}>
              {machineId} — {machine.cause || 'Anomaly detected'}
            </p>
          </div>
        )}
      </div>

      {/* Live electrical + environment sensors (economics live in Asset Health) */}
      <div className="hero-sensor-grid">
        {[
          { label: 'Voltage / Current', value: `${voltage} V / ${current} A`, color: 'var(--color-cyan)', icon: <IconVoltage size={13} /> },
          { label: 'Power Factor', value: `${powerFactor.toFixed(2)} cos φ`, color: 'var(--color-text)', icon: <IconPowerFactor size={13} /> },
          { label: 'Temp / Humidity', value: `${temp} °C / ${humidite} %`, color: temp > 60 ? 'var(--color-red)' : 'var(--color-text)', icon: <IconTemp size={13} /> },
          { label: 'Pressure', value: `${pression.toFixed(1)} hPa`, color: 'var(--color-text)', icon: <IconPressure size={13} /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="hero-sensor-tile">
            <span className="hero-sensor-label" style={{ color: 'var(--color-text-sub)' }}>
              <span className="widget-icon" style={{ color }}>{icon}</span>
              {label}
            </span>
            <span className="mono hero-sensor-value" style={{ color }}>
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
