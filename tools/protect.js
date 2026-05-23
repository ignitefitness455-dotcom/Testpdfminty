import { ICONS } from "../src/ui/icons.js";
import { downloadFile, showSuccess } from '../utils/globals.js';
import { runPdfWorkerTask } from '../utils/pdfWorker.js';
import { setupToolUI } from '../src/utils/pdfToolsSetup.js';

function getPasswordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const colors = ['#ef4444', '#ef4444', '#f59e0b', '#10b981', '#10b981', '#059669'];
  return { label: labels[score], color: colors[score], score };
}

export function init() {
  setupToolUI({
    toolId: 'protect',
    title: 'Protect PDF',
    description: 'Add password protection to your PDF document',
    icon: ICONS.protect,
    actionText: 'Protect PDF',
    instructions: [
      'Upload a PDF file.',
      'Enter a strong password (8+ characters recommended).',
      'Click Protect PDF to encrypt.',
    ],
    settingsHtml: `
      <div class="settings-panel">
        <div class="setting-group full-width">
          <label class="input-label" for="protect-password">Password</label>
          <input type="password" id="protect-password" class="text-input" placeholder="Enter password" minlength="1" autocomplete="new-password" />
          <div id="password-strength" style="margin-top:0.5rem;font-size:0.85rem;font-weight:600;display:none;"></div>
          <p style="font-size:0.8rem;color:var(--muted);margin-top:0.25rem;">Use 8+ characters with letters, numbers, and symbols.</p>
        </div>
        <div class="setting-group">
          <label class="input-label">Owner Password (optional)</label>
          <input type="password" id="owner-password" class="text-input" placeholder="Same as above if empty" autocomplete="new-password" />
        </div>
        <div class="setting-group">
          <label class="input-label">Permissions</label>
          <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;color:var(--muted);font-size:0.9rem;">
            <input type="checkbox" id="perm-print" checked /> Allow printing
          </label>
          <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;color:var(--muted);font-size:0.9rem;margin-top:0.25rem;">
            <input type="checkbox" id="perm-copy" /> Allow copying text
          </label>
        </div>
      </div>
    `,
    onInit: () => {
      const pwdInput = document.getElementById('protect-password');
      const strengthEl = document.getElementById('password-strength');
      if (pwdInput && strengthEl) {
        pwdInput.addEventListener('input', () => {
          const pw = pwdInput.value;
          if (pw.length === 0) { strengthEl.style.display = 'none'; return; }
          const s = getPasswordStrength(pw);
          strengthEl.style.display = 'block';
          strengthEl.textContent = `Strength: ${s.label}`;
          strengthEl.style.color = s.color;
        });
      }
    },
    onApply: async ({ actualBytes, currentFileName, onProgress }) => {
      const password = document.getElementById('protect-password').value;
      if (!password) throw new Error('Please enter a password.');
      if (password.length < 4) throw new Error('Password must be at least 4 characters.');

      const ownerPassword = document.getElementById('owner-password').value || password;
      const allowPrint = document.getElementById('perm-print')?.checked ?? true;
      const allowCopy = document.getElementById('perm-copy')?.checked ?? false;

      onProgress({ percent: 10, label: 'Encrypting PDF...' });
      const payload = {
        fileBytes: actualBytes instanceof Uint8Array ? actualBytes : new Uint8Array(actualBytes),
        password,
        ownerPassword,
        permissions: {
          printing: allowPrint ? 'highResolution' : 'none',
          copying: allowCopy,
          modifying: false,
          annotating: false,
        },
      };

      try {
        const result = await runPdfWorkerTask('protect', payload, [payload.fileBytes.buffer], onProgress);
        downloadFile(result, (currentFileName || 'document') + '_protected.pdf');
        showSuccess('PDF protected with password!');
      } catch (e) {
        if (e.message?.includes('encrypted')) {
          throw new Error('Cannot protect an already-encrypted PDF. Unlock it first.');
        }
        throw e;
      }
    },
  });
}

export function destroy() {}
