import "./styles/style.css";
import config from "../config.js";
import { Loader } from "@googlemaps/js-api-loader";
import { ElevationService } from "./services/ElevationService.js";
import { TerrainRenderer } from "./rendering/TerrainRenderer.js";
import { LocationPresets } from "./utils/LocationPresets.js";
import { LoadingUI } from "./components/LoadingUI.js";
import elevationData from "./data/elevationData/sanFranciscoElevationData.js";

const DEBUG = true;
const SAMPLE_LENGTH = 0.5; // distance (kilometers) to sample elevation
const SCALE = 2; // scale factor for elevation data

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
  const loadingUI = new LoadingUI();

  // Register screenshot shortcut
  registerKeyboardShortcuts(terrainRenderer);

  if (!DEBUG) {
    initMap(google, elevationService, terrainRenderer, loadingUI);
  } else {
    terrainRenderer.draw(elevationData);
  }
}

// Initialize Maps interface
function initMap(google, elevationService, terrainRenderer, loadingUI) {
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: LocationPresets.sanFrancisco.zoom,
    center: LocationPresets.sanFrancisco.center,
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

    // Show loading UI before starting the data fetch
    loadingUI.show();
    loadingUI.updateProgress(0);

    elevationService
      .getElevationData(coordinates, (progress) => {
        loadingUI.updateProgress(progress);
      })
      .then((data) => {
        console.log(data);
        terrainRenderer.draw(data, SCALE);
        loadingUI.hide(); // Hide after rendering is complete
      })
      .catch((error) => {
        console.error("Error getting elevation data:", error);
        loadingUI.hide(); // Hide on error
      });
  });
}

// Register keyboard shortcut for saving screenshots
function registerKeyboardShortcuts(terrainRenderer) {
  document.addEventListener(
    "keydown",
    function (e) {
      // Change to a different key combination that won't conflict with browser defaults
      if (
        (window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey) &&
        e.key === "e"
      ) {
        e.preventDefault();
        // Add resolution multiplier (2x, 3x, 4x for higher resolution)
        const resolutionMultiplier = 4; // Increase this value for higher resolution
        const dataURL = terrainRenderer.getScreenshot(resolutionMultiplier);

        // Add error handling and logging
        if (!dataURL) {
          console.error("Screenshot data is empty or undefined");
          return;
        }

        // Create a download link instead of opening in a new window
        const link = document.createElement("a");
        link.download = `topology-screenshot-${resolutionMultiplier}x.png`;
        link.href = dataURL;
        link.click();

        // Also log success
        console.log(
          `Screenshot captured at ${resolutionMultiplier}x resolution`
        );
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
