import "./style.css";
import config from "./config";
import { Loader } from "@googlemaps/js-api-loader";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GUI } from "dat.gui";
import sanFranciscoElevationData from "./elevationData/sanFranciscoElevationData";
import tahoeElevationData from "./elevationData/tahoeElevationData";

const DEBUG = false;

// Map properties
const mapTypeId = "terrain";
const everest = {
  center: { lat: 27.9881198, lng: 86.8425776 },
  zoom: 10,
};
const nyc = {
  center: { lat: 40.6966727, lng: -74.1443534 },
  zoom: 12,
};
const sanFrancisco = {
  center: { lat: 37.7709704, lng: -122.4118542 },
  zoom: 12,
};
const tahoe = { center: { lat: 39.088311, lng: -120.013428 }, zoom: 10 };

const sampleLength = 0.5; // distance (kilometers) to sample elevation

const maxDistance = 100000;

const loader = new Loader({
  apiKey: config.API_TOKEN,
  version: "weekly",
  libraries: ["places"],
});

let includeOceanFloor = false;

Number.prototype.toRad = function () {
  return (this * Math.PI) / 180;
};

Number.prototype.toDeg = function () {
  return (this * 180) / Math.PI;
};

function distance(coord1, coord2) {
  // degrees to radians.
  let lng1 = coord1.lng.toRad();
  let lng2 = coord2.lng.toRad();
  let lat1 = coord1.lat.toRad();
  let lat2 = coord2.lat.toRad();

  // Haversine formula
  let dlng = lng2 - lng1;
  let dlat = lat2 - lat1;
  let a =
    Math.pow(Math.sin(dlat / 2), 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dlng / 2), 2);

  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Radius of earth in kilometers. Use 3956 for miles
  let r = 6371;

  return c * r;
}

function newLat(coord, distance) {
  // Radius of earth in kilometers. Use 3956 for miles
  let r = 6371;

  return {
    lat: coord.lat - (distance / r) * (180 / Math.PI),
    lng: coord.lng,
  };
}

function newLng(coord, distance) {
  // Radius of earth in kilometers. Use 3956 for miles
  let r = 6371;

  return {
    lat: coord.lat,
    lng: coord.lng - (distance / r).toDeg() / Math.cos(coord.lat.toRad()),
  };
}

function cleanElevationData(result) {
  let cleanData = [];

  result.forEach((item, i) => {
    cleanData.push(item.elevation);
  });

  return cleanData;
}

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function getElevationData(
  google,
  southWest,
  northEast,
  southEast,
  northWest
) {
  let elevationData = [];

  const elevator = new google.maps.ElevationService();

  let i = northWest;
  let j = northEast;

  const d = distance(i, j);
  const denominator = distance(northWest, southWest);
  let numerator = 0;
  let samples = Math.floor(d / sampleLength);
  const maxSamples = 500;
  const requestsPerSecond = 100;

  while (i.lat >= southWest.lat) {
    let k = i;
    let s = samples;
    let pathElevation = [];
    console.log(
      `Downloading elevation data (${(numerator / denominator) * 100}%)`
    );
    while (s > 0) {
      let path;
      if (s > maxSamples) {
        const l = newLng(k, maxSamples * sampleLength);

        path = [k, l];
      } else {
        path = [k, j];
      }

      const data = await elevator.getElevationAlongPath({
        path: path,
        samples: s > 500 ? maxSamples : s,
      });

      pathElevation.push(cleanElevationData(data.results));
      s -= maxSamples;
      //await delay(Math.ceil(maxSamples / requestsPerSecond) * 1000);
      await delay(1000);
    }
    elevationData.push(pathElevation.flat());

    i = newLat(i, sampleLength);
    j = newLat(j, sampleLength);
    numerator += sampleLength;
  }
  console.log(`Downloading elevation data (100%)`);
  console.log(elevationData);
  draw(elevationData);
}

function getMap(google) {
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: nyc.zoom,
    center: nyc.center,
    mapTypeId,
  });

  google.maps.event.addListener(map, "bounds_changed", function () {
    const bounds = map.getBounds();
    const southWest = {
      lat: bounds.getSouthWest().lat(),
      lng: bounds.getSouthWest().lng(),
    };
    const northEast = {
      lat: bounds.getNorthEast().lat(),
      lng: bounds.getNorthEast().lng(),
    };
    const southEast = {
      lat: bounds.getSouthWest().lat(),
      lng: bounds.getNorthEast().lng(),
    };
    const northWest = {
      lat: bounds.getNorthEast().lat(),
      lng: bounds.getSouthWest().lng(),
    };

    getElevationData(google, southWest, northEast, southEast, northWest);
  });
}

