import { ICONS } from "../src/ui/icons.js";
import { downloadFile, showSuccess } from '../utils/globals.js';
import { runPdfWorkerTask } from '../utils/pdfWorker.js';
import { setupToolUI } from '../src/utils/pdfToolsSetup.js';

export function init() {
  setupToolUI({
    toolId: 'split',
    title: 'Split PDF',
    description: 'Extract pages or split into multiple files',
    icon: ICONS.split,
    actionText: 'Split PDF',
    instructions: [
      'Upload a PDF file.',
      'Enter page ranges (e.g., 1-3, 5, 7-9).',
      'Each range becomes a separate PDF in a ZIP file.',
    ],
    settingsHtml: `
      <div class="setting-group full-width">
        <label class="input-label" for="split-ranges">Page Ranges</label>
        <input type="text" id="split-ranges" class="text-input" placeholder="e.g. 1-3, 5, 7-9" />
        <p style="font-size:0.85rem;color:var(--muted);margin-top:0.5rem;">Separate ranges with commas. Each range becomes a separate PDF.</p>
      </div>
    `,
    onApply: async ({ actualBytes, currentFileName, onProgress }) => {
      const rangesText = document.getElementById('split-ranges').value.trim();
      if (!rangesText) throw new Error('Please enter page ranges to split.');

      const ranges = [];
      for (const p of rangesText.split(',')) {
        const pt = p.trim();
        if (pt.includes('-')) {
          const [s, e] = pt.split('-').map(Number);
          if (s && e) ranges.push({ start: s, end: e });
        } else if (!isNaN(Number(pt))) {
          const n = Number(pt);
          ranges.push({ start: n, end: n });
        }
      }
      if (ranges.length === 0) throw new Error('Invalid page ranges.');

      onProgress({ percent: 10, label: 'Loading PDF...' });
      const payload = {
        fileBytes: actualBytes instanceof Uint8Array ? actualBytes : new Uint8Array(actualBytes),
        ranges,
        fileName: currentFileName || 'document',
      };

      const results = await runPdfWorkerTask('split', payload, [payload.fileBytes.buffer], onProgress);

      if (results.length === 1) {
        downloadFile(results[0].bytes, results[0].name);
      } else {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        results.forEach((r) => zip.file(r.name, r.bytes));
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (currentFileName || 'document') + '_split.zip';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      showSuccess(`PDF split into ${results.length} file(s)!`);
    },
  });
}

export function destroy() {}
