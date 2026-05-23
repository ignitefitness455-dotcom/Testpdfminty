import { ToastManager } from './ToastManager.js';

export const UI = {
  showError(message) {
    ToastManager.error(message);
  },
  showSuccess(message) {
    ToastManager.success(message);
  },
  showProgress(percentOrData, labelText) {
    const overlay = document.getElementById('modern-progress-overlay');
    if (overlay) {
      overlay.style.opacity = '1';
    }
    // Also update the per-tool progress tracker
    const fill = document.getElementById('progress-tracker-fill');
    const label = document.getElementById('progress-tracker-label');
    const tracker = document.getElementById('progress-tracker');
    if (tracker) tracker.classList.remove('hidden');
    const pct = typeof percentOrData === 'object' ? (percentOrData.percent ?? percentOrData.progress ?? 0) : (percentOrData ?? 0);
    const lbl = typeof percentOrData === 'object' ? (percentOrData.label ?? labelText) : labelText;
    if (fill) fill.style.width = Math.min(100, Math.max(0, pct)) + '%';
    if (label && lbl) label.textContent = lbl;
  },
  hideProgress() {
    const overlay = document.getElementById('modern-progress-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
    }
  },
};
window.UI = UI;
