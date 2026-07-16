import React, { useEffect, useState, useRef } from 'react';
import type { Reading } from '../types';

interface EnergyForecastingProps {
  series: Reading[];
  normalKw: number;
}

export const EnergyForecasting: React.FC<EnergyForecastingProps> = ({ series, normalKw }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 120 });

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({ width: Math.max(200, entry.contentRect.width), height: 100 });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  if (!series || series.length === 0) return null;

  const { width, height } = dimensions;
  const pad = { top: 10, right: 15, bottom: 20, left: 35 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  // Split history vs forecast:
  // Let's use the last 6 points as actual history, and project 6 points forward
  const actualCount = Math.min(6, series.length);
  const actuals = series.slice(series.length - actualCount);

  // Generate 6 forecast values projecting upward trend or matching normal
  const forecasts = Array.from({ length: 6 }).map((_, i) => {
    const base = actuals[actuals.length - 1]?.kw ?? normalKw;
    // Add small drift/trend
    const drift = i * 1.8 + Math.sin(i) * 3;
    const timeVal = new Date();
    timeVal.setMinutes(timeVal.getMinutes() + (i + 1) * 2);
    const label = `${timeVal.getHours().toString().padStart(2, '0')}:${timeVal.getMinutes().toString().padStart(2, '0')}`;
    return {
      t: label,
      kw: Math.max(0, base + drift),
    };
  });

  const totalPoints = actuals.length + forecasts.length;
  const combined = [...actuals.map(p => ({ ...p, isForecast: false })), ...forecasts.map(p => ({ ...p, isForecast: true }))];

  const yMax = Math.max(...combined.map(p => p.kw)) * 1.1;
  const yMin = Math.min(...combined.map(p => p.kw)) * 0.9;
  const yRange = yMax - yMin || 1;

  const getX = (i: number) => pad.left + (i / (totalPoints - 1)) * plotW;
  const getY = (v: number) => pad.top + plotH - ((v - yMin) / yRange) * plotH;

  const actualPath = actuals.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(p.kw).toFixed(1)}`).join(' ');
  
  // Forecast starts from the last actual point
  const lastActualIndex = actuals.length - 1;
  const forecastPath = [
    `M ${getX(lastActualIndex).toFixed(1)} ${getY(actuals[lastActualIndex].kw).toFixed(1)}`,
    ...forecasts.map((p, i) => `L ${getX(lastActualIndex + i + 1).toFixed(1)} ${getY(p.kw).toFixed(1)}`)
  ].join(' ');

  // Shaded green area for forecast projection
  const bottomY = pad.top + plotH;
  const forecastArea = [
    `M ${getX(lastActualIndex).toFixed(1)} ${bottomY.toFixed(1)}`,
    `L ${getX(lastActualIndex).toFixed(1)} ${getY(actuals[lastActualIndex].kw).toFixed(1)}`,
    ...forecasts.map((p, i) => `L ${getX(lastActualIndex + i + 1).toFixed(1)} ${getY(p.kw).toFixed(1)}`),
    `L ${getX(totalPoints - 1).toFixed(1)} ${bottomY.toFixed(1)}`,
    'Z'
  ].join(' ');

  return (
    <div ref={containerRef} className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.85rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="section-label" style={{ margin: 0, borderBottom: 'none', padding: 0 }}>⚡ Energy Forecasting</span>
        <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.65rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--color-cyan)' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '2px', backgroundColor: 'var(--color-cyan)' }} /> Actual
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--color-green)' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '2px', backgroundColor: 'var(--color-green)', borderStyle: 'dashed', borderWidth: '1px' }} /> Forecast
          </span>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
        <svg width={width} height={height} style={{ overflow: 'visible', width: '100%', height: '100%' }}>
          <defs>
            <linearGradient id="forecast-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-green)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="var(--color-green)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Forecast Shaded Area */}
          <path d={forecastArea} fill="url(#forecast-grad)" />

          {/* Divider line between historical and forecast */}
          <line
            x1={getX(lastActualIndex)} y1={pad.top}
            x2={getX(lastActualIndex)} y2={bottomY}
            stroke="var(--color-border)" strokeWidth={1} strokeDasharray="2 3" strokeOpacity={0.4}
          />
          <text
            x={getX(lastActualIndex)} y={pad.top - 2}
            textAnchor="middle" fill="var(--color-text-dim)"
            style={{ fontSize: '0.5rem', fontFamily: 'var(--font-mono)' }}
          >
            NOW
          </text>

          {/* Actual line */}
          <path d={actualPath} fill="none" stroke="var(--color-cyan)" strokeWidth={2} style={{ filter: 'drop-shadow(0 0 3px var(--color-cyan))' }} />
          
          {/* Forecast line (Dashed) */}
          <path d={forecastPath} fill="none" stroke="var(--color-green)" strokeWidth={2} strokeDasharray="3 3" style={{ filter: 'drop-shadow(0 0 3px var(--color-green))' }} />

          {/* Y Axis ticks */}
          <text x={pad.left - 5} y={getY(yMin) + 3} textAnchor="end" fill="var(--color-text-dim)" style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)' }}>
            {yMin.toFixed(0)}
          </text>
          <text x={pad.left - 5} y={getY(yMax) + 3} textAnchor="end" fill="var(--color-text-dim)" style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)' }}>
            {yMax.toFixed(0)}
          </text>

          {/* X Axis labels */}
          <text x={getX(0)} y={height - 2} textAnchor="start" fill="var(--color-text-dim)" style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)' }}>
            {actuals[0]?.t}
          </text>
          <text x={getX(totalPoints - 1)} y={height - 2} textAnchor="end" fill="var(--color-text-dim)" style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)' }}>
            {forecasts[forecasts.length - 1]?.t}
          </text>
        </svg>
      </div>
    </div>
  );
};
export default EnergyForecasting;
