import { ICONS } from "../src/ui/icons.js";
import { downloadFile, showSuccess } from '../utils/globals.js';
import { runPdfWorkerTask } from '../utils/pdfWorker.js';
import { setupToolUI } from '../src/utils/pdfToolsSetup.js';

export function init() {
  setupToolUI({
    toolId: 'merge',
    title: 'Merge PDF',
    description: 'Combine multiple PDFs into a single document',
    icon: ICONS.merge,
    actionText: 'Merge PDFs',
    isMultiFile: true,
    acceptPdf: true,
    instructions: [
      'Select multiple PDF files using the file picker or drag & drop.',
      'Add more files if needed using the + Add More button.',
      'Click Merge PDFs to combine all files in order.',
      'Your merged PDF will download automatically.',
    ],
    onApply: async ({ filesArray, currentFileName, onProgress }) => {
      if (filesArray.length < 2) {
        throw new Error('Please add at least 2 PDFs to merge.');
      }

      onProgress({ percent: 10, label: 'Reading files...' });
      const filesData = [];
      const transferables = [];

      for (const f of filesArray) {
        let ab;
        if (f.id) {
          ab = await (await import('../src/core/Database.js')).db.getFile(f.id);
        } else if (f.fileObj) {
          ab = await f.fileObj.arrayBuffer();
        } else if (f.bytes) {
          ab = f.bytes.buffer;
        }
        if (!ab) continue;
        const ua = ab instanceof Uint8Array ? ab : new Uint8Array(ab);
        filesData.push(ua);
        transferables.push(ua.buffer);
      }

      if (filesData.length < 2) {
        throw new Error('Could not read enough valid PDF files.');
      }

      onProgress({ percent: 30, label: `Merging ${filesData.length} files...` });

      const result = await runPdfWorkerTask('merge', { files: filesData }, transferables, onProgress);
      downloadFile(result, 'merged-document.pdf');
      showSuccess(`${filesData.length} PDFs merged successfully!`);
    },
  });
}

export function destroy() {}
