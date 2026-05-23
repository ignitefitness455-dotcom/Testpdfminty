import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function executeAddPageNumbers(payload, postMessage) {
  postMessage({ id: payload.id, status: 'progress', progress: 10, type: 'progress', percent: 10, label: 'Loading PDF...' });
  const pdfDoc = await PDFDocument.load(payload.fileBytes, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const { position, format, size, margin, colorRgb } = payload;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    const pageNum = i + 1;
    let text = String(pageNum);
    if (format === 'page_1') text = `Page ${pageNum}`;
    else if (format === '1_of_n') text = `${pageNum} of ${totalPages}`;
    else if (format === '-1-') text = `- ${pageNum} -`;
    const textWidth = font.widthOfTextAtSize(text, size);
    let x, y;
    if (position.includes('left')) x = margin;
    else if (position.includes('right')) x = width - margin - textWidth;
    else x = width / 2 - textWidth / 2;
    if (position.includes('top')) y = height - margin - size;
    else y = margin;
    page.drawText(text, { x, y, size, font, color: rgb(colorRgb.r, colorRgb.g, colorRgb.b) });
    if (i % 20 === 0) postMessage({ id: payload.id, status: 'progress', progress: Math.min(95, Math.round(10 + (i / pages.length) * 80)), type: 'progress', percent: Math.min(95, Math.round(10 + (i / pages.length) * 80)), label: `Adding numbers: page ${i + 1}` });
  }
  postMessage({ id: payload.id, status: 'progress', progress: 95, type: 'progress', percent: 95, label: 'Saving...' });
  return await pdfDoc.save({ useObjectStreams: true });
}

if (typeof self !== 'undefined' && self.postMessage) {
  self.onmessage = async (e) => {
    const { id, payload } = e.data;
    try {
      const result = await executeAddPageNumbers(payload, (msg) => self.postMessage(msg));
      self.postMessage({ id, status: 'success', result }, [result.buffer]);
    } catch (err) {
      self.postMessage({ id, status: 'error', error: { errorType: err.name || 'Error', message: err.message, stack: err.stack } });
    }
  };
}
