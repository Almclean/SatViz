
# OrbitalLink Viz

OrbitalLink Viz is a high-performance, real-time 3D visualization tool designed to simulate satellite constellations and optical inter-satellite links (OISL). Built with **React**, **Three.js** (via React Three Fiber), and **satellite.js**, it provides accurate orbital propagation based on TLE (Two-Line Element) data.

## 🚀 Features

### 3D Visualization
- **Realistic Earth**: High-resolution textures for surface, specular highlights, and cloud layers with atmospheric glow.
- **Accurate Propagation**: Uses SGP4/SDP4 propagation algorithms to calculate satellite positions in real-time.
- **Altitude Heatmap**: Satellites are colored dynamically based on their altitude relative to the current constellation (Red = Lowest, Green = Highest).

### Optical Cross-Links
- **Dynamic Linking**: Simulates optical cross-links between satellites.
- **K-Nearest Neighbors**: Limits connections to the 4 nearest neighbors within range to simulate realistic mesh topology.
- **Visual Direction**: Links are vertex-colored to indicate directionality:
  - **Neon Orange**: Outgoing (Source)
  - **Cyan**: Incoming (Target)

### Interactivity
- **Satellite Selection**: Click any satellite to view detailed telemetry and highlight its specific orbit path.
- **Orbit Visualization**: Displays the predicted orbital trajectory for the selected satellite.
- **Telemetry Panel**: Real-time display of:
  - Latitude / Longitude
  - Altitude (km)
  - Velocity (km/s)

### Simulation Controls
- **Time Travel**: Pause, Rewind, and Fast Forward simulation speed (up to 1000x real-time).
- **Data Import**: Built-in parser allows users to paste raw TLE data (2-line or 3-line format) to instantly regenerate the simulation with new constellations.

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **3D Engine**: @react-three/fiber, @react-three/drei, Three.js
- **Physics/Math**: satellite.js (Orbital mechanics), Lucide React (Icons)
- **Build Tool**: Vite

## 📦 Installation & Running

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Build for Production**:
   ```bash
   npm run build
   ```

## 🎮 Usage Guide

### Navigation
- **Rotate**: Left Click + Drag
- **Zoom**: Scroll Wheel
- **Select**: Left Click on any satellite dot

### Control Panel
The floating control panel at the bottom provides two tabs:

#### 1. Simulation Tab
- **Play/Pause**: Toggle time progression.
- **Speed Controls**: `<<` (Slow Down) and `>>` (Speed Up).
- **Reset**: Resets time to "Now" and speed to 1x.
- **Toggles**: Turn Optical Links on/off.

#### 2. Data Sources Tab
- Paste raw TLE data into the text area.
- Supports standard formats (e.g., from CelesTrak).
- Format example:
  ```text
  KUIPER-00008
  1 63724U 25088A   25334.98169249  .00003154  00000+0  27297-3 0  9992
  2 63724  51.8899 176.8893 0010888 132.6246 227.5645 14.99833878 33259
  ```
- Click **"Load TLE Data"** to render the new constellation.

## ⚙️ Configuration

Key physical constants can be adjusted in `constants.ts`:

```typescript
// Scale of the 3D scene (1 unit = Earth Radius)
export const SCALE_FACTOR = 1 / EARTH_RADIUS_KM;

// Maximum distance for optical links
export const MAX_LINK_RANGE_KM = 2500;
```

## 🧪 Testing

The project includes integration tests to ensure core functionality (like satellite selection after data reload) remains stable.

```bash
npm test
```
