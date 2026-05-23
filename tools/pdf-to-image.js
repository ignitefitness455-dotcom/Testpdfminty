import { ICONS } from "../src/ui/icons.js";
import { downloadFile as downloadBlobFn, showSuccess } from '../utils/globals.js';
import { setupToolUI } from '../src/utils/pdfToolsSetup.js';

export function init() {
  setupToolUI({
    toolId: 'pdf-to-image',
    title: 'PDF to Image',
    description: 'Convert PDF pages to JPG images',
    icon: ICONS.pdf_to_image,
    actionText: 'Convert to Images',
    instructions: [
      'Upload a PDF file.',
      'Select output format and quality.',
      'Click Convert to get a ZIP of images.',
    ],
    settingsHtml: `
      <div class="settings-panel">
        <div class="setting-group">
          <label class="input-label">Output Format</label>
          <select id="img-format" class="select-input">
            <option value="jpeg" selected>JPEG</option>
            <option value="png">PNG</option>
          </select>
        </div>
        <div class="setting-group">
          <label class="input-label">Scale (DPI factor)</label>
          <select id="img-scale" class="select-input">
            <option value="1">1x (72 DPI)</option>
            <option value="1.5">1.5x (108 DPI)</option>
            <option value="2" selected>2x (144 DPI)</option>
            <option value="3">3x (216 DPI)</option>
          </select>
        </div>
        <div class="setting-group">
          <label class="input-label"><span>Quality</span> <span id="conv-quality-val" style="color:var(--accent)">90%</span></label>
          <input type="range" id="conv-quality" class="range-input" min="50" max="100" value="90" />
        </div>
      </div>
    `,
    onInit: () => {
      const slider = document.getElementById('conv-quality');
      const val = document.getElementById('conv-quality-val');
      if (slider && val) slider.addEventListener('input', (e) => { val.textContent = e.target.value + '%'; });
    },
    onApply: async ({ actualBytes, currentFileName, onProgress }) => {
      const format = document.getElementById('img-format')?.value || 'jpeg';
      const scale = parseFloat(document.getElementById('img-scale')?.value || '2');
      const quality = parseInt(document.getElementById('conv-quality')?.value || '90', 10) / 100;

      onProgress({ percent: 5, label: 'Loading PDF...' });

      // Use bundled pdfjs-dist (Fixed CRITICAL-5, CRITICAL-11)
      const pdfjsLib = await import('pdfjs-dist');
      const workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

      const pdf = await pdfjsLib.getDocument({ data: actualBytes }).promise;
      const totalPages = pdf.numPages;

      onProgress({ percent: 10, label: `Converting ${totalPages} page(s)...` });

      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport }).promise;

        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, mimeType, quality));
        zip.file(`page_${String(i).padStart(3, '0')}.${format}`, blob);

        canvas.width = 0;
        canvas.height = 0;
        onProgress({ percent: 10 + (i / totalPages) * 80, label: `Page ${i} of ${totalPages}...` });
      }

      pdf.destroy();
      onProgress({ percent: 95, label: 'Creating ZIP...' });
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (currentFileName || 'document') + '_images.zip';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showSuccess(`${totalPages} page(s) converted to ${format.toUpperCase()}!`);
    },
  });
}

export function destroy() {}
