import * as THREE from "three";
// import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GUI } from "dat.gui";

/**
 * TerrainRenderer - Handles 3D rendering of terrain using Three.js
 */
export class TerrainRenderer {
  constructor(sampleLength) {
    this.camera = null;
    // this.controls = null;
    this.scene = null;
    this.renderer = null;
    this.material = null;
    this.gui = null;
    this.maxDistance = null;
    this.includeOceanFloor = false;
    this.sampleLength = sampleLength;

    // Bind methods
    // this.animate = this.animate.bind(this);
    this.render = this.render.bind(this);
  }

  /**
   * Initialize the renderer
   */
  initialize() {
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      preserveDrawingBuffer: true,
      logarithmicDepthBuffer: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    // Create GUI
    this.gui = new GUI();

    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // Handle window resize
    window.addEventListener("resize", this.onWindowResize.bind(this), false);

    return this;
  }

  /**
   * Draw terrain based on elevation data
   */
  draw(elevationData, scale = 1) {
    if (!this.renderer) {
      this.initialize();
    }

    // Clear previous terrain if it exists
    if (this.terrain) {
      this.scene.remove(this.terrain);
      this.terrain.geometry.dispose();
    }

    // Setup camera
    this.setupCamera(elevationData);

    // Setup controls
    // this.setupControls();

    // Create terrain geometry
    this.createTerrain(elevationData, scale);

    // Setup lighting
    this.setupLighting();

    // Start animation loop
    // this.animate();

    // Render
    this.render();

    return this;
  }

  /**
   * Setup the camera
   */
  setupCamera(elevationData) {
    // Position camera to view terrain from appropriate distance
    this.maxDistance =
      this.kmToM(elevationData.length * this.sampleLength) /
      2 /
      Math.tan((Math.PI * 45) / 360);

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      100,
      this.maxDistance
    );

    this.camera.position.set(0, 0, this.maxDistance);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * Setup orbit controls
   */
  // setupControls() {
  //   // Create controls
  //   this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  //   this.controls.listenToKeyEvents(window);
  //   this.controls.addEventListener("change", this.render);

  //   // Configure controls
  //   this.controls.enableDamping = true;
  //   this.controls.dampingFactor = 0.05;
  //   this.controls.screenSpacePanning = false;
  //   this.controls.minDistance = 100;
  //   this.controls.maxDistance = this.maxDistance;
  //   this.controls.maxPolarAngle = Math.PI / 2;
  // }

