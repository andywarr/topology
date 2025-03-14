import { GoogleMapsUrlParser } from "../utils/GoogleMapsUrlParser.js";

export class HomepageUI {
  constructor(onLocationSubmit) {
    this.onLocationSubmit = onLocationSubmit;
    this.container = null;
    this.mapContainer = document.getElementById("map");
    this.createUI();
  }

  createUI() {
    // Store the original map container visibility
    const originalMapDisplay = this.mapContainer.style.display;
    this.mapContainer.style.display = "none";

    // Create homepage container
    this.container = document.createElement("div");
    this.container.className = "homepage-container";

    // Create title
    const title = document.createElement("h1");
    title.textContent = "Topology Viewer";

    // Create form
    const form = document.createElement("form");
    form.className = "url-form";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder =
      "Paste Google Maps URL (e.g., https://www.google.com/maps/@37.7709704,-122.4118542,12z)";
    input.className = "url-input";

    const button = document.createElement("button");
    button.type = "submit";
    button.textContent = "Generate Topology";
    button.className = "submit-button";

    // Sample locations section
    const samplesTitle = document.createElement("h3");
    samplesTitle.textContent = "Or choose a sample location:";

    const sampleLocationsContainer = document.createElement("div");
    sampleLocationsContainer.className = "sample-locations";

    // Add event listeners
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const url = input.value.trim();
      if (url) {
        const location = GoogleMapsUrlParser.parseUrl(url);
        if (location) {
          this.hide();
          this.mapContainer.style.display = originalMapDisplay;
          this.onLocationSubmit(location);
        } else {
          alert(
            "Invalid Google Maps URL. Please check the format and try again."
          );
        }
      }
    });

    // Assemble the UI
    form.appendChild(input);
    form.appendChild(button);

    this.container.appendChild(title);
    this.container.appendChild(form);
    this.container.appendChild(samplesTitle);
    this.container.appendChild(sampleLocationsContainer);

    document.body.insertBefore(this.container, document.body.firstChild);
  }

  hide() {
    if (this.container) {
      this.container.style.display = "none";
    }
  }

  show() {
    if (this.container) {
      this.container.style.display = "block";
    }
  }
}
