import * as satellite from 'satellite.js';
import { SCALE_FACTOR } from './constants';
import { SatelliteObject, TLEData } from './types';

export const parseRawTLEString = (raw: string): TLEData[] => {
  const lines = raw.split('\n').map(l => l.trim()).filter(l => l !== '');
  const tles: TLEData[] = [];
  
  // Iterate through lines to find TLE sets. 
  // Supports standard 3-line (Name, Line1, Line2) or 2-line formats if name is missing.
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Look for Line 1 start
    if (line.startsWith('1 ') && line.length > 20) {
      const line1 = line;
      const line2 = lines[i+1];
      
      // Ensure Line 2 exists and looks correct
      if (line2 && line2.startsWith('2 ')) {
        let name = `SAT-${tles.length + 1}`;
        
        // Check if the previous line was a Name (not starting with 1 or 2)
        if (i > 0) {
          const prev = lines[i-1];
          if (!prev.startsWith('1 ') && !prev.startsWith('2 ')) {
            name = prev;
          }
        }

        tles.push({
          id: tles.length,
          name: name,
          line1, 
          line2
        });
        
        i++; // Skip processing line 2 next iteration
      }
    }
  }
  return tles;
};

export const parseTLEs = (tles: TLEData[]): SatelliteObject[] => {
  return tles.map((tle) => {
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
    
    // Pre-calculate orbit path (one orbit ~90 mins for LEO, we take 100 points)
    // For simplicity, we calculate a path based on current time forward 100 minutes
    const now = new Date();
    const orbitPath: [number, number, number][] = [];
    
    for (let i = 0; i < 100; i++) {
      const t = new Date(now.getTime() + i * 60000); // +1 minute steps
      const positionAndVelocity = satellite.propagate(satrec, t);
      const positionEci = positionAndVelocity.position;

      if (positionEci && typeof positionEci !== 'boolean') {
        const x = positionEci.x * SCALE_FACTOR;
        const y = positionEci.z * SCALE_FACTOR; // Switch Z and Y for Three.js (Y is up)
        const z = -positionEci.y * SCALE_FACTOR; 
        orbitPath.push([x, y, z]);
      }
    }

    return {
      id: tle.id,
      name: tle.name,
      satrec,
      orbitPath,
    };
  });
};

export const getSatellitePosition = (satrec: any, date: Date): [number, number, number] | null => {
  const positionAndVelocity = satellite.propagate(satrec, date);
  const positionEci = positionAndVelocity.position;

  if (!positionEci || typeof positionEci === 'boolean') return null;

  // Convert to Three.js coordinates
  // Satellite.js returns km. We scale to units.
  // ECI: X points to vernal equinox, Z points North.
  // Three.js: Y usually Up.
  // We map: ECI X -> Three X, ECI Z -> Three Y, ECI Y -> Three -Z (Right hand rule adjustments)
  
  const x = positionEci.x * SCALE_FACTOR;
  const y = positionEci.z * SCALE_FACTOR;
  const z = -positionEci.y * SCALE_FACTOR;

  return [x, y, z];
};

export const getSatelliteInfo = (satrec: any, date: Date) => {
  const positionAndVelocity = satellite.propagate(satrec, date);
  const positionEci = positionAndVelocity.position;
  const velocityEci = positionAndVelocity.velocity;

  if (!positionEci || typeof positionEci === 'boolean' || !velocityEci || typeof velocityEci === 'boolean') {
    return null;
  }

  const gmst = satellite.gstime(date);
  const geodetic = satellite.eciToGeodetic(positionEci, gmst);

  return {
    latitude: satellite.degreesLat(geodetic.latitude),
    longitude: satellite.degreesLong(geodetic.longitude),
    height: geodetic.height, // km
    velocity: Math.sqrt(velocityEci.x ** 2 + velocityEci.y ** 2 + velocityEci.z ** 2) // km/s
  };
};

export const getGMST = (date: Date) => {
  return satellite.gstime(date);
};