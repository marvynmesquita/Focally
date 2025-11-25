import React from 'react';

const BinauralSelector = ({ selected, onSelect, options }) => {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onSelect(option.value)}
          className={`
            px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
            border
            ${selected === option.value 
              ? 'bg-neon-cyan/20 border-neon-cyan text-white shadow-[0_0_15px_rgba(0,242,255,0.3)]' 
              : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/30'}
          `}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default BinauralSelector;
