import React from 'react';

export interface TLEData {
  id: number;
  name: string;
  line1: string;
  line2: string;
}

export interface SatelliteObject {
  id: number;
  name: string;
  satrec: any; // satellite.js SatRec object
  // Pre-calculated orbital path for visualization
  orbitPath: [number, number, number][]; 
}

export interface SimulationState {
  date: Date;
  speed: number; // multiplier, e.g., 1x, 100x
  paused: boolean;
  showLinks: boolean;
}

// Augment JSX.IntrinsicElements to include React Three Fiber elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: any;
      bufferGeometry: any;
      color: any;
      directionalLight: any;
      group: any;
      instancedMesh: any;
      lineBasicMaterial: any;
      lineSegments: any;
      mesh: any;
      meshBasicMaterial: any;
      meshLambertMaterial: any;
      meshPhongMaterial: any;
      meshStandardMaterial: any;
      ringGeometry: any;
      sphereGeometry: any;
    }
  }
}

// Augment React's JSX namespace for React 18+ support
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: any;
      bufferGeometry: any;
      color: any;
      directionalLight: any;
      group: any;
      instancedMesh: any;
      lineBasicMaterial: any;
      lineSegments: any;
      mesh: any;
      meshBasicMaterial: any;
      meshLambertMaterial: any;
      meshPhongMaterial: any;
      meshStandardMaterial: any;
      ringGeometry: any;
      sphereGeometry: any;
    }
  }
}