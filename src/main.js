/**
 * src/main.js - PDFMinty Application Orchestrator
 * Refactored from monolithic app.js into clean modular architecture.
 * Handles: bootstrap, service worker registration, lazy tool loading.
 */

import { toolsList } from './core/toolsConfig.js';
import { renderHomePage } from './ui/HomePage.js';
import { initContactModal } from './ui/ContactModal.js';
import { initThemeAndScroll } from './ui/ThemeManager.js';
import { ToastManager } from './utils/ToastManager.js';
import { initRouter } from './core/router.js';
import { initAnalytics } from './core/analytics.js';
import { initErrorBoundary } from './core/errorBoundary.js';

// Lazy-load confetti to optimize initial bundle
window.confetti = function (...args) {
  return import('canvas-confetti').then((module) => {
    window.confetti = module.default;
    return window.confetti(...args);
  }).catch(() => {});
};

// Debounced confetti to prevent memory leak (CRITICAL-8)
let _confettiDebounceTimer = null;
let _confettiSessionFired = false;
window.confettiDebounced = function(opts) {
  if (_confettiSessionFired) return;
  clearTimeout(_confettiDebounceTimer);
  _confettiDebounceTimer = setTimeout(() => {
    _confettiSessionFired = true;
    if (typeof window.confetti === 'function') {
      window.confetti(opts);
    }
    // Reset after 5 minutes to allow celebration again
    setTimeout(() => { _confettiSessionFired = false; }, 300000);
  }, 300);
};

// Tool loader registry for dynamic imports
const toolLoaders = {
  merge: () => import('../tools/merge.js'),
  split: () => import('../tools/split.js'),
  compress: () => import('../tools/compress.js'),
  rotate: () => import('../tools/rotate.js'),
  reorder: () => import('../tools/reorder.js'),
  'delete-pages': () => import('../tools/delete-pages.js'),
  'extract-pages': () => import('../tools/extract-pages.js'),
  'image-to-pdf': () => import('../tools/image-to-pdf.js'),
  'pdf-to-image': () => import('../tools/pdf-to-image.js'),
  protect: () => import('../tools/protect.js'),
  unlock: () => import('../tools/unlock.js'),
  watermark: () => import('../tools/watermark.js'),
  'add-page-numbers': () => import('../tools/add-page-numbers.js'),
  'add-blank-page': () => import('../tools/add-blank-page.js'),
  'crop-resize': () => import('../tools/crop-resize.js'),
};

// Global namespace
window.PdfMinty = window.PdfMinty || {};
window.PdfMinty.utils = window.PdfMinty.utils || {};
window.PdfMinty.ui = window.PdfMinty.ui || {};

// Current tool reference for cleanup
let currentTool = null;

/**
 * Load a tool script dynamically with error handling.
 * Fixed CRITICAL-13: Wrapped in error boundary.
 * Fixed CRITICAL-15: Progress states shown.
 */
async function loadToolScript(toolId) {
  const appContainer = document.getElementById('app');
  if (!appContainer) return;

  // Show loading state
  appContainer.innerHTML = `
    <div class="tool-loading" role="status" aria-busy="true" aria-label="Loading ${toolId} tool">
      <div class="loading-spinner"></div>
      <p>Loading ${toolId.replace(/-/g, ' ')} tool...</p>
    </div>
  `;

  // Cleanup previous tool
  if (currentTool && typeof currentTool.destroy === 'function') {
    try {
      currentTool.destroy();
    } catch (e) {
      console.error('Error during tool destruction:', e);
    }
  }
  currentTool = null;

  const loader = toolLoaders[toolId];
  if (!loader) {
    renderToolError(appContainer, toolId, 'Tool not found.');
    return;
  }

  try {
    const module = await loader();

    if (typeof module.init === 'function') {
      currentTool = module;
      await module.init();
    } else if (typeof module.default === 'function') {
      module.default();
    } else {
      throw new Error('Module does not export an init function.');
    }

    // Focus management for accessibility (CRITICAL-18)
    const heading = appContainer.querySelector('h1, h2');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }

    // Track tool usage (CRITICAL-19)
    if (window.PdfMintyAnalytics) {
      window.PdfMintyAnalytics.track('tool_loaded', { tool: toolId });
    }
  } catch (err) {
    console.error(`[PDFMinty] Failed to load tool: ${toolId}`, err);
    renderToolError(appContainer, toolId, err.message);
    ToastManager.error(`Failed to load tool: ${toolId}. Please try again.`);
  }
}

/**
 * Render user-friendly error UI when tool fails to load.
 * Fixed CRITICAL-13: Error boundary UI.
 */
