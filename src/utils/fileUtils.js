/**
 * src/utils/fileUtils.js - File utility functions
 */

export function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function downloadFile(uint8Array, filename) {
  try {
    if (!uint8Array || !uint8Array.length) {
      throw new Error('No data to download');
    }
    const blob = new Blob([uint8Array], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    console.error('Download failed:', error);
    throw new Error('Failed to download file: ' + error.message);
  }
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function loadExternalScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * Render a PDF thumbnail using pdfjs-dist.
 * Fixed CRITICAL-5: Uses bundled pdfjs-dist instead of CDN.
 */
export async function renderPdfThumbnail(file, imgElement, maxWidth = 300) {
  let pdf = null;
  try {
    const pdfjsLib = await import('pdfjs-dist');
    // Use bundled worker
    const workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const scale = unscaledViewport.width > maxWidth ? maxWidth / unscaledViewport.width : 1.0;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: ctx, viewport }).promise;

    // Try WebP first, fallback to JPEG
    const isWebpSupported = document.createElement('canvas')
      .toDataURL('image/webp').indexOf('data:image/webp') === 0;
    imgElement.src = canvas.toDataURL(isWebpSupported ? 'image/webp' : 'image/jpeg', 0.8);

    // Clean up canvas
    canvas.width = 0;
    canvas.height = 0;
  } catch (error) {
    console.warn('Thumbnail generation failed:', error);
    // Leave default SVG in place
  } finally {
    if (pdf && typeof pdf.destroy === 'function') {
      pdf.destroy();
    }
  }
}

export async function renderPdfThumbnailFromBytes(bytes, imgElement, maxWidth = 300) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  await renderPdfThumbnail(blob, imgElement, maxWidth);
}
