import React from 'react';

type IconProps = {
  size?: number;
  color?: string;
  className?: string;
  title?: string;
};

function Svg({
  size = 16,
  color = 'currentColor',
  className,
  title,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/** Money saved / cost avoided */
export const IconCost = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v10" />
    <path d="M15 9.5c0-1.2-1.3-2-3-2s-3 .8-3 2 1.3 1.8 3 2.2 3 1 3 2.2-1.3 2-3 2-3-.8-3-2" />
  </Svg>
);

/** CO₂ / emissions offset */
export const IconCo2 = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 19c-3.5 0-6-2.2-6-5.2C6 10.5 9 7 12 5c3 2 6 5.5 6 8.8 0 3-2.5 5.2-6 5.2z" />
    <path d="M9.5 14.5c1 .8 2 .8 3 0" />
    <path d="M11.5 11.5c.7.5 1.3.5 2 0" />
  </Svg>
);

/** Machine uptime / healthy running */
export const IconUptime = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 14h3l2-6 3 10 2-6h4" />
    <path d="M3 19h18" />
  </Svg>
);

/** Anomaly / alert */
export const IconAnomaly = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3 2 20h20L12 3z" />
    <path d="M12 10v4" />
    <path d="M12 17h.01" />
  </Svg>
);

/** Detection latency / stopwatch */
export const IconDetection = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2.5 1.5" />
    <path d="M9 3h6" />
    <path d="M12 3v2" />
  </Svg>
);

/** Live power / kW telemetry chart */
export const IconTelemetry = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 17 9 9l4 5 3-7 5 10" />
    <path d="M3 20h18" />
  </Svg>
);

/** Voltage */
export const IconVoltage = (p: IconProps) => (
  <Svg {...p}>
    <path d="M13 2 6 13h5l-1 9 7-11h-5l1-9z" />
  </Svg>
);

/** Power factor / cosine */
export const IconPowerFactor = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 12 16.5 7.5" />
    <path d="M12 12h7" />
  </Svg>
);

/** Temperature */
export const IconTemp = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10 14.5V6a2 2 0 1 1 4 0v8.5a3.5 3.5 0 1 1-4 0z" />
    <path d="M12 17.5v-5" />
  </Svg>
);

/** Pressure gauge */
export const IconPressure = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6.5 18a8 8 0 1 1 11 0" />
    <path d="M12 14l3-4" />
    <path d="M9 19h6" />
  </Svg>
);

/** Air compressor / tank twin */
export const IconCompressor = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="9" width="14" height="8" rx="3" />
    <path d="M17 11h3v4h-3" />
    <circle cx="8" cy="13" r="1.5" />
    <circle cx="13" cy="13" r="1.5" />
    <path d="M6 9V7h4" />
  </Svg>
);

/** Asset economics / health */
export const IconHealth = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.6-7 10-7 10z" />
  </Svg>
);

/** Baseline vs actual */
export const IconBaseline = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 18h16" />
    <path d="M4 14h10" />
    <path d="M7 14V7l4 3 4-5v9" />
  </Svg>
);

/** Scenario / playbook */
export const IconScenario = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 4h9a2 2 0 0 1 2 2v14l-4-2-4 2V6a2 2 0 0 0-2-2H5" />
    <path d="M9 9h6" />
    <path d="M9 13h4" />
  </Svg>
);

/** Wear / abrasion */
export const IconWear = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 16c2-1 3-4 4-4s2 4 4 4 3-4 4-4 2 3 4 4" />
    <path d="M4 20h16" />
    <path d="M8 8l2-4 2 3 2-2 2 3" />
  </Svg>
);

/** Maintenance wrench */
export const IconMaintenance = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-2.5 2.5-2.5z" />
  </Svg>
);

/** Tariff / clock band */
export const IconTariff = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="5" width="16" height="15" rx="2" />
    <path d="M8 3v4" />
    <path d="M16 3v4" />
    <path d="M4 10h16" />
    <path d="M9 14h2" />
    <path d="M13 14h2" />
    <path d="M9 17h6" />
  </Svg>
);

/** Shift / production window */
export const IconShift = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);

/** Drift / trend away */
export const IconDrift = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 17 10 10l3 3 8-8" />
    <path d="M14 5h7v7" />
  </Svg>
);
