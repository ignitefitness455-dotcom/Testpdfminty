import { PDFDocument } from 'pdf-lib';

export async function executeUnlock(payload, postMessage) {
  postMessage({ id: payload.id, status: 'progress', progress: 10, type: 'progress', percent: 10, label: 'Loading PDF...' });
  const pdfDoc = await PDFDocument.load(payload.fileBytes, { password: payload.password });
  postMessage({ id: payload.id, status: 'progress', progress: 50, type: 'progress', percent: 50, label: 'Removing encryption...' });
  const result = await pdfDoc.save({ useObjectStreams: true });
  postMessage({ id: payload.id, status: 'progress', progress: 100, type: 'progress', percent: 100, label: 'Done' });
  return result;
}

if (typeof self !== 'undefined' && self.postMessage) {
  self.onmessage = async (e) => {
    const { id, payload } = e.data;
    try {
      const result = await executeUnlock(payload, (msg) => self.postMessage(msg));
      self.postMessage({ id, status: 'success', result }, [result.buffer]);
    } catch (err) {
      self.postMessage({ id, status: 'error', error: { errorType: err.name || 'Error', message: err.message, stack: err.stack } });
    }
  };
}
