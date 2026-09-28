import React, { useRef, useEffect } from 'react';
import { NavTab } from '../types';
import { Home, Search, Monitor, Heart, Settings, LucideIcon } from 'lucide-react';
import './GooeyNav.css';

export interface NavRailItem {
  id: NavTab;
  label: string;
  tooltip: string;
  badge?: string;
  icon: LucideIcon;
  isActive: boolean;
  onClick: () => void;
}

interface SidebarNavigationProps {
  items: NavRailItem[];
  isSidebarOpen: boolean;
  particleCount?: number;
  particleDistances?: [number, number];
  particleR?: number;
  animationTime?: number;
  timeVariance?: number;
}

const NEON_CYBER_COLORS = [
  '#38bdf8', // Neon Sky Cyan
  '#22d3ee', // Bright Cyan
  '#06b6d4', // Deep Cyan
  '#67e8f9', // Soft Glow Cyan
  '#818cf8', // Electric Indigo
  '#ffffff', // Pure White Flash
];

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  items,
  isSidebarOpen,
  particleCount = 14,
  particleDistances = [45, 12],
  particleR = 70,
  animationTime = 450,
  timeVariance = 200,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLUListElement>(null);
  const filterRef = useRef<HTMLSpanElement>(null);

  const activeIndex = items.findIndex((item) => item.isActive);

  const noise = (n = 1) => n / 2 - Math.random() * n;

  const getXY = (distance: number, pointIndex: number, totalPoints: number) => {
    const angle = ((360 + noise(10)) / totalPoints) * pointIndex * (Math.PI / 180);
    return [distance * Math.cos(angle), distance * Math.sin(angle)];
  };

  const createParticle = (i: number, t: number, d: [number, number], r: number) => {
    const rotate = noise(r / 10);
    return {
      start: getXY(d[0], particleCount - i, particleCount),
      end: getXY(d[1] + noise(6), particleCount - i, particleCount),
      time: t,
      scale: 0.9 + noise(0.3),
      color: NEON_CYBER_COLORS[Math.floor(Math.random() * NEON_CYBER_COLORS.length)],
      rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10,
    };
  };

  const makeParticles = (element: HTMLElement) => {
    const d = particleDistances;
    const r = particleR;
    const bubbleTime = animationTime * 1.5 + timeVariance;
    element.style.setProperty('--time', `${bubbleTime}ms`);

    // Remove existing particles to avoid buildup
    const oldParticles = element.querySelectorAll('.vertical-gooey-particle');
    oldParticles.forEach((p) => {
      try {
        element.removeChild(p);
      } catch {}
    });

    element.classList.remove('active');

    for (let i = 0; i < particleCount; i++) {
      const t = animationTime + noise(timeVariance);
      const p = createParticle(i, t, d, r);

      setTimeout(() => {
        const particle = document.createElement('span');
        const point = document.createElement('span');
        particle.classList.add('vertical-gooey-particle');
        particle.style.setProperty('--start-x', `${p.start[0]}px`);
        particle.style.setProperty('--start-y', `${p.start[1]}px`);
        particle.style.setProperty('--end-x', `${p.end[0]}px`);
        particle.style.setProperty('--end-y', `${p.end[1]}px`);
        particle.style.setProperty('--time', `${p.time}ms`);
        particle.style.setProperty('--scale', `${p.scale}`);
        particle.style.setProperty('--color', p.color);
        particle.style.setProperty('--rotate', `${p.rotate}deg`);

        point.classList.add('vertical-gooey-point');
        point.style.setProperty('--color', p.color);
        particle.appendChild(point);
        element.appendChild(particle);

        requestAnimationFrame(() => {
          element.classList.add('active');
        });

        setTimeout(() => {
          try {
            element.removeChild(particle);
          } catch {}
        }, t + 50);
      }, 20);
    }
  };

  const updateEffectPosition = (element: HTMLElement) => {
    if (!containerRef.current || !filterRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const pos = element.getBoundingClientRect();

    const styles = {
      left: `${pos.x - containerRect.x}px`,
      top: `${pos.y - containerRect.y}px`,
      width: `${pos.width}px`,
      height: `${pos.height}px`,
    };
    Object.assign(filterRef.current.style, styles);
  };

  const handleItemClick = (e: React.MouseEvent<HTMLButtonElement>, index: number, onClick: () => void) => {
    const liEl = e.currentTarget.parentElement;
    if (liEl && filterRef.current) {
      updateEffectPosition(liEl);
      makeParticles(filterRef.current);
    }
    onClick();
  };

  useEffect(() => {
    if (!navRef.current || !containerRef.current || activeIndex < 0) return;
    const activeLi = navRef.current.querySelectorAll('li')[activeIndex];
    if (activeLi) {
      updateEffectPosition(activeLi);
      if (filterRef.current) {
        makeParticles(filterRef.current);
      }
    }

    const resizeObserver = new ResizeObserver(() => {
      const currentActiveLi = navRef.current?.querySelectorAll('li')[activeIndex];
      if (currentActiveLi) {
        updateEffectPosition(currentActiveLi);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [activeIndex, isSidebarOpen]);

  return (
    <div className="vertical-gooey-nav-container" ref={containerRef}>
      <nav className="w-full">
        <ul ref={navRef} className="w-full space-y-2.5">
          {items.map((item, index) => {
            const Icon = item.icon;
            const isItemActive = item.isActive;

            return (
              <li key={item.id} className={`w-full ${isItemActive ? 'active' : ''}`}>
                <button
                  id={`nav-btn-${item.id}`}
                  onClick={(e) => handleItemClick(e, index, item.onClick)}
                  className={`w-full flex items-center ${
                    isSidebarOpen ? 'justify-between px-3.5 py-3 rounded-2xl' : 'justify-center p-3 rounded-2xl'
                  } text-xs md:text-sm font-semibold transition-all duration-300 group relative cursor-pointer active:scale-95 ${
                    isItemActive
                      ? 'bg-gradient-to-r from-cyan-500/25 via-blue-600/20 to-indigo-600/20 text-white border border-cyan-400/60 shadow-[0_0_18px_rgba(6,182,212,0.35)] font-bold'
                      : 'text-slate-400 hover:text-cyan-200 hover:bg-white/[0.06] border border-transparent'
                  }`}
                  title={!isSidebarOpen ? (item.tooltip || item.label) : undefined}
                  aria-label={item.tooltip || item.label}
                >
                  {/* Clean uniform icon without any left notches/bars */}
                  <div className={`flex items-center ${isSidebarOpen ? 'gap-3 min-w-0' : 'justify-center'}`}>
                    <div
                      className={`transition-all duration-300 flex items-center justify-center ${
                        isItemActive
                          ? 'text-cyan-300 drop-shadow-[0_0_12px_rgba(56,189,248,0.95)] scale-110'
                          : 'text-slate-400 group-hover:text-cyan-300 group-hover:scale-110'
                      }`}
                    >
                      <Icon className="w-5 h-5 stroke-[2.2]" />
                    </div>

                    {/* Smooth expanded text label */}
                    {isSidebarOpen && (
                      <span
                        className={`tracking-wide text-left text-xs font-semibold truncate transition-all duration-300 ${
                          isItemActive
                            ? 'text-white font-bold drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                            : 'text-slate-300 group-hover:text-white'
                        }`}
                      >
                        {item.label}
                      </span>
                    )}
                  </div>

                  {/* Optional Badge */}
                  {isSidebarOpen && item.badge && (
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 transition-all duration-300 ${
                        isItemActive
                          ? 'bg-cyan-500/40 text-cyan-100 border border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                          : 'bg-white/5 text-slate-400 border border-white/10 group-hover:bg-cyan-500/20 group-hover:text-cyan-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Vertical Gooey Liquid & Particle Canvas Overlay */}
      <span className="effect filter" ref={filterRef} />
    </div>
  );
};

export default SidebarNavigation;
