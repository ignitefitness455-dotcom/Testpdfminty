import { PDFDocument } from 'pdf-lib';

export async function executeDeletePages(payload, postMessage) {
  postMessage({ id: payload.id, status: 'progress', progress: 10, type: 'progress', percent: 10, label: 'Loading PDF...' });
  const pdfDoc = await PDFDocument.load(payload.fileBytes, { ignoreEncryption: true });
  const totalPages = pdfDoc.getPageCount();
  const toDelete = new Set();
  for (let part of payload.rangesText.split(',')) {
    part = part.trim();
    if (!part) continue;
    if (part.includes('-')) {
      let [s, e] = part.split('-').map(Number);
      if (s && e) { if (s > e) [s, e] = [e, s]; for (let i = s; i <= e; i++) toDelete.add(i); }
    } else if (!isNaN(Number(part))) { toDelete.add(Number(part)); }
  }
  const indices = Array.from(toDelete).sort((a, b) => b - a).map((p) => p - 1).filter((i) => i >= 0 && i < totalPages);
  for (const idx of indices) pdfDoc.removePage(idx);
  postMessage({ id: payload.id, status: 'progress', progress: 80, type: 'progress', percent: 80, label: 'Saving...' });
  return await pdfDoc.save({ useObjectStreams: true });
}

if (typeof self !== 'undefined' && self.postMessage) {
  self.onmessage = async (e) => {
    const { id, payload } = e.data;
    try {
      const result = await executeDeletePages(payload, (msg) => self.postMessage(msg));
      self.postMessage({ id, status: 'success', result }, [result.buffer]);
    } catch (err) {
      self.postMessage({ id, status: 'error', error: { errorType: err.name || 'Error', message: err.message, stack: err.stack } });
    }
  };
}
