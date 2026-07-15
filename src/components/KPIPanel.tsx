import React from 'react';
import type { KPIs } from '../types';

interface KPIPanelProps {
  kpis: KPIs;
}

export const KPIPanel: React.FC<KPIPanelProps> = ({ kpis }) => {
  const { waste_avoided, time_to_detection, anomalies_this_week, false_alert_rate, fleet_uptime } = kpis;

  const cardStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    padding: '0.85rem',
    backgroundColor: 'var(--color-panel)',
    border: '1px solid var(--color-hairline)',
    borderRadius: '8px',
    flexGrow: 1,
    gap: '0.25rem',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: 'var(--color-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 600,
  };

  return (
    <div 
      className="panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        height: '100%',
      }}
    >
      <h3 style={{ margin: 0, fontSize: '1.15rem', borderBottom: '1px solid var(--color-hairline)', paddingBottom: '0.5rem' }}>
        Impact KPIs
      </h3>

      {/* KPI 1: Estimated Waste Avoided */}
      <div style={cardStyle}>
        <span style={labelStyle}>Est. Waste Avoided</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
          <span 
            className="number" 
            style={{ 
              fontSize: '1.65rem', 
              fontWeight: 700, 
              color: 'var(--color-green)',
              textShadow: '0 0 10px rgba(47, 217, 140, 0.15)'
            }}
          >
            {waste_avoided.toFixed(2)}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-green)', fontWeight: 600 }}>MAD</span>
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>
          Active deviation × duration × tariff
        </span>
      </div>

      {/* KPI 2: Time to Detection */}
      <div style={cardStyle}>
        <span style={labelStyle}>Avg. Time to Detection</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
          <span className="number" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-blue)' }}>
            {time_to_detection.toFixed(1)}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-blue)', fontWeight: 600 }}>seconds</span>
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>
          Anomaly start to manager alert
        </span>
      </div>

      {/* KPI 3: Fleet Uptime */}
      <div style={cardStyle}>
        <span style={labelStyle}>Fleet Uptime (nominal)</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
          <span className="number" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
            {fleet_uptime.toFixed(1)}%
          </span>
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>
          Time all machine nodes stay green
        </span>
      </div>

      {/* KPI 4: False Alert Rate */}
      <div style={cardStyle}>
        <span style={labelStyle}>False Alert Rate</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
          <span 
            className="number" 
            style={{ 
              fontSize: '1.5rem', 
              fontWeight: 700, 
              color: false_alert_rate > 20 ? 'var(--color-amber)' : 'var(--color-text)' 
            }}
          >
            {false_alert_rate}%
          </span>
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>
          Dismissed vs. confirmed warnings
        </span>
      </div>

      {/* KPI 5: Active Anomalies */}
      <div style={cardStyle}>
        <span style={labelStyle}>Active Anomalies</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
          <span 
            className="number" 
            style={{ 
              fontSize: '1.5rem', 
              fontWeight: 700, 
              color: anomalies_this_week > 0 ? 'var(--color-red)' : 'var(--color-text)' 
            }}
          >
            {anomalies_this_week}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>active this week</span>
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>
          Excludes manually dismissed alerts
        </span>
      </div>
    </div>
  );
};
export default KPIPanel;