function renderToolError(container, toolId, message) {
  container.innerHTML = `
    <div class="tool-error" role="alert" aria-live="assertive">
      <div class="tool-error-icon" aria-hidden="true">&#9888;</div>
      <h2>Tool Loading Failed</h2>
      <p>We couldn't load the "${toolId}" tool.</p>
      <p class="tool-error-detail">${message || 'An unexpected error occurred.'}</p>
      <div class="tool-error-actions">
        <a href="/" class="btn-secondary" aria-label="Go back to home page">Go Back Home</a>
        <button onclick="location.reload()" class="btn-action" type="button">Retry</button>
      </div>
    </div>
  `;
}

/**
 * SEO helper: Update meta tags per tool page.
 * Fixed CRITICAL-17: Full SEO support per tool.
 */
const SEO = {
  updateTags(toolId) {
    const tool = toolsList.find((t) => t.id === toolId);
    if (!tool) return;

    const title = `${tool.title} — Free ${tool.title} Online | PDFMinty`;
    const desc = `${tool.desc}. 100% free and private. Processed locally in your browser. No uploads, no signup required.`;

    document.title = title;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', desc);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', desc);

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', `https://pdfminty.com/${tool.id}-pdf`);

    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', title);

    const twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (twitterDesc) twitterDesc.setAttribute('content', desc);

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', `https://pdfminty.com/${tool.id}-pdf`);
  },
  resetTags() {
    document.title = 'PDFMinty — Free Online PDF Tools | Merge, Compress & Split PDF';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content',
        'PDFMinty is a free, privacy-first PDF toolkit. Merge, split, compress and edit PDFs directly in your browser. No uploads. No signup required.'
      );
    }
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', 'https://pdfminty.com');
  }
};

/**
 * Router handler - delegates to core/router but keeps tool loading local.
 * Fixed CRITICAL-6: Router bug with -pdf suffix.
 */
function handleRoute(path) {
  const appContainer = document.getElementById('app');
  if (!appContainer) return;

  // Animate out
  appContainer.style.opacity = '0';
  appContainer.style.transform = 'translateY(10px)';

  setTimeout(async () => {
    appContainer.innerHTML = '';
    appContainer.style.transition = 'opacity 0.2s ease, transform 0.2s ease';

    let viewId = '';
    if (path !== '/' && path !== '/index.html') {
      viewId = path.replace(/^\//, '').replace(/\/$/, '');
      // Fix CRITICAL-6: Only strip -pdf suffix for routing, preserve tool IDs
      viewId = viewId.replace(/-pdf$/, '');
    }

    if (!viewId) {
      SEO.resetTags();
      renderHomePage(appContainer, toolsList);
      const heading = appContainer.querySelector('h1');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    } else {
      const isValidTool = toolsList.some((t) => t.id === viewId);
      if (isValidTool) {
        SEO.updateTags(viewId);
        await loadToolScript(viewId);
      } else {
        // Invalid route - redirect home
        window.history.replaceState(null, '', '/');
        SEO.resetTags();
        renderHomePage(appContainer, toolsList);
      }
    }

    // Animate in
    requestAnimationFrame(() => {
      appContainer.style.opacity = '1';
      appContainer.style.transform = 'translateY(0)';
    });
  }, 150);
}

// Initialize the application
(function bootstrap() {
  // Initialize error boundary (CRITICAL-13)
  initErrorBoundary();

  // Initialize theme and scroll behaviors
  initThemeAndScroll();

  // Initialize router
  initRouter({
    onRouteChange: handleRoute,
    toolsList,
  });

  // Register service worker (CRITICAL-1)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.info('[PDFMinty] Service Worker registered:', reg.scope);
        // Check for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              ToastManager.info('Update available! Refresh to get the latest version.');
            }
          });
        });
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  }

  // Pre-load contact modal
  if (typeof window.requestIdleCallback !== 'undefined') {
    window.requestIdleCallback(() => {
      try { initContactModal(); } catch (e) { console.warn('Contact modal preload failed', e); }
    });
  } else {
    setTimeout(() => {
      try { initContactModal(); } catch (e) { console.warn('Contact modal preload failed', e); }
    }, 3000);
  }

  // Initialize privacy-respecting analytics (CRITICAL-19)
  try {
    initAnalytics();
  } catch (e) {
    console.warn('Analytics init failed:', e);
  }

  // Expose utilities globally for backward compat
  window.PdfMinty.utils.callGeminiAPI = async function (prompt, context = '', history = []) {
    try {
      const response = await fetch('/api/gemini-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, context, history }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'AI service unavailable');
      }
      return data;
    } catch (error) {
      console.error('Gemini API Error:', error);
      ToastManager.error('AI features are currently unavailable.');
      throw error;
    }
  };
  window.callGeminiAPI = window.PdfMinty.utils.callGeminiAPI;
})();
