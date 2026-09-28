import React from 'react';
import { LIQUID_GLASS_TOKENS } from '../../../modules/desktop/shell/LiquidGlassShellContainer';
import { useAdaptiveMaterial } from '../../../modules/desktop/adaptive';

export interface WindowsQuickActionTileProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  stateLabel?: string;
  isActive: boolean;
  isDisabled?: boolean;
  onClick: () => void;
  title?: string;
}

export const WindowsQuickActionTile: React.FC<WindowsQuickActionTileProps> = ({
  icon,
  label,
  stateLabel,
  isActive,
  isDisabled = false,
  onClick,
  title,
}) => {
  const { tokens } = useAdaptiveMaterial();

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      title={title || label}
      style={
        isActive && !isDisabled
          ? {
              background: tokens.quickAction.tileActiveGradient,
              borderColor: tokens.quickAction.tileActiveBorder,
              boxShadow: tokens.quickAction.tileActiveShadow,
              color: tokens.quickAction.tileActiveText,
            }
          : undefined
      }
      className={`h-[62px] w-full p-2 flex flex-col justify-between items-start rounded-lg select-none font-sans text-left cursor-pointer border ${
        isDisabled
          ? 'opacity-40 cursor-not-allowed bg-white/[0.02] border-white/[0.04] text-white/40'
          : isActive
          ? 'text-white hover:brightness-110 active:brightness-95 transition-all duration-150'
          : LIQUID_GLASS_TOKENS.tileInactive
      }`}
    >
      {/* Icon Top Left */}
      <div className="w-4 h-4 flex items-center justify-center shrink-0">
        {icon}
      </div>

      {/* Label & Secondary State Text Bottom */}
      <div className="w-full min-w-0 overflow-hidden">
        <div className="text-[11px] font-normal leading-tight truncate text-white">
          {label}
        </div>
        {stateLabel && (
          <div className="text-[9.5px] text-white/70 leading-none truncate mt-0.5 font-light">
            {stateLabel}
          </div>
        )}
      </div>
    </button>
  );
};

export default WindowsQuickActionTile;

