# PDFMinty

> Free, privacy-first PDF tools that run entirely in your browser. No uploads. No signup. No server.

PDFMinty is a professional-grade PDF toolkit built as a Progressive Web App (PWA). All processing happens locally using Web Workers and client-side libraries — your files never leave your device.

## Features

- **15 PDF Tools**: Merge, Split, Compress, Rotate, Reorder, Delete Pages, Extract Pages, Image to PDF, PDF to Image, Protect, Unlock, Watermark, Page Numbers, Blank Pages, Crop & Resize
- **100% Private**: All files processed locally in your browser via Web Workers
- **PWA Support**: Installable on desktop and mobile, works offline
- **No Uploads**: Zero server interaction for file processing
- **Cross-Platform**: Works on Chrome, Firefox, Safari, Edge
- **Mobile Ready**: Responsive from 320px to 4K
- **Accessible**: Keyboard navigation, ARIA labels, screen reader support
- **SEO Optimized**: JSON-LD structured data, Open Graph, Twitter Cards

## Quick Start

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Run unit tests
npm run test:unit

# Run E2E tests
npm run test:e2e
```

## Deployment

### Netlify (Recommended)

1. Connect your Git repo to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Set functions directory: `functions`
5. Add environment variable: `GEMINI_API_KEY`
6. Deploy!

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key for AI features | Yes |

### Android (Capacitor)

```bash
npm run build
npm run build:android
npm run open:android
```

## Project Structure

```
pdfminty/
├── public/
│   ├── sw.js              # Service Worker with caching strategies
│   ├── manifest.json      # PWA manifest
│   ├── favicon.svg
│   └── icons/
├── src/
│   ├── main.js            # App orchestrator
│   ├── core/              # Router, state, DB, workers, analytics
│   ├── ui/                # HomePage, ContactModal, ThemeManager, icons
│   ├── utils/             # fileValidator, pdfEngine, progressTracker, etc.
│   └── styles/
│       └── main.css       # Complete styles with mobile breakpoints
├── tools/                 # 15 tool modules (standardized init/destroy)
├── workers/               # 13 dedicated Web Workers
├── functions/
│   └── api/               # Netlify Functions (gemini-proxy, contact)
├── tests/                 # Vitest unit tests
├── e2e/                   # Playwright E2E tests
├── index.html             # Entry point with SEO meta tags
├── vite.config.js         # Vite configuration
├── netlify.toml           # Netlify redirects and headers
├── capacitor.config.ts    # Capacitor configuration
└── package.json
```

## Architecture

- **Frontend**: Vite + vanilla JS, SPA routing
- **PDF Engine**: pdf-lib (manipulation), pdfjs-dist (rendering), jspdf (generation)
- **Workers**: Dedicated Web Workers per operation for non-blocking UI
- **Storage**: IndexedDB with TTL-based expiry (auto-cleans after 1 hour)
- **API**: Netlify Functions proxying to Gemini for AI features
- **PWA**: Service Worker with offline support, installable on all platforms

## Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | Full support |
| Firefox | 88+ | Full support |
| Safari | 14+ | Full support |
| Edge | 90+ | Full support |
| iOS Safari | 14+ | Full support |
| Chrome Android | 90+ | Full support |

## License

MIT
