import React from 'react';
import { motion } from 'motion/react';

interface RitualStepProps {
  step: number;
  currentStep: number;
  children: React.ReactNode;
  className?: string;
}

export const RitualStep: React.FC<RitualStepProps> = ({ step, currentStep, children, className = "" }) => {
  if (step !== currentStep) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: 20 }}
      className={`flex flex-col flex-1 items-center justify-center p-8 pointer-events-none ${className}`}
    >
      {children}
    </motion.div>
  );
};
