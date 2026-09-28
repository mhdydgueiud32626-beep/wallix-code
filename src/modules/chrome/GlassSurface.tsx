import React from 'react';

export interface GlassSurfaceProps {
  blur?: number | 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  opacity?: number; // 0 to 100
  borderOpacity?: number; // 0 to 100
  shadow?: 'none' | 'subtle' | 'medium' | 'deep' | 'glow';
  accent?: 'none' | 'cyan' | 'purple' | 'blue' | 'emerald' | 'amber' | 'rose';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full' | number;
  glow?: boolean;
  glowColor?: string;
  hoverEffect?: boolean;
  frostedHighlight?: boolean;
  glassIntensity?: number; // 0 to 100
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  id?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export const GlassSurface: React.FC<GlassSurfaceProps> = ({
  blur = 24,
  opacity = 30,
  borderOpacity = 22,
  shadow = 'medium',
  accent = 'none',
  radius = '2xl',
  glow = false,
  glowColor,
  hoverEffect = false,
  frostedHighlight = true,
  glassIntensity = 55,
  className = '',
  style = {},
  children,
  id,
  onClick,
}) => {
  // Compute blur CSS value
  const blurPx = typeof blur === 'number' ? `${blur}px` : {
    none: '0px',
    sm: '6px',
    md: '12px',
    lg: '20px',
    xl: '28px',
    '2xl': '36px',
  }[blur] || '24px';

  // Compute border-radius
  const isNumericRadius = typeof radius === 'number';
  const radiusClass = isNumericRadius ? '' : ({
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
    full: 'rounded-full',
  }[radius] || 'rounded-2xl');

  // Compute shadow style with subtle frosted ambient depth modulated by glassIntensity
  const intensity = typeof glassIntensity === 'number' ? Math.min(Math.max(glassIntensity, 0), 100) : 55;
  const highlightAlpha = (0.12 + (intensity / 100) * 0.28).toFixed(2);
  const shadowAlpha = (0.1 + (intensity / 100) * 0.25).toFixed(2);
  const highlightInset = frostedHighlight
    ? `inset 0 1px 1px 0 rgba(255, 255, 255, ${highlightAlpha}), inset 0 -1px 1px 0 rgba(0, 0, 0, ${shadowAlpha})`
    : '';

  let shadowStyle = '';
  if (shadow === 'subtle') shadowStyle = '0 4px 16px -2px rgba(0, 0, 0, 0.35)';
  else if (shadow === 'medium') shadowStyle = '0 10px 30px -4px rgba(0, 0, 0, 0.45)';
  else if (shadow === 'deep') shadowStyle = '0 20px 48px -6px rgba(0, 0, 0, 0.65)';
  else if (shadow === 'glow') {
    const col = glowColor || 'rgba(6, 182, 212, 0.25)';
    shadowStyle = `0 10px 35px -5px rgba(0, 0, 0, 0.5), 0 0 25px 0 ${col}`;
  }

  const combinedShadow = [shadowStyle, highlightInset].filter(Boolean).join(', ');

  // Base background and border
  let bgRgba = `rgba(15, 23, 42, ${opacity / 100})`;
  let borderRgba = `rgba(255, 255, 255, ${borderOpacity / 100})`;

  if (accent === 'cyan') {
    bgRgba = `rgba(6, 35, 52, ${Math.min(opacity / 100 + 0.05, 0.85)})`;
    borderRgba = `rgba(34, 211, 238, ${borderOpacity / 100})`;
  } else if (accent === 'blue') {
    bgRgba = `rgba(15, 28, 56, ${Math.min(opacity / 100 + 0.05, 0.85)})`;
    borderRgba = `rgba(96, 165, 250, ${borderOpacity / 100})`;
  } else if (accent === 'purple') {
    bgRgba = `rgba(28, 18, 48, ${Math.min(opacity / 100 + 0.05, 0.85)})`;
    borderRgba = `rgba(192, 132, 252, ${borderOpacity / 100})`;
  } else if (accent === 'emerald') {
    bgRgba = `rgba(6, 40, 32, ${Math.min(opacity / 100 + 0.05, 0.85)})`;
    borderRgba = `rgba(52, 211, 153, ${borderOpacity / 100})`;
  } else if (accent === 'amber') {
    bgRgba = `rgba(45, 28, 10, ${Math.min(opacity / 100 + 0.05, 0.85)})`;
    borderRgba = `rgba(251, 191, 36, ${borderOpacity / 100})`;
  } else if (accent === 'rose') {
    bgRgba = `rgba(48, 15, 22, ${Math.min(opacity / 100 + 0.05, 0.85)})`;
    borderRgba = `rgba(244, 63, 94, ${borderOpacity / 100})`;
  }

  const saturation = 130 + Math.round(intensity * 0.5);

  const combinedStyle: React.CSSProperties = {
    backgroundColor: bgRgba,
    backdropFilter: `blur(${blurPx}) saturate(${saturation}%)`,
    WebkitBackdropFilter: `blur(${blurPx}) saturate(${saturation}%)`,
    borderColor: borderRgba,
    borderRadius: isNumericRadius ? `${radius}px` : undefined,
    boxShadow: combinedShadow || undefined,
    // Unified CSS custom property design tokens
    ['--glass-bg' as any]: bgRgba,
    ['--glass-blur' as any]: blurPx,
    ['--glass-border' as any]: borderRgba,
    ['--glass-shadow' as any]: shadowStyle,
    ['--glass-highlight' as any]: highlightInset,
    ...style,
  };

  return (
    <div
      id={id}
      onClick={onClick}
      style={combinedStyle}
      className={`border transition-all duration-300 ${radiusClass} ${
        hoverEffect ? 'hover:scale-[1.02] hover:-translate-y-0.5 hover:brightness-110' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
