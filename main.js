import './style.css'
import rough from 'roughjs';

const canvas = document.getElementById("canvas");
const context = canvas.getContext('2d');
const rc = rough.canvas(canvas);

let circleDiameter = 8;
let circleSpacing = 2;

let options = {
  stroke: '#000', // This is the color
  disableMultiStroke: true,
  roughness: 0.5, // 0 is a perfect circle
  strokeWidth: 1
}

let x = 0;
let y = 0;

function drawUniform() {
  for (y = circleSpacing + circleDiameter/2; y < canvas.height; y += circleSpacing + circleDiameter) {
    for (x = circleSpacing + circleDiameter/2; x < canvas.width; x += circleSpacing + circleDiameter) {
      rc.circle(x, y, circleDiameter, options);
    }
  }
}

function setSize(height, width) {
  canvas.height = height;
  canvas.width = width;
}

function windowResize() {
  setSize(window.innerHeight, window.innerWidth);
  drawUniform();
}

function init() {
  setSize(window.innerHeight, window.innerWidth);
  window.onresize = windowResize;

  drawUniform();
}

init();
