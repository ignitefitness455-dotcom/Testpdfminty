/**
 * src/utils/pdfEngine.js - PDF-lib wrapper with robust error handling
 */

export class PdfEngine {
  static async loadPdf(bytes, options = {}) {
    const { ignoreEncryption = true, password = undefined } = options;
    try {
      const { PDFDocument } = await import('pdf-lib');
      const loadOptions = { ignoreEncryption };
      if (password) loadOptions.password = password;
      const pdf = await PDFDocument.load(bytes, loadOptions);
      return { success: true, pdf, pageCount: pdf.getPageCount() };
    } catch (error) {
      let message = 'Failed to load PDF.';
      const lowered = (error.message || '').toLowerCase();
      if (lowered.includes('password') || lowered.includes('encrypted')) {
        message = 'This PDF is password-protected. Please use the Unlock tool first.';
      } else if (lowered.includes('corrupt') || lowered.includes('invalid')) {
        message = 'The PDF file appears to be corrupted or invalid.';
      } else if (lowered.includes('version') || lowered.includes('parse')) {
        message = 'This PDF version may not be supported. Try a different file.';
      }
      return { success: false, error, message };
    }
  }

  static async createPdf() {
    const { PDFDocument } = await import('pdf-lib');
    return PDFDocument.create();
  }

  static async savePdf(pdfDoc, options = {}) {
    try {
      const bytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        ...options,
      });
      return { success: true, bytes };
    } catch (error) {
      return { success: false, error, message: 'Failed to save PDF: ' + error.message };
    }
  }

  /**
   * Check if PDF has embedded images.
   */
  static async hasImages(pdfDoc) {
    try {
      const pages = pdfDoc.getPages();
      for (const page of pages) {
        const resources = page.node.Resources?.();
        if (resources?.lookup?.('XObject')) {
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }
}
