import { ICONS } from "../src/ui/icons.js";
import { downloadFile, showSuccess } from '../utils/globals.js';
import { runPdfWorkerTask } from '../utils/pdfWorker.js';
import { setupToolUI } from '../src/utils/pdfToolsSetup.js';

export function init() {
  setupToolUI({
    toolId: 'reorder',
    title: 'Reorder PDF',
    description: 'Change the order of pages in your PDF',
    icon: ICONS.reorder,
    actionText: 'Reorder PDF',
    instructions: [
      'Upload a PDF file.',
      'Enter new page order (e.g., 3,1,2,4).',
      'Click Reorder PDF to rearrange.',
    ],
    settingsHtml: `
      <div class="setting-group full-width">
        <label class="input-label" for="page-order">New Page Order</label>
        <input type="text" id="page-order" class="text-input" placeholder="e.g. 3, 1, 2, 4" />
        <p style="font-size:0.85rem;color:var(--muted);margin-top:0.5rem;">Enter page numbers separated by commas.</p>
      </div>
    `,
    onApply: async ({ actualBytes, currentFileName, onProgress }) => {
      const input = document.getElementById('page-order').value.trim();
      if (!input) throw new Error('Please enter the new page order.');

      const order = input.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n) && n > 0);
      if (order.length === 0) throw new Error('Invalid page order.');

      onProgress({ percent: 10, label: 'Reordering pages...' });
      const payload = {
        fileBytes: actualBytes instanceof Uint8Array ? actualBytes : new Uint8Array(actualBytes),
        newOrder: order,
      };
      const result = await runPdfWorkerTask('reorder', payload, [payload.fileBytes.buffer], onProgress);
      downloadFile(result, (currentFileName || 'document') + '_reordered.pdf');
      showSuccess('Pages reordered successfully!');
    },
  });
}

export function destroy() {}
