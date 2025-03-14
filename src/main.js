import "./styles/style.css";
import config from "../config.js";
import { Loader } from "@googlemaps/js-api-loader";
import { ElevationService } from "./services/ElevationService.js";
import { TerrainRenderer } from "./rendering/TerrainRenderer.js";
import { LocationPresets } from "./utils/LocationPresets.js";
import { LoadingUI } from "./components/LoadingUI.js";
import { HomepageUI } from "./components/HomepageUI.js";
import elevationData from "./data/elevationData/sanFranciscoElevationData.js";

const DEBUG = false;
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
  registerKeyboardShortcuts(terrainRenderer, loadingUI);

  // Initialize homepage UI
  const homepageUI = new HomepageUI((location) => {
    if (!DEBUG) {
      initMap(google, elevationService, terrainRenderer, loadingUI, location);
    } else {
      terrainRenderer.draw(elevationData);
    }
  });

  // Optionally bypass the homepage in DEBUG mode
  if (DEBUG) {
    homepageUI.hide();
    terrainRenderer.draw(elevationData);
  }
}

// Initialize Maps interface
function initMap(
  google,
  elevationService,
  terrainRenderer,
  loadingUI,
  customLocation
) {
  const location = customLocation || LocationPresets.sanFrancisco;

  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: location.zoom,
    center: location.center,
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
    loadingUI.show(
      "Loading Elevation Data",
      "Please wait while fetching elevation data."
    );
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
function registerKeyboardShortcuts(terrainRenderer, loadingUI) {
  document.addEventListener(
    "keydown",
    function (e) {
      // Change to a different key combination that won't conflict with browser defaults
      if (
        (window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey) &&
        e.key === "s"
      ) {
        e.preventDefault();

        // Use LoadingUI with custom title and description for screenshot capture
        loadingUI.show("Saving Image", "Please wait while saving the image.");
        loadingUI.updateProgress(0);

        // Use a reasonable multiplier (4x is quite high resolution already)
        const resolutionMultiplier = 4;

        // Use the blob approach for better memory handling
        terrainRenderer
          .getScreenshotBlob(resolutionMultiplier)
          .then((blob) => {
            if (!blob) {
              throw new Error("Failed to capture screenshot");
            }

            // Update progress
            loadingUI.updateProgress(50);

            // Create object URL from blob
            const url = URL.createObjectURL(blob);

            // Create download link
            const link = document.createElement("a");
            link.download = `topology-screenshot-${resolutionMultiplier}x.png`;
            link.href = url;

            // Update progress before initiating download
            loadingUI.updateProgress(75);
            link.click();

            // Release the object URL when done
            setTimeout(() => URL.revokeObjectURL(url), 100);

            // Show completion and hide after a short delay
            loadingUI.updateProgress(100);
            setTimeout(() => loadingUI.hide(), 500);

            console.log(
              `Screenshot captured at ${resolutionMultiplier}x resolution`
            );
          })
          .catch((error) => {
            console.error("Error saving image:", error);
            loadingUI.show("Error", "Failed to save image.");
            setTimeout(() => loadingUI.hide(), 2000);
          });
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
