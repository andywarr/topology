# Topology

A 3D terrain visualization tool that renders elevation data using Three.js and Google Maps API.

## Features

- Interactive 3D terrain visualization
- Dynamic elevation data fetching from Google Maps
- Adjustable lighting and material properties
- Camera controls for exploring terrain
- Screenshot capability
- Preset locations (San Francisco, NYC, Tahoe, Everest)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/andywarr/topology.git
cd topology
```

2. Install dependencies:

```bash
npm install
```

3. Create a `config.js` file in the root directory with your Google Maps API key:

```javascript
export default {
  API_TOKEN: "YOUR_GOOGLE_MAPS_API_KEY",
};
```

## Usage

### Development

Run the development server:

```bash
npm run dev
```

Open your browser and navigate to the local server URL (http://localhost:3000).

### Building for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Controls

### Camera Controls

- **Left-click + drag**: Rotate camera
- **Right-click + drag**: Pan camera
- **Scroll**: Zoom in/out

### Keyboard Shortcuts

- **Ctrl+S** (Windows/Linux) or **Cmd+S** (Mac): Save a screenshot of the current view

### GUI Controls

The application provides an interactive GUI with controls for:

- Material properties (metalness, roughness)
- Lighting intensity and position
- Other rendering options

## Debugging

The application includes a debug mode that can be enabled by setting `DEBUG = true` in the main.js file.
When in debug mode, the application will use pre-loaded elevation data instead of fetching from the API.

## Technologies

- [Three.js](https://threejs.org/): 3D visualization
- [Google Maps API](https://developers.google.com/maps): Elevation data
- [dat.GUI](https://github.com/dataarts/dat.gui): User interface controls
- [Vite](https://vitejs.dev/): Build tool and development server

## License

[MIT](LICENSE)
