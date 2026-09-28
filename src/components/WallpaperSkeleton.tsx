import React from 'react';

interface WallpaperSkeletonProps {
  count?: number;
  className?: string;
}

export const WallpaperSkeleton: React.FC<WallpaperSkeletonProps> = ({ 
  count = 1,
  className = ''
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`wallpaper-skeleton-${index}`}
          className={`relative rounded-2xl overflow-hidden bg-[#0e111a] border border-white/5 flex flex-col shadow-lg animate-pulse ${className}`}
        >
          {/* Image Placeholder with subtle shimmer */}
          <div className="relative w-full aspect-[16/10] bg-white/[0.03] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            
            {/* Subtle top badge placeholder */}
            <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg bg-white/5" />
          </div>
        </div>
      ))}
    </>
  );
};
