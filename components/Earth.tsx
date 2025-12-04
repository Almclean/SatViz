
import React, { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import * as THREE from 'three';
import { getGMST } from '../utils';

interface EarthProps {
  currentDate: Date;
}

const Earth: React.FC<EarthProps> = ({ currentDate }) => {
  const earthRef = useRef<THREE.Group>(null);
  
  // High res textures
  const [colorMap, bumpMap, specMap, cloudsMap] = useLoader(TextureLoader, [
    'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
    'https://unpkg.com/three-globe/example/img/earth-topology.png',
    'https://unpkg.com/three-globe/example/img/earth-water.png',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png'
  ]);

  useFrame(() => {
    if (earthRef.current) {
      // Rotate Earth based on Greenwich Mean Sidereal Time (GMST) to align with ECI coordinates
      const gmst = getGMST(currentDate);
      // GMST is in radians.
      // Three.js Y is up (North).
      earthRef.current.rotation.y = gmst; 
    }
  });

  return (
    <group ref={earthRef}>
      {/* Base Earth Sphere */}
      <mesh raycast={() => null}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial 
          map={colorMap} 
          bumpMap={bumpMap} 
          bumpScale={0.01}
          specularMap={specMap}
          specular={new THREE.Color('grey')} 
          shininess={5}
        />
      </mesh>
      
      {/* Atmosphere / Clouds */}
      <mesh scale={[1.005, 1.005, 1.005]} raycast={() => null}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshLambertMaterial 
          map={cloudsMap} 
          transparent 
          opacity={0.4} 
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Atmospheric Glow */}
       <mesh scale={[1.02, 1.02, 1.02]} raycast={() => null}>
        <sphereGeometry args={[1, 64, 64]} />
         <meshBasicMaterial 
          color="#4db2ff" 
          transparent 
          opacity={0.1} 
          side={THREE.BackSide} 
          blending={THREE.AdditiveBlending}
         />
      </mesh>
    </group>
  );
};

export default Earth;
