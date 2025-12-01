import React, { useState } from 'react';
import { Play, Pause, FastForward, Rewind, Eye, EyeOff, RotateCw, Database, Activity } from 'lucide-react';
import { SimulationState } from '../types';

interface ControlsProps {
  state: SimulationState;
  setState: React.Dispatch<React.SetStateAction<SimulationState>>;
  onImportTLE: (raw: string) => void;
}

const Controls: React.FC<ControlsProps> = ({ state, setState, onImportTLE }) => {
  const [activeTab, setActiveTab] = useState<'sim' | 'data'>('sim');
  const [tleInput, setTleInput] = useState('');

  const togglePause = () => setState(s => ({ ...s, paused: !s.paused }));
  
  const changeSpeed = (factor: number) => {
    setState(s => {
       let newSpeed = s.speed * factor;
       if (Math.abs(newSpeed) < 1) newSpeed = Math.sign(newSpeed) || 1;
       return { ...s, speed: newSpeed };
    });
  };

  const toggleLinks = () => setState(s => ({ ...s, showLinks: !s.showLinks }));
  const resetTime = () => setState(s => ({...s, date: new Date(), speed: 1, paused: false}));

  const handleImportClick = () => {
    if (tleInput.trim()) {
      onImportTLE(tleInput);
      setTleInput('');
      setActiveTab('sim');
    }
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-md border border-gray-700 p-1 rounded-2xl flex flex-col text-white shadow-2xl z-50 min-w-[340px] animate-in slide-in-from-bottom-4 duration-300">
      
      {/* Tab Switcher */}
      <div className="flex bg-gray-950/50 rounded-xl p-1 mb-2">
        <button 
          onClick={() => setActiveTab('sim')}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-lg transition ${activeTab === 'sim' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
        >
          <Activity size={14} /> Simulation
        </button>
        <button 
          onClick={() => setActiveTab('data')}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-lg transition ${activeTab === 'data' ? 'bg-blue-900/40 text-blue-200 shadow border border-blue-800/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
        >
          <Database size={14} /> Data Sources
        </button>
      </div>

      <div className="px-3 pb-3">
        {activeTab === 'sim' ? (
          <div className="flex flex-col gap-3">
            {/* Info Header */}
            <div className="flex justify-between items-center text-xs text-gray-400 font-mono border-b border-gray-700/50 pb-2">
              <span>{state.date.toISOString().split('.')[0].replace('T', ' ')} UTC</span>
              <span>{state.speed}x Speed</span>
            </div>

            {/* Media Controls */}
            <div className="flex justify-center gap-4 items-center">
              <button onClick={() => changeSpeed(0.5)} className="hover:text-blue-400 transition" title="Slow Down"><Rewind size={20} /></button>
              <button 
                onClick={togglePause} 
                className="bg-blue-600 hover:bg-blue-500 p-3 rounded-full shadow-lg shadow-blue-900/20 transition hover:scale-105 active:scale-95"
                title={state.paused ? "Play" : "Pause"}
              >
                {state.paused ? <Play fill="currentColor" size={20} /> : <Pause fill="currentColor" size={20} />}
              </button>
              <button onClick={() => changeSpeed(2)} className="hover:text-blue-400 transition" title="Speed Up"><FastForward size={20} /></button>
              <button onClick={resetTime} className="hover:text-red-400 transition ml-2" title="Reset to Now"><RotateCw size={16} /></button>
            </div>

            {/* Toggles */}
            <div className="flex justify-center gap-2 mt-1">
              <button 
                onClick={toggleLinks} 
                className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition ${state.showLinks ? 'bg-cyan-900/30 text-cyan-300 border border-cyan-800/50' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                {state.showLinks ? <Eye size={14} /> : <EyeOff size={14} />}
                Optical Links
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
             <div className="text-xs text-gray-400">
               Paste TLE data (3-line or 2-line format) below to update the visualization.
             </div>
             <textarea 
               className="w-full h-32 bg-gray-950 border border-gray-700 rounded-lg p-2 text-[10px] font-mono text-gray-300 focus:outline-none focus:border-blue-500 resize-none"
               placeholder={`Startlink-1\n1 00001U...\n2 00001...`}
               value={tleInput}
               onChange={(e) => setTleInput(e.target.value)}
             />
             <button 
               onClick={handleImportClick}
               disabled={!tleInput.trim()}
               className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2 rounded-lg transition shadow-lg"
             >
               Load TLE Data
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Controls;