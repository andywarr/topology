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

const loader = new Loader({
  apiKey: config.API_TOKEN,
  version: "weekly",
  libraries: ["places"]
});

const canvas = document.getElementById('canvas');
// const map = new google.maps.Map(document.getElementById("map"), {
//   zoom,
//   center: sanFrancisco,
//   mapTypeId,
// });
// const elevator = new google.maps.ElevationService();

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

function calcStartScale() {
  return Math.max(document.getElementById('canvas-wrapper').clientHeight/height,
    document.getElementById('canvas-wrapper').clientWidth/width);
}

function distance(coord1, coord2) {
        // degrees to radians.
        let lng1 = coord1.lng * Math.PI / 180;
        let lng2 = coord2.lng * Math.PI / 180;
        let lat1 = coord1.lat * Math.PI / 180;
        let lat2 = coord2.lat * Math.PI / 180;

        // Haversine formula
        let dlng = lng2 - lng1;
        let dlat = lat2 - lat1;
        let a = Math.pow(Math.sin(dlat / 2), 2)
                 + Math.cos(lat1) * Math.cos(lat2)
                 * Math.pow(Math.sin(dlng / 2),2);

        let c = 2 * Math.asin(Math.sqrt(a));

        // Radius of earth in kilometers. Use 3956 for miles
        let r = 6371;

        return(c * r * 1000);
    }

function drawWave() {
  for (let i = 0, y = circleSpacing + circleDiameter/2; y < canvas.height; i += 1, y += circleSpacing + circleDiameter) {
    for (let j = 0, x = circleSpacing + circleDiameter/2; x < canvas.width; j += 1, x += Math.pow(((Math.sin(0.075 * j) + 1)/2)+1, 2) * circleSpacing + circleDiameter) {
      rc.circle(x, y, circleDiameter, options);
    }
  }
}

function drawUniform() {
  for (let i = 0, y = circleSpacing + circleDiameter/2; y < canvas.height; i += 1, y += circleSpacing + circleDiameter) {
    for (let j = 0, x = circleSpacing + circleDiameter/2; x < canvas.width; j += 1, x += circleSpacing + circleDiameter) {
      rc.circle(x, y, circleDiameter, options);
    }
  }
}

function setSize(height, width) {
  canvas.height = height;
  canvas.width = width;
}

// function windowResize() {
//   setSize(window.innerHeight, window.innerWidth);
//   drawUniform();
// }

function init() {
  //setSize(window.innerHeight, window.innerWidth);
  setSize(height, width);
  // window.onresize = windowResize;

  drawWave();

  // Adding a timeout because in order for Panzoom to retrieve proper Zoom the canvas needs to be painted
  setTimeout(() => panzoom.zoom(calcStartScale()))
}

init();

loader
  .load()
  .then((google) => {
    const map = new google.maps.Map(document.getElementById("map"), {
      zoom,
      center: sanFrancisco,
      mapTypeId,
    });
    const elevator = new google.maps.ElevationService();

    // const bounds = map.getBounds();
    // console.log(bounds);

    google.maps.event.addListener(map, 'bounds_changed', function() {
      const bounds = map.getBounds();
      const southWest = {lat: bounds.getSouthWest().lat(), lng: bounds.getSouthWest().lng()};
      const northEast = {lat: bounds.getNorthEast().lat(), lng: bounds.getNorthEast().lng()};
      const southEast = {lat: bounds.getSouthWest().lat(), lng: bounds.getNorthEast().lng()};
      const northWest = {lat: bounds.getNorthEast().lat(), lng: bounds.getSouthWest().lng()};

      console.log(distance(northWest, northEast));
    });
  })
  .catch(e => {
    // do something
  });
