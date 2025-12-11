import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-surface border border-slate-700/50 rounded-2xl p-4 shadow-xl ${onClick ? 'cursor-pointer hover:border-indigo-500/50 transition-colors' : ''} ${className}`}
    >
      {children}
    </div>
  );
};