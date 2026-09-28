import React from 'react';
import { Sun } from 'lucide-react';
import { useQuickSettings } from '../../../services/systemBridge';
import { useAdaptiveMaterial } from '../../../modules/desktop/adaptive';

export const WindowsBrightnessSlider: React.FC = () => {
  const { quickSettings, setScreenBrightness } = useQuickSettings();
  const { tokens } = useAdaptiveMaterial();
  const activeAccent = tokens.accent.activeAccent;

  return (
    <div className="w-full pt-2 pb-1 flex items-center gap-3 px-1 font-sans select-none">
      {/* Sun Icon */}
      <div className="w-4 h-4 flex items-center justify-center text-amber-300 shrink-0">
        <Sun className="w-4 h-4 stroke-[1.8]" />
      </div>

      {/* Windows 10 Native Slider Bar with Liquid Glass Track */}
      <div className="relative flex-1 flex items-center">
        <input
          type="range"
          min="10"
          max="100"
          value={quickSettings.screenBrightness}
          onChange={(e) => setScreenBrightness(Number(e.target.value))}
          className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer overflow-hidden"
          style={{
            accentColor: activeAccent,
            background: `linear-gradient(to right, ${activeAccent} ${quickSettings.screenBrightness}%, rgba(255, 255, 255, 0.18) ${quickSettings.screenBrightness}%)`,
          }}
          aria-label="Display Brightness"
        />
      </div>

      {/* Percentage Readout */}
      <span className="text-[11.5px] font-mono text-white/80 w-8 text-right shrink-0">
        {quickSettings.screenBrightness}%
      </span>
    </div>
  );
};

export default WindowsBrightnessSlider;

