import React from 'react';

interface LogoProps {
  className?: string;
  style?: React.CSSProperties;
  height?: number | string;
}

export const Logo: React.FC<LogoProps> = ({ className, style, height = 32 }) => {
  return (
    <svg
      version="1.1"
      viewBox="0 0 500 500"
      height={height}
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
    >
      <defs>
        {/* Luminous gradient for primary accents (cyan -> blue) */}
        <linearGradient id="logo-accent-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-cyan)" />
          <stop offset="100%" stopColor="var(--color-blue)" />
        </linearGradient>
      </defs>

      {/* Hexagonal house/node outline */}
      <path
        d="M 230 110 
           L 320 190 
           A 8 8 0 0 1 323 196
           L 323 250 
           M 323 350
           L 323 364
           A 12 12 0 0 1 311 376
           L 245 376
           M 175 376
           L 170 376
           A 12 12 0 0 1 158 364
           L 158 290"
        fill="none"
        stroke="var(--color-text)"
        strokeWidth="24"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 3 vertical bar charts (left side) */}
      <rect x="134" y="326" width="18" height="50" rx="6" fill="url(#logo-accent-grad)" />
      <rect x="160" y="294" width="18" height="82" rx="6" fill="url(#logo-accent-grad)" />
      <rect x="186" y="250" width="18" height="126" rx="6" fill="url(#logo-accent-grad)" />

      {/* Central Lightning Bolt */}
      <path
        d="M 250 144
           L 214 246
           L 242 246
           L 230 334
           L 290 220
           L 260 220
           Z"
        fill="url(#logo-accent-grad)"
        style={{ filter: 'drop-shadow(0 0 8px rgba(41,211,240,0.5))' }}
      />

      {/* 3 horizontal circuit lines (right side) */}
      {/* Top Line */}
      <path d="M 323 234 L 370 234 L 396 200" fill="none" stroke="url(#logo-accent-grad)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="396" cy="200" r="12" fill="url(#logo-accent-grad)" />

      {/* Middle Line */}
      <path d="M 323 286 L 388 286" fill="none" stroke="url(#logo-accent-grad)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="388" cy="286" r="12" fill="url(#logo-accent-grad)" />

      {/* Bottom Line */}
      <path d="M 323 336 L 370 336 L 396 366" fill="none" stroke="url(#logo-accent-grad)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="396" cy="366" r="12" fill="url(#logo-accent-grad)" />
    </svg>
  );
};
export default Logo;
