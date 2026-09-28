# WALLIX Persistent Agent Rules & Architecture Directives

## 1. Locked Software-First Environment Directive
- **SOFTWARE-ONLY INTERFACE**: WALLIX is strictly a visual software customization environment. It must **NEVER** simulate physical laptop hardware, laptop bezels, chasses, monitor stands/chins, webcams, camera notches, or hardware LEDs.
- **FULL-BLEED WALLPAPER**: The wallpaper canvas must always extend continuously and seamlessly to the absolute top edge of the viewport container (`top: 0px`).
- **FLOATING SOFTWARE CONTROLS**: Top status indicators (battery, search, control center, clock, and live-sync health) must always float over the continuous wallpaper layer as lightweight software UI with translucent glass/gradient styling, without reserving a dark hardware spacer.
- **NO HARDWARE CONTROLS**: Do not add hardware bezel thickness sliders, physical camera toggles, or device body simulators.

## 2. Core Systems to Preserve
- **Native App Discovery & Bridge**: Preserve `AppDiscoveryService`, `NativeAppStorage`, and bridge communications.
- **Centralized Motion & Physics**: Maintain `WALLIX_MOTION_CONFIG` in `src/config/wallixMotionConfig.ts` as the single source of truth for spring curves, damping, and magnification physics.
- **Live WYSIWYG Single Source of Truth**: Fullscreen previews (`DesktopSimulatorModal`) and target customizer workspaces mount production components directly (`EnvironmentAppearance`, `WindowsDesktopCanvas`) with error isolation via `LivePreviewErrorBoundary`.
