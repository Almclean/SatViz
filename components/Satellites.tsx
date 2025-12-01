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
  
  // Memoize orbit geometries to avoid re-creating them every frame
  const orbitLines = useMemo(() => {
    return data.map(sat => sat.orbitPath.map(p => new THREE.Vector3(p[0], p[1], p[2])));
  }, [data]);

  useFrame(() => {
    if (!meshRef.current) return;

    // 1. Update Satellite Positions
    const positions: THREE.Vector3[] = [];
    
    data.forEach((sat, i) => {
      const pos = getSatellitePosition(sat.satrec, currentDate);
      if (pos) {
        tempObject.position.set(pos[0], pos[1], pos[2]);
        tempObject.updateMatrix();
        meshRef.current!.setMatrixAt(i, tempObject.matrix);
        positions.push(new THREE.Vector3(pos[0], pos[1], pos[2]));
      } else {
        // Hide invalid satellites (e.g., decayed)
        tempObject.position.set(0, 0, 0);
        tempObject.scale.set(0, 0, 0);
        tempObject.updateMatrix();
        meshRef.current!.setMatrixAt(i, tempObject.matrix);
        positions.push(new THREE.Vector3(0,0,0));
      }
    });

    meshRef.current.instanceMatrix.needsUpdate = true;

    // 2. Update Links (Max 4 nearest neighbors per satellite)
    if (showLinks && linksRef.current) {
      const linkPositions: number[] = [];
      const drawnEdges = new Set<string>();
      const maxRangeSq = MAX_LINK_RANGE_UNITS * MAX_LINK_RANGE_UNITS;
      
      for (let i = 0; i < positions.length; i++) {
        const p1 = positions[i];
        if (p1.lengthSq() === 0) continue; // Skip invalid/hidden sats

        // Find all candidates within range
        const candidates: { idx: number; distSq: number }[] = [];
        
        for (let j = 0; j < positions.length; j++) {
          if (i === j) continue;
          const p2 = positions[j];
          if (p2.lengthSq() === 0) continue;

          // Use distanceToSquared for performance (avoids sqrt)
          const distSq = p1.distanceToSquared(p2);
          
          if (distSq <= maxRangeSq) {
            candidates.push({ idx: j, distSq });
          }
        }

        // Sort candidates by distance and take the closest 4
        candidates.sort((a, b) => a.distSq - b.distSq);
        const nearest = candidates.slice(0, 4);

        // Add links to geometry
        for (const neighbor of nearest) {
          const j = neighbor.idx;
          
          // Deduplicate edges so we don't draw A->B and B->A on top of each other
          // We use a string key "minIdx-maxIdx"
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
      // Tell Three.js how many vertices to draw (divide by 3 for xyz)
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
        <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0.8} />
      </instancedMesh>

      {/* Orbit Paths */}
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

      {/* Optical Links */}
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