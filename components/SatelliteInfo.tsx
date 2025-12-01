import React from 'react';
import { X, Activity, Navigation, Maximize2, Gauge } from 'lucide-react';
import { SatelliteObject } from '../types';
import { getSatelliteInfo } from '../utils';

interface SatelliteInfoProps {
  satellite: SatelliteObject | null;
  currentDate: Date;
  onClose: () => void;
}

const SatelliteInfo: React.FC<SatelliteInfoProps> = ({ satellite, currentDate, onClose }) => {
  if (!satellite) return null;

  const info = getSatelliteInfo(satellite.satrec, currentDate);

  return (
    <div className="absolute top-20 right-4 bg-gray-900/90 backdrop-blur-md border border-gray-700 p-5 rounded-xl shadow-2xl z-50 w-72 text-white animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex justify-between items-start mb-4 border-b border-gray-700 pb-2">
        <div>
          <h2 className="text-lg font-bold text-blue-400">{satellite.name}</h2>
          <p className="text-xs text-gray-400 font-mono">ID: {satellite.id}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition">
          <X size={20} />
        </button>
      </div>

      {!info ? (
         <div className="text-red-400 text-sm">Signal Lost (Decayed?)</div>
      ) : (
        <div className="space-y-4">
           <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
              <Navigation size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-400">Position</p>
              <p className="font-mono text-sm">
                {info.latitude.toFixed(2)}°, {info.longitude.toFixed(2)}°
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-green-500/20 p-2 rounded-lg text-green-400">
              <Maximize2 size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-400">Altitude</p>
              <p className="font-mono text-sm">{info.height.toFixed(2)} km</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-purple-500/20 p-2 rounded-lg text-purple-400">
              <Gauge size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-400">Velocity</p>
              <p className="font-mono text-sm">{info.velocity.toFixed(2)} km/s</p>
            </div>
          </div>

           <div className="flex items-center gap-3">
            <div className="bg-orange-500/20 p-2 rounded-lg text-orange-400">
              <Activity size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-400">Status</p>
              <p className="font-mono text-sm text-green-400">Active - Tracking</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SatelliteInfo;