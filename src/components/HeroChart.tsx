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
    cause,
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
    : wifi_rssi > -70 ? 'Bon (📶)'
    : wifi_rssi > -80 ? 'Moyen (📶)'
    : 'Faible (📶)';

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
        padding: '1rem',
        marginBottom: '1rem'
      }}
    >
      {/* Title block */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.25rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-text)' }}>
            Fichier Télémétrie Capteur
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
            Machine: <span style={{ color: 'var(--color-blue)', fontWeight: 600 }}>{machineId}</span> · {machineName}
          </span>
        </div>
        
        {/* Legend */}
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--color-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '6px', backgroundColor: 'rgba(62, 142, 255, 0.04)', border: '1px dashed var(--color-blue)', borderRadius: '2px' }} />
            <span>Normal Limit ({baselineMin}-{baselineMax} kW)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '3px', backgroundColor: 'var(--color-blue)', borderRadius: '2px' }} />
            <span>Nominal</span>
          </div>
          {hasAnomaly && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ display: 'inline-block', width: '12px', height: '3px', backgroundColor: 'var(--color-red)', borderRadius: '2px' }} />
              <span>Surcharge</span>
            </div>
          )}
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div style={{ width: '100%', height: `${height}px`, position: 'relative' }}>
        <svg 
          width="100%" 
          height="100%" 
          style={{ overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="blueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--color-blue)" stopOpacity="1" />
              <stop offset="100%" stopColor="var(--color-blue)" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="redGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--color-red)" stopOpacity="1" />
              <stop offset="100%" stopColor="var(--color-red)" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Shaded Horizontal Baseline Band */}
          {yMin < baselineMax && yMax > baselineMin && (
            <rect
              x={padding.left}
              y={Math.max(padding.top, getY(baselineMax))}
              width={plotWidth}
              height={Math.min(plotHeight, getY(baselineMin) - getY(baselineMax))}
              fill="rgba(62, 142, 255, 0.03)"
              stroke="rgba(62, 142, 255, 0.15)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          )}

          {/* Horizontal Grid lines */}
          {uniqueTicks.map((val) => {
            const y = getY(val);
            const isBaseline = val === baselineMin || val === baselineMax;
            return (
              <g key={val}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke={isBaseline ? 'rgba(62, 142, 255, 0.2)' : 'var(--color-hairline)'}
                  strokeWidth={isBaseline ? '1.2' : '1'}
                  strokeDasharray={isBaseline ? 'none' : '2 4'}
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="timestamp"
                  fill={isBaseline ? 'var(--color-blue)' : 'var(--color-muted)'}
                  style={{ fontSize: '0.75rem', fontWeight: isBaseline ? 600 : 400 }}
                >
                  {val.toFixed(0)} kW
                </text>
              </g>
            );
          })}

          {/* X Axis Timestamps */}
          {xLabelIndices.map((idx) => {
            if (idx >= series.length) return null;
            const x = getX(idx);
            return (
              <g key={idx}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={height - padding.bottom}
                  stroke="var(--color-hairline)"
                  strokeWidth="0.5"
                  strokeDasharray="2 4"
                />
                <text
                  x={x}
                  y={height - padding.bottom + 18}
                  textAnchor="middle"
                  className="timestamp"
                  fill="var(--color-muted)"
                  style={{ fontSize: '0.75rem' }}
                >
                  {series[idx].t}
                </text>
              </g>
            );
          })}

          {/* Telemetry Line - Nominal Segment (Blue) */}
          {bluePath && (
            <path
              d={bluePath}
              fill="none"
              stroke="url(#blueGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Telemetry Line - Anomaly Segment (Red) */}
          {redPath && (
            <>
              <path
                d={redPath}
                fill="none"
                stroke="url(#redGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={redPath}
                fill="none"
                stroke="transparent"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              />
            </>
          )}

          {/* Glowing Anomaly Marker */}
          {hasAnomaly && (
            <g 
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <circle cx={anomalyX} cy={anomalyY} r="18" fill="transparent" />
              <circle
                cx={anomalyX}
                cy={anomalyY}
                r="12"
                fill="var(--color-red)"
                opacity="0.25"
                className="pulse-critical"
                style={{ transformOrigin: `${anomalyX}px ${anomalyY}px` }}
              />
              <circle cx={anomalyX} cy={anomalyY} r="6" fill="var(--color-red)" stroke="#0B0E13" strokeWidth="2" />
              <line
                x1={anomalyX}
                y1={anomalyY}
                x2={anomalyX}
                y2={padding.top - 10}
                stroke="var(--color-red)"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.6"
              />
            </g>
          )}
        </svg>

        {/* Anomaly Callout Overlay (Section 3.4) */}
        {hasAnomaly && cause && isHovered && (
          <div
            className="panel fade-in"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              maxWidth: '320px',
              width: 'calc(100% - 2rem)',
              padding: '0.85rem',
              border: '1px solid var(--color-red)',
              backgroundColor: 'rgba(19, 24, 34, 0.98)',
              boxShadow: '0 8px 32px rgba(255, 77, 94, 0.35)',
              borderRadius: '8px',
              fontSize: '0.8rem',
              color: 'var(--color-text)',
              zIndex: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', borderBottom: '1px solid rgba(255, 77, 94, 0.2)', paddingBottom: '0.25rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--color-red)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                ⚠️ FUSION AI DIAGNOSTIC
              </span>
              <span 
                className="timestamp"
                style={{ 
                  fontWeight: 700, 
                  backgroundColor: 'rgba(255, 77, 94, 0.15)', 
                  color: 'var(--color-red)', 
                  padding: '0.1rem 0.35rem', 
                  borderRadius: '3px',
                  fontSize: '0.7rem'
                }}
              >
                TYPE: {anomalyType}
              </span>
            </div>
            <p style={{ margin: 0, lineHeight: 1.35, color: '#E7ECF3' }}>
              {cause}
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
          <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Tension / Courant</span>
          <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginTop: '0.15rem' }}>
            {voltage} V / {current} A
          </span>
        </div>

        {/* Metric 2: Power Factor */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem', backgroundColor: 'rgba(35, 43, 56, 0.2)', borderRadius: '6px', border: '1px solid rgba(35, 43, 56, 0.5)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Facteur Puissance</span>
          <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginTop: '0.15rem' }}>
            {powerFactor.toFixed(2)} (cos φ)
          </span>
        </div>

        {/* Metric 3: Temp & Humidity */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem', backgroundColor: 'rgba(35, 43, 56, 0.2)', borderRadius: '6px', border: '1px solid rgba(35, 43, 56, 0.5)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Temp / Humidité</span>
          <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginTop: '0.15rem' }}>
            {temp} °C / {humidite} %
          </span>
        </div>

        {/* Metric 4: Pressure */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem', backgroundColor: 'rgba(35, 43, 56, 0.2)', borderRadius: '6px', border: '1px solid rgba(35, 43, 56, 0.5)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Pression</span>
          <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginTop: '0.15rem' }}>
            {pression.toFixed(1)} hPa
          </span>
        </div>

        {/* Metric 5: Cost per hour */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem', backgroundColor: 'rgba(35, 43, 56, 0.2)', borderRadius: '6px', border: '1px solid rgba(35, 43, 56, 0.5)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Coût Horaire</span>
          <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-green)', marginTop: '0.15rem' }}>
            {costPerHour.toFixed(2)} MAD/h
          </span>
        </div>

        {/* Metric 6: WiFi Signal / Relay */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem', backgroundColor: 'rgba(35, 43, 56, 0.2)', borderRadius: '6px', border: '1px solid rgba(35, 43, 56, 0.5)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Statut WiFi / Relais</span>
          <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text)', marginTop: '0.15rem' }}>
            {wifi_rssi} dBm · {wifiLabel} · <span style={{ color: relay ? 'var(--color-red)' : 'var(--color-muted)' }}>{relay ? 'DISJONCTÉ' : 'NOMINAL'}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
