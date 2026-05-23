/**
 * src/core/errorBoundary.js - Global Error Boundary
 * Fixed CRITICAL-13: Catches unhandled errors, shows user-friendly UI.
 */

export function initErrorBoundary() {
  // Global error handler
  window.addEventListener('error', (event) => {
    console.error('[ErrorBoundary] Global error:', event.error);
    showErrorUI(event.error?.message || 'An unexpected error occurred.');
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[ErrorBoundary] Unhandled rejection:', event.reason);
    showErrorUI(event.reason?.message || 'An async operation failed.');
  });

  console.info('[ErrorBoundary] Initialized');
}

let errorToastShown = false;

function showErrorUI(message) {
  // Prevent error spam
  if (errorToastShown) return;
  errorToastShown = true;

  // Try to use ToastManager if available
  if (window.PdfMinty && window.PdfMinty.ui && window.PdfMinty.ui.showError) {
    window.PdfMinty.ui.showError(`Error: ${message}. Please refresh if issues persist.`);
  } else {
    // Fallback error display
    const existing = document.getElementById('pdfminty-global-error');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.id = 'pdfminty-global-error';
    el.role = 'alert';
    el.setAttribute('aria-live', 'assertive');
    el.innerHTML = `
      <div style="position:fixed;top:0;left:0;right:0;background:#ef4444;color:#fff;padding:1rem;z-index:99999;text-align:center;font-weight:600;">
        &#9888; Something went wrong: ${message}
        <button onclick="this.parentElement.remove();window.errorToastShown=false;" style="margin-left:1rem;background:#fff;color:#ef4444;border:none;padding:0.25rem 0.75rem;border-radius:4px;cursor:pointer;font-weight:600;">Dismiss</button>
      </div>
    `;
    document.body.appendChild(el);
  }

  // Reset after 10 seconds
  setTimeout(() => { errorToastShown = false; }, 10000);
}
