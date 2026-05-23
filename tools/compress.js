import { ICONS } from "../src/ui/icons.js";
import { downloadFile, showSuccess } from '../utils/globals.js';
import { runPdfWorkerTask } from '../utils/pdfWorker.js';
import { setupToolUI } from '../src/utils/pdfToolsSetup.js';
import { formatBytes } from './shared.js';

export function init() {
  setupToolUI({
    toolId: 'compress',
    title: 'Compress PDF',
    description: 'Reduce PDF file size with image quality control',
    icon: ICONS.compress,
    actionText: 'Compress PDF',
    instructions: [
      'Upload a PDF file containing images.',
      'Select desired image quality (lower = smaller file).',
      'Click Compress PDF to optimize.',
      'Compare before/after sizes and download.',
    ],
    settingsHtml: `
      <div class="settings-panel">
        <div class="setting-group full-width">
          <label class="input-label" for="compress-quality"><span>Image Quality</span> <span id="quality-val" style="color:var(--accent)">70%</span></label>
          <input type="range" id="compress-quality" class="range-input" min="10" max="100" value="70" />
          <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--muted);margin-top:0.25rem;">
            <span>Smaller</span><span>Better Quality</span>
          </div>
        </div>
        <div class="setting-group">
          <label class="input-label">Image Scale</label>
          <select id="compress-scale" class="select-input">
            <option value="1.0">100% (Original size)</option>
            <option value="1.5" selected>150% (Recommended)</option>
            <option value="2.0">200% (High DPI)</option>
          </select>
        </div>
        <div class="setting-group">
          <label class="input-label">Method</label>
          <select id="compress-method" class="select-input">
            <option value="resample" selected>Resample Images (Best compression)</option>
            <option value="objectstreams">Object Streams Only (Mild)</option>
          </select>
        </div>
      </div>
      <div id="compress-stats" class="compress-stats hidden">
        <div class="stat-row"><span>Original:</span><span id="orig-size">-</span></div>
        <div class="stat-row"><span>Compressed:</span><span id="new-size">-</span></div>
        <div class="stat-row"><span>Savings:</span><span id="savings-pct">-</span></div>
      </div>
    `,
    onInit: () => {
      const slider = document.getElementById('compress-quality');
      const val = document.getElementById('quality-val');
      if (slider && val) {
        slider.addEventListener('input', (e) => { val.textContent = e.target.value + '%'; });
      }
    },
    onApply: async ({ actualBytes, currentFileName, onProgress }) => {
      const quality = parseInt(document.getElementById('compress-quality')?.value || '70', 10) / 100;
      const scale = parseFloat(document.getElementById('compress-scale')?.value || '1.5');
      const method = document.getElementById('compress-method')?.value || 'resample';
      const originalSize = actualBytes.byteLength || actualBytes.length;

      document.getElementById('orig-size').textContent = formatBytes(originalSize);
      document.getElementById('compress-stats')?.classList.remove('hidden');

      onProgress({ percent: 5, label: 'Analyzing PDF...' });

      const payload = {
        fileBytes: actualBytes instanceof Uint8Array ? actualBytes : new Uint8Array(actualBytes),
        quality,
        scale,
        method,
        fileName: currentFileName || 'document',
      };

      onProgress({ percent: 10, label: 'Compressing images...' });
      const result = await runPdfWorkerTask('compress', payload, [payload.fileBytes.buffer], onProgress);

      const newSize = result.byteLength || result.length;
      const savings = Math.round(((originalSize - newSize) / originalSize) * 100);

      document.getElementById('new-size').textContent = formatBytes(newSize);
      document.getElementById('savings-pct').textContent = (savings >= 0 ? savings + '% smaller' : (Math.abs(savings) + '% larger'));

      downloadFile(result, (currentFileName || 'document') + '_compressed.pdf');
      showSuccess(savings >= 0 ? `Compressed! Saved ${savings}%` : 'Compression complete (file may be similar size)');
    },
  });
}

export function destroy() {}
