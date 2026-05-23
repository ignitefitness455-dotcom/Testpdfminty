import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';

export async function executeWatermark(payload, postMessage) {
  postMessage({ id: payload.id, status: 'progress', progress: 10, type: 'progress', percent: 10, label: 'Loading PDF...' });
  const pdfDoc = await PDFDocument.load(payload.fileBytes, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { text, colorRgb, opacity, textSize, rotationDeg, position } = payload;
  const angle = rotationDeg * (Math.PI / 180);

  for (let k = 0; k < pages.length; k++) {
    const page = pages[k];
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, textSize);
    const textHeight = font.heightAtSize(textSize);
    let centerY = height / 2;
    if (position === 'top') centerY = height - textHeight * 2;
    else if (position === 'bottom') centerY = textHeight * 2;
    page.drawText(text, {
      x: width / 2 - (textWidth / 2) * Math.cos(angle) + (textHeight / 2) * Math.sin(angle),
      y: centerY - (textWidth / 2) * Math.sin(angle) - (textHeight / 2) * Math.cos(angle),
      size: textSize, font, color: rgb(colorRgb.r, colorRgb.g, colorRgb.b), opacity, rotate: degrees(rotationDeg),
    });
    if (k % 20 === 0) postMessage({ id: payload.id, status: 'progress', progress: Math.min(95, Math.round(10 + (k / pages.length) * 80)), type: 'progress', percent: Math.min(95, Math.round(10 + (k / pages.length) * 80)), label: `Watermarking page ${k + 1}` });
  }
  postMessage({ id: payload.id, status: 'progress', progress: 95, type: 'progress', percent: 95, label: 'Saving...' });
  return await pdfDoc.save({ useObjectStreams: true });
}

if (typeof self !== 'undefined' && self.postMessage) {
  self.onmessage = async (e) => {
    const { id, payload } = e.data;
    try {
      const result = await executeWatermark(payload, (msg) => self.postMessage(msg));
      self.postMessage({ id, status: 'success', result }, [result.buffer]);
    } catch (err) {
      self.postMessage({ id, status: 'error', error: { errorType: err.name || 'Error', message: err.message, stack: err.stack } });
    }
  };
}
