/**
 * src/utils/ToastManager.js - Toast notifications with ARIA support
 */

export class ToastManager {
  static init() {
    if (!document.getElementById('pdfminty-toast')) {
      const toast = document.createElement('div');
      toast.id = 'pdfminty-toast';
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      toast.setAttribute('aria-atomic', 'true');
      document.body.appendChild(toast);
    }
  }

  static show(message, type = 'info') {
    this.init();
    const toast = document.getElementById('pdfminty-toast');
    const icons = { success: '&#10003;', error: '&#10007;', warning: '&#9888;', info: '&#9432;' };
    const classes = { success: 'toast-success', error: 'toast-danger', warning: 'toast-warning', info: 'toast-info' };

    toast.innerHTML = `<span class="toast-icon" aria-hidden="true">${icons[type] || icons.info}</span> <span>${this._escapeHtml(message)}</span>`;
    toast.className = `toast ${classes[type] || classes.info}`;

    if (this._timeout) clearTimeout(this._timeout);

    requestAnimationFrame(() => {
      toast.classList.add('visible');
    });

    this._timeout = setTimeout(() => {
      toast.classList.remove('visible');
    }, 4000);
  }

  static success(message) {
    this.show(message, 'success');
    // Celebration confetti (debounced)
    if (typeof window.confettiDebounced === 'function') {
      window.confettiDebounced({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#0ea5e9', '#10b981'],
      });
    }
  }

  static error(err) {
    let msg = typeof err === 'string' ? err : err?.message || 'An unknown error occurred.';
    const lowered = msg.toLowerCase();

    if (lowered.includes('encrypted') || lowered.includes('password') || lowered.includes('encrypt dictionary')) {
      msg = 'This PDF is password-protected. Please unlock it first.';
    } else if (lowered.includes('too large') || lowered.includes('out of memory')) {
      msg = 'File is very large. Processing may take a while.';
    } else if (lowered.includes('corrupt') || lowered.includes('invalid pdf') || lowered.includes('failed to parse')) {
      msg = 'The PDF file appears to be corrupted or invalid.';
    } else if (lowered.includes('failed to fetch') || lowered.includes('network')) {
      msg = 'Network error. Please check your connection.';
    } else if (lowered.includes('need more files')) {
      msg = 'Please add at least 2 PDFs to merge.';
    } else if (lowered.includes('worker') && lowered.includes('not found')) {
      msg = 'Processing worker could not be loaded. Please refresh.';
    }

    console.error('[PDFMinty Error]:', err);
    this.show(msg, 'error');
  }

  static warning(message) {
    this.show(message, 'warning');
  }

  static info(message) {
    this.show(message, 'info');
  }

  static _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
