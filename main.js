import "./style.css";
import config from "./config";
import { Loader } from "@googlemaps/js-api-loader";
import { ElevationService } from "./services/ElevationService.js";
import { TerrainRenderer } from "./rendering/TerrainRenderer.js";
import { LocationPresets } from "./utils/LocationPresets.js";
import elevationData from "./elevationData/sanFranciscoElevationData";

const DEBUG = false;
const SAMPLE_LENGTH = 0.5; // distance (kilometers) to sample elevation

// Initialize Google Maps API
const loader = new Loader({
  apiKey: config.API_TOKEN,
  version: "weekly",
  libraries: ["places"],
});

// App initialization
function initApp(google) {
  const elevationService = new ElevationService(google, SAMPLE_LENGTH);
  const terrainRenderer = new TerrainRenderer(SAMPLE_LENGTH);

  // Register screenshot shortcut
  registerKeyboardShortcuts(terrainRenderer);

  if (!DEBUG) {
    initMap(google, elevationService, terrainRenderer);
  } else {
    terrainRenderer.draw(elevationData);
  }
}

// Initialize Maps interface
function initMap(google, elevationService, terrainRenderer) {
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: LocationPresets.nyc.zoom,
    center: LocationPresets.nyc.center,
    mapTypeId: "terrain",
  });

  google.maps.event.addListener(map, "bounds_changed", function () {
    const bounds = map.getBounds();
    const coordinates = {
      southWest: {
        lat: bounds.getSouthWest().lat(),
        lng: bounds.getSouthWest().lng(),
      },
      northEast: {
        lat: bounds.getNorthEast().lat(),
        lng: bounds.getNorthEast().lng(),
      },
      southEast: {
        lat: bounds.getSouthWest().lat(),
        lng: bounds.getNorthEast().lng(),
      },
      northWest: {
        lat: bounds.getNorthEast().lat(),
        lng: bounds.getSouthWest().lng(),
      },
    };

    elevationService
      .getElevationData(coordinates)
      .then((data) => terrainRenderer.draw(data))
      .catch((error) => console.error("Error getting elevation data:", error));
  });
}

// Register keyboard shortcut for saving screenshots
function registerKeyboardShortcuts(terrainRenderer) {
  document.addEventListener(
    "keydown",
    function (e) {
      if (
        (window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey) &&
        e.key === "s"
      ) {
        e.preventDefault();
        const dataURL = terrainRenderer.getScreenshot();
        window.open(dataURL);
      }
    },
    false
  );
}

// Start the application
loader
  .load()
  .then((google) => {
    initApp(google);
  })
  .catch((e) => {
    console.error("Failed to load Google Maps API:", e);
  });
