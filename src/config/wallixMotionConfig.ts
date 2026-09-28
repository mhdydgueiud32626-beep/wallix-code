/**
 * Centralized Single Source of Truth for WALLIX Motion & Live Physics Configuration.
 * 
 * Modifying values here immediately cascades to:
 * - AppDock & DockItem magnification wave physics
 * - DockActionButton springs and lifts
 * - Top Status Area micro-interactions (Battery, Search, Controls)
 * - Fullscreen Live WYSIWYG Viewport & Simulator
 */

export interface WallixMotionConfig {
  dock: {
    maxScale: number;
    stiffness: number;
    damping: number;
    mass: number;
    centerLift: number;
    adjacentScale: number;
    adjacentLift: number;
    outerScale: number;
    outerLift: number;
    brightnessPeak: number;
    actionMaxScale: number;
    actionCenterLift: number;
    actionAdjacentScale: number;
    actionAdjacentLift: number;
    actionOuterScale: number;
    actionOuterLift: number;
  };
  topControls: {
    hoverScale: number;
    tapScale: number;
    stiffness: number;
    damping: number;
  };
  toast: {
    stiffness: number;
    damping: number;
  };
}

export const WALLIX_MOTION_CONFIG: WallixMotionConfig = {
  dock: {
    maxScale: 1.26,
    stiffness: 360,
    damping: 30,
    mass: 0.14,
    centerLift: -4.0,
    adjacentScale: 1.14,
    adjacentLift: -2.0,
    outerScale: 1.04,
    outerLift: -0.7,
    brightnessPeak: 1.07,
    actionMaxScale: 1.20,
    actionCenterLift: -3.0,
    actionAdjacentScale: 1.10,
    actionAdjacentLift: -1.5,
    actionOuterScale: 1.03,
    actionOuterLift: -0.5,
  },
  topControls: {
    hoverScale: 1.05,
    tapScale: 0.95,
    stiffness: 480,
    damping: 32,
  },
  toast: {
    stiffness: 450,
    damping: 30,
  }
};
