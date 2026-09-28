import React from 'react';

export const WallixLogo3D: React.FC<{ size?: number; className?: string }> = ({ size = 110, className = '' }) => {
  return (
    <div 
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Ambient background glow matching the artwork */}
      <div 
        className="absolute -inset-4 rounded-full bg-gradient-to-tr from-blue-600/30 via-cyan-400/20 to-purple-600/30 blur-xl -z-10 pointer-events-none"
      />

      <svg
        viewBox="0 0 200 200"
        className="w-full h-full overflow-visible drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]"
      >
        <defs>
          {/* Base Rounded Frame Clip Path */}
          <clipPath id="frameClip">
            <rect x="36" y="24" width="128" height="132" rx="34" />
          </clipPath>

          {/* Sky Gradient */}
          <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E133E" />
            <stop offset="45%" stopColor="#371860" />
            <stop offset="70%" stopColor="#641C6E" />
            <stop offset="90%" stopColor="#2A1B54" />
            <stop offset="100%" stopColor="#0B1228" />
          </linearGradient>

          {/* Sun Gradient */}
          <linearGradient id="sunGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFA6C9" />
            <stop offset="40%" stopColor="#FF6584" />
            <stop offset="100%" stopColor="#C837AB" />
          </linearGradient>

          {/* Neon Mist Lake Gradient */}
          <linearGradient id="mistGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0.7" />
          </linearGradient>

          {/* Frosted Glass 'W' Fill Gradient */}
          <linearGradient id="glassFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
            <stop offset="25%" stopColor="#E0F2FE" stopOpacity="0.32" />
            <stop offset="60%" stopColor="#BAE6FD" stopOpacity="0.22" />
            <stop offset="85%" stopColor="#E0E7FF" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.6" />
          </linearGradient>

          {/* Glass Specular Edge Stroke Gradient */}
          <linearGradient id="glassStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="35%" stopColor="#BAE6FD" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#C7D2FE" stopOpacity="0.5" />
          </linearGradient>

          {/* Soft Glass Blur Filter */}
          <filter id="glassBlur" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.4" />
          </filter>
        </defs>

        {/* 1. OUTER GLOWING ACRYLIC CARD CONTAINER */}
        <rect
          x="36"
          y="24"
          width="128"
          height="132"
          rx="34"
          fill="#110E28"
          stroke="rgba(147, 197, 253, 0.45)"
          strokeWidth="3.5"
          filter="drop-shadow(0 0 12px rgba(99, 102, 241, 0.4))"
        />

        {/* 2. INNER SCENE: SUNSET MOUNTAINS & RETROWAVE SKY */}
        <g clipPath="url(#frameClip)">
          {/* Deep Purple Night Sky */}
          <rect x="36" y="24" width="128" height="132" fill="url(#skyGrad)" />

          {/* Distant Stars / Stardust */}
          <circle cx="60" cy="45" r="0.8" fill="#FFFFFF" opacity="0.7" />
          <circle cx="138" cy="42" r="1.1" fill="#FFFFFF" opacity="0.85" />
          <circle cx="102" cy="36" r="0.7" fill="#FFFFFF" opacity="0.6" />
          <circle cx="85" cy="52" r="0.9" fill="#E0F2FE" opacity="0.7" />
          <circle cx="148" cy="62" r="0.6" fill="#FFFFFF" opacity="0.5" />

          {/* Soft Evening Clouds */}
          <ellipse cx="68" cy="48" rx="22" ry="3.5" fill="#4C1D95" opacity="0.45" />
          <ellipse cx="142" cy="55" rx="18" ry="3" fill="#581C87" opacity="0.4" />

          {/* Retrowave Sunset Sun with Scanlines */}
          <g>
            <circle cx="124" cy="72" r="18" fill="url(#sunGrad)" />
            {/* Scanline Cuts through the sun */}
            <rect x="104" y="68" width="40" height="1.2" fill="#2E1065" opacity="0.75" />
            <rect x="104" y="73" width="40" height="1.6" fill="#2E1065" opacity="0.85" />
            <rect x="104" y="79" width="40" height="2.2" fill="#2E1065" opacity="0.9" />
          </g>

          {/* Layer 1: Distant Background Purple Mountains */}
          <polygon
            points="36,105 75,68 115,100 148,74 164,96 164,156 36,156"
            fill="#3B0764"
            opacity="0.85"
          />

          {/* Layer 2: Midground Dark Violet Mountains */}
          <polygon
            points="36,120 62,88 92,118 126,82 164,124 164,156 36,156"
            fill="#1E1B4B"
          />
          <polyline
            points="62,88 92,118 126,82"
            fill="none"
            stroke="#C084FC"
            strokeWidth="1.2"
            strokeOpacity="0.4"
          />

          {/* Layer 3: Foreground Indigo Valley */}
          <polygon
            points="36,134 78,104 118,136 164,115 164,156 36,156"
            fill="#0F172A"
          />

          {/* Glowing Mist / Cyan Lake Reflection at Bottom */}
          <ellipse cx="100" cy="132" rx="46" ry="12" fill="url(#mistGrad)" opacity="0.55" filter="blur(4px)" />
          
          {/* Vertical Cyan Light Reflection */}
          <polygon points="98,124 102,124 106,156 94,156" fill="#38BDF8" opacity="0.3" filter="blur(2px)" />

          {/* Inner Frame Vignette */}
          <rect
            x="36"
            y="24"
            width="128"
            height="132"
            fill="none"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="2"
          />
        </g>

        {/* 3. FOREGROUND 3D FROSTED GLASS 'W' OVERLAPPING THE FRAME */}
        {/* Left Wing of W: (22, 44) down to (72, 142) */}
        {/* Center-Left Rise: (72, 142) up to (100, 60) */}
        {/* Center-Right Drop: (100, 60) down to (128, 142) */}
        {/* Right Wing of W: (128, 142) up to (178, 44) */}
        <g filter="drop-shadow(0 8px 18px rgba(0, 0, 0, 0.5))">
          
          {/* Glass Cast Shadow onto the mountain landscape */}
          <path
            d="M 28 46 L 73 144 L 99 64 L 127 144 L 172 46"
            fill="none"
            stroke="rgba(0, 0, 0, 0.45)"
            strokeWidth="22"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="blur(4px)"
          />

          {/* Glass Base Body */}
          <path
            d="M 28 46 L 73 144 L 99 64 L 127 144 L 172 46"
            fill="none"
            stroke="url(#glassFill)"
            strokeWidth="23"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ backdropFilter: 'blur(8px)' }}
          />

          {/* Glass Refraction Inner Glow / Volume */}
          <path
            d="M 28 46 L 73 144 L 99 64 L 127 144 L 172 46"
            fill="none"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="15"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Beveled Specular Outline */}
          <path
            d="M 28 46 L 73 144 L 99 64 L 127 144 L 172 46"
            fill="none"
            stroke="url(#glassStroke)"
            strokeWidth="23"
            strokeLinecap="round"
            strokeLinejoin="round"
            fillOpacity="0"
          />

          {/* Precision Crisp Inner Edge Highlights for 3D Bevel depth */}
          <path
            d="M 22 43 L 68 136 M 100 68 L 122 136"
            stroke="#FFFFFF"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeOpacity="0.8"
          />
          <path
            d="M 33 48 L 76 142 M 132 142 L 176 48"
            stroke="#FFFFFF"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeOpacity="0.65"
          />
        </g>
      </svg>
    </div>
  );
};
