/**
 * Drawing module — manages mask canvas and brush interactions.
 */

let maskCanvas, maskCtx;
let displayCanvas, displayCtx;
let originalImage = null;
let brushSize = 20;
let isEraser = false;
let isDrawing = false;
let undoStack = [];
const MAX_UNDO = 20;
let cursorCanvas, cursorCtx;
let cursorVisible = false;

/**
 * Initialize drawing canvases with an uploaded image.
 * @param {HTMLCanvasElement} origCanvas - visible canvas
 * @param {HTMLCanvasElement} resultCanvas - result canvas (not used here)
 * @param {HTMLImageElement} img
 * @param {number} displayW
 * @param {number} displayH
 */
function initDrawing(origCanvas, resultCanvas, img, displayW, displayH) {
  originalImage = img;
  displayCanvas = origCanvas;
  displayCanvas.width = displayW;
  displayCanvas.height = displayH;
  displayCtx = displayCanvas.getContext('2d');
  displayCtx.drawImage(img, 0, 0, displayW, displayH);

  // Cursor overlay canvas
  if (!cursorCanvas) {
    cursorCanvas = document.createElement('canvas');
    cursorCanvas.style.position = 'absolute';
    cursorCanvas.style.pointerEvents = 'none';
    cursorCanvas.style.top = '0';
    cursorCanvas.style.left = '0';
    displayCanvas.parentElement.style.position = 'relative';
    displayCanvas.parentElement.appendChild(cursorCanvas);
  }
  cursorCanvas.width = displayW;
  cursorCanvas.height = displayH;
  cursorCtx = cursorCanvas.getContext('2d');

  maskCanvas = document.createElement('canvas');
  maskCanvas.width = img.naturalWidth;
  maskCanvas.height = img.naturalHeight;
  maskCtx = maskCanvas.getContext('2d');
  maskCtx.fillStyle = '#000000';
  maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

  resultCanvas.width = img.naturalWidth;
  resultCanvas.height = img.naturalHeight;
  const rctx = resultCanvas.getContext('2d');
  rctx.drawImage(img, 0, 0);

  undoStack = [];
  saveUndoState();

  // Cursor tracking
  displayCanvas.addEventListener('mousemove', showCursor);
  displayCanvas.addEventListener('mouseleave', hideCursor);
  displayCanvas.addEventListener('touchstart', hideCursor);
  displayCanvas.addEventListener('touchmove', hideCursor);
  displayCanvas.addEventListener('touchend', hideCursor);
}

/**
 * Set brush size.
 * @param {number} size
 */
function setBrushSize(size) {
  brushSize = size;
  if (cursorVisible && cursorCtx) {
    // Redraw cursor at current position with new size
    cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
  }
}

/**
 * Toggle eraser mode.
 * @returns {boolean} new eraser state
 */
function toggleEraser() {
  isEraser = !isEraser;
  if (cursorVisible && cursorCtx) {
    cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
  }
  return isEraser;
}

function clearMask() {
  if (!maskCtx) return;
  saveUndoState();
  maskCtx.fillStyle = '#000000';
  maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
  redrawOverlay();
}

function undo() {
  if (undoStack.length <= 1) return;
  undoStack.pop();
  const prev = undoStack[undoStack.length - 1];
  maskCtx.putImageData(prev, 0, 0);
  redrawOverlay();
}

function saveUndoState() {
  undoStack.push(maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height));
  if (undoStack.length > MAX_UNDO) undoStack.shift();
}

/**
 * Convert event coordinates to canvas pixel position.
 */
function getCanvasPos(e) {
  const rect = displayCanvas.getBoundingClientRect();
  const scaleX = originalImage.naturalWidth / rect.width;
  const scaleY = originalImage.naturalHeight / rect.height;
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
}

function onPointerDown(e) {
  e.preventDefault();
  isDrawing = true;
  saveUndoState();
  drawStroke(getCanvasPos(e));
}

function onPointerMove(e) {
  e.preventDefault();
  if (!isDrawing) return;
  drawStroke(getCanvasPos(e));
}

function onPointerUp(e) {
  e.preventDefault();
  isDrawing = false;
}

function drawStroke(pos) {
  const color = isEraser ? '#000000' : '#FFFFFF';
  const rect = displayCanvas.getBoundingClientRect();
  const scale = originalImage.naturalWidth / rect.width;
  const radius = brushSize * scale;
  maskCtx.beginPath();
  maskCtx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
  maskCtx.fillStyle = color;
  maskCtx.fill();
  redrawOverlay();
}

function getDisplayScale() {
  return displayCanvas.width / originalImage.naturalWidth;
}

function showCursor(e) {
  if (!cursorCtx) return;
  const rect = displayCanvas.getBoundingClientRect();
  const displayW = rect.width;
  const displayH = rect.height;
  if (cursorCanvas.width !== displayW || cursorCanvas.height !== displayH) {
    cursorCanvas.width = displayW;
    cursorCanvas.height = displayH;
    cursorCanvas.style.width = displayW + 'px';
    cursorCanvas.style.height = displayH + 'px';
  }
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const r = brushSize / 2;

  cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
  cursorCtx.beginPath();
  cursorCtx.arc(x, y, r, 0, Math.PI * 2);
  cursorCtx.strokeStyle = isEraser ? '#999' : '#ec4899';
  cursorCtx.lineWidth = 2;
  cursorCtx.setLineDash(isEraser ? [4, 4] : []);
  cursorCtx.stroke();
  cursorVisible = true;
}

function hideCursor() {
  if (!cursorCtx) return;
  cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
  cursorVisible = false;
}

function redrawOverlay() {
  displayCtx.drawImage(originalImage, 0, 0, displayCanvas.width, displayCanvas.height);
  const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
  const imgData = displayCtx.getImageData(0, 0, displayCanvas.width, displayCanvas.height);
  const scaleX = maskCanvas.width / displayCanvas.width;
  const scaleY = maskCanvas.height / displayCanvas.height;

  for (let dy = 0; dy < displayCanvas.height; dy++) {
    for (let dx = 0; dx < displayCanvas.width; dx++) {
      const mx = Math.floor(dx * scaleX);
      const my = Math.floor(dy * scaleY);
      const idx = (my * maskCanvas.width + mx) * 4;
      const oidx = (dy * displayCanvas.width + dx) * 4;
      if (maskData.data[idx] > 128) {
        // Blend red overlay: 40% red, 60% original
        imgData.data[oidx] = Math.round(imgData.data[oidx] * 0.4 + 255 * 0.6);
        imgData.data[oidx + 1] = Math.round(imgData.data[oidx + 1] * 0.4);
        imgData.data[oidx + 2] = Math.round(imgData.data[oidx + 2] * 0.4);
      }
    }
  }
  displayCtx.putImageData(imgData, 0, 0);
}

/**
 * Get raw mask image data.
 * @returns {ImageData}
 */
function getMaskData() {
  return maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
}

function getOriginalImage() {
  return originalImage;
}

function getMaskCanvas() {
  return maskCanvas;
}
