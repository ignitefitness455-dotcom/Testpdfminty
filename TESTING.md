# PDFMinty Testing Guide

## Automated Tests

### Unit Tests (Vitest)

```bash
npm run test:unit
```

Tests cover:
- `FileValidator` - PDF/image validation, magic bytes, size limits
- `ToastManager` - Toast creation, types, HTML escaping
- `Database` - IndexedDB operations, TTL expiry, cleanup

### E2E Tests (Playwright)

```bash
npm run test:e2e
```

Tests cover:
- Home page rendering (title, heading, tools count)
- Privacy banner visibility
- Theme toggle (dark/light mode)
- Tool navigation via cards
- Search and category filtering
- FAQ accordion interaction
- Tool page loading (Merge, Rotate, Protect)
- Contact modal opening
- Back button navigation

### Cross-Browser Testing

Playwright runs on Chromium, Firefox, WebKit, and Mobile Chrome (Pixel 5).

## Manual Test Steps

### Home Page
1. Load `/` - verify title, hero, 15 tool cards
2. Search for "merge" - only Merge PDF should show
3. Click "Convert" tab - only 2 tools should show
4. Toggle theme - background should switch dark/light
5. Scroll down - privacy banner should hide, back-to-top appears
6. Click FAQ question - answer expands, click again to collapse

### Merge PDF
1. Navigate to `/merge-pdf`
2. Upload 2+ PDFs
3. Click "Merge PDFs"
4. Verify combined PDF downloads
5. Test "Add More" button
6. Test file removal

### Split PDF
1. Navigate to `/split-pdf`
2. Upload a PDF
3. Enter ranges like `1-3, 5, 7-9`
4. Click "Split PDF"
5. Verify ZIP with individual PDFs downloads

### Compress PDF
1. Navigate to `/compress-pdf`
2. Upload a PDF with images
3. Adjust quality slider
4. Click "Compress PDF"
5. Verify before/after stats display
6. Verify compressed PDF downloads

### Image to PDF
1. Navigate to `/image-to-pdf`
2. Upload JPG/PNG images
3. Select page size and orientation
4. Click "Convert to PDF"
5. Verify output PDF

### PDF to Image
1. Navigate to `/pdf-to-image`
2. Upload a PDF
3. Select DPI and quality
4. Click "Convert"
5. Verify ZIP with images downloads

### Protect PDF
1. Navigate to `/protect-pdf`
2. Upload PDF, enter password
3. Verify password strength indicator
4. Click "Protect PDF"
5. Try opening downloaded PDF (should prompt for password)

### Unlock PDF
1. Navigate to `/unlock-pdf`
2. Upload a protected PDF
3. Enter password
4. Click "Unlock PDF"
5. Verify downloaded PDF opens without password

### Rotate, Reorder, Delete, Extract
- Test with various page ranges
- Verify output file names match operation

### Contact Form
1. Click "Contact Us" in footer
2. Fill all fields
3. Submit - verify success message
4. Try with empty fields - verify validation errors

### Responsive Testing
1. Open DevTools, toggle device toolbar
2. Test at 320px, 768px, 1024px, 1920px
3. Verify no horizontal scroll
4. Verify buttons are tap-friendly (min 44px)

### PWA Testing
1. In Chrome DevTools > Application > Service Workers
2. Verify `sw.js` is registered
3. Toggle offline - verify cached pages load
4. Check "Add to Home Screen" prompt works

### Accessibility Testing
1. Use keyboard-only navigation (Tab, Enter, Escape)
2. Run axe DevTools - should pass WCAG AA
3. Test with screen reader (NVDA/VoiceOver)
4. Verify focus indicators are visible
