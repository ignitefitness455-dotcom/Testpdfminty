import { ICONS } from "../src/ui/icons.js";
import { downloadFile, showSuccess } from '../utils/globals.js';
import { runPdfWorkerTask } from '../utils/pdfWorker.js';
import { setupToolUI } from '../src/utils/pdfToolsSetup.js';
import { PdfEngine } from '../src/utils/pdfEngine.js';

export function init() {
  setupToolUI({
    toolId: 'add-blank-page',
    title: 'Add Blank Page',
    description: 'Insert blank pages into your PDF',
    icon: ICONS.add_blank_page,
    actionText: 'Add Blank Pages',
    instructions: [
      'Upload a PDF file.',
      'Specify position and number of blank pages.',
      'Click Add Blank Pages.',
    ],
    settingsHtml: `
      <div class="settings-panel">
        <div class="setting-group">
          <label class="input-label" for="blank-count">Number of Pages</label>
          <input type="number" id="blank-count" class="number-input" value="1" min="1" max="20" />
        </div>
        <div class="setting-group">
          <label class="input-label" for="blank-position">Insert After Page</label>
          <input type="number" id="blank-position" class="number-input" value="0" min="0" />
          <p style="font-size:0.8rem;color:var(--muted);">Use 0 to insert at beginning.</p>
        </div>
        <div class="setting-group">
          <label class="input-label">Page Size</label>
          <select id="blank-size" class="select-input">
            <option value="same" selected>Same as document</option>
            <option value="a4">A4</option>
            <option value="letter">Letter</option>
          </select>
        </div>
      </div>
    `,
    onApply: async ({ actualBytes, currentFileName, onProgress }) => {
      const count = parseInt(document.getElementById('blank-count').value, 10);
      const position = parseInt(document.getElementById('blank-position').value, 10);
      const sizeType = document.getElementById('blank-size').value;

      if (isNaN(count) || count < 1 || count > 20) throw new Error('Enter 1-20 blank pages.');

      let dims = [595.28, 841.89]; // A4 default
      if (sizeType === 'same') {
        const engine = await PdfEngine.loadPdf(actualBytes);
        if (engine.success) {
          const pages = engine.pdf.getPages();
          if (pages.length > 0) {
            const { width, height } = pages[0].getSize();
            dims = [width, height];
          }
        }
      } else if (sizeType === 'letter') {
        dims = [612.0, 792.0];
      }

      onProgress({ percent: 10, label: 'Inserting blank pages...' });
      const payload = {
        fileBytes: actualBytes instanceof Uint8Array ? actualBytes : new Uint8Array(actualBytes),
        count, insertIndex: position, dims,
      };
      const result = await runPdfWorkerTask('add-blank-page', payload, [payload.fileBytes.buffer], onProgress);
      downloadFile(result, (currentFileName || 'document') + '_blank_added.pdf');
      showSuccess(`${count} blank page(s) added!`);
    },
  });
}

export function destroy() {}
