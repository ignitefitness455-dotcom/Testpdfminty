import { describe, it, expect } from 'vitest';
import { FileValidator } from '../src/utils/fileValidator.js';

describe('FileValidator', () => {
  it('validates a PDF file correctly', () => {
    const file = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
    const result = FileValidator.validate(file, { acceptPdf: true });
    expect(result.valid).toBe(true);
    expect(result.isPdf).toBe(true);
  });

  it('rejects non-PDF when only PDF accepted', () => {
    const file = new File(['hello'], 'test.txt', { type: 'text/plain' });
    const result = FileValidator.validate(file, { acceptPdf: true, acceptImage: false });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('PDF');
  });

  it('accepts images when configured', () => {
    const file = new File(['\x89PNG'], 'test.png', { type: 'image/png' });
    const result = FileValidator.validate(file, { acceptPdf: false, acceptImage: true });
    expect(result.valid).toBe(true);
    expect(result.isImage).toBe(true);
  });

  it('rejects empty files', () => {
    const file = new File([], 'empty.pdf', { type: 'application/pdf' });
    const result = FileValidator.validate(file, { acceptPdf: true });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('empty');
  });

  it('validates PDF integrity by magic bytes', async () => {
    const validPdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34]);
    const file = new File([validPdf], 'valid.pdf', { type: 'application/pdf' });
    const result = await FileValidator.validatePdfIntegrity(file);
    expect(result.valid).toBe(true);
  });

  it('rejects invalid PDF magic bytes', async () => {
    const invalid = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
    const file = new File([invalid], 'fake.pdf', { type: 'application/pdf' });
    const result = await FileValidator.validatePdfIntegrity(file);
    expect(result.valid).toBe(false);
  });
});
