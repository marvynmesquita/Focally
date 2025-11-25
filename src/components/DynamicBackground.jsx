import { useEffect, useRef } from 'react';

const DynamicBackground = ({ active }) => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[#1a0b2e]"></div>
      
      {/* Orb 1 - Cyan */}
      <div className={`
        absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full 
        bg-neon-cyan/20 blur-[100px] animate-blob mix-blend-screen
        transition-all duration-1000
        ${active ? 'opacity-40 scale-110' : 'opacity-20 scale-100'}
      `}></div>

      {/* Orb 2 - Magenta */}
      <div className={`
        absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full 
        bg-neon-magenta/20 blur-[100px] animate-blob animation-delay-2000 mix-blend-screen
        transition-all duration-1000
        ${active ? 'opacity-40 scale-110' : 'opacity-20 scale-100'}
      `}></div>

      {/* Orb 3 - Deep Blue/Purple (Bottom) */}
      <div className={`
        absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] rounded-full 
        bg-blue-600/20 blur-[120px] animate-blob animation-delay-4000 mix-blend-screen
        transition-all duration-1000
        ${active ? 'opacity-50 scale-110' : 'opacity-30 scale-100'}
      `}></div>


    </div>
  );
};

export default DynamicBackground;
