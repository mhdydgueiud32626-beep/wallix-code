import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GripHorizontal, Maximize2, X, Move, ArrowUpRight } from 'lucide-react';
import { WidgetId, WidgetLayoutItem, AlignmentGuide } from '../../desktop/types';

interface DraggableWidgetWrapperProps {
  item: WidgetLayoutItem;
  isLocked: boolean;
  snapToGrid?: boolean;
  gridSize?: number;
  otherItems?: WidgetLayoutItem[];
  onPositionChange: (id: WidgetId, x: number, y: number) => void;
  onSizeChange: (id: WidgetId, w: number, h: number) => void;
  onBringToFront: (id: WidgetId) => void;
  onClose?: () => void;
  onAlignmentGuidesChange?: (guides: AlignmentGuide[]) => void;
  children: React.ReactNode;
}

export const DraggableWidgetWrapper: React.FC<DraggableWidgetWrapperProps> = ({
  item,
  isLocked,
  snapToGrid = true,
  gridSize = 15,
  otherItems = [],
  onPositionChange,
  onSizeChange,
  onBringToFront,
  onClose,
  onAlignmentGuidesChange,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState<{ startX: number; startY: number; startW: number; startH: number }>({
    startX: 0,
    startY: 0,
    startW: item.w,
    startH: item.h,
  });

  // Calculate Alignment Guides & Snapping
  const calculateSnappingAndGuides = useCallback(
    (targetX: number, targetY: number, targetW: number, targetH: number) => {
      let finalX = targetX;
      let finalY = targetY;
      const guides: AlignmentGuide[] = [];
      const snapThreshold = 10;

      // 1. Grid Snapping
      if (snapToGrid) {
        finalX = Math.round(finalX / gridSize) * gridSize;
        finalY = Math.round(finalY / gridSize) * gridSize;
      }

      // 2. Alignment with Viewport Edges & Center
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const viewportMargin = 24;

      // Screen Left
      if (Math.abs(finalX - viewportMargin) < snapThreshold) {
        finalX = viewportMargin;
        guides.push({ type: 'vertical', position: viewportMargin, label: 'Margin (24px)' });
      }
      // Screen Top
      if (Math.abs(finalY - viewportMargin) < snapThreshold) {
        finalY = viewportMargin;
        guides.push({ type: 'horizontal', position: viewportMargin, label: 'Margin (24px)' });
      }
      // Screen Center Vertical
      const centerX = Math.round(vw / 2 - targetW / 2);
      if (Math.abs(finalX - centerX) < snapThreshold) {
        finalX = centerX;
        guides.push({ type: 'vertical', position: Math.round(vw / 2), label: 'Screen Center' });
      }

      // 3. Alignment with Other Active Widgets
      for (const other of otherItems) {
        if (other.id === item.id) continue;

        // Vertical Alignment: Left-to-Left, Right-to-Right, Left-to-Right
        // Left align
        if (Math.abs(finalX - other.x) < snapThreshold) {
          finalX = other.x;
          guides.push({ type: 'vertical', position: other.x, label: `Align Left: ${other.name}` });
        }
        // Right align
        else if (Math.abs(finalX + targetW - (other.x + other.w)) < snapThreshold) {
          finalX = other.x + other.w - targetW;
          guides.push({ type: 'vertical', position: other.x + other.w, label: `Align Right: ${other.name}` });
        }
        // Snag to right side of other
        else if (Math.abs(finalX - (other.x + other.w + 15)) < snapThreshold) {
          finalX = other.x + other.w + 15;
          guides.push({ type: 'vertical', position: finalX, label: `15px Gap: ${other.name}` });
        }

        // Horizontal Alignment: Top-to-Top, Bottom-to-Bottom, Top-to-Bottom
        // Top align
        if (Math.abs(finalY - other.y) < snapThreshold) {
          finalY = other.y;
          guides.push({ type: 'horizontal', position: other.y, label: `Align Top: ${other.name}` });
        }
        // Bottom align
        else if (Math.abs(finalY + targetH - (other.y + other.h)) < snapThreshold) {
          finalY = other.y + other.h - targetH;
          guides.push({ type: 'horizontal', position: other.y + other.h, label: `Align Bottom: ${other.name}` });
        }
        // Snag below other with 15px gap
        else if (Math.abs(finalY - (other.y + other.h + 15)) < snapThreshold) {
          finalY = other.y + other.h + 15;
          guides.push({ type: 'horizontal', position: finalY, label: `15px Stack Gap: ${other.name}` });
        }
      }

      // 4. Viewport Boundary Clamp
      finalX = Math.max(8, Math.min(vw - targetW - 8, finalX));
      finalY = Math.max(8, Math.min(vh - targetH - 8, finalY));

      return { x: finalX, y: finalY, guides };
    },
    [snapToGrid, gridSize, otherItems, item.id]
  );

  // START DRAG
  const handlePointerDownDrag = (e: React.PointerEvent) => {
    if (isLocked) return;
    // Don't drag if clicking buttons/inputs/selects
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('a')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    onBringToFront(item.id);

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - item.x,
      y: e.clientY - item.y,
    });

    if (containerRef.current) {
      containerRef.current.setPointerCapture(e.pointerId);
    }
  };

  // START RESIZE
  const handlePointerDownResize = (e: React.PointerEvent) => {
    if (isLocked) return;
    e.preventDefault();
    e.stopPropagation();
    onBringToFront(item.id);

    setIsResizing(true);
    setResizeStart({
      startX: e.clientX,
      startY: e.clientY,
      startW: item.w,
      startH: item.h,
    });

    if (containerRef.current) {
      containerRef.current.setPointerCapture(e.pointerId);
    }
  };

  // POINTER MOVE (DRAG & RESIZE)
  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      const rawX = e.clientX - dragOffset.x;
      const rawY = e.clientY - dragOffset.y;

      const { x, y, guides } = calculateSnappingAndGuides(rawX, rawY, item.w, item.h);
      onPositionChange(item.id, x, y);

      if (onAlignmentGuidesChange) {
        onAlignmentGuidesChange(guides);
      }
    } else if (isResizing) {
      const deltaX = e.clientX - resizeStart.startX;
      const deltaY = e.clientY - resizeStart.startY;

      let newW = resizeStart.startW + deltaX;
      let newH = resizeStart.startH + deltaY;

      if (snapToGrid) {
        newW = Math.round(newW / gridSize) * gridSize;
        newH = Math.round(newH / gridSize) * gridSize;
      }

      // Enforce Min/Max Constraints
      newW = Math.max(item.minW, Math.min(item.maxW || 800, newW));
      newH = Math.max(item.minH, Math.min(item.maxH || 800, newH));

      // Viewport bounds
      const maxAvailableW = window.innerWidth - item.x - 16;
      const maxAvailableH = window.innerHeight - item.y - 16;
      newW = Math.min(newW, maxAvailableW);
      newH = Math.min(newH, maxAvailableH);

      onSizeChange(item.id, newW, newH);

      if (onAlignmentGuidesChange) {
        onAlignmentGuidesChange([]);
      }
    }
  };

  // POINTER UP / CANCEL
  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging || isResizing) {
      setIsDragging(false);
      setIsResizing(false);

      if (onAlignmentGuidesChange) {
        onAlignmentGuidesChange([]);
      }

      try {
        if (containerRef.current && containerRef.current.hasPointerCapture(e.pointerId)) {
          containerRef.current.releasePointerCapture(e.pointerId);
        }
      } catch (err) {
        // Safe ignore
      }
    }
  };

  return (
    <div
      ref={containerRef}
      id={`draggable-widget-${item.id}`}
      onPointerDown={() => onBringToFront(item.id)}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        transform: `translate3d(${item.x}px, ${item.y}px, 0)`,
        width: `${item.w}px`,
        height: `${item.h}px`,
        zIndex: item.zIndex,
      }}
      className={`absolute top-0 left-0 transition-shadow select-none group/widget ${
        isLocked
          ? 'pointer-events-auto cursor-default'
          : `pointer-events-auto rounded-3xl ${
              isDragging
                ? 'cursor-grabbing ring-2 ring-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.6)] z-50'
                : isResizing
                ? 'cursor-nwse-resize ring-2 ring-pink-400 shadow-[0_0_25px_rgba(244,114,182,0.6)] z-50'
                : 'cursor-grab ring-1 ring-cyan-400/40 hover:ring-2 hover:ring-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
            }`
      }`}
    >
      {/* UNLOCKED EDIT MODE: TOP DRAG HEADER BAR */}
      {!isLocked && (
        <div
          onPointerDown={handlePointerDownDrag}
          className="absolute -top-7 left-0 right-0 h-6 px-2 rounded-t-xl bg-slate-950/90 backdrop-blur-xl border-t border-x border-cyan-400/50 flex items-center justify-between text-white text-[10px] z-30 cursor-grab active:cursor-grabbing select-none"
        >
          <div className="flex items-center gap-1 font-mono font-bold text-cyan-300">
            <GripHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="truncate max-w-[90px]">{item.name}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Live Coords Badge */}
            <span className="text-[8.5px] font-mono text-slate-400 hidden sm:inline">
              {Math.round(item.x)},{Math.round(item.y)} ({Math.round(item.w)}×{Math.round(item.h)})
            </span>

            {/* Bring to Front */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBringToFront(item.id);
              }}
              className="p-0.5 rounded hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 transition"
              title="Bring to Front"
            >
              <ArrowUpRight className="w-3 h-3" />
            </button>

            {/* Close / Hide Widget */}
            {onClose && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-0.5 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition"
                title="Hide Widget"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* WIDGET CONTENT CONTAINER */}
      <div 
        className={`w-full h-full relative overflow-hidden ${
          !isLocked ? 'rounded-2xl border border-dashed border-cyan-400/40 bg-black/20 backdrop-blur-sm' : ''
        }`}
      >
        {children}
      </div>

      {/* UNLOCKED EDIT MODE: BOTTOM-RIGHT RESIZE HANDLE `⋰` */}
      {!isLocked && (
        <div
          onPointerDown={handlePointerDownResize}
          className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center cursor-nwse-resize shadow-[0_0_12px_rgba(6,182,212,0.9)] z-40 transition-transform hover:scale-125 select-none"
          title="Drag to resize widget (15px snap grid)"
        >
          {/* Subtle resize glyph ⋰ */}
          <span className="text-[12px] font-mono font-black leading-none select-none pointer-events-none">
            ⋰
          </span>
        </div>
      )}
    </div>
  );
};
