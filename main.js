import './style.css'

let canvas = document.getElementById("canvas");

function setSize(height, width) {
  canvas.height = height;
  canvas.width = width;
}

function windowResize() {
  setSize(window.innerHeight, window.innerWidth);
}

function init() {
  setSize(window.innerHeight, window.innerWidth);
  window.onresize = windowResize;
}

init();
