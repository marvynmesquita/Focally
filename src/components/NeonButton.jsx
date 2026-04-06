import React from 'react';

const NeonButton = ({ children, onClick, variant = 'primary', className = '', disabled = false }) => {
  const baseStyles = "px-8 py-3 rounded-full font-medium transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-accent-primary text-white border border-transparent shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:bg-accent-secondary hover:shadow-[0_6px_20px_rgba(13,148,136,0.23)]",
    secondary: "bg-transparent text-gray-300 hover:text-white border border-transparent hover:bg-white/5",
    danger: "bg-red-500/10 text-red-200 border border-red-500/20 hover:bg-red-500/20"
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default NeonButton;
