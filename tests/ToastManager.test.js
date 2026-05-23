import { describe, it, expect, beforeEach } from 'vitest';
import { ToastManager } from '../src/utils/ToastManager.js';

describe('ToastManager', () => {
  beforeEach(() => {
    const existing = document.getElementById('pdfminty-toast');
    if (existing) existing.remove();
  });

  it('creates toast container on first use', () => {
    ToastManager.show('Test message');
    const toast = document.getElementById('pdfminty-toast');
    expect(toast).toBeTruthy();
  });

  it('displays success toast', () => {
    ToastManager.success('Operation complete!');
    const toast = document.getElementById('pdfminty-toast');
    expect(toast.classList.contains('toast-success')).toBe(true);
  });

  it('displays error toast', () => {
    ToastManager.error('Something went wrong');
    const toast = document.getElementById('pdfminty-toast');
    expect(toast.classList.contains('toast-danger')).toBe(true);
  });
});
