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
  showOrbits: boolean;
  onSatelliteClick: (sat: SatelliteObject) => void;
}

const Satellites: React.FC<SatellitesProps> = ({ data, currentDate, showLinks, showOrbits, onSatelliteClick }) => {
  const meshRef = useRef<InstancedMesh>(null);
  const linksRef = useRef<LineSegments>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  
  // Memoize orbit geometries to avoid re-creating them every frame
  const orbitLines = useMemo(() => {
    return data.map(sat => sat.orbitPath.map(p => new THREE.Vector3(p[0], p[1], p[2])));
  }, [data]);

  useFrame(() => {
    if (!meshRef.current) return;

    // 1. Update Satellite Positions and Calculate Altitudes
    const positions: THREE.Vector3[] = [];
    const altitudes: number[] = [];
    let minAlt = Infinity;
    let maxAlt = -Infinity;
    
    data.forEach((sat, i) => {
      const pos = getSatellitePosition(sat.satrec, currentDate);
      if (pos) {
        tempObject.position.set(pos[0], pos[1], pos[2]);
        tempObject.updateMatrix();
        meshRef.current!.setMatrixAt(i, tempObject.matrix);
        
        const vec = new THREE.Vector3(pos[0], pos[1], pos[2]);
        positions.push(vec);
        
        // Altitude = Distance from center - Earth Radius (1.0 in local units)
        const alt = vec.length() - 1;
        altitudes.push(alt);
        
        if (alt < minAlt) minAlt = alt;
        if (alt > maxAlt) maxAlt = alt;
      } else {
        // Hide invalid satellites (e.g., decayed)
        tempObject.position.set(0, 0, 0);
        tempObject.scale.set(0, 0, 0);
        tempObject.updateMatrix();
        meshRef.current!.setMatrixAt(i, tempObject.matrix);
        positions.push(new THREE.Vector3(0,0,0));
        altitudes.push(0);
      }
    });

    // 2. Apply Colors based on Altitude (Red = Low, Green = High)
    const range = maxAlt - minAlt;
    // Prevent divide by zero if all satellites are at the exact same altitude
    const safeRange = range < 0.000001 ? 1 : range;

    data.forEach((_, i) => {
      if (positions[i].lengthSq() === 0) return; // Skip invalid

      const alt = altitudes[i];
      const normalized = (alt - minAlt) / safeRange; // 0.0 to 1.0

      // HSL: Red is hue 0.0, Green is hue ~0.33
      tempColor.setHSL(normalized * 0.33, 1.0, 0.5);
      meshRef.current!.setColorAt(i, tempColor);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;

    // 3. Update Links (K-Nearest Neighbors)
    if (showLinks && linksRef.current) {
      const linkPositions: number[] = [];
      const drawnEdges = new Set<string>();
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
          const j = neighbor.idx;
          const key = i < j ? `${i}-${j}` : `${j}-${i}`;
          
          if (!drawnEdges.has(key)) {
            drawnEdges.add(key);
            const p2 = positions[j];
            linkPositions.push(p1.x, p1.y, p1.z);
            linkPositions.push(p2.x, p2.y, p2.z);
          }
        }
      }

      linksRef.current.geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(linkPositions, 3)
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
        {/* White base color allows instanceColor to Tint the mesh correctly */}
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.2} roughness={0.4} />
      </instancedMesh>

      {/* Orbit Paths (raycast=null prevents them from blocking clicks) */}
      {showOrbits && data.map((sat, i) => (
        <Line
          key={`orbit-${sat.id}`}
          points={orbitLines[i]}
          color="rgba(255,255,255,0.2)"
          lineWidth={1}
          dashed
          dashScale={2}
          gapSize={1}
          opacity={0.3}
          transparent
          raycast={() => null}
        />
      ))}

      {/* Optical Links (raycast=null prevents blocking clicks) */}
      {showLinks && (
        <lineSegments ref={linksRef} raycast={() => null}>
          <bufferGeometry />
          <lineBasicMaterial color="cyan" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
        </lineSegments>
      )}
    </group>
  );
};

export default Satellites;