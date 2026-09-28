/**
 * Fluent Shell Motion Physics & Curves
 * Based on Microsoft Fluent Design System motion curves (Decelerate / Accelerate / Standard)
 * tuned for authentic Liquid Glass reveal dynamics.
 */

// Fluent standard cubic-bezier entrance: cubic-bezier(0.1, 0.9, 0.2, 1.0)
export const FLUENT_EASING = [0.1, 0.9, 0.2, 1.0] as const;
export const FLUENT_EXIT_EASING = [0.7, 0.0, 0.84, 0.0] as const;

export const shellFlyoutMotion = {
  initial: { opacity: 0, y: -12, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.97 },
  transition: {
    duration: 0.2,
    ease: FLUENT_EASING,
  },
};

export const shellSideDockMotion = {
  initial: { opacity: 0, x: '100%' },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: '100%' },
  transition: {
    type: 'spring' as const,
    stiffness: 420,
    damping: 34,
    mass: 0.8,
  },
};

export const shellSearchModalMotion = {
  initial: { opacity: 0, scale: 0.95, y: -18 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: -10 },
  transition: {
    duration: 0.22,
    ease: FLUENT_EASING,
  },
};

