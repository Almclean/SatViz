import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SatelliteObject } from '../types';
import { getSatellitePosition } from '../utils';

interface SelectedMarkerProps {
  satellite: SatelliteObject | null;
  currentDate: Date;
}

const SelectedMarker: React.FC<SelectedMarkerProps> = ({ satellite, currentDate }) => {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!meshRef.current || !satellite) return;

    const pos = getSatellitePosition(satellite.satrec, currentDate);
    if (pos) {
      meshRef.current.position.set(pos[0], pos[1], pos[2]);
      
      // Make the marker face the camera
      meshRef.current.lookAt(state.camera.position);

      // Simple pulsating scale effect
      const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.2;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  if (!satellite) return null;

  return (
    <group ref={meshRef}>
      {/* Outer Ring */}
      <mesh>
        <ringGeometry args={[0.04, 0.045, 32]} />
        <meshBasicMaterial color="#ffaa00" side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>
      
      {/* Inner Crosshair */}
      <mesh rotation={[0, 0, Math.PI / 4]}>
         <ringGeometry args={[0.02, 0.025, 4]} />
         <meshBasicMaterial color="#ffaa00" side={THREE.DoubleSide} transparent opacity={0.6} />
      </mesh>
    </group>
  );
};

export default SelectedMarker;