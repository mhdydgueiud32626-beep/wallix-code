import React from 'react';
import { motion } from 'motion/react';
import { STATUS_GLASS_TOKENS } from './statusTokens';

interface StatusButtonProps {
  id: string;
  isActive?: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  title: string;
  ariaLabel: string;
  children: React.ReactNode;
  className?: string;
}

export const StatusButton: React.FC<StatusButtonProps> = ({
  id,
  isActive = false,
  onClick,
  title,
  ariaLabel,
  children,
  className = '',
}) => {
  return (
    <motion.button
      id={id}
      type="button"
      aria-label={ariaLabel}
      aria-expanded={isActive}
      title={title}
      onClick={onClick}
      whileHover={{ 
        scale: 1.05, 
        backgroundColor: isActive ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.12)' 
      }}
      whileTap={{ scale: 0.95 }}
      transition={STATUS_GLASS_TOKENS.buttonSpring}
      className={`relative px-2 py-1 rounded-md text-white/90 hover:text-white transition-colors duration-150 flex items-center justify-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
        isActive 
          ? 'bg-white/20 text-white shadow-sm ring-1 ring-white/30' 
          : 'bg-transparent'
      } ${className}`}
    >
      {children}
    </motion.button>
  );
};
