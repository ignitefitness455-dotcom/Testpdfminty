import { ICONS } from "../src/ui/icons.js";
import { downloadFile, showSuccess } from '../utils/globals.js';
import { runPdfWorkerTask } from '../utils/pdfWorker.js';
import { setupToolUI } from '../src/utils/pdfToolsSetup.js';

export function init() {
  setupToolUI({
    toolId: 'unlock',
    title: 'Unlock PDF',
    description: 'Remove password protection from PDF',
    icon: ICONS.unlock,
    actionText: 'Unlock PDF',
    instructions: [
      'Upload a password-protected PDF.',
      'Enter the owner or user password.',
      'Click Unlock PDF to remove protection.',
    ],
    settingsHtml: `
      <div class="settings-panel">
        <div class="setting-group full-width">
          <label class="input-label" for="unlock-password">Password</label>
          <input type="password" id="unlock-password" class="text-input" placeholder="Enter PDF password" autocomplete="off" />
        </div>
      </div>
    `,
    onApply: async ({ actualBytes, currentFileName, onProgress }) => {
      const password = document.getElementById('unlock-password').value;
      if (!password) throw new Error('Please enter the password.');

      onProgress({ percent: 10, label: 'Unlocking PDF...' });

      const payload = {
        fileBytes: actualBytes instanceof Uint8Array ? actualBytes : new Uint8Array(actualBytes),
        password,
      };

      try {
        const result = await runPdfWorkerTask('unlock', payload, [payload.fileBytes.buffer], onProgress);
        downloadFile(result, (currentFileName || 'document') + '_unlocked.pdf');
        showSuccess('PDF unlocked successfully!');
      } catch (e) {
        const msg = e.message?.toLowerCase() || '';
        if (msg.includes('password') || msg.includes('incorrect') || msg.includes('invalidpassword')) {
          throw new Error('Incorrect password. Please check and try again.');
        } else if (msg.includes('not encrypted') || msg.includes('no encryption')) {
          throw new Error('This PDF is not password-protected.');
        } else if (msg.includes('not supported') || msg.includes('algorithm')) {
          throw new Error('This encryption type is not supported. Try a different PDF.');
        }
        throw e;
      }
    },
  });
}

export function destroy() {}