function kmToM(distance) {
  const mInKm = 1000;

  return distance * mInKm;
}

let camera, controls, material, scene, renderer;

function processElevation(elevation) {
  if (!includeOceanFloor && elevation < 0) {
    return 0;
  }

  return elevation;
}

function draw(elevationData) {
  renderer = new THREE.WebGLRenderer({
    preserveDrawingBuffer: true,
    logarithmicDepthBuffer: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const gui = new GUI();

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    100,
    maxDistance
  );
  camera.position.set(
    0,
    0,
    kmToM(elevationData.length * sampleLength) /
      2 /
      Math.tan((Math.PI * 45) / 360)
  );
  camera.lookAt(0, 0, 0);

  // controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.listenToKeyEvents(window); // optional
  controls.addEventListener("change", render); // call this only in static scenes (i.e., if there is no animation loop)

  controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
  controls.dampingFactor = 0.05;

  controls.screenSpacePanning = false;

  controls.minDistance = 100;
  controls.maxDistance = maxDistance;

  controls.maxPolarAngle = Math.PI / 2;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  material = new THREE.MeshStandardMaterial({
    color: 0x777777,
    flatShading: true,
    roughness: 0.4,
    metalness: 0.85,
    // wireframe: true,
  });

  let geometry = new THREE.PlaneGeometry(
    kmToM(elevationData[0].length * sampleLength),
    kmToM(elevationData.length * sampleLength),
    elevationData[0].length - 1,
    elevationData.length - 1
  );

  const flattenedElevationData = elevationData
    .flat()
    .map((value) => Math.round(value / 25) * 25);
  const vertices = geometry.attributes.position.array;

  for (let i = 0, l = flattenedElevationData.length; i < l; i++) {
    const elevation = processElevation(flattenedElevationData[i]);
    vertices[i * 3 + 2] = elevation * 2;
  }
  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();

  let plane = new THREE.Mesh(geometry, material);

  // Add lighting to the scene
  // const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  // scene.add(ambientLight);

  // const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
  // scene.add(hemisphereLight);

  // Store light position components
  const mainLightPos = { x: 2, y: 2, z: 1 };
  const fillLightPos = { x: -1, y: -1, z: 1 };

  // Functions to update light positions
  function updateMainLightPosition() {
    directionalLight.position
      .set(mainLightPos.x, mainLightPos.y, mainLightPos.z)
      .normalize();
  }

  function updateFillLightPosition() {
    directionalLight2.position
      .set(fillLightPos.x, fillLightPos.y, fillLightPos.z)
      .normalize();
  }

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
  directionalLight.position
    .set(mainLightPos.x, mainLightPos.y, mainLightPos.z)
    .normalize();
  scene.add(directionalLight);

  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
  directionalLight2.position
    .set(fillLightPos.x, fillLightPos.y, fillLightPos.z)
    .normalize();
  scene.add(directionalLight2);

  // Add lighting controls to GUI
  const lightFolder = gui.addFolder("lighting");
  //lightFolder.add(ambientLight, "intensity", 0, 1).name("ambient");
  //lightFolder.add(hemisphereLight, "intensity", 0, 1).name("hemisphere");
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

  const materialFolder = gui.addFolder("material");
  materialFolder.add(material, "metalness", 0, 1);
  materialFolder.add(material, "roughness", 0, 1);
  materialFolder.open();

  scene.add(plane);
  animate();
  //render();
}

function animate() {
  requestAnimationFrame(animate);

  render();
}

function render() {
  renderer.render(scene, camera);
}

document.addEventListener(
  "keydown",
  function (e) {
    if (
      (window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey) &&
      e.key == "s"
    ) {
      e.preventDefault();
      const dataURL = renderer.domElement.toDataURL();
      console.log(dataURL);
      window.open(dataURL);
    }
  },
  false
);

function init(google) {
  if (!DEBUG) {
    getMap(google);
  } else {
    draw(sanFranciscoElevationData);
  }
}

loader
  .load()
  .then((google) => {
    init(google);
  })
  .catch((e) => {
    console.error(e);
  });