  /**
   * Create terrain from elevation data
   */
  createTerrain(elevationData, scale) {
    // Create material
    this.material = new THREE.MeshStandardMaterial({
      color: 0x777777,
      flatShading: true,
      roughness: 1.0,
      metalness: 0.0,
    });

    // Add material controls to GUI
    const materialFolder = this.gui.addFolder("material");
    materialFolder.add(this.material, "metalness", 0, 1);
    materialFolder.add(this.material, "roughness", 0, 1);
    materialFolder.open();

    // Create geometry
    const geometry = new THREE.PlaneGeometry(
      this.kmToM(elevationData[0].length * this.sampleLength),
      this.kmToM(elevationData.length * this.sampleLength),
      elevationData[0].length - 1,
      elevationData.length - 1
    );

    // Apply elevation data to geometry
    const flattenedElevationData = elevationData
      .flat()
      .map((value) => Math.round(value / 25) * 25);

    const vertices = geometry.attributes.position.array;

    for (let i = 0, l = flattenedElevationData.length; i < l; i++) {
      const elevation = this.processElevation(flattenedElevationData[i]);
      vertices[i * 3 + 2] = elevation * scale;
    }

    // Update geometry
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();

    // Create mesh and add to scene
    this.terrain = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.terrain);
  }

  /**
   * Setup lighting for the scene
   */
  setupLighting() {
    // Store light position components
    const mainLightPos = { x: 4, y: -1.5, z: 0.5 };
    const fillLightPos = { x: -1, y: -1, z: 1 };

    // Create main directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position
      .set(mainLightPos.x, mainLightPos.y, mainLightPos.z)
      .normalize();
    this.scene.add(directionalLight);

    // Create fill light
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0);
    directionalLight2.position
      .set(fillLightPos.x, fillLightPos.y, fillLightPos.z)
      .normalize();
    this.scene.add(directionalLight2);

    // Functions to update light positions
    const updateMainLightPosition = () => {
      directionalLight.position
        .set(mainLightPos.x, mainLightPos.y, mainLightPos.z)
        .normalize();
    };

    const updateFillLightPosition = () => {
      directionalLight2.position
        .set(fillLightPos.x, fillLightPos.y, fillLightPos.z)
        .normalize();
    };

    // Add lighting controls to GUI
    const lightFolder = this.gui.addFolder("lighting");
    lightFolder.add(directionalLight, "intensity", 0, 2).name("main light");
    lightFolder.add(directionalLight2, "intensity", 0, 1).name("fill light");

    // Add position controls for main light
    const mainLightFolder = lightFolder.addFolder("main light position");
    mainLightFolder
      .add(mainLightPos, "x", -10, 10)
      .onChange(updateMainLightPosition);
    mainLightFolder
      .add(mainLightPos, "y", -10, 10)
      .onChange(updateMainLightPosition);
    mainLightFolder
      .add(mainLightPos, "z", -10, 10)
      .onChange(updateMainLightPosition);

    // Add position controls for fill light
    const fillLightFolder = lightFolder.addFolder("fill light position");
    fillLightFolder
      .add(fillLightPos, "x", -10, 10)
      .onChange(updateFillLightPosition);
    fillLightFolder
      .add(fillLightPos, "y", -10, 10)
      .onChange(updateFillLightPosition);
    fillLightFolder
      .add(fillLightPos, "z", -10, 10)
      .onChange(updateFillLightPosition);

    lightFolder.open();
  }

  /**
   * Animation loop
   */
  // animate() {
  //   requestAnimationFrame(this.animate);

  //   // if (this.controls) {
  //   //   this.controls.update();
  //   // }

  //   this.render();
  // }

  /**
   * Render the scene
   */
  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Handle window resize
   */
  onWindowResize() {
    if (this.camera && this.renderer) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  /**
   * Get screenshot of current view
   * @param {number} multiplier - Resolution multiplier (2 = double resolution, etc.)
   * @returns {string} Data URL of screenshot
   */
  getScreenshot(multiplier = 1) {
    if (!this.renderer) {
      throw new Error("Renderer not initialized");
    }

    // Store original dimensions
    const originalWidth = window.innerWidth;
    const originalHeight = window.innerHeight;

    if (multiplier <= 1) {
      // If no multiplier or invalid value, return standard resolution
      return this.renderer.domElement.toDataURL();
    }

    // Store original pixel ratio
    const originalPixelRatio = this.renderer.getPixelRatio();

    try {
      // Set renderer to higher resolution
      this.renderer.setSize(
        originalWidth * multiplier,
        originalHeight * multiplier
      );
      this.renderer.setPixelRatio(originalPixelRatio);

      // Update camera aspect ratio
      this.camera.aspect = originalWidth / originalHeight;
      this.camera.updateProjectionMatrix();

      // Render high-resolution frame
      this.renderer.render(this.scene, this.camera);

      // Capture the screenshot
      const dataURL = this.renderer.domElement.toDataURL();

      return dataURL;
    } finally {
      // Always restore original size regardless of success or failure
      this.renderer.setSize(originalWidth, originalHeight);
      this.renderer.setPixelRatio(originalPixelRatio);
      this.camera.aspect = originalWidth / originalHeight;
      this.camera.updateProjectionMatrix();
      this.render(); // Re-render at original size
    }
  }

  /**
   * Get screenshot of current view as Blob (better for large images)
   * @param {number} multiplier - Resolution multiplier (2 = double resolution, etc.)
   * @returns {Promise<Blob>} Promise resolving to image blob
   */
  getScreenshotBlob(multiplier = 1) {
    if (!this.renderer) {
      throw new Error("Renderer not initialized");
    }

    return new Promise((resolve, reject) => {
      try {
        // Store original dimensions
        const originalWidth = window.innerWidth;
        const originalHeight = window.innerHeight;

        // Get WebGL context and check max texture size
        const gl = this.renderer.getContext();
        const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);

        // Limit multiplier based on max texture size
        const safeMultiplier = Math.min(
          multiplier,
          Math.floor(maxTextureSize / Math.max(originalWidth, originalHeight))
        );

        if (safeMultiplier < multiplier) {
          console.warn(
            `Reduced multiplier from ${multiplier}x to ${safeMultiplier}x due to WebGL limits`
          );
        }

        // For standard resolution, just use the current canvas
        if (safeMultiplier <= 1) {
          this.renderer.domElement.toBlob((blob) => resolve(blob), "image/png");
          return;
        }

        // Store original settings
        const originalPixelRatio = this.renderer.getPixelRatio();

        // Set renderer to higher resolution
        this.renderer.setSize(
          originalWidth * safeMultiplier,
          originalHeight * safeMultiplier,
          false // Don't update style
        );

        // Update camera aspect ratio
        this.camera.aspect = originalWidth / originalHeight;
        this.camera.updateProjectionMatrix();

        // Render high-resolution frame
        this.renderer.render(this.scene, this.camera);

        // Get the blob representation
        this.renderer.domElement.toBlob((blob) => {
          // Restore original settings
          this.renderer.setSize(originalWidth, originalHeight);
          this.renderer.setPixelRatio(originalPixelRatio);
          this.camera.aspect = originalWidth / originalHeight;
          this.camera.updateProjectionMatrix();
          this.render(); // Re-render at original size

          resolve(blob);
        }, "image/png");
      } catch (error) {
        // Restore original settings even in case of error
        this.renderer.setSize(originalWidth, originalHeight);
        this.renderer.setPixelRatio(originalPixelRatio);
        this.camera.aspect = originalWidth / originalHeight;
        this.camera.updateProjectionMatrix();
        this.render();

        reject(error);
      }
    });
  }

  /**
   * Process elevation value
   */
  processElevation(elevation) {
    if (!this.includeOceanFloor && elevation < 0) {
      return 0;
    }

    return elevation;
  }

  /**
   * Convert kilometers to meters
   */
  kmToM(distance) {
    const mInKm = 1000;
    return distance * mInKm;
  }

  /**
   * Set whether to include ocean floor
   */
  setIncludeOceanFloor(include) {
    this.includeOceanFloor = include;
  }

  /**
   * Set sample length
   */
  setSampleLength(length) {
    this.sampleLength = length;
  }

  /**
   * Dispose of resources to prevent memory leaks
   */
  dispose() {
    if (this.gui) {
      this.gui.destroy();
    }

    if (this.renderer) {
      this.renderer.dispose();
      document.body.removeChild(this.renderer.domElement);
    }

    if (this.terrain) {
      this.scene.remove(this.terrain);
      this.terrain.geometry.dispose();
      this.terrain.material.dispose();
    }

    // if (this.controls) {
    //   this.controls.dispose();
    // }

    window.removeEventListener("resize", this.onWindowResize);
  }
}
