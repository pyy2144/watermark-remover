/**
 * App controller — single engine (OpenCV Telea).
 */

const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const uploadSection = document.getElementById('uploadSection');
const editorSection = document.getElementById('editorSection');
const originalCanvas = document.getElementById('originalCanvas');
const resultCanvas = document.getElementById('resultCanvas');

const brushSizeSlider = document.getElementById('brushSize');
const brushSizeValue = document.getElementById('brushSizeValue');
const undoBtn = document.getElementById('undoBtn');
const eraserBtn = document.getElementById('eraserBtn');
const clearBtn = document.getElementById('clearBtn');
const processBtn = document.getElementById('processBtn');
const downloadBtn = document.getElementById('downloadBtn');
const compareBtn = document.getElementById('compareBtn');

const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');

let imageLoaded = false;
let resultReady = false;
let showingResult = false;

// === Upload ===
uploadArea.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFile);

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.style.borderStyle = 'solid';
});
uploadArea.addEventListener('dragleave', () => {
  uploadArea.style.borderStyle = 'dashed';
});
uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.style.borderStyle = 'dashed';
  const file = e.dataTransfer.files[0];
  if (file) handleFile({ target: { files: [file] } });
});

async function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const img = await loadImage(file);
    const maxDim = 1200;
    const size = fitSize(img.naturalWidth, img.naturalHeight, maxDim, maxDim);
    initDrawing(originalCanvas, resultCanvas, img, size.width, size.height);
    setupDrawingEvents();
    imageLoaded = true;
    resultReady = false;
    showingResult = false;
    uploadSection.style.display = 'none';
    editorSection.style.display = 'block';
    updateButtons();
  } catch (err) {
    alert(err.message);
  }
}

// === Drawing Events ===
function setupDrawingEvents() {
  originalCanvas.addEventListener('mousedown', onPointerDown);
  originalCanvas.addEventListener('mousemove', onPointerMove);
  originalCanvas.addEventListener('mouseup', onPointerUp);
  originalCanvas.addEventListener('mouseleave', onPointerUp);
  originalCanvas.addEventListener('touchstart', onPointerDown, { passive: false });
  originalCanvas.addEventListener('touchmove', onPointerMove, { passive: false });
  originalCanvas.addEventListener('touchend', onPointerUp);
  originalCanvas.style.touchAction = 'none';
}

// === Keyboard shortcuts ===
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault();
    undo();
    updateButtons();
  }
});

// === Toolbar ===
brushSizeSlider.addEventListener('input', () => {
  const v = parseInt(brushSizeSlider.value);
  brushSizeValue.textContent = v;
  setBrushSize(v);
});

undoBtn.addEventListener('click', () => {
  undo();
  updateButtons();
});

eraserBtn.addEventListener('click', () => {
  const active = toggleEraser();
  eraserBtn.classList.toggle('active', active);
});

clearBtn.addEventListener('click', () => {
  clearMask();
  resultReady = false;
  showingResult = false;
  const rctx = resultCanvas.getContext('2d');
  const img = getOriginalImage();
  rctx.drawImage(img, 0, 0);
  updateButtons();
});

processBtn.addEventListener('click', () => {
  processBtn.disabled = true;
  showLoading('OpenCV 处理中...');
  setTimeout(() => {
    try {
      const origImgCanvas = document.createElement('canvas');
      origImgCanvas.width = getOriginalImage().naturalWidth;
      origImgCanvas.height = getOriginalImage().naturalHeight;
      const octx = origImgCanvas.getContext('2d');
      octx.drawImage(getOriginalImage(), 0, 0);
      const result = inpaintSimple(origImgCanvas, getMaskCanvas());
      const rctx = resultCanvas.getContext('2d');
      rctx.drawImage(result, 0, 0);
      resultReady = true;
      hideLoading();
      processBtn.disabled = false;
      updateButtons();
    } catch (err) {
      hideLoading();
      processBtn.disabled = false;
      alert('处理失败：' + err.message);
    }
  }, 50);
});

downloadBtn.addEventListener('click', () => {
  const canvas = showingResult ? resultCanvas : originalCanvas;
  downloadImage(canvas, 'watermark-removed.png');
});

compareBtn.addEventListener('click', () => {
  if (!resultReady) return;
  showingResult = !showingResult;
  compareBtn.classList.toggle('active', showingResult);
  originalCanvas.parentElement.style.opacity = showingResult ? '0.15' : '1';
  compareBtn.textContent = showingResult ? '正在对比（再点退出）' : '前后对比';
});

// === UI State ===
function updateButtons() {
  undoBtn.disabled = (typeof undoStack !== 'undefined' && undoStack.length <= 1);
  processBtn.disabled = !imageLoaded;
  downloadBtn.disabled = !imageLoaded;
  compareBtn.disabled = !resultReady;
}

function showLoading(msg) {
  loadingText.textContent = msg;
  loadingOverlay.style.display = 'flex';
}

function hideLoading() {
  loadingOverlay.style.display = 'none';
}
