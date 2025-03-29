import React, { useState, useEffect, useRef } from "react";
import { HomepageUI } from "./HomepageUI";
// Import other utilities and services
import { Loader } from "@googlemaps/js-api-loader";
import { ElevationService } from "../services/ElevationService.js";
import { TerrainRenderer } from "../rendering/TerrainRenderer.js";
import { LoadingUI } from "./LoadingUI.js";
import sanFranciscoElevationData from "../data/elevationData/sanFranciscoElevationData.js";
import everestElevationData from "../data/elevationData/everestElevationData.js";
import tahoeElevationData from "../data/elevationData/tahoeElevationData.js";
import config from "../../config.js";

const App = () => {
  const SAMPLE_LENGTH = 0.5; // distance (kilometers) to sample elevation
  const SCALE = 2; // scale factor for elevation data

  const [showHomepage, setShowHomepage] = useState(true);
  const [location, setLocation] = useState(null);
  const terrainRendererRef = useRef(null);

  // Map location names to their preloaded data
  const preloadedData = {
    "San Francisco": sanFranciscoElevationData,
    Tahoe: tahoeElevationData,
    Everest: everestElevationData,
  };

  // Initialize Google Maps API
  const loader = new Loader({
    apiKey: config.API_TOKEN,
    version: "weekly",
    libraries: ["places"],
  });

  // Initialize Maps interface
  function initMap(
    google,
    elevationService,
    terrainRenderer,
    loadingUI,
    customLocation,
    preloadedElevationData = null
  ) {
    const location = customLocation;

    const map = new google.maps.Map(document.getElementById("map"), {
      zoom: location.zoom,
      center: location.center,
      mapTypeId: "terrain",
    });

    // If we have preloaded data, use it right away
    if (preloadedElevationData) {
      console.log("Using preloaded elevation data");
      terrainRenderer.draw(preloadedElevationData, SCALE);

      return; // Skip setting up the fetch event listener
    }

    // Function to fetch elevation data based on map bounds
    const fetchElevationData = () => {
      const bounds = map.getBounds();
      if (!bounds) return; // Safety check if bounds aren't ready

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
    };

    // Fetch data when bounds change
    google.maps.event.addListener(map, "bounds_changed", fetchElevationData);
  }

  // Handle location submissions
  const handleLocationSubmit = (submittedLocation, isPreview = false) => {
    setLocation(submittedLocation);

    if (!isPreview) {
      setShowHomepage(false);
    }

    // Start the application
    loader
      .load()
      .then((google) => {
        const elevationService = new ElevationService(google, SAMPLE_LENGTH);

        // Use existing renderer instance or create a new one
        if (!terrainRendererRef.current) {
          terrainRendererRef.current = new TerrainRenderer(SAMPLE_LENGTH);
        }

        const loadingUI = new LoadingUI();

        // Register screenshot shortcut
        registerKeyboardShortcuts(terrainRendererRef.current, loadingUI);

        // Check if this is one of our preloaded locations
        const preloadedElevationData = submittedLocation.name
          ? preloadedData[submittedLocation.name]
          : null;

        initMap(
          google,
          elevationService,
          terrainRendererRef.current,
          loadingUI,
          submittedLocation,
          preloadedElevationData
        );
      })
      .catch((e) => {
        console.error("Failed to load Google Maps API:", e);
      });
  };

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

  useEffect(() => {
    setShowHomepage(true);

    loader
      .load()
      .then((google) => {
        // Create the renderer once and store in ref
        if (!terrainRendererRef.current) {
          terrainRendererRef.current = new TerrainRenderer(SAMPLE_LENGTH);
        }
        terrainRendererRef.current.draw(sanFranciscoElevationData, SCALE);
      })
      .catch((e) => {
        console.error("Failed to load Google Maps API:", e);
      });
  }, []);

  return showHomepage ? (
    <HomepageUI onLocationSubmit={handleLocationSubmit} />
  ) : null;
};

export default App;
