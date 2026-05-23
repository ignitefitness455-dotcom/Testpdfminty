import { PDFDocument } from 'pdf-lib';

export async function executeSplit(payload, postMessage) {
  postMessage({ id: payload.id, status: 'progress', progress: 5, type: 'progress', percent: 5, label: 'Loading PDF...' });
  const srcDoc = await PDFDocument.load(payload.fileBytes, { ignoreEncryption: true });
  const results = [];
  const totalRanges = payload.ranges.length;
  for (let c = 0; c < totalRanges; c++) {
    const r = payload.ranges[c];
    const newDoc = await PDFDocument.create();
    const indices = [];
    for (let j = r.start - 1; j < r.end; j++) {
      if (j >= 0 && j < srcDoc.getPageCount()) indices.push(j);
    }
    if (indices.length > 0) {
      const copiedPages = await newDoc.copyPages(srcDoc, indices);
      for (const page of copiedPages) newDoc.addPage(page);
      const pdfBytes = await newDoc.save({ useObjectStreams: true });
      results.push({ name: `${payload.fileName || 'document'}_${r.start}-${r.end}.pdf`, bytes: pdfBytes });
    }
    postMessage({ id: payload.id, status: 'progress', progress: Math.round(10 + ((c + 1) / totalRanges) * 80), type: 'progress', percent: Math.round(10 + ((c + 1) / totalRanges) * 80), label: `Range ${c + 1} of ${totalRanges}` });
  }
  return results;
}

if (typeof self !== 'undefined' && self.postMessage) {
  self.onmessage = async (e) => {
    const { id, payload } = e.data;
    try {
      const result = await executeSplit(payload, (msg) => self.postMessage(msg));
      const buffers = result.map((r) => r.bytes.buffer);
      self.postMessage({ id, status: 'success', result }, buffers);
    } catch (err) {
      self.postMessage({ id, status: 'error', error: { errorType: err.name || 'Error', message: err.message, stack: err.stack } });
    }
  };
}
