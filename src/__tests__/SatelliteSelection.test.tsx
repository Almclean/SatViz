import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import App from '../App';

// Fix for missing types for Jest globals
declare const jest: any;
declare const describe: any;
declare const it: any;
declare const expect: any;

// Mock Three.js dependencies since JSDOM doesn't support WebGL
jest.mock('@react-three/fiber', () => ({
  ...jest.requireActual('@react-three/fiber'),
  Canvas: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useFrame: jest.fn(),
  useLoader: jest.fn(() => [null, null, null, null]),
}));

jest.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  Stars: () => null,
  Line: () => null,
}));

// Mock Satellites to expose interactive elements for testing
jest.mock('../components/Satellites', () => {
  return ({ onSatelliteClick, data }: any) => (
    <div data-testid="satellites-group">
      {data.map((sat: any) => (
        <button
          key={sat.id}
          data-testid={`satellite-${sat.name}`}
          onClick={() => onSatelliteClick(sat)}
        >
          {sat.name}
        </button>
      ))}
    </div>
  );
});

describe('Satellite Selection Flow', () => {
  it('should allow selecting a satellite after loading new TLE data', () => {
    render(<App />);

    // 1. Open Data Tab
    const dataTab = screen.getByText('Data Sources');
    fireEvent.click(dataTab);

    // 2. Input new TLE Data
    const textArea = screen.getByPlaceholderText(/Startlink-1/i);
    const newTLE = `
NEW-SAT
1 99999U 23001A   23001.00000000  .00000000  00000-0  00000-0 0  9999
2 99999   0.0000   0.0000 0000000   0.0000   0.0000 15.00000000    19
    `.trim();

    fireEvent.change(textArea, { target: { value: newTLE } });
    
    // 3. Click Load
    const loadButton = screen.getByText('Load TLE Data');
    fireEvent.click(loadButton);

    // 4. Find and Click the new satellite
    // If the component didn't update or key didn't change, this might be stale or fail
    const newSatBtn = screen.getByTestId('satellite-NEW-SAT');
    expect(newSatBtn).toBeInTheDocument();
    
    fireEvent.click(newSatBtn);

    // 5. Verify Info Panel opens with correct name
    // The Info panel displays the name in an h2
    expect(screen.getByRole('heading', { name: 'NEW-SAT' })).toBeInTheDocument();
  });
});