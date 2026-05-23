/**
 * src/utils/pdfToolsSetup.js - Standardized tool UI setup
 * Fixed CRITICAL-15: Progress tracking for all tools.
 */

import { FileHandler } from './fileHandler.js';
import { db } from '../core/Database.js';
import { ToastManager } from './ToastManager.js';
import { formatBytes, renderPdfThumbnail } from './fileUtils.js';
import { FileValidator } from './fileValidator.js';
import { ProgressTracker } from './progressTracker.js';

const singleFilePreviewHtml = `
  <div class="file-info">
    <img id="file-preview-img" loading="lazy" alt="" style="width:60px;height:80px;object-fit:cover;border-radius:8px;border:1px solid var(--border);"
      src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='1.5'%3E%3Cpath d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/%3E%3Cpolyline points='14 2 14 8 20 8'/%3E%3C/svg%3E" />
    <div class="file-info-meta">
      <span id="file-name-display" class="file-name"></span>
      <div class="file-info-badges">
        <span id="page-count-display" class="page-count-badge" style="display:none;"></span>
        <span id="file-size-display" class="file-size-badge"></span>
      </div>
    </div>
    <button id="remove-file-btn" class="remove-btn" title="Remove file" aria-label="Remove selected file" type="button">&#10005;</button>
  </div>
`;

export function renderToolBase({ title, description, icon, dropText, extraWorkspaceHtml, actionText, instructions }) {
  const instructionsHtml = instructions?.length ? `
    <div class="instructions-section">
      <h3>How to use this tool</h3>
      <ol>${instructions.map(inst => `<li>${inst}</li>`).join('')}</ol>
    </div>
  ` : '';

  const acceptAttr = title.includes('Image') && !title.includes('PDF to') ? 'image/*' : '.pdf';
  const multipleAttr = title.includes('Merge') || (title.includes('Image') && title.includes('PDF')) ? 'multiple' : '';

  return `
    <div class="tool-container">
      <a id="btn-back" class="back-link" href="/" aria-label="Go back to home page">&#8249; Back</a>
      <div class="tool-header">
        <h1>${title}</h1>
        <p>${description}</p>
      </div>
      <label id="drop-zone" tabindex="0" role="button"
        aria-label="File upload: ${dropText || 'Drag and drop a file here, or click to browse'}"
        style="display:block;border:2px dashed var(--primary);padding:4rem 2rem;text-align:center;border-radius:1rem;cursor:pointer;background:var(--card);transition:border-color 0.2s;">
        <input type="file" id="file-input" aria-hidden="true" tabindex="-1" accept="${acceptAttr}" style="display:none;" ${multipleAttr} />
        <div class="tool-hero-icon" aria-hidden="true">${icon}</div>
        <p style="font-size:1.25rem;margin:0;font-weight:500;">${dropText || 'Drag & drop a file here, or click to select'}</p>
        <p style="font-size:0.85rem;color:var(--muted);margin-top:0.5rem;">Maximum file size: 500MB</p>
      </label>
      <p style="text-align:center;color:var(--muted);font-size:0.85rem;margin-top:1rem;">&#128274; No upload. No servers. 100% private.</p>
      <div id="workspace" class="workspace hidden" role="region" aria-label="Tool workspace">
        ${extraWorkspaceHtml}
        <div class="actions">
          <button id="btn-apply" class="btn-action" type="button">${actionText}</button>
        </div>
        <div id="progress-tracker" class="progress-tracker hidden" role="status" aria-live="polite" aria-atomic="true">
          <div class="progress-tracker-bar"><div id="progress-tracker-fill" style="width:0%"></div></div>
          <span id="progress-tracker-label">Ready</span>
        </div>
      </div>
      ${instructionsHtml}
    </div>
  `;
}

/**
 * Standardized tool UI setup.
 * All tools follow: init -> validate -> process -> cleanup.
 */
