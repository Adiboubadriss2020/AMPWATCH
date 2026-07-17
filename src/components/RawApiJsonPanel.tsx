import React, { useState } from 'react';

interface RawApiJsonPanelProps {
  title?: string;
  rawResponse: unknown;
  live: boolean;
  emptyMessage?: string;
}

export const RawApiJsonPanel: React.FC<RawApiJsonPanelProps> = ({
  title = 'API JSON',
  rawResponse,
  live,
  emptyMessage = 'Waiting for payload…',
}) => {
  const [copied, setCopied] = useState(false);
  const hasData =
    rawResponse != null &&
    !(
      typeof rawResponse === 'object' &&
      rawResponse !== null &&
      'webhook' in rawResponse &&
      'agent' in rawResponse &&
      (rawResponse as { webhook: unknown; agent: unknown }).webhook == null &&
      (rawResponse as { webhook: unknown; agent: unknown }).agent == null
    );

  const jsonText = hasData ? JSON.stringify(rawResponse, null, 2) : '';

  const copy = async () => {
    if (!jsonText) return;
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.55rem',
        padding: '0.65rem 0.85rem',
        minHeight: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <span className="section-label" style={{ margin: 0, border: 'none', padding: 0 }}>
          {title}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--color-text-sub)', fontWeight: 600 }}>
            {live ? 'LIVE' : 'Waiting…'}
          </span>
          <button
            type="button"
            onClick={() => void copy()}
            disabled={!jsonText}
            style={{
              background: 'var(--color-overlay)',
              border: '1px solid var(--color-hairline)',
              borderRadius: '6px',
              padding: '0.2rem 0.55rem',
              fontSize: '0.65rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text)',
              cursor: jsonText ? 'pointer' : 'default',
              opacity: jsonText ? 1 : 0.5,
            }}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <pre
        className="mono"
        style={{
          margin: 0,
          padding: '0.75rem',
          background: 'var(--color-overlay)',
          border: '1px solid var(--color-hairline)',
          borderRadius: '8px',
          maxHeight: '360px',
          overflow: 'auto',
          fontSize: '0.72rem',
          lineHeight: 1.45,
          color: 'var(--color-text)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {jsonText || `{\n  "message": "${emptyMessage}"\n}`}
      </pre>
    </div>
  );
};

export default RawApiJsonPanel;
