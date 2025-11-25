import React from 'react';

const GlassCard = ({ children, className = '', onClick, hoverEffect = false }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        glass-panel rounded-3xl p-8 
        ${hoverEffect ? 'cursor-pointer hover:bg-white/15 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(0,242,255,0.1)]' : ''}
        transition-all duration-300 ease-out
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default GlassCard;
