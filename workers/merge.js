import { PDFDocument } from 'pdf-lib';

export async function executeMerge(payload, postMessage) {
  const mergedPdf = await PDFDocument.create();
  for (let i = 0; i < payload.files.length; i++) {
    const fileBytes = payload.files[i];
    const pdf = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
    const indices = pdf.getPageIndices();
    const copiedPages = await mergedPdf.copyPages(pdf, indices);
    for (const page of copiedPages) mergedPdf.addPage(page);
    postMessage({
      id: payload.id, status: 'progress', progress: Math.round(((i + 1) / payload.files.length) * 80),
      type: 'progress', percent: Math.round(((i + 1) / payload.files.length) * 80),
      label: `Merged file ${i + 1} of ${payload.files.length}`,
    });
  }
  postMessage({ id: payload.id, status: 'progress', progress: 95, type: 'progress', percent: 95, label: 'Saving...' });
  return await mergedPdf.save({ useObjectStreams: true });
}

if (typeof self !== 'undefined' && self.postMessage) {
  self.onmessage = async (e) => {
    const { id, payload } = e.data;
    try {
      const result = await executeMerge(payload, (msg) => self.postMessage(msg));
      self.postMessage({ id, status: 'success', result }, [result.buffer]);
    } catch (err) {
      self.postMessage({ id, status: 'error', error: { errorType: err.name || 'Error', message: err.message, stack: err.stack } });
    }
  };
}
