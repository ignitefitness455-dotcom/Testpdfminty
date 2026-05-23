import { ICONS } from "../src/ui/icons.js";
import { downloadFile, showSuccess } from '../utils/globals.js';
import { runPdfWorkerTask } from '../utils/pdfWorker.js';
import { setupToolUI } from '../src/utils/pdfToolsSetup.js';

export function init() {
  setupToolUI({
    toolId: 'add-page-numbers',
    title: 'Add Page Numbers',
    description: 'Insert page numbers into your PDF',
    icon: ICONS.add_page_numbers,
    actionText: 'Add Page Numbers',
    instructions: [
      'Upload a PDF file.',
      'Choose format, position, and style.',
      'Click Add Page Numbers.',
    ],
    settingsHtml: `
      <div class="settings-panel">
        <div class="setting-group">
          <label class="input-label">Format</label>
          <select id="num-format" class="select-input">
            <option value="1" selected>1, 2, 3...</option>
            <option value="page_1">Page 1, Page 2...</option>
            <option value="1_of_n">1 of N</option>
            <option value="-1-">- 1 -</option>
          </select>
        </div>
        <div class="setting-group">
          <label class="input-label">Position</label>
          <select id="num-position" class="select-input">
            <option value="bottom-center" selected>Bottom Center</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="bottom-right">Bottom Right</option>
            <option value="top-center">Top Center</option>
            <option value="top-left">Top Left</option>
            <option value="top-right">Top Right</option>
          </select>
        </div>
        <div class="setting-group">
          <label class="input-label"><span>Size</span> <span id="num-size-val" style="color:var(--accent)">12px</span></label>
          <input type="range" id="num-size" class="range-input" min="8" max="48" value="12" />
        </div>
        <div class="setting-group">
          <label class="input-label"><span>Margin</span> <span id="num-margin-val" style="color:var(--accent)">30px</span></label>
          <input type="range" id="num-margin" class="range-input" min="10" max="100" value="30" />
        </div>
        <div class="setting-group full-width">
          <label class="input-label">Color</label>
          <div class="color-picker-wrapper">
            <input type="color" id="num-color" class="color-input" value="#000000" />
            <span id="num-color-hex" class="color-hex">#000000</span>
          </div>
        </div>
      </div>
    `,
    onInit: () => {
      const bind = (id, suffix) => {
        const el = document.getElementById(id);
        const val = document.getElementById(id + '-val');
        if (el && val) el.addEventListener('input', () => { val.textContent = el.value + suffix; });
      };
      bind('num-size', 'px');
      bind('num-margin', 'px');
      const color = document.getElementById('num-color');
      const hex = document.getElementById('num-color-hex');
      if (color && hex) color.addEventListener('input', () => { hex.textContent = color.value.toUpperCase(); });
    },
    onApply: async ({ actualBytes, currentFileName, onProgress }) => {
      const format = document.getElementById('num-format').value;
      const position = document.getElementById('num-position').value;
      const size = parseInt(document.getElementById('num-size').value, 10);
      const margin = parseInt(document.getElementById('num-margin').value, 10);
      const hex = document.getElementById('num-color').value;
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;

      onProgress({ percent: 10, label: 'Adding page numbers...' });
      const payload = {
        fileBytes: actualBytes instanceof Uint8Array ? actualBytes : new Uint8Array(actualBytes),
        format, position, size, margin, colorRgb: { r, g, b },
      };
      const result = await runPdfWorkerTask('add-page-numbers', payload, [payload.fileBytes.buffer], onProgress);
      downloadFile(result, (currentFileName || 'document') + '_numbered.pdf');
      showSuccess('Page numbers added!');
    },
  });
}

export function destroy() {}
