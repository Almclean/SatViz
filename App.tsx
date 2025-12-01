import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

import { SAMPLE_TLES } from './constants';
import { parseTLEs, parseRawTLEString } from './utils';
import { SimulationState, SatelliteObject } from './types';

import Earth from './components/Earth';
import Satellites from './components/Satellites';
import Controls from './components/Controls';
import SatelliteInfo from './components/SatelliteInfo';
import SelectedMarker from './components/SelectedMarker';

// Component to handle simulation loop logic outside of the React render cycle
const SimulationLoop = ({ 
  state, 
  onTimeUpdate 
}: { 
  state: SimulationState, 
  onTimeUpdate: (d: Date) => void 
}) => {
  useFrame((_, delta) => {
    if (!state.paused) {
      // Calculate new time: current + (delta_seconds * 1000ms * speed_multiplier)
      const newTime = new Date(state.date.getTime() + delta * 1000 * state.speed);
      onTimeUpdate(newTime);
    }
  });
  return null;
};

function App() {
  const [satelliteData, setSatelliteData] = useState(() => parseTLEs(SAMPLE_TLES));
  const [selectedSatellite, setSelectedSatellite] = useState<SatelliteObject | null>(null);
  
  const [simState, setSimState] = useState<SimulationState>({
    date: new Date(),
    speed: 1,
    paused: false,
    showLinks: true,
  });

  const handleTimeUpdate = (newDate: Date) => {
    setSimState(prev => ({ ...prev, date: newDate }));
  };

  const handleImportTLE = (raw: string) => {
    try {
      const parsedTles = parseRawTLEString(raw);
      if (parsedTles.length > 0) {
        const newSatellites = parseTLEs(parsedTles);
        setSatelliteData(newSatellites);
        setSelectedSatellite(null); // Clear selection as IDs might change
        console.log(`Imported ${newSatellites.length} satellites.`);
      } else {
        alert("No valid TLE data found in input.");
      }
    } catch (e) {
      console.error("Failed to parse TLE", e);
      alert("Error parsing TLE data.");
    }
  };

  return (
    <div className="relative w-full h-screen bg-black">
      
      {/* 3D Scene */}
      <Canvas camera={{ position: [0, 2, 4], fov: 45 }}>
        <color attach="background" args={['#050510']} />
        
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 3, 5]} intensity={2.5} />
        <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <SimulationLoop state={simState} onTimeUpdate={handleTimeUpdate} />

        <group>
          <Earth currentDate={simState.date} />
          <Satellites 
            data={satelliteData} 
            currentDate={simState.date} 
            showLinks={simState.showLinks}
            selectedSatellite={selectedSatellite}
            onSatelliteClick={setSelectedSatellite}
          />
          <SelectedMarker satellite={selectedSatellite} currentDate={simState.date} />
        </group>
        
        <OrbitControls 
          enablePan={false} 
          minDistance={1.5} 
          maxDistance={10} 
          zoomSpeed={0.6}
          rotateSpeed={0.5}
        />
      </Canvas>

      {/* UI Layer */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">
          Orbital<span className="text-blue-400">Link</span> Viz
        </h1>
        <p className="text-sm text-gray-400 mt-1 max-w-xs">
          Visualizing {satelliteData.length} satellites and real-time optical cross-links.
        </p>
      </div>

      <SatelliteInfo 
        satellite={selectedSatellite} 
        currentDate={simState.date} 
        onClose={() => setSelectedSatellite(null)} 
      />

      <Controls 
        state={simState} 
        setState={setSimState} 
        onImportTLE={handleImportTLE}
      />
    </div>
  );
}

export default App;