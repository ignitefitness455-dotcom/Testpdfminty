import { PDFDocument } from 'pdf-lib';

export async function executeProtect(payload, postMessage) {
  postMessage({ id: payload.id, status: 'progress', progress: 10, type: 'progress', percent: 10, label: 'Loading PDF...' });
  const pdfDoc = await PDFDocument.load(payload.fileBytes);
  postMessage({ id: payload.id, status: 'progress', progress: 40, type: 'progress', percent: 40, label: 'Applying encryption...' });
  const result = await pdfDoc.save({
    useObjectStreams: true,
    userPassword: payload.password,
    ownerPassword: payload.ownerPassword || payload.password,
    permissions: payload.permissions || { printing: 'highResolution', modifying: false, copying: false },
  });
  postMessage({ id: payload.id, status: 'progress', progress: 100, type: 'progress', percent: 100, label: 'Done' });
  return result;
}

if (typeof self !== 'undefined' && self.postMessage) {
  self.onmessage = async (e) => {
    const { id, payload } = e.data;
    try {
      const result = await executeProtect(payload, (msg) => self.postMessage(msg));
      self.postMessage({ id, status: 'success', result }, [result.buffer]);
    } catch (err) {
      self.postMessage({ id, status: 'error', error: { errorType: err.name || 'Error', message: err.message, stack: err.stack } });
    }
  };
}
