import { ICONS } from "../src/ui/icons.js";
import { downloadFile, showSuccess } from '../utils/globals.js';
import { runPdfWorkerTask } from '../utils/pdfWorker.js';
import { setupToolUI } from '../src/utils/pdfToolsSetup.js';

export function init() {
  setupToolUI({
    toolId: 'watermark',
    title: 'Watermark PDF',
    description: 'Add text watermark to all pages',
    icon: ICONS.watermark,
    actionText: 'Add Watermark',
    instructions: [
      'Upload a PDF file.',
      'Enter watermark text and customize appearance.',
      'Click Add Watermark to apply.',
    ],
    settingsHtml: `
      <div class="settings-panel">
        <div class="setting-group full-width">
          <label class="input-label" for="wm-text">Watermark Text</label>
          <input type="text" id="wm-text" class="text-input" value="CONFIDENTIAL" placeholder="Enter text" />
        </div>
        <div class="setting-group">
          <label class="input-label">Color</label>
          <div class="color-picker-wrapper">
            <input type="color" id="wm-color" class="color-input" value="#ff0000" />
            <span id="wm-color-hex" class="color-hex">#FF0000</span>
          </div>
        </div>
        <div class="setting-group">
          <label class="input-label">Position</label>
          <select id="wm-position" class="select-input">
            <option value="center" selected>Center</option>
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
          </select>
        </div>
        <div class="setting-group">
          <label class="input-label"><span>Size</span> <span id="wm-size-val" style="color:var(--accent)">60px</span></label>
          <input type="range" id="wm-size" class="range-input" min="12" max="150" value="60" />
        </div>
        <div class="setting-group">
          <label class="input-label"><span>Opacity</span> <span id="wm-opacity-val" style="color:var(--accent)">30%</span></label>
          <input type="range" id="wm-opacity" class="range-input" min="5" max="100" value="30" />
        </div>
        <div class="setting-group full-width">
          <label class="input-label"><span>Rotation</span> <span id="wm-rotation-val" style="color:var(--accent)">45 deg</span></label>
          <input type="range" id="wm-rotation" class="range-input" min="-90" max="90" value="45" />
        </div>
      </div>
    `,
    onInit: () => {
      const bind = (id, suffix) => {
        const el = document.getElementById(id);
        const val = document.getElementById(id + '-val');
        if (el && val) el.addEventListener('input', () => { val.textContent = el.value + suffix; });
      };
      bind('wm-size', 'px');
      bind('wm-opacity', '%');
      bind('wm-rotation', ' deg');
      const color = document.getElementById('wm-color');
      const hex = document.getElementById('wm-color-hex');
      if (color && hex) {
        color.addEventListener('input', () => { hex.textContent = color.value.toUpperCase(); });
      }
    },
    onApply: async ({ actualBytes, currentFileName, onProgress }) => {
      const text = document.getElementById('wm-text').value;
      if (!text) throw new Error('Please enter watermark text.');

      const rawColor = document.getElementById('wm-color').value;
      const r = parseInt(rawColor.substr(1, 2), 16) / 255;
      const g = parseInt(rawColor.substr(3, 2), 16) / 255;
      const b = parseInt(rawColor.substr(5, 2), 16) / 255;
      const textSize = parseInt(document.getElementById('wm-size').value, 10);
      const opacity = parseInt(document.getElementById('wm-opacity').value, 10) / 100;
      const rotationDeg = parseInt(document.getElementById('wm-rotation').value, 10);
      const position = document.getElementById('wm-position').value;

      onProgress({ percent: 10, label: 'Adding watermark...' });
      const payload = {
        fileBytes: actualBytes instanceof Uint8Array ? actualBytes : new Uint8Array(actualBytes),
        text, colorRgb: { r, g, b }, opacity, textSize, rotationDeg, position,
      };
      const result = await runPdfWorkerTask('watermark', payload, [payload.fileBytes.buffer], onProgress);
      downloadFile(result, (currentFileName || 'document') + '_watermarked.pdf');
      showSuccess('Watermark added successfully!');
    },
  });
}

export function destroy() {}
