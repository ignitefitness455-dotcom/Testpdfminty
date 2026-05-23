/**
 * src/utils/fileValidator.js - Comprehensive file validation
 * Fixed CRITICAL-14: Validates PDFs, images, sizes, integrity.
 */

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const LARGE_FILE_THRESHOLD = 50 * 1024 * 1024; // 50MB
const MAX_IMAGE_SIZE = 2000; // 2000px max dimension

export class FileValidator {
  /**
   * Validate a single file.
   */
  static validate(file, options = {}) {
    const { acceptPdf = true, acceptImage = false, maxSize = MAX_FILE_SIZE } = options;

    if (!file || !(file instanceof File)) {
      return { valid: false, reason: 'No file selected.' };
    }

    // Size check
    if (file.size === 0) {
      return { valid: false, reason: 'File is empty.' };
    }
    if (file.size > maxSize) {
      return { valid: false, reason: `File too large. Maximum allowed is ${this._formatBytes(maxSize)}.` };
    }
    if (file.size > LARGE_FILE_THRESHOLD) {
      // Warning but allow
      console.warn('[FileValidator] Large file detected:', file.name, this._formatBytes(file.size));
    }

    // Type check
    const name = file.name.toLowerCase();
    const isPdf = file.type === 'application/pdf' || name.endsWith('.pdf');
    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|bmp|heic)$/i.test(name);

    if (acceptPdf && !acceptImage && !isPdf) {
      return { valid: false, reason: 'Please upload a valid PDF file.' };
    }
    if (!acceptPdf && acceptImage && !isImage) {
      return { valid: false, reason: 'Please upload a valid image file (JPG, PNG, WEBP).' };
    }
    if (acceptPdf && acceptImage && !isPdf && !isImage) {
      return { valid: false, reason: 'Please upload a valid PDF or image file.' };
    }

    return { valid: true, isPdf, isImage, isLarge: file.size > LARGE_FILE_THRESHOLD };
  }

  /**
   * Validate PDF integrity by checking magic bytes.
   */
  static async validatePdfIntegrity(file) {
    try {
      const buffer = await file.slice(0, 8).arrayBuffer();
      const bytes = new Uint8Array(buffer);
      // PDF magic bytes: %PDF-1.x
      const isPdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
      if (!isPdf) {
        return { valid: false, reason: 'File does not appear to be a valid PDF (incorrect file header).' };
      }
      return { valid: true };
    } catch (e) {
      return { valid: false, reason: 'Could not read file for integrity check.' };
    }
  }

  /**
   * Validate image dimensions.
   */
  static async validateImageDimensions(file, maxDim = MAX_IMAGE_SIZE) {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        if (img.width > maxDim || img.height > maxDim) {
          resolve({
            valid: true,
            oversized: true,
            width: img.width,
            height: img.height,
            reason: `Image dimensions (${img.width}x${img.height}) exceed ${maxDim}px. It will be auto-resized.`,
          });
        } else {
          resolve({ valid: true, oversized: false, width: img.width, height: img.height });
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ valid: false, reason: 'Could not read image dimensions.' });
      };
      img.src = url;
    });
  }

  /**
   * Validate all files in a batch.
   */
  static validateBatch(files, options = {}) {
    const results = [];
    for (const file of files) {
      results.push(this.validate(file, options));
    }
    const firstError = results.find((r) => !r.valid);
    if (firstError) {
      return firstError;
    }
    return { valid: true, results };
  }

  static _formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
