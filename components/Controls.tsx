import React from 'react';
import { Play, Pause, FastForward, Rewind, Eye, EyeOff, Satellite, RotateCw } from 'lucide-react';
import { SimulationState } from '../types';

interface ControlsProps {
  state: SimulationState;
  setState: React.Dispatch<React.SetStateAction<SimulationState>>;
}

const Controls: React.FC<ControlsProps> = ({ state, setState }) => {
  
  const togglePause = () => setState(s => ({ ...s, paused: !s.paused }));
  
  const changeSpeed = (factor: number) => {
    setState(s => {
       let newSpeed = s.speed * factor;
       if (Math.abs(newSpeed) < 1) newSpeed = Math.sign(newSpeed) || 1;
       return { ...s, speed: newSpeed };
    });
  };

  const toggleLinks = () => setState(s => ({ ...s, showLinks: !s.showLinks }));
  const toggleOrbits = () => setState(s => ({ ...s, showOrbits: !s.showOrbits }));

  const resetTime = () => setState(s => ({...s, date: new Date(), speed: 1, paused: false}));

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/80 backdrop-blur-md border border-gray-700 p-4 rounded-2xl flex flex-col gap-3 text-white shadow-2xl z-50 min-w-[320px]">
      
      {/* Info Header */}
      <div className="flex justify-between items-center text-xs text-gray-400 font-mono border-b border-gray-700 pb-2">
        <span>{state.date.toISOString().split('.')[0].replace('T', ' ')} UTC</span>
        <span>{state.speed}x Speed</span>
      </div>

      {/* Media Controls */}
      <div className="flex justify-center gap-4 items-center">
        <button onClick={() => changeSpeed(0.5)} className="hover:text-blue-400 transition" title="Slow Down"><Rewind size={20} /></button>
        <button 
          onClick={togglePause} 
          className="bg-blue-600 hover:bg-blue-500 p-3 rounded-full shadow-lg transition"
          title={state.paused ? "Play" : "Pause"}
        >
          {state.paused ? <Play fill="currentColor" size={20} /> : <Pause fill="currentColor" size={20} />}
        </button>
        <button onClick={() => changeSpeed(2)} className="hover:text-blue-400 transition" title="Speed Up"><FastForward size={20} /></button>
        <button onClick={resetTime} className="hover:text-red-400 transition ml-2" title="Reset to Now"><RotateCw size={16} /></button>
      </div>

      {/* Toggles */}
      <div className="flex justify-between gap-2 mt-1">
        <button 
          onClick={toggleLinks} 
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition ${state.showLinks ? 'bg-cyan-900/50 text-cyan-300 border border-cyan-700' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
        >
          {state.showLinks ? <Eye size={16} /> : <EyeOff size={16} />}
          Links
        </button>
        <button 
          onClick={toggleOrbits} 
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition ${state.showOrbits ? 'bg-purple-900/50 text-purple-300 border border-purple-700' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
        >
          <Satellite size={16} />
          Orbits
        </button>
      </div>
    </div>
  );
};

export default Controls;