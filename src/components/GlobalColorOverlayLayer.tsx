import React from 'react';
import { ColorGradePreset } from '../data/colorPresets';

interface GlobalColorOverlayLayerProps {
  activeTheme: ColorGradePreset;
  intensity: number;
}

export const GlobalColorOverlayLayer: React.FC<GlobalColorOverlayLayerProps> = ({
  activeTheme,
  intensity,
}) => {
  if (activeTheme.id === 'none') return null;

  return (
    <div 
      id="wallix-global-color-overlay-layer"
      className={`absolute inset-0 z-20 pointer-events-none transition-all duration-500 ease-in-out ${activeTheme.className}`}
      style={{ opacity: intensity }}
    />
  );
};
