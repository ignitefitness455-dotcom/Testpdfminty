import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  base: '/',
  worker: {
    format: 'iife',
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.name && chunkInfo.name.includes('/tools/')) {
            const toolName = chunkInfo.name.split('/').pop();
            return `assets/tool-${toolName}-[hash].js`;
          }
          return 'assets/[name]-[hash].js';
        },
        manualChunks(id) {
          if (id.includes('node_modules/pdf-lib')) return 'pdflib';
          if (id.includes('node_modules/pdfjs-dist')) return 'pdfjs';
          if (id.includes('node_modules/canvas-confetti')) return 'confetti';
          if (id.includes('node_modules/jszip')) return 'jszip';
          if (id.includes('node_modules/jspdf')) return 'jspdf';
          if (id.includes('/tools/')) {
            return `tool-${id.split('/').pop().split('.')[0]}`;
          }
        },
      },
    },
    minify: 'terser',
    cssMinify: true,
    sourcemap: false,
  },
  optimizeDeps: {
    include: ['pdf-lib', 'pdfjs-dist', 'jszip'],
  },
  server: {
    port: 5173,
    host: true,
  },
});
