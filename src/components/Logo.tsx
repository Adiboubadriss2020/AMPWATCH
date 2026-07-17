import React from 'react';
import logoLightSrc from '../assets/energenius-logo.png';
import logoDarkSrc from '../assets/energenius-logo-dark.png';

interface LogoProps {
  className?: string;
  style?: React.CSSProperties;
  height?: number | string;
  theme?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({
  className,
  style,
  height = 88,
  theme = 'light',
}) => {
  const h = typeof height === 'number' ? height : Number.parseInt(String(height), 10) || 88;
  const isDark = theme === 'dark';

  return (
    <img
      src={isDark ? logoDarkSrc : logoLightSrc}
      alt="EnerGenius — Smart energy. Smarter decisions."
      className={`brand-logo brand-logo--${isDark ? 'dark' : 'light'}${className ? ` ${className}` : ''}`}
      height={h}
      style={{
        height: h,
        width: 'auto',
        display: 'block',
        objectFit: 'contain',
        objectPosition: 'center',
        flexShrink: 0,
        borderRadius: isDark ? 10 : 0,
        ...style,
      }}
      draggable={false}
    />
  );
};

export default Logo;
