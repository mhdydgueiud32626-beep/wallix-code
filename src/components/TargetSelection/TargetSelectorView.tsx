import React from 'react';
import { TargetCard } from './TargetCard';
import { CUSTOMIZATION_TARGETS } from '../../data/customizationTargets';
import { TargetEnvironmentId } from '../../types/target';

interface TargetSelectorViewProps {
  selectedTargetId?: TargetEnvironmentId;
  onSelectTarget: (targetId: TargetEnvironmentId) => void;
  onNavigateHomeWallpapers?: () => void;
}

export const TargetSelectorView: React.FC<TargetSelectorViewProps> = ({
  selectedTargetId,
  onSelectTarget,
}) => {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 sm:space-y-7 animate-fadeIn pb-12">
      {/* ========================================================================= */}
      {/* HEADER: PRODUCT-FIRST CONTROLLED HEADING */}
      {/* ========================================================================= */}
      <div className="text-center space-y-1.5 pt-1 sm:pt-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-['Outfit']">
          Choose your environment
        </h1>
        <p className="text-slate-400 text-sm max-w-xl mx-auto font-normal">
          Choose an environment to open its dedicated customization workspace.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 2 × 2 BALANCED TARGET CARDS GRID */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
        {CUSTOMIZATION_TARGETS.map((target) => (
          <TargetCard
            key={target.id}
            target={target}
            isSelected={selectedTargetId === target.id}
            onSelect={onSelectTarget}
          />
        ))}
      </div>
    </div>
  );
};

