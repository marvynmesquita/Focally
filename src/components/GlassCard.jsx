import React from 'react';

const GlassCard = ({ children, className = '', onClick, hoverEffect = false }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        glass-panel rounded-3xl p-8 
        ${hoverEffect ? 'cursor-pointer hover:bg-white-[0.03] hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(13,148,136,0.15)]' : ''}
        transition-all duration-300 ease-out
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default GlassCard;
