import React from 'react';
import { AlignmentGuide } from '../../desktop/types';

interface AlignmentGuidesProps {
  guides: AlignmentGuide[];
}

export const AlignmentGuides: React.FC<AlignmentGuidesProps> = ({ guides }) => {
  if (!guides || guides.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {guides.map((guide, idx) => {
        if (guide.type === 'vertical') {
          return (
            <div
              key={`guide-v-${idx}`}
              className="absolute top-0 bottom-0 border-l border-dashed border-cyan-400 z-50 shadow-[0_0_8px_rgba(6,182,212,0.9)]"
              style={{ left: `${guide.position}px` }}
            >
              {guide.label && (
                <div className="absolute top-4 left-1.5 px-1.5 py-0.5 rounded bg-cyan-950/90 border border-cyan-400/60 text-[9px] font-mono text-cyan-300 font-bold whitespace-nowrap shadow-lg">
                  {guide.label}
                </div>
              )}
            </div>
          );
        } else {
          return (
            <div
              key={`guide-h-${idx}`}
              className="absolute left-0 right-0 border-t border-dashed border-cyan-400 z-50 shadow-[0_0_8px_rgba(6,182,212,0.9)]"
              style={{ top: `${guide.position}px` }}
            >
              {guide.label && (
                <div className="absolute top-1.5 left-4 px-1.5 py-0.5 rounded bg-cyan-950/90 border border-cyan-400/60 text-[9px] font-mono text-cyan-300 font-bold whitespace-nowrap shadow-lg">
                  {guide.label}
                </div>
              )}
            </div>
          );
        }
      })}
    </div>
  );
};
