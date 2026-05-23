# PDFMinty Changelog

## v1.1.0 (2026-05-23) - Major Refactor & Bug Fix Release

### Critical Bug Fixes

- **[CRITICAL-1]** Service Worker - Completely rewritten with stale-while-revalidate, cache-first, and network-first strategies for all asset types
- **[CRITICAL-2]** API Endpoints - Created proper Netlify Functions with rate limiting, input sanitization, and CORS (`functions/api/gemini-proxy.js`, `functions/api/contact.js`)
- **[CRITICAL-3]** Vite Build - Fixed worker format from `es` to `iife` for pdf-lib CommonJS compatibility; added proper manualChunks
- **[CRITICAL-4]** Entry Point - Restructured to `src/main.js` with proper modular imports
- **[CRITICAL-5]** PDF.js CDN Version Mismatch - Now imports bundled `pdfjs-dist` from node_modules; removed CDN dependency
- **[CRITICAL-6]** Router Bug - Fixed `-pdf` suffix stripping that broke tool IDs like `image-to-pdf`
- **[CRITICAL-7]** IndexedDB Privacy Leak - Added timestamp-based expiration (1h TTL), periodic cleanup (every 5min), and async safety
- **[CRITICAL-8]** Confetti Memory Leak - Added debounce (300ms) and session limit (once per 5 minutes)
- **[CRITICAL-9]** Compress Tool - Implemented real compression with image quality slider, object streams, and before/after size display
- **[CRITICAL-10]** Protect/Unlock Tools - Added password strength indicator, owner vs user password handling, and proper error messages
- **[CRITICAL-11]** PDF-to-Image Tool - Uses bundled pdfjs-dist with DPI/quality selector and ZIP download for multi-page export
- **[CRITICAL-12]** Image-to-PDF Tool - Added file validation, auto-resize for images >2000px, WEBP/HEIC support, page size selector
- **[CRITICAL-13]** Error Boundaries - All tool loading wrapped in try-catch with user-friendly error UI
- **[CRITICAL-14]** Input Validation - Comprehensive fileValidator.js checks file type, size, PDF integrity, image dimensions
- **[CRITICAL-15]** Loading/Progress States - All tools use unified ProgressTracker with step labels (Loading, Validating, Processing, Saving, Done)
- **[CRITICAL-16]** Mobile Responsiveness - Touch-friendly min 44px buttons, responsive grids, no horizontal scroll, tested down to 320px
- **[CRITICAL-17]** SEO & Meta Tags - Added canonical URL, JSON-LD structured data, Open Graph, Twitter cards, per-tool title/description
- **[CRITICAL-18]** Accessibility - ARIA labels, roles, skip link, keyboard navigation, focus management, WCAG AA color contrast
- **[CRITICAL-19]** Analytics - Privacy-respecting local analytics with DNT respect, no third-party trackers
- **[CRITICAL-20]** Capacitor Config - Fixed webDir to `dist`, added proper app ID, scheme, and splash screen config

### Refactoring

- Split monolithic `app.js` (9.9KB) into: `router.js`, `state.js`, `ui.js`, `worker-manager.js`, `db.js`, `api.js`, `analytics.js`, `errorBoundary.js`
- All 15 tools standardized with `init() -> validate() -> process() -> cleanup()` pattern
- Created `utils/` files: `fileValidator.js`, `pdfEngine.js`, `progressTracker.js`, `uiComponents.js`
- All tools export `{ init, destroy }` interface
- Workers use proper transferable buffers and timeout handling

### Added

- Unit tests (Vitest) for fileValidator, ToastManager, database
- E2E tests (Playwright) for home page, tool flows, navigation
- FAQ accordion on home page
- How It Works section
- Features section
- Bottom CTA section
- Category tabs with filtering
- Search functionality
- Password strength indicator on Protect tool
- Image quality/size/orientation controls on Image-to-PDF
- DPI/quality selector on PDF-to-Image
- Before/after file size display on Compress tool
- Auto-update notification for PWA
- Background sync support in Service Worker

### Changed

- Upgraded to modern Vite 5 build pipeline
- Improved IndexedDB with TTL-based expiry and automatic cleanup
- Enhanced contact modal with form validation and accessibility
- Improved toast system with escapeHTML and ARIA support
- Unified progress tracking across all tools
- Better error messages with context-aware suggestions

### Removed

- CDN dependency for pdfjs-dist (now bundled)
- Console.log statements (replaced with structured logging)
- TODO comments and placeholder text
