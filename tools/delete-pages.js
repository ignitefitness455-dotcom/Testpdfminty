import { ICONS } from "../src/ui/icons.js";
import { downloadFile, showSuccess } from '../utils/globals.js';
import { runPdfWorkerTask } from '../utils/pdfWorker.js';
import { setupToolUI } from '../src/utils/pdfToolsSetup.js';

export function init() {
  setupToolUI({
    toolId: 'delete-pages',
    title: 'Delete Pages',
    description: 'Remove unwanted pages from your PDF',
    icon: ICONS.delete_pages,
    actionText: 'Delete Pages',
    instructions: [
      'Upload a PDF file.',
      'Enter page numbers to delete (e.g., 2, 5-7).',
      'Click Delete Pages to remove them.',
    ],
    settingsHtml: `
      <div class="setting-group full-width">
        <label class="input-label" for="delete-ranges">Pages to Delete</label>
        <input type="text" id="delete-ranges" class="text-input" placeholder="e.g. 2, 5-7, 10" />
        <p style="font-size:0.85rem;color:var(--muted);margin-top:0.5rem;">Separate pages with commas. Use hyphens for ranges.</p>
      </div>
    `,
    onApply: async ({ actualBytes, currentFileName, onProgress }) => {
      const rangesText = document.getElementById('delete-ranges').value.trim();
      if (!rangesText) throw new Error('Please enter pages to delete.');

      onProgress({ percent: 10, label: 'Deleting pages...' });
      const payload = {
        fileBytes: actualBytes instanceof Uint8Array ? actualBytes : new Uint8Array(actualBytes),
        rangesText,
      };
      const result = await runPdfWorkerTask('delete-pages', payload, [payload.fileBytes.buffer], onProgress);
      downloadFile(result, (currentFileName || 'document') + '_deleted.pdf');
      showSuccess('Pages deleted successfully!');
    },
  });
}

export function destroy() {}
