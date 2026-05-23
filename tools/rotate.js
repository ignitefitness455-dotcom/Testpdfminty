import { ICONS } from "../src/ui/icons.js";
import { downloadFile, showSuccess } from '../utils/globals.js';
import { runPdfWorkerTask } from '../utils/pdfWorker.js';
import { setupToolUI } from '../src/utils/pdfToolsSetup.js';

export function init() {
  setupToolUI({
    toolId: 'rotate',
    title: 'Rotate PDF',
    description: 'Rotate all pages in your PDF document',
    icon: ICONS.rotate,
    actionText: 'Rotate PDF',
    instructions: [
      'Upload a PDF file.',
      'Select the rotation angle.',
      'Click Rotate PDF to apply.',
    ],
    settingsHtml: `
      <div class="settings-panel">
        <div class="setting-group full-width">
          <label class="input-label">Rotation Angle</label>
          <select id="rotate-angle" class="select-input">
            <option value="90">90° Clockwise</option>
            <option value="-90">90° Counter-Clockwise</option>
            <option value="180">180° (Flip)</option>
          </select>
        </div>
      </div>
    `,
    onApply: async ({ actualBytes, currentFileName, onProgress }) => {
      const angle = parseInt(document.getElementById('rotate-angle').value, 10);
      const payload = {
        fileBytes: actualBytes instanceof Uint8Array ? actualBytes : new Uint8Array(actualBytes),
        degree: angle,
      };
      onProgress({ percent: 10, label: 'Rotating pages...' });
      const result = await runPdfWorkerTask('rotate', payload, [payload.fileBytes.buffer], onProgress);
      downloadFile(result, (currentFileName || 'document') + '_rotated.pdf');
      showSuccess(`PDF rotated ${angle}° successfully!`);
    },
  });
}

export function destroy() {}
