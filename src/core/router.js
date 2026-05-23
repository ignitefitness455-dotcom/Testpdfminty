/**
 * src/core/router.js - SPA Router
 * Handles client-side navigation with history API.
 */

let _onRouteChange = null;
let _toolsList = [];

export function initRouter({ onRouteChange, toolsList = [] }) {
  _onRouteChange = onRouteChange;
  _toolsList = toolsList;

  // Handle browser back/forward
  window.addEventListener('popstate', () => {
    const path = window.location.pathname;
    if (_onRouteChange) _onRouteChange(path);
  });

  // Link interceptor for SPA navigation
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // Only handle internal links
    if (href.startsWith('/')) {
      e.preventDefault();
      window.history.pushState(null, '', href);
      if (_onRouteChange) _onRouteChange(href);
    }

    // Handle hash links for same-page navigation
    if (href.startsWith('#')) {
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });

  // Initial route
  const initialPath = window.location.pathname;
  if (_onRouteChange) _onRouteChange(initialPath);
}

/**
 * Navigate programmatically.
 */
export function navigateTo(path) {
  window.history.pushState(null, '', path);
  if (_onRouteChange) _onRouteChange(path);
}

/**
 * Get current route info.
 */
export function getCurrentRoute() {
  return {
    path: window.location.pathname,
    hash: window.location.hash,
    search: window.location.search,
  };
}
