/**
 * Load an image from a File object.
 * @param {File} file
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('请上传图片文件（JPG / PNG / WebP）'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('图片加载失败，文件可能已损坏'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

/**
 * Trigger browser download of a canvas as PNG.
 * @param {HTMLCanvasElement} canvas
 * @param {string} filename
 */
function downloadImage(canvas, filename) {
  const link = document.createElement('a');
  link.download = filename || 'watermark-removed.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/**
 * Scale image dimensions to fit within maxWidth/maxHeight while preserving aspect ratio.
 * @param {number} imgW
 * @param {number} imgH
 * @param {number} maxW
 * @param {number} maxH
 * @returns {{ width: number, height: number }}
 */
function fitSize(imgW, imgH, maxW, maxH) {
  if (imgW <= maxW && imgH <= maxH) return { width: imgW, height: imgH };
  const ratio = Math.min(maxW / imgW, maxH / imgH);
  return { width: Math.round(imgW * ratio), height: Math.round(imgH * ratio) };
}
