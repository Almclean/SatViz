
import React, { useEffect, useRef } from 'react';
import { addEffect } from '@react-three/fiber';

const FPSCounter: React.FC = () => {
  const fpsRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();

    // Subscribe to R3F's global render loop
    const unsubscribe = addEffect(() => {
      frameCount++;
      const time = performance.now();
      
      // Update every 500ms
      if (time >= lastTime + 500) { 
        const fps = Math.round((frameCount * 1000) / (time - lastTime));
        
        if (fpsRef.current) {
          fpsRef.current.innerText = fps.toString();
          
          // Dynamic coloring
          if (fps >= 50) {
            fpsRef.current.className = "text-sm font-bold font-mono text-green-400 w-8 text-right";
          } else if (fps >= 30) {
             fpsRef.current.className = "text-sm font-bold font-mono text-yellow-400 w-8 text-right";
          } else {
             fpsRef.current.className = "text-sm font-bold font-mono text-red-400 w-8 text-right";
          }
        }
        
        frameCount = 0;
        lastTime = time;
      }
    });

    return unsubscribe;
  }, []);

  return (
    <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-gray-900/80 backdrop-blur-md border border-gray-700 px-3 py-1.5 rounded-lg shadow-lg pointer-events-none select-none animate-in fade-in duration-500">
      <div className="text-[10px] font-bold text-gray-500 tracking-wider">FPS</div>
      <span ref={fpsRef} className="text-sm font-bold font-mono text-green-400 w-8 text-right">--</span>
    </div>
  );
};

export default FPSCounter;
