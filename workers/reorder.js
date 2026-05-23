import { PDFDocument } from 'pdf-lib';

export async function executeReorder(payload, postMessage) {
  postMessage({ id: payload.id, status: 'progress', progress: 10, type: 'progress', percent: 10, label: 'Loading PDF...' });
  const srcDoc = await PDFDocument.load(payload.fileBytes, { ignoreEncryption: true });
  const newDoc = await PDFDocument.create();
  const indices = payload.newOrder.map((p) => p - 1).filter((i) => i >= 0 && i < srcDoc.getPageCount());
  const copiedPages = await newDoc.copyPages(srcDoc, indices);
  for (let i = 0; i < copiedPages.length; i++) {
    newDoc.addPage(copiedPages[i]);
    if (i % 20 === 0) postMessage({ id: payload.id, status: 'progress', progress: Math.min(95, Math.round(10 + (i / copiedPages.length) * 80)), type: 'progress', percent: Math.min(95, Math.round(10 + (i / copiedPages.length) * 80)), label: `Reordering page ${i + 1}` });
  }
  postMessage({ id: payload.id, status: 'progress', progress: 95, type: 'progress', percent: 95, label: 'Saving...' });
  return await newDoc.save({ useObjectStreams: true });
}

if (typeof self !== 'undefined' && self.postMessage) {
  self.onmessage = async (e) => {
    const { id, payload } = e.data;
    try {
      const result = await executeReorder(payload, (msg) => self.postMessage(msg));
      self.postMessage({ id, status: 'success', result }, [result.buffer]);
    } catch (err) {
      self.postMessage({ id, status: 'error', error: { errorType: err.name || 'Error', message: err.message, stack: err.stack } });
    }
  };
}
