import { ICONS } from "../src/ui/icons.js";
import { downloadFile, showSuccess } from '../utils/globals.js';
import { runPdfWorkerTask } from '../utils/pdfWorker.js';
import { setupToolUI } from '../src/utils/pdfToolsSetup.js';
import { FileValidator } from '../src/utils/fileValidator.js';

const MAX_IMAGE_SIZE = 2000;
const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/heic'];

export function init() {
  setupToolUI({
    toolId: 'image-to-pdf',
    title: 'Image to PDF',
    description: 'Convert JPG, PNG, WEBP images to PDF',
    icon: ICONS.image_to_pdf,
    actionText: 'Convert to PDF',
    isMultiFile: true,
    acceptPdf: false,
    acceptImage: true,
    instructions: [
      'Select one or more images (JPG, PNG, WEBP supported).',
      'Large images will be automatically resized.',
      'Choose page size and orientation.',
      'Click Convert to PDF.',
    ],
    settingsHtml: `
      <div class="settings-panel">
        <div class="setting-group">
          <label class="input-label">Page Size</label>
          <select id="page-size" class="select-input">
            <option value="a4" selected>A4 (210 x 297 mm)</option>
            <option value="letter">Letter (216 x 279 mm)</option>
            <option value="fit">Fit to Image</option>
          </select>
        </div>
        <div class="setting-group">
          <label class="input-label">Orientation</label>
          <select id="orientation" class="select-input">
            <option value="auto" selected>Auto (match image)</option>
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </div>
        <div class="setting-group">
          <label class="input-label"><span>Quality</span> <span id="img-quality-val" style="color:var(--accent)">85%</span></label>
          <input type="range" id="img-quality" class="range-input" min="50" max="100" value="85" />
        </div>
        <div class="setting-group">
          <label class="input-label">Margin</label>
          <select id="img-margin" class="select-input">
            <option value="0">None</option>
            <option value="10" selected>Small (10mm)</option>
            <option value="20">Medium (20mm)</option>
          </select>
        </div>
      </div>
    `,
    onInit: () => {
      const slider = document.getElementById('img-quality');
      const val = document.getElementById('img-quality-val');
      if (slider && val) {
        slider.addEventListener('input', (e) => { val.textContent = e.target.value + '%'; });
      }
    },
    onApply: async ({ filesArray, onProgress }) => {
      if (filesArray.length === 0) throw new Error('Please add at least one image.');

      const pageSize = document.getElementById('page-size')?.value || 'a4';
      const orientation = document.getElementById('orientation')?.value || 'auto';
      const quality = parseInt(document.getElementById('img-quality')?.value || '85', 10) / 100;
      const margin = parseInt(document.getElementById('img-margin')?.value || '10', 10);

      onProgress({ percent: 5, label: 'Reading images...' });

      // Validate and read all images
      const fileDatas = [];
      const transferables = [];

      for (let i = 0; i < filesArray.length; i++) {
        const item = filesArray[i];
        onProgress({ percent: 5 + (i / filesArray.length) * 20, label: `Reading ${item.name}...` });

        const validation = FileValidator.validate(item.fileObj || item, { acceptImage: true });
        if (!validation.valid) throw new Error(validation.reason);

        // Check dimensions
        const dimCheck = await FileValidator.validateImageDimensions(item.fileObj || item, MAX_IMAGE_SIZE);
        if (!dimCheck.valid) throw new Error(dimCheck.reason);

        const buffer = await (item.fileObj || item).arrayBuffer();
        const type = (item.fileObj || item).type || 'image/jpeg';
        const bytes = new Uint8Array(buffer);
        fileDatas.push({ bytes, type, name: item.name, oversized: dimCheck.oversized });
        transferables.push(bytes.buffer);
      }

      onProgress({ percent: 30, label: 'Converting to PDF...' });

      const payload = {
        files: fileDatas,
        pageSize,
        orientation,
        quality,
        margin,
      };

      const result = await runPdfWorkerTask('image-to-pdf', payload, transferables, onProgress);
      downloadFile(result, 'images-converted.pdf');
      showSuccess(`${filesArray.length} image(s) converted to PDF!`);
    },
  });
}

export function destroy() {}
