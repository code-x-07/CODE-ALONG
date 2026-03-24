import clsx from 'clsx';
import React from 'react';

interface VideoBubblesProps {
  className?: string;
  stacked?: boolean; // If true, first bubble has -margin-right (overlap). If false, no overlap.
}

export const VideoBubbles = React.memo(function VideoBubbles({ className, stacked = true }: VideoBubblesProps) {
  return (
    <div className={clsx("flex items-center justify-center pointer-events-none", className)}>
      {/* User Bubble (Green) */}
      <div 
        className={clsx(
          "relative w-20 h-20 rounded-full border-2 border-neon-green shadow-[0_0_15px_rgba(57,255,20,0.5)] overflow-hidden bg-black z-20 will-change-transform",
          stacked && "mr-[-20px]"
        )}
        style={{ animation: 'fadeInScale 0.3s ease-out' }}
      >
        <img 
          src="https://images.unsplash.com/photo-1612180767923-91c5b42d84dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjeWJlcnB1bmslMjBoYWNrZXIlMjBhdmF0YXIlMjBuZW9ufGVufDF8fHx8MTc3MTY4MjM1MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" 
          alt="You" 
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-neon-green font-bold backdrop-blur-sm">
          You
        </div>
      </div>

      {/* Koala Bubble (Pink) */}
      <div 
        className="relative w-20 h-20 rounded-full border-2 border-neon-pink shadow-[0_0_15px_rgba(255,20,147,0.5)] overflow-hidden bg-black z-10 will-change-transform"
        style={{ animation: 'fadeInScale 0.3s ease-out 0.1s backwards' }}
      >
        <img 
          src="https://images.unsplash.com/photo-1530739130845-c4121d38e013?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrb2FsYSUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MTY4MjM1MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" 
          alt="Koala" 
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-neon-pink font-bold backdrop-blur-sm">
          koala
        </div>
      </div>
    </div>
  );
});