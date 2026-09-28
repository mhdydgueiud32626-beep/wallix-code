import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { STATUS_GLASS_TOKENS } from './statusTokens';

interface StatusPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  width?: number;
  rightOffset?: number;
  arrowOffset?: number;
  children: React.ReactNode;
  className?: string;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export const StatusPopover: React.FC<StatusPopoverProps> = ({
  isOpen,
  onClose,
  width = 310,
  rightOffset,
  arrowOffset,
  children,
  className = '',
  triggerRef,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState<{
    right: number;
    arrowRight: number;
    width: number;
  }>({
    right: rightOffset ?? 8,
    arrowRight: arrowOffset ?? 24,
    width: typeof width === 'number' ? width : 310,
  });

  // Calculate anchored trigger positioning dynamically
  useEffect(() => {
    if (!isOpen) return;

    const calculatePosition = () => {
      const viewportWidth = window.innerWidth;
      const targetWidth = Math.min(width, Math.max(260, viewportWidth - 24));

      if (triggerRef?.current && popoverRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const parent = (popoverRef.current.offsetParent as HTMLElement) || popoverRef.current.parentElement;

        if (parent) {
          const parentRect = parent.getBoundingClientRect();
          const triggerCenterX = triggerRect.left + triggerRect.width / 2;
          const triggerFromParentRight = parentRect.right - triggerCenterX;

          // Ideal placement: center popover over trigger button
          const idealRight = triggerFromParentRight - targetWidth / 2;

          // Clamping bounds to stay completely within viewport with comfortable margins
          const minRight = Math.max(0, parentRect.right - (viewportWidth - 10));
          const maxRight = Math.max(minRight, parentRect.right - 12 - targetWidth);
          const clampedRight = Math.max(minRight, Math.min(maxRight, idealRight));

          // Position the top arrow pointer precisely over the trigger center
          const rawArrowRight = triggerFromParentRight - clampedRight;
          const clampedArrowRight = Math.max(16, Math.min(targetWidth - 20, rawArrowRight));

          setPosition({
            right: clampedRight,
            arrowRight: clampedArrowRight,
            width: targetWidth,
          });
          return;
        }
      }

      // Default fallback
      setPosition({
        right: rightOffset ?? 8,
        arrowRight: arrowOffset ?? 24,
        width: targetWidth,
      });
    };

    calculatePosition();
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition);

    return () => {
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition);
    };
  }, [isOpen, triggerRef, width, rightOffset, arrowOffset]);

  // Close on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current && 
        !popoverRef.current.contains(target) &&
        (!triggerRef?.current || !triggerRef.current.contains(target))
      ) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isOpen, onClose, triggerRef]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, scale: 0.96, y: -5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -3, transition: { duration: 0.14 } }}
          transition={STATUS_GLASS_TOKENS.panelSpring}
          style={{
            width: `${position.width}px`,
            right: `${position.right}px`,
            maxWidth: 'calc(100vw - 20px)',
          }}
          className={`absolute top-full mt-2 z-50 overflow-hidden box-border ${STATUS_GLASS_TOKENS.panelContainer} ${className}`}
        >
          {/* Subtle Top Notch / Arrow Pointer with Liquid Glass Translucency */}
          <div 
            style={{ right: `${position.arrowRight}px` }}
            className="absolute -top-1.5 w-3 h-3 bg-white/76 dark:bg-[#1c2028]/76 backdrop-blur-2xl border-t border-l border-white/60 dark:border-white/15 rotate-45 pointer-events-none rounded-tl-sm shadow-sm z-20"
          />

          {/* Popover Content */}
          <div className="relative z-10 p-3.5 sm:p-4 text-slate-800 dark:text-slate-100 box-border w-full min-w-0">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
