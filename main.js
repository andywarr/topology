import './style.css';
import config from './config'
import { Loader } from '@googlemaps/js-api-loader';
import Panzoom from '@panzoom/panzoom';
import rough from 'roughjs';

// Canvas properties
let pixelsPerInch = 300;
let height =  8 * pixelsPerInch;
let width = 11 * pixelsPerInch;

// Map properties
const mapTypeId = "terrain";
const sanFrancisco = {lat: 37.7749, lng: 122.4194};
const zoom = 12;

const sampleLenth = 0.5; // distance (kilometers) to sample elevation

const loader = new Loader({
  apiKey: config.API_TOKEN,
  version: "weekly",
  libraries: ["places"]
});

const canvas = document.getElementById('canvas');

const panzoom = Panzoom(canvas, {
  contain: 'outside',
  handleStartEvent: (event) => {
    event.preventDefault()
  },
  maxScale: 1,
});

// Bind to mousewheel
canvas.addEventListener('wheel', panzoom.zoomWithWheel)
// Bind to shift+mousewheel
canvas.addEventListener('wheel', function (event) {
  if (!event.shiftKey) return
  panzoom.zoomWithWheel(event)
});

const rc = rough.canvas(canvas);

let circleDiameter = 5;
let circleSpacing = 2;

let options = {
  stroke: '#000', // This is the color
  disableMultiStroke: true,
  roughness: 0.5, // 0 is a perfect circle
  strokeWidth: 1
}

let x = 0;
let y = 0;

Number.prototype.toRad = function() {
  return this * Math.PI / 180;
}

Number.prototype.toDeg = function() {
  return this * 180 / Math.PI;
}

function calcStartScale() {
  return Math.max(document.getElementById('canvas-wrapper').clientHeight/height,
    document.getElementById('canvas-wrapper').clientWidth/width);
}

function distance(coord1, coord2) {
  // degrees to radians.
  let lng1 = coord1.lng.toRad();
  let lng2 = coord2.lng.toRad();
  let lat1 = coord1.lat.toRad();
  let lat2 = coord2.lat.toRad();

  // Haversine formula
  let dlng = lng2 - lng1;
  let dlat = lat2 - lat1;
  let a = Math.pow(Math.sin(dlat / 2), 2)
           + Math.cos(lat1) * Math.cos(lat2)
           * Math.pow(Math.sin(dlng / 2),2);

  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Radius of earth in kilometers. Use 3956 for miles
  let r = 6371;

  return(c * r);
}

function newLng(coord, distance) {
  // Radius of earth in kilometers. Use 3956 for miles
  let r = 6371;

  return {
    lat: coord.lat,
    lng: coord.lng - (distance / r).toDeg() / Math.cos(coord.lat.toRad())
  };
}

function drawWave() {
  for (let i = 0, y = circleSpacing + circleDiameter/2;
       y < canvas.height;
       i += 1, y += circleSpacing + circleDiameter) {
    for (let j = 0, x = circleSpacing + circleDiameter/2;
         x < canvas.width;
         j += 1, x += Math.pow(((Math.sin(0.075 * j) + 1)/2)+1, 2) * circleSpacing + circleDiameter) {
      rc.circle(x, y, circleDiameter, options);
    }
  }
}

function drawUniform() {
  for (let i = 0, y = circleSpacing + circleDiameter/2;
       y < canvas.height;
       i += 1, y += circleSpacing + circleDiameter) {
    for (let j = 0, x = circleSpacing + circleDiameter/2;
         x < canvas.width;
         j += 1, x += circleSpacing + circleDiameter) {
      rc.circle(x, y, circleDiameter, options);
    }
  }
}

async function getElevationData(google, southWest, northEast, southEast, northWest) {
  const elevator = new google.maps.ElevationService();

  let i = northWest;
  let j = northEast;

  let d = distance(i, j);

  while (i.lng >= southWest.lng) {
    const path = [i, j];

    // const result = await elevator.getElevationAlongPath({
    //     path: path,
    //     samples: 3,
    //     // samples: d/sampleLenth,
    //   });
    // console.log(i, result);

    i = newLng(i, sampleLenth);
    j = newLng(j, sampleLenth);
  }
}

function getMap(google) {
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom,
    center: sanFrancisco,
    mapTypeId,
  });

  google.maps.event.addListener(map, 'bounds_changed', function() {
    const bounds = map.getBounds();
    const southWest = {lat: bounds.getSouthWest().lat(),
                       lng: bounds.getSouthWest().lng()};
    const northEast = {lat: bounds.getNorthEast().lat(),
                       lng: bounds.getNorthEast().lng()};
    const southEast = {lat: bounds.getNorthEast().lat(),
                       lng: bounds.getSouthWest().lng()};
    const northWest = {lat: bounds.getSouthWest().lat(),
                       lng: bounds.getNorthEast().lng()};

    getElevationData(google, southWest, northEast, southEast, northWest);
  });
}

function setSize(height, width) {
  canvas.height = height;
  canvas.width = width;

  const map = document.getElementById("map");

  if (height > width) {
    map.style.height = `${window.innerHeight * width/height}px`;
    map.style.width = `${window.innerWidth * width/height}px`;
  } else {
    map.style.height = `${window.innerHeight * height/width}px`;
    map.style.width = `${window.innerWidth * height/width}px`;
  }
}

function init(google) {
  setSize(height, width);

  getMap(google);

  drawWave();

  // Adding a timeout because in order for Panzoom to retrieve proper Zoom
  // the canvas needs to be painted
  setTimeout(() => panzoom.zoom(calcStartScale()))
}

loader
  .load()
  .then((google) => {
    init(google);
  })
  .catch(e => {
    console.error(e);
  });
