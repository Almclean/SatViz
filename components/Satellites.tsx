
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { InstancedMesh, LineSegments } from 'three';
import { SatelliteObject } from '../types';
import { getSatellitePosition } from '../utils';
import { MAX_LINK_RANGE_UNITS } from '../constants';
import { Line } from '@react-three/drei';

interface SatellitesProps {
  data: SatelliteObject[];
  currentDate: Date;
  showLinks: boolean;
  selectedSatellite: SatelliteObject | null;
  onSatelliteClick: (sat: SatelliteObject) => void;
}

const Satellites: React.FC<SatellitesProps> = ({ data, currentDate, showLinks, selectedSatellite, onSatelliteClick }) => {
  const meshRef = useRef<InstancedMesh>(null);
  const linksRef = useRef<LineSegments>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  
  // Link Colors: Neon Red-Orange (Outgoing) -> Bright Cyan (Incoming)
  const colorOutgoing = useMemo(() => new THREE.Color('#ff3300'), []);
  const colorIncoming = useMemo(() => new THREE.Color('#00ffff'), []);

  // Memoize orbit geometries to avoid re-creating them every frame
  const orbitLines = useMemo(() => {
    return data.map(sat => sat.orbitPath.map(p => new THREE.Vector3(p[0], p[1], p[2])));
  }, [data]);

  useFrame(() => {
    if (!meshRef.current) return;

    const positions: THREE.Vector3[] = [];
    const validAltitudes: number[] = [];
    const rawAltitudes: number[] = []; // Store 1:1 with data index
    
    // 1. Calculate positions and gather altitudes
    data.forEach((sat, i) => {
      const pos = getSatellitePosition(sat.satrec, currentDate);
      if (pos) {
        tempObject.position.set(pos[0], pos[1], pos[2]);
        tempObject.updateMatrix();
        meshRef.current!.setMatrixAt(i, tempObject.matrix);
        
        const vec = new THREE.Vector3(pos[0], pos[1], pos[2]);
        positions.push(vec);
        
        // Altitude relative to Earth surface (radius = 1)
        const alt = vec.length() - 1;
        validAltitudes.push(alt);
        rawAltitudes.push(alt);
      } else {
        // Hide invalid satellites
        tempObject.position.set(0, 0, 0);
        tempObject.scale.set(0, 0, 0);
        tempObject.updateMatrix();
        meshRef.current!.setMatrixAt(i, tempObject.matrix);
        positions.push(new THREE.Vector3(0,0,0));
        rawAltitudes.push(NaN);
      }
    });

    // 2. Determine Color Scale using Percentiles
    let minAlt = 0;
    let maxAlt = 1;
    
    if (validAltitudes.length > 0) {
      validAltitudes.sort((a, b) => a - b);
      const p2 = Math.floor(validAltitudes.length * 0.02);
      const p98 = Math.floor(validAltitudes.length * 0.98);
      
      minAlt = validAltitudes[p2] || validAltitudes[0];
      maxAlt = validAltitudes[p98] || validAltitudes[validAltitudes.length - 1];

      if (maxAlt - minAlt < 0.000001) {
          maxAlt = minAlt + 0.000001; 
      }
    }

    const range = maxAlt - minAlt;

    // 3. Apply Satellite Colors
    data.forEach((_, i) => {
      if (positions[i].lengthSq() === 0) return; // Skip invalid

      const alt = rawAltitudes[i];
      if (isNaN(alt)) return;

      let normalized = (alt - minAlt) / range;
      normalized = Math.max(0, Math.min(1, normalized));

      // Red (0.0) -> Green (0.35)
      tempColor.setHSL(normalized * 0.35, 1.0, 0.5);
      meshRef.current!.setColorAt(i, tempColor);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;

    // 4. Update Links (K-Nearest Neighbors, max 4) with Vertex Colors
    if (showLinks && linksRef.current) {
      const linkPositions: number[] = [];
      const linkColors: number[] = [];
      const maxRangeSq = MAX_LINK_RANGE_UNITS * MAX_LINK_RANGE_UNITS;
      
      for (let i = 0; i < positions.length; i++) {
        const p1 = positions[i];
        if (p1.lengthSq() === 0) continue; 

        // Find all candidates within range
        const candidates: { idx: number; distSq: number }[] = [];
        
        for (let j = 0; j < positions.length; j++) {
          if (i === j) continue;
          const p2 = positions[j];
          if (p2.lengthSq() === 0) continue;

          const distSq = p1.distanceToSquared(p2);
          if (distSq <= maxRangeSq) {
            candidates.push({ idx: j, distSq });
          }
        }

        // Keep only the 4 nearest neighbors
        candidates.sort((a, b) => a.distSq - b.distSq);
        const nearest = candidates.slice(0, 4);

        for (const neighbor of nearest) {
          const p2 = positions[neighbor.idx];
          
          linkPositions.push(p1.x, p1.y, p1.z);
          linkPositions.push(p2.x, p2.y, p2.z);

          // Vertex Color: Source (Outgoing/Red-Orange) -> Target (Incoming/Cyan)
          linkColors.push(colorOutgoing.r, colorOutgoing.g, colorOutgoing.b);
          linkColors.push(colorIncoming.r, colorIncoming.g, colorIncoming.b);
        }
      }

      linksRef.current.geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(linkPositions, 3)
      );
      linksRef.current.geometry.setAttribute(
        'color',
        new THREE.Float32BufferAttribute(linkColors, 3)
      );
      linksRef.current.geometry.setDrawRange(0, linkPositions.length / 3);
    }
  });

  return (
    <group>
      {/* Satellites Instanced Mesh */}
      <instancedMesh 
        ref={meshRef} 
        args={[undefined, undefined, data.length]}
        frustumCulled={false} // CRITICAL: Prevents culling when bounding sphere is stale/small
        onClick={(e) => {
          e.stopPropagation();
          const instanceId = e.instanceId;
          if (instanceId !== undefined && data[instanceId]) {
            onSatelliteClick(data[instanceId]);
          }
        }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
      >
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.2} roughness={0.4} />
      </instancedMesh>

      {/* Selected Orbit Path - Only show if satellite selected */}
      {selectedSatellite && (() => {
         const index = data.findIndex(s => s.id === selectedSatellite.id);
         if (index !== -1 && orbitLines[index]) {
             return (
                 <Line 
                    key={`orbit-${selectedSatellite.id}`}
                    points={orbitLines[index]}
                    color="rgba(150, 200, 255, 0.5)"
                    lineWidth={1.5}
                    transparent
                    opacity={0.6}
                    raycast={() => null}
                 />
             );
         }
         return null;
      })()}

      {/* Optical Links (raycast=null prevents blocking clicks) */}
      {showLinks && (
        <lineSegments ref={linksRef} raycast={() => null}>
          <bufferGeometry />
          <lineBasicMaterial 
            vertexColors={true} 
            transparent={false} 
            opacity={1.0} 
            blending={THREE.AdditiveBlending} 
            depthWrite={false}
            linewidth={2} 
          />
        </lineSegments>
      )}
    </group>
  );
};

export default Satellites;
