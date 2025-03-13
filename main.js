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
const sanFrancisco = { lat: 51.528308, lng: -0.171663 };
const zoom = 12;

const sampleLength = 0.1; // distance (kilometers) to sample elevation

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
  console.log(d);
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
      await delay(Math.ceil(maxSamples / requestsPerSecond) * 1000);
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
    zoom,
    center: sanFrancisco,
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
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    50000
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
  controls.maxDistance = 50000;

  controls.maxPolarAngle = Math.PI / 2;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  material = new THREE.MeshStandardMaterial({
    color: 0x222222,
    flatShading: true,
    roughness: 0.8,
    metalness: 0.2,
  });

  let geometry = new THREE.PlaneGeometry(
    kmToM(elevationData[0].length * sampleLength),
    kmToM(elevationData.length * sampleLength),
    elevationData[0].length - 1,
    elevationData.length - 1
  );

  const vertices = geometry.attributes.position.array;

  for (let i = 0, l = elevationData.flat().length; i < l; i++) {
    vertices[(i + 1) * 3 - 1] = processElevation(elevationData.flat()[i]) * 2;
  }

  let plane = new THREE.Mesh(geometry, material);

  // lights
  // const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
  // dirLight1.position.set(0, 1, 0);
  // scene.add(dirLight1);

  // const dirLight2 = new THREE.DirectionalLight(0xffffff, 1.5);
  // dirLight2.position.set(0, -1, 0);
  // scene.add(dirLight2);

  // const dirLight3 = new THREE.DirectionalLight(0xffffff, 1.5);
  // dirLight3.position.set(1, 0, 0);
  // scene.add(dirLight3);

  // const dirLight4 = new THREE.DirectionalLight(0xffffff, 1.5);
  // dirLight4.position.set(-1, 0, 0);
  // scene.add(dirLight4);

  // const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  // scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 3);
  dirLight.position.set(0, 1, 0);
  dirLight.castShadow = false;
  scene.add(dirLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);

  const hemiLight = new THREE.HemisphereLight(0xaaaaaa, 0x444444, 2);
  scene.add(hemiLight);

  const rimLight = new THREE.PointLight(0xffffff, 3);
  rimLight.position.set(-5, 5, 5);
  scene.add(rimLight);

  scene.add(plane);
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
  //getMap(google);
  draw(sanFranciscoElevationData);
}

loader
  .load()
  .then((google) => {
    init(google);
  })
  .catch((e) => {
    console.error(e);
  });
