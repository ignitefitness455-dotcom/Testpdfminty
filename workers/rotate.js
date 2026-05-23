import { PDFDocument, degrees } from 'pdf-lib';

export async function executeRotate(payload, postMessage) {
  postMessage({ id: payload.id, status: 'progress', progress: 10, type: 'progress', percent: 10, label: 'Loading PDF...' });
  const pdfDoc = await PDFDocument.load(payload.fileBytes, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const deg = payload.degree || 90;
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const currentRotation = page.getRotation().angle;
    const finalAngle = ((currentRotation + deg) % 360 + 360) % 360;
    page.setRotation(degrees(finalAngle));
    if (i % 20 === 0) postMessage({ id: payload.id, status: 'progress', progress: Math.min(95, Math.round(10 + (i / pages.length) * 80)), type: 'progress', percent: Math.min(95, Math.round(10 + (i / pages.length) * 80)), label: `Rotating page ${i + 1} of ${pages.length}` });
  }
  postMessage({ id: payload.id, status: 'progress', progress: 95, type: 'progress', percent: 95, label: 'Saving...' });
  return await pdfDoc.save({ useObjectStreams: true });
}

if (typeof self !== 'undefined' && self.postMessage) {
  self.onmessage = async (e) => {
    const { id, payload } = e.data;
    try {
      const result = await executeRotate(payload, (msg) => self.postMessage(msg));
      self.postMessage({ id, status: 'success', result }, [result.buffer]);
    } catch (err) {
      self.postMessage({ id, status: 'error', error: { errorType: err.name || 'Error', message: err.message, stack: err.stack } });
    }
  };
}
