import { PDFDocument } from 'pdf-lib';

export async function executeAddBlankPage(payload, postMessage) {
  postMessage({ id: payload.id, status: 'progress', progress: 10, type: 'progress', percent: 10, label: 'Loading PDF...' });
  const pdfDoc = await PDFDocument.load(payload.fileBytes, { ignoreEncryption: true });
  const totalPages = pdfDoc.getPageCount();
  let insertIndex = payload.insertIndex || 0;
  if (insertIndex < 0) insertIndex = 0;
  if (insertIndex > totalPages) insertIndex = totalPages;
  for (let i = 0; i < payload.count; i++) {
    pdfDoc.insertPage(insertIndex + i, payload.dims || [595.28, 841.89]);
  }
  postMessage({ id: payload.id, status: 'progress', progress: 80, type: 'progress', percent: 80, label: 'Saving...' });
  return await pdfDoc.save({ useObjectStreams: true });
}

if (typeof self !== 'undefined' && self.postMessage) {
  self.onmessage = async (e) => {
    const { id, payload } = e.data;
    try {
      const result = await executeAddBlankPage(payload, (msg) => self.postMessage(msg));
      self.postMessage({ id, status: 'success', result }, [result.buffer]);
    } catch (err) {
      self.postMessage({ id, status: 'error', error: { errorType: err.name || 'Error', message: err.message, stack: err.stack } });
    }
  };
}
