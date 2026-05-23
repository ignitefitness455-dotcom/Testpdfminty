/**
 * src/utils/fileHandler.js - File handling with drag-drop support
 */

export const FileHandler = {
  validateFile(file, options = {}) {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|webp|gif|bmp|heic)$/i);

    if (file.size > 500 * 1024 * 1024) {
      return { valid: false, reason: 'File too large. Maximum is 500MB.' };
    }

    const acceptImageTool = options.acceptImage !== false;
    const acceptPdfTool = options.acceptPdf !== false;

    if (acceptPdfTool && !acceptImageTool && !isPdf) {
      return { valid: false, reason: 'Please upload a valid PDF file.' };
    }
    if (!acceptPdfTool && acceptImageTool && !isImage) {
      return { valid: false, reason: 'Please upload a valid image file (JPG, PNG, WEBP).' };
    }
    if (acceptPdfTool && acceptImageTool && !isPdf && !isImage) {
      return { valid: false, reason: 'Please upload a valid PDF or image file.' };
    }

    return { valid: true, isPdf, isImage };
  },

  async readFileAsArrayBuffer(file) {
    if (file.arrayBuffer) {
      return await file.arrayBuffer();
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  },

  initDropZone(zoneId, inputId, onFiles, accept = '.pdf') {
    const zone = document.getElementById(zoneId);
    const input = document.getElementById(inputId);
    if (!zone || !input) return;

    if (accept) input.accept = accept;
    zone.classList.add('drop-zone-enhanced');

    // Click to browse
    zone.addEventListener('click', (e) => {
      if (e.target !== input && !e.target.closest('input')) {
        input.click();
      }
    });

    // Keyboard support
    zone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        input.click();
      }
    });

    // Drag & drop
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.add('drag-active');
    });

    zone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      if (!zone.contains(e.relatedTarget)) {
        zone.classList.remove('drag-active');
      }
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.remove('drag-active');
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        onFiles(Array.from(files));
        input.value = '';
      }
    });

    // File input change
    input.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        onFiles(Array.from(e.target.files));
        input.value = '';
      }
    });
  },
};
