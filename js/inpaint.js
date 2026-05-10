/**
 * Inpainting engine — Phase 3: OpenCV.js Telea algorithm
 * Falls back to simple radial fill if OpenCV.js is unavailable.
 */

let opencvReady = false;
const OPENCV_TIMEOUT = 30000;

/**
 * Called when OpenCV.js finishes loading.
 */
function onOpenCvReady() {
  opencvReady = true;
  updateProcessButton();
  if (typeof updateEngineUI === 'function') updateEngineUI();
}

/**
 * Called if OpenCV.js fails to load.
 */
function onOpenCvError() {
  opencvReady = false;
  updateProcessButton();
}

function updateProcessButton() {
  const btn = document.getElementById('processBtn');
  if (btn) {
    btn.disabled = false;
  }
}

/**
 * Inpaint using OpenCV Telea algorithm.
 * @param {HTMLCanvasElement} imageCanvas - original image at full resolution
 * @param {HTMLCanvasElement} maskCanvas - mask (white = inpaint, black = keep)
 * @returns {HTMLCanvasElement} result canvas
 */
function inpaintSimple(imageCanvas, maskCanvas) {
  if (opencvReady && typeof cv !== 'undefined') {
    return inpaintOpenCV(imageCanvas, maskCanvas);
  }
  return inpaintFallback(imageCanvas, maskCanvas);
}

function inpaintOpenCV(imageCanvas, maskCanvas) {
  const w = imageCanvas.width;
  const h = imageCanvas.height;

  // Read canvases into OpenCV matrices
  const src = cv.imread(imageCanvas);
  const mask = cv.imread(maskCanvas);

  // Convert to correct formats
  const srcBGR = new cv.Mat();
  const maskGray = new cv.Mat();
  cv.cvtColor(src, srcBGR, cv.COLOR_RGBA2BGR);
  cv.cvtColor(mask, maskGray, cv.COLOR_RGBA2GRAY);

  // Inpaint: radius=5, Telea algorithm
  const dst = new cv.Mat();
  cv.inpaint(srcBGR, maskGray, dst, 5, cv.INPAINT_TELEA);

  // Convert BGR back to RGBA for correct display
  const dstRGBA = new cv.Mat();
  cv.cvtColor(dst, dstRGBA, cv.COLOR_BGR2RGBA);

  const result = document.createElement('canvas');
  result.width = w;
  result.height = h;
  cv.imshow(result, dstRGBA);

  // Free WebAssembly memory
  src.delete();
  mask.delete();
  srcBGR.delete();
  maskGray.delete();
  dst.delete();
  dstRGBA.delete();

  return result;
}

function inpaintFallback(imageCanvas, maskCanvas) {
  const w = imageCanvas.width;
  const h = imageCanvas.height;
  const imgCtx = imageCanvas.getContext('2d');
  const srcData = imgCtx.getImageData(0, 0, w, h);
  const maskCtx = maskCanvas.getContext('2d');
  const maskData = maskCtx.getImageData(0, 0, w, h);

  const result = document.createElement('canvas');
  result.width = w;
  result.height = h;
  const dstCtx = result.getContext('2d');
  const dstData = dstCtx.createImageData(w, h);

  const RADIUS = 15;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (maskData.data[idx] < 128) {
        dstData.data[idx] = srcData.data[idx];
        dstData.data[idx + 1] = srcData.data[idx + 1];
        dstData.data[idx + 2] = srcData.data[idx + 2];
        dstData.data[idx + 3] = 255;
      } else {
        let rSum = 0, gSum = 0, bSum = 0, wSum = 0;
        for (let dy = -RADIUS; dy <= RADIUS; dy++) {
          for (let dx = -RADIUS; dx <= RADIUS; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
            const nidx = (ny * w + nx) * 4;
            if (maskData.data[nidx] < 128) {
              const dist = Math.sqrt(dx * dx + dy * dy) + 1;
              const weight = 1 / (dist * dist);
              rSum += srcData.data[nidx] * weight;
              gSum += srcData.data[nidx + 1] * weight;
              bSum += srcData.data[nidx + 2] * weight;
              wSum += weight;
            }
          }
        }
        dstData.data[idx] = wSum > 0 ? Math.round(rSum / wSum) : srcData.data[idx];
        dstData.data[idx + 1] = wSum > 0 ? Math.round(gSum / wSum) : srcData.data[idx + 1];
        dstData.data[idx + 2] = wSum > 0 ? Math.round(bSum / wSum) : srcData.data[idx + 2];
        dstData.data[idx + 3] = 255;
      }
    }
  }
  dstCtx.putImageData(dstData, 0, 0);
  return result;
}
