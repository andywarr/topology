import './style.css'

import rough from 'roughjs';

const canvas = document.getElementById("canvas");
const rc = rough.canvas(canvas);

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
