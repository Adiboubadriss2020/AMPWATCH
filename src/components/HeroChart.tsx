import React, { useRef, useEffect, useState } from 'react';
import type { Reading, Machine } from '../types';

interface HeroChartProps {
  machine: Machine;
  series: Reading[];
  anomalyIndex: number;
}

export const HeroChart: React.FC<HeroChartProps> = ({
  machine,
  series,
  anomalyIndex
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 220 });
  const [isHovered, setIsHovered] = useState(false);

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
    wifi_rssi,
    relay,
    anomalyType,
  } = machine;

  // Handle resizing of the container to make chart responsive
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setDimensions({
          width: Math.max(300, width),
          height: 200
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  if (!series || series.length === 0) {
    return (
      <div className="panel flex-center" style={{ height: '380px', color: 'var(--color-muted)' }}>
        No telemetry data available
      </div>
    );
  }

  const { width, height } = dimensions;
  const padding = { top: 20, right: 30, bottom: 30, left: 55 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Baseline thresholds calculated dynamically
  const baselineMin = Math.round(normalKw * 0.9);
  const baselineMax = Math.round(normalKw * 1.1);

  // Determine Y axis range
  const kwValues = series.map(d => d.kw);
  const maxSeriesVal = Math.max(...kwValues);
  const minSeriesVal = Math.min(...kwValues);

  const yMax = Math.max(baselineMax * 1.35, maxSeriesVal * 1.05);
  const yMin = Math.max(0, Math.min(baselineMin * 0.7, minSeriesVal * 0.95));
  const yRange = yMax - yMin || 1;

  // Map values to coordinates
  const getX = (index: number) => {
    return padding.left + (index / (series.length - 1)) * plotWidth;
  };

  const getY = (value: number) => {
    return padding.top + plotHeight - ((value - yMin) / yRange) * plotHeight;
  };

  // Generate SVG Path
  const generatePath = (points: Reading[], startIndex: number, endIndex: number): string => {
    if (points.length === 0 || startIndex < 0 || endIndex < startIndex) return '';
    let d = '';
    for (let i = startIndex; i <= endIndex; i++) {
      const x = getX(i);
      const y = getY(points[i].kw);
      d += `${i === startIndex ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
  };

  // Anomaly point logic
  const hasAnomaly = anomalyIndex !== -1 && anomalyIndex < series.length;
  const anomalyPt = hasAnomaly ? series[anomalyIndex] : null;
  const anomalyX = hasAnomaly ? getX(anomalyIndex) : 0;
  const anomalyY = hasAnomaly ? getY(anomalyPt!.kw) : 0;

  // Split paths
  const bluePath = hasAnomaly
    ? generatePath(series, 0, anomalyIndex)
    : generatePath(series, 0, series.length - 1);

  const redPath = hasAnomaly
    ? generatePath(series, anomalyIndex, series.length - 1)
    : '';

  // Y-axis grid ticks (4 ticks)
  const ticks = [yMin, baselineMin, baselineMax, yMax].sort((a, b) => a - b);
  const uniqueTicks = ticks.filter((t, i, arr) => i === 0 || t - arr[i - 1] > yRange * 0.1);

  // X-axis timestamps labels
  const xLabelIndices = [
    0,
    Math.floor(series.length * 0.33),
    Math.floor(series.length * 0.66),
    series.length - 1
  ];

  // Helper to format WiFi signal strength
  const wifiLabel = wifi_rssi > -60 ? 'Excellent (📶)'
    : wifi_rssi > -70 ? 'Good (📶)'
    : wifi_rssi > -80 ? 'Fair (📶)'
    : 'Weak (📶)';

  return (
    <div 
      ref={containerRef}
      className="panel"
      style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      {/* Chart Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-sub)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
            Live Telemetry
          </span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {machineId} 
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-sub)', fontWeight: 500 }}>
              ({machineName})
            </span>
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-nominal)', backgroundColor: 'var(--color-green-dim)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
            ● Active Ingestion
          </span>
        </div>
      </div>

      {/* SVG Interactive Chart */}
      <div 
        style={{ position: 'relative', width: '100%', height: `${height}px` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <svg 
          width={width} 
          height={height} 
          style={{ overflow: 'visible', width: '100%', height: '100%' }}
        >
          {/* Subtle Horizontal Grid lines */}
          {uniqueTicks.map((tick, idx) => (
            <line
              key={idx}
              x1={padding.left}
              y1={getY(tick)}
              x2={width - padding.right}
              y2={getY(tick)}
              stroke="var(--color-border)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          ))}

          {/* Baseline Safe Zone shading */}
          <rect
            x={padding.left}
            y={getY(baselineMax)}
            width={plotWidth}
            height={Math.max(0, getY(baselineMin) - getY(baselineMax))}
            fill="rgba(34, 197, 94, 0.03)"
          />

          {/* Target Baseline lines */}
          <line
            x1={padding.left}
            y1={getY(baselineMax)}
            x2={width - padding.right}
            y2={getY(baselineMax)}
            stroke="var(--color-border-hi)"
            strokeWidth={1}
            strokeDasharray="2 2"
          />
          <line
            x1={padding.left}
            y1={getY(baselineMin)}
            x2={width - padding.right}
            y2={getY(baselineMin)}
            stroke="var(--color-border-hi)"
            strokeWidth={1}
            strokeDasharray="2 2"
          />

          {/* Left Y-axis values */}
          {uniqueTicks.map((tick, idx) => (
            <text
              key={idx}
              x={padding.left - 8}
              y={getY(tick) + 4}
              textAnchor="end"
              fill="var(--color-text-sub)"
              style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }}
            >
              {tick.toFixed(0)} kW
            </text>
          ))}

          {/* Bottom X-axis labels */}
          {xLabelIndices.map((idx) => {
            if (idx >= series.length) return null;
            return (
              <text
                key={idx}
                x={getX(idx)}
                y={height - 8}
                textAnchor="middle"
                fill="var(--color-text-dim)"
                style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }}
              >
                {series[idx].t}
              </text>
            );
          })}

          {/* Nominal line path */}
          <path
            d={bluePath}
            fill="none"
            stroke="var(--color-blue)"
            strokeWidth={2}
          />

          {/* Anomaly line path */}
          {redPath && (
            <path
              d={redPath}
              fill="none"
              stroke="var(--color-critical)"
              strokeWidth={2}
              strokeDasharray="1 1"
            />
          )}

          {/* Anomaly Callout indicator */}
          {hasAnomaly && (
            <>
              <circle
                cx={anomalyX}
                cy={anomalyY}
                r={6}
                fill="var(--color-critical)"
                style={{ animation: 'pulse-ring 1.5s infinite' }}
              />
              <circle
                cx={anomalyX}
                cy={anomalyY}
                r={3}
                fill="#ffffff"
              />
            </>
          )}
        </svg>

        {/* Floating Interactive anomaly diagnosis card (Section 4.1 / Step 8) */}
        {hasAnomaly && isHovered && (
          <div 
            className="fade-in"
            style={{
              position: 'absolute',
              top: '10px',
              left: `${padding.left + 15}px`,
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              maxWidth: '280px',
              pointerEvents: 'none',
              backdropFilter: 'blur(10px)',
              zIndex: 10,
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-critical)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--color-critical)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {anomalyType} Detected
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text)', lineHeight: '1.35' }}>
              {machineId} has exceeded normal power limit.
              <br />
              <strong style={{ color: 'var(--color-text-sub)' }}>Cause:</strong> {machine.cause || 'Unknown deviation'}
            </p>
          </div>
        )}
      </div>

      {/* Real-Time Telemetry Details Grid (Secondary Sensor Fields) */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.5rem',
          marginTop: '0.25rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--color-hairline)',
        }}
      >
        {/* Metric 1: Current & Voltage */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem', backgroundColor: 'rgba(35, 43, 56, 0.2)', borderRadius: '6px', border: '1px solid rgba(35, 43, 56, 0.5)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Voltage / Current</span>
          <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginTop: '0.15rem' }}>
            {voltage} V / {current} A
          </span>
        </div>

        {/* Metric 2: Power Factor */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem', backgroundColor: 'rgba(35, 43, 56, 0.2)', borderRadius: '6px', border: '1px solid rgba(35, 43, 56, 0.5)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Power Factor</span>
          <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginTop: '0.15rem' }}>
            {powerFactor.toFixed(2)} (cos φ)
          </span>
        </div>

        {/* Metric 3: Temp & Humidity */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem', backgroundColor: 'rgba(35, 43, 56, 0.2)', borderRadius: '6px', border: '1px solid rgba(35, 43, 56, 0.5)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Temp / Humidity</span>
          <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginTop: '0.15rem' }}>
            {temp} °C / {humidite} %
          </span>
        </div>

        {/* Metric 4: Pressure */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem', backgroundColor: 'rgba(35, 43, 56, 0.2)', borderRadius: '6px', border: '1px solid rgba(35, 43, 56, 0.5)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Pressure</span>
          <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginTop: '0.15rem' }}>
            {pression.toFixed(1)} hPa
          </span>
        </div>

        {/* Metric 5: Cost per hour */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem', backgroundColor: 'rgba(35, 43, 56, 0.2)', borderRadius: '6px', border: '1px solid rgba(35, 43, 56, 0.5)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Cost / Hour</span>
          <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-green)', marginTop: '0.15rem' }}>
            {costPerHour.toFixed(2)} MAD/h
          </span>
        </div>

        {/* Metric 6: WiFi Signal / Relay */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem', backgroundColor: 'rgba(35, 43, 56, 0.2)', borderRadius: '6px', border: '1px solid rgba(35, 43, 56, 0.5)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase' }}>WiFi / Relay Status</span>
          <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text)', marginTop: '0.15rem' }}>
            {wifi_rssi} dBm · {wifiLabel} · <span style={{ color: relay ? 'var(--color-red)' : 'var(--color-muted)' }}>{relay ? 'TRIPPED' : 'NOMINAL'}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