export function setupToolUI({
  toolId,
  title,
  description,
  icon,
  actionText,
  isMultiFile = false,
  settingsHtml = '',
  instructions = [],
  onInit = null,
  onApply = null,
  acceptPdf = true,
  acceptImage = false,
}) {
  const appContainer = document.getElementById('app') || document.querySelector('main') || document.body;
  const fileListHtml = isMultiFile
    ? '<p class="file-list-hint">Files will be processed in the order shown.</p><div id="file-list" class="file-list"></div><div class="actions"><button id="btn-add-more" class="btn-secondary" type="button">&#43; Add More</button></div>'
    : singleFilePreviewHtml;

  appContainer.innerHTML = renderToolBase({
    title, description, icon, actionText,
    extraWorkspaceHtml: fileListHtml + (settingsHtml || ''),
    instructions,
  });

  let originalPdfBytes = null;
  let currentFileName = '';
  let filesArray = [];
  let isProcessing = false;

  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const workspace = document.getElementById('workspace');
  const progressTracker = document.getElementById('progress-tracker');
  const progressFill = document.getElementById('progress-tracker-fill');
  const progressLabel = document.getElementById('progress-tracker-label');

  function updateProgress(data) {
    const pct = typeof data === 'object' ? (data.percent ?? data.progress ?? 0) : data;
    const label = typeof data === 'object' ? (data.label ?? 'Processing...') : 'Processing...';
    if (progressTracker) progressTracker.classList.remove('hidden');
    if (progressFill) progressFill.style.width = Math.min(100, Math.max(0, pct)) + '%';
    if (progressLabel) progressLabel.textContent = label;
  }

  function resetProgress() {
    if (progressTracker) progressTracker.classList.add('hidden');
    if (progressFill) progressFill.style.width = '0%';
    if (progressLabel) progressLabel.textContent = 'Ready';
  }

  // Initialize custom onInit
  if (onInit) {
    try {
      onInit();
    } catch (e) {
      console.error('onInit error:', e);
    }
  }

  const acceptTypes = acceptImage && !acceptPdf ? 'image/*' : (acceptPdf && !acceptImage ? '.pdf' : '.pdf,image/*');

  FileHandler.initDropZone('drop-zone', 'file-input', handleFiles, acceptTypes);

  if (isMultiFile) {
    document.getElementById('btn-add-more')?.addEventListener('click', () => fileInput?.click());
  }

  async function handleFiles(files) {
    if (!files || files.length === 0) return;
    if (isProcessing) {
      ToastManager.warning('Please wait for the current operation to finish.');
      return;
    }

    // Validate all files
    for (const f of files) {
      const result = FileValidator.validate(f, { acceptPdf, acceptImage });
      if (!result.valid) {
        ToastManager.error(result.reason);
        return;
      }
    }

    // Validate PDF integrity for single-file tools
    if (!isMultiFile && files[0] && acceptPdf) {
      const integrity = await FileValidator.validatePdfIntegrity(files[0]);
      if (!integrity.valid) {
        ToastManager.error(integrity.reason);
        return;
      }
    }

    if (!isMultiFile) {
      const file = files[0];
      try {
        updateProgress({ percent: 10, label: 'Reading file...' });
        const ab = await FileHandler.readFileAsArrayBuffer(file);
        try {
          await db.saveFile(toolId + '_target', ab);
          originalPdfBytes = toolId + '_target';
        } catch (e) {
          originalPdfBytes = ab;
        }
        currentFileName = file.name.replace(/\.[^/.]+$/, '');

        document.getElementById('file-name-display').textContent = file.name;
        document.getElementById('file-size-display').textContent = formatBytes(file.size);

        const imgEl = document.getElementById('file-preview-img');
        if (imgEl && file.type === 'application/pdf') {
          renderPdfThumbnail(file, imgEl);
        } else if (imgEl && file.type.startsWith('image/')) {
          const url = URL.createObjectURL(file);
          imgEl.src = url;
          imgEl.onload = () => URL.revokeObjectURL(url);
        }

        dropZone.classList.add('hidden');
        workspace.classList.remove('hidden');
        resetProgress();
      } catch (err) {
        ToastManager.error('Failed to read file: ' + err.message);
      }
    } else {
      // Multi-file
      try {
        const mapped = await Promise.all(
          Array.from(files).map(async (file) => {
            const ab = await FileHandler.readFileAsArrayBuffer(file);
            const id = toolId + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            try {
              await db.saveFile(id, ab);
              return { name: file.name, id, fileObj: file };
            } catch {
              return { name: file.name, id: null, fileObj: file, bytes: ab };
            }
          })
        );
        filesArray = filesArray.concat(mapped);
        renderFileList();
        dropZone.classList.add('hidden');
        workspace.classList.remove('hidden');
      } catch (err) {
        ToastManager.error('Failed to process files: ' + err.message);
      }
    }
  }

  function renderFileList() {
    if (!isMultiFile) return;
    const list = document.getElementById('file-list');
    if (!list) return;
    list.innerHTML = '';
    filesArray.forEach((file, idx) => {
      const item = document.createElement('div');
      item.className = 'file-item';
      if (file.fileObj?.type?.startsWith('image/')) {
        const img = document.createElement('img');
        const r = new FileReader();
        r.onload = (e) => { img.src = e.target.result; };
        r.readAsDataURL(file.fileObj);
        item.appendChild(img);
      }
      const badge = document.createElement('div');
      badge.className = 'file-name-badge';
      badge.textContent = file.name;
      const btn = document.createElement('button');
      btn.className = 'remove-btn';
      btn.innerHTML = '&#10005;';
      btn.type = 'button';
      btn.setAttribute('aria-label', `Remove ${file.name}`);
      btn.addEventListener('click', () => {
        const removed = filesArray.splice(idx, 1)[0];
        if (removed?.id) db.deleteFile(removed.id).catch(() => {});
        renderFileList();
        if (filesArray.length === 0) {
          workspace.classList.add('hidden');
          dropZone.classList.remove('hidden');
        }
      });
      item.appendChild(badge);
      item.appendChild(btn);
      list.appendChild(item);
    });
  }

  // Remove single file
  document.getElementById('remove-file-btn')?.addEventListener('click', () => {
    originalPdfBytes = null;
    currentFileName = '';
    if (fileInput) fileInput.value = '';
    workspace.classList.add('hidden');
    dropZone.classList.remove('hidden');
    resetProgress();
  });

  // Apply button
  const btnApply = document.getElementById('btn-apply');
  if (btnApply && onApply) {
    btnApply.addEventListener('click', async () => {
      if (isProcessing) return;
      isProcessing = true;

      if (!isMultiFile && !originalPdfBytes) {
        ToastManager.error('Please select a file first.');
        isProcessing = false;
        return;
      }
      if (isMultiFile && filesArray.length === 0) {
        ToastManager.error('Please add at least one file.');
        isProcessing = false;
        return;
      }

      const originalText = btnApply.textContent;
      btnApply.disabled = true;
      btnApply.textContent = 'Processing...';
      btnApply.setAttribute('aria-busy', 'true');
      updateProgress({ percent: 10, label: 'Starting...' });

      try {
        let actualBytes;
        if (!isMultiFile && originalPdfBytes) {
          if (typeof originalPdfBytes === 'string') {
            const ab = await db.getFile(originalPdfBytes);
            actualBytes = ab ? new Uint8Array(ab) : null;
          } else {
            actualBytes = new Uint8Array(originalPdfBytes);
          }
        }

        await onApply({
          actualBytes,
          currentFileName,
          filesArray,
          onProgress: updateProgress,
        });

        updateProgress({ percent: 100, label: 'Complete!' });
        if (window.PdfMintyAnalytics) {
          window.PdfMintyAnalytics.track('tool_completed', { tool: toolId });
        }
      } catch (error) {
        console.error(`[${toolId}] Error:`, error);
        ToastManager.error(error);
        updateProgress({ percent: 0, label: 'Failed' });
        if (window.PdfMintyAnalytics) {
          window.PdfMintyAnalytics.track('tool_failed', { tool: toolId, error: error?.message });
        }
      } finally {
        btnApply.disabled = false;
        btnApply.textContent = originalText;
        btnApply.setAttribute('aria-busy', 'false');
        setTimeout(resetProgress, 2000);
        isProcessing = false;
      }
    });
  }

  // Keyboard shortcut: Escape to go back
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const back = document.getElementById('btn-back');
      if (back && !isProcessing) back.click();
    }
  });

  // Focus first element
  const firstFocusable = appContainer.querySelector('input, select, button:not([tabindex="-1"])');
  if (firstFocusable && document.activeElement === document.body) {
    setTimeout(() => firstFocusable.focus(), 50);
  }
}
