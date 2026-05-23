import { PDFDocument } from 'pdf-lib';

export async function executeCompress(payload, postMessage) {
  const { fileBytes, quality, scale, method } = payload;
  postMessage({ id: payload.id, status: 'progress', progress: 10, type: 'progress', percent: 10, label: 'Loading PDF...' });

  const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
  const pageCount = pdfDoc.getPageCount();

  if (method === 'objectstreams') {
    // Simple optimization: metadata cleanup + object streams
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setProducer('PDFMinty');
    pdfDoc.setCreator('PDFMinty');
    postMessage({ id: payload.id, status: 'progress', progress: 90, type: 'progress', percent: 90, label: 'Saving...' });
    return await pdfDoc.save({ useObjectStreams: true });
  }

  // Full resample: render pages to images and re-embed
  // Note: pdf-lib cannot directly re-embed images with compression.
  // We use metadata optimization + object streams for pure pdf-lib approach.
  // For actual image re-encoding, we need canvas in main thread.
  // This worker does the best possible with pdf-lib alone.
  pdfDoc.setTitle('');
  pdfDoc.setAuthor('');
  pdfDoc.setSubject('');
  pdfDoc.setProducer('PDFMinty');
  pdfDoc.setCreator('PDFMinty');

  // Try to remove duplicate objects (pdf-lib does this automatically with useObjectStreams)
  postMessage({ id: payload.id, status: 'progress', progress: 80, type: 'progress', percent: 80, label: 'Optimizing structure...' });
  const result = await pdfDoc.save({ useObjectStreams: true });
  postMessage({ id: payload.id, status: 'progress', progress: 100, type: 'progress', percent: 100, label: 'Complete' });
  return result;
}

if (typeof self !== 'undefined' && self.postMessage) {
  self.onmessage = async (e) => {
    const { id, payload } = e.data;
    try {
      const result = await executeCompress(payload, (msg) => self.postMessage(msg));
      self.postMessage({ id, status: 'success', result }, [result.buffer]);
    } catch (err) {
      self.postMessage({ id, status: 'error', error: { errorType: err.name || 'Error', message: err.message, stack: err.stack } });
    }
  };
}
