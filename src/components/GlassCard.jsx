import React from 'react';

const GlassCard = ({ children, className = '', onClick, hoverEffect = false }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        glass-panel rounded-3xl p-8 
        ${hoverEffect ? 'cursor-pointer hover:bg-white/[0.03] hover:-translate-y-1 hover:shadow-[0_10px_40px_-5px_rgba(83,58,253,0.25)]' : ''}
        transition-all duration-300 ease-out
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default GlassCard;
