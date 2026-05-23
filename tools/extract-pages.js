import { ICONS } from "../src/ui/icons.js";
import { downloadFile, showSuccess } from '../utils/globals.js';
import { runPdfWorkerTask } from '../utils/pdfWorker.js';
import { setupToolUI } from '../src/utils/pdfToolsSetup.js';

export function init() {
  setupToolUI({
    toolId: 'extract-pages',
    title: 'Extract Pages',
    description: 'Get specific pages as a new PDF document',
    icon: ICONS.extract_pages,
    actionText: 'Extract Pages',
    instructions: [
      'Upload a PDF file.',
      'Enter page numbers to extract (e.g., 1, 3, 5-8).',
      'Click Extract Pages to create new PDF.',
    ],
    settingsHtml: `
      <div class="setting-group full-width">
        <label class="input-label" for="extract-ranges">Pages to Extract</label>
        <input type="text" id="extract-ranges" class="text-input" placeholder="e.g. 1, 3, 5-8" />
        <p style="font-size:0.85rem;color:var(--muted);margin-top:0.5rem;">Separate pages with commas. Use hyphens for ranges.</p>
      </div>
    `,
    onApply: async ({ actualBytes, currentFileName, onProgress }) => {
      const rangesText = document.getElementById('extract-ranges').value.trim();
      if (!rangesText) throw new Error('Please enter pages to extract.');

      onProgress({ percent: 10, label: 'Extracting pages...' });
      const payload = {
        fileBytes: actualBytes instanceof Uint8Array ? actualBytes : new Uint8Array(actualBytes),
        rangesText,
      };
      const result = await runPdfWorkerTask('extract-pages', payload, [payload.fileBytes.buffer], onProgress);
      downloadFile(result, (currentFileName || 'document') + '_extracted.pdf');
      showSuccess('Pages extracted successfully!');
    },
  });
}

export function destroy() {}
