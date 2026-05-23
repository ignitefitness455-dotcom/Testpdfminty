import { ICONS } from "../src/ui/icons.js";
import { downloadFile, showSuccess } from '../utils/globals.js';
import { setupToolUI } from '../src/utils/pdfToolsSetup.js';

const MM_TO_PT = 2.835;

export function init() {
  setupToolUI({
    toolId: 'crop-resize',
    title: 'Crop & Resize PDF',
    description: 'Adjust margins or change page dimensions',
    icon: ICONS.crop_resize,
    actionText: 'Apply Changes',
    instructions: [
      'Upload a PDF file.',
      'Choose Crop or Resize mode.',
      'Adjust values and click Apply.',
    ],
    settingsHtml: `
      <div class="settings-panel">
        <div class="setting-group full-width">
          <label class="input-label">Mode</label>
          <div style="display:flex;gap:1rem;">
            <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;">
              <input type="radio" name="cr-mode" value="crop" checked /> Crop (adjust margins)
            </label>
            <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;">
              <input type="radio" name="cr-mode" value="resize" /> Resize (change dimensions)
            </label>
          </div>
        </div>
        <div id="crop-settings">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
            <div class="setting-group">
              <label class="input-label">Top Margin (mm)</label>
              <input type="number" id="crop-top" class="number-input" value="0" min="0" />
            </div>
            <div class="setting-group">
              <label class="input-label">Bottom Margin (mm)</label>
              <input type="number" id="crop-bottom" class="number-input" value="0" min="0" />
            </div>
            <div class="setting-group">
              <label class="input-label">Left Margin (mm)</label>
              <input type="number" id="crop-left" class="number-input" value="0" min="0" />
            </div>
            <div class="setting-group">
              <label class="input-label">Right Margin (mm)</label>
              <input type="number" id="crop-right" class="number-input" value="0" min="0" />
            </div>
          </div>
        </div>
        <div id="resize-settings" style="display:none;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
            <div class="setting-group">
              <label class="input-label">Width (mm)</label>
              <input type="number" id="resize-w" class="number-input" value="210" min="10" />
            </div>
            <div class="setting-group">
              <label class="input-label">Height (mm)</label>
              <input type="number" id="resize-h" class="number-input" value="297" min="10" />
            </div>
          </div>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.75rem;">
            <button type="button" class="btn-shortcut" onclick="document.getElementById('resize-w').value=210;document.getElementById('resize-h').value=297;">A4</button>
            <button type="button" class="btn-shortcut" onclick="document.getElementById('resize-w').value=216;document.getElementById('resize-h').value=279;">Letter</button>
          </div>
        </div>
      </div>
    `,
    onInit: () => {
      document.querySelectorAll('input[name="cr-mode"]').forEach((r) => {
        r.addEventListener('change', () => {
          const isCrop = document.querySelector('input[name="cr-mode"]:checked').value === 'crop';
          document.getElementById('crop-settings').style.display = isCrop ? 'block' : 'none';
          document.getElementById('resize-settings').style.display = isCrop ? 'none' : 'block';
        });
      });
    },
    onApply: async ({ actualBytes, currentFileName, onProgress }) => {
      const mode = document.querySelector('input[name="cr-mode"]:checked').value;
      const { PDFDocument, degrees } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.load(actualBytes, { ignoreEncryption: true });

      onProgress({ percent: 20, label: 'Applying changes...' });

      if (mode === 'crop') {
        const top = parseFloat(document.getElementById('crop-top').value) || 0;
        const bottom = parseFloat(document.getElementById('crop-bottom').value) || 0;
        const left = parseFloat(document.getElementById('crop-left').value) || 0;
        const right = parseFloat(document.getElementById('crop-right').value) || 0;

        for (const page of pdfDoc.getPages()) {
          const box = page.getCropBox() || page.getMediaBox();
          const newX = box.x + left * MM_TO_PT;
          const newY = box.y + bottom * MM_TO_PT;
          const newW = box.width - (left + right) * MM_TO_PT;
          const newH = box.height - (top + bottom) * MM_TO_PT;
          if (newW <= 0 || newH <= 0) throw new Error('Margins too large for page dimensions.');
          page.setCropBox(newX, newY, newW, newH);
        }
      } else {
        const w = parseFloat(document.getElementById('resize-w').value) || 210;
        const h = parseFloat(document.getElementById('resize-h').value) || 297;
        if (w <= 0 || h <= 0) throw new Error('Invalid dimensions.');

        const newDoc = await PDFDocument.create();
        const srcPages = pdfDoc.getPages();
        const targetW = w * MM_TO_PT;
        const targetH = h * MM_TO_PT;

        // Process in batches to avoid memory issues
        for (let i = 0; i < srcPages.length; i += 5) {
          const batch = srcPages.slice(i, i + 5);
          const embedded = await newDoc.embedPages(batch);
          for (let j = 0; j < batch.length; j++) {
            const newPage = newDoc.addPage([targetW, targetH]);
            const origSize = batch[j].getSize();
            const scale = Math.min(targetW / origSize.width, targetH / origSize.height);
            const drawW = origSize.width * scale;
            const drawH = origSize.height * scale;
            newPage.drawPage(embedded[j], {
              x: (targetW - drawW) / 2,
              y: (targetH - drawH) / 2,
              width: drawW,
              height: drawH,
            });
          }
          onProgress({ percent: 20 + (i / srcPages.length) * 60, label: `Resizing page ${i + 1}...` });
        }

        const result = await newDoc.save({ useObjectStreams: true });
        downloadFile(result, `${currentFileName || 'document'}_resized.pdf`);
        showSuccess('PDF resized successfully!');
        return;
      }

      const result = await pdfDoc.save({ useObjectStreams: true });
      downloadFile(result, `${currentFileName || 'document'}_cropped.pdf`);
      showSuccess('PDF cropped successfully!');
    },
  });
}

export function destroy() {}
