import React from 'react';

const VolumeSlider = ({ value, onChange, label, icon, disabled = false }) => {
  return (
    <div className="w-full mb-6">
      <div className="flex items-center justify-between mb-2 text-gray-300">
        <label className="text-sm font-medium flex items-center gap-2">
          {icon && <span className="text-accent-primary">{icon}</span>}
          {label}
        </label>
        <span className="text-xs font-mono text-gray-500">{Math.round(value * 100)}%</span>
      </div>
      <div className="relative h-6 flex items-center">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="w-full z-10 opacity-0 cursor-pointer"
        />
        {/* Custom Track */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 rounded-full transform -translate-y-1/2 overflow-hidden">
          <div 
            className="h-full bg-accent-primary opacity-90"
            style={{ width: `${value * 100}%` }}
          />
        </div>
        {/* Custom Thumb */}
        <div 
          className="absolute top-1/2 h-4 w-4 bg-white rounded-full shadow-[0_0_10px_rgba(83,58,253,0.6)] transform -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-all duration-100"
          style={{ left: `${value * 100}%` }}
        />
      </div>
    </div>
  );
};

export default VolumeSlider;
