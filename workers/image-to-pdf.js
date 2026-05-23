import { PDFDocument } from 'pdf-lib';

const PAGE_SIZES = {
  a4: [595.28, 841.89],
  letter: [612.0, 792.0],
};

export async function executeImageToPdf(payload, postMessage) {
  postMessage({ id: payload.id, status: 'progress', progress: 10, type: 'progress', percent: 10, label: 'Creating PDF...' });
  const { files, pageSize, orientation, quality, margin } = payload;
  const pdfDoc = await PDFDocument.create();
  const marginPt = margin * 2.835;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    let image;
    if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      image = await pdfDoc.embedJpg(file.bytes);
    } else {
      image = await pdfDoc.embedPng(file.bytes);
    }
    const { width, height } = image.scale(1);

    let pageW, pageH;
    if (pageSize === 'fit') {
      pageW = width + marginPt * 2;
      pageH = height + marginPt * 2;
    } else {
      [pageW, pageH] = PAGE_SIZES[pageSize] || PAGE_SIZES.a4;
    }
    if (orientation === 'landscape' && pageW < pageH) [pageW, pageH] = [pageH, pageW];
    else if (orientation === 'portrait' && pageW > pageH) [pageW, pageH] = [pageH, pageW];
    else if (orientation === 'auto' && width > height && pageW < pageH) [pageW, pageH] = [pageH, pageW];

    const scale = Math.min((pageW - marginPt * 2) / width, (pageH - marginPt * 2) / height);
    const drawW = width * scale;
    const drawH = height * scale;
    const x = (pageW - drawW) / 2;
    const y = (pageH - drawH) / 2;

    const page = pdfDoc.addPage([pageW, pageH]);
    page.drawImage(image, { x, y, width: drawW, height: drawH });
    postMessage({ id: payload.id, status: 'progress', progress: Math.min(95, Math.round(10 + ((i + 1) / files.length) * 80)), type: 'progress', percent: Math.min(95, Math.round(10 + ((i + 1) / files.length) * 80)), label: `Processing image ${i + 1} of ${files.length}` });
  }
  postMessage({ id: payload.id, status: 'progress', progress: 95, type: 'progress', percent: 95, label: 'Saving...' });
  return await pdfDoc.save({ useObjectStreams: true });
}

if (typeof self !== 'undefined' && self.postMessage) {
  self.onmessage = async (e) => {
    const { id, payload } = e.data;
    try {
      const result = await executeImageToPdf(payload, (msg) => self.postMessage(msg));
      self.postMessage({ id, status: 'success', result }, [result.buffer]);
    } catch (err) {
      self.postMessage({ id, status: 'error', error: { errorType: err.name || 'Error', message: err.message, stack: err.stack } });
    }
  };
}
