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