import { beforeAll, afterEach, vi } from 'vitest';

// Mock IndexedDB for tests
const mockIndexedDB = {
  open: () => ({
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
    result: {
      transaction: () => ({
        objectStore: () => ({
          put: () => ({ onsuccess: null }),
          get: () => ({ onsuccess: null, result: new ArrayBuffer(8) }),
          clear: () => ({ onsuccess: null }),
          delete: () => ({ onsuccess: null }),
        }),
      }),
      objectStoreNames: { contains: () => true },
      createObjectStore: () => ({}),
    },
    set onsuccess(fn) { if (fn) fn({ target: this }); },
    set onerror(fn) { if (fn) fn({ target: { error: new Error('mock') } }); },
  }),
};

global.indexedDB = mockIndexedDB;
global.window = global;

// Mock File
global.File = class MockFile {
  constructor(parts, name, opts = {}) {
    this.parts = parts;
    this.name = name;
    this.type = opts.type || '';
    this.size = parts.reduce((acc, p) => acc + p.length || p.byteLength || 0, 0);
  }
  arrayBuffer() { return Promise.resolve(new ArrayBuffer(8)); }
  slice() { return this; }
};

// Mock FileReader
global.FileReader = class MockFileReader {
  readAsArrayBuffer() { setTimeout(() => { if (this.onload) this.onload({ target: { result: new ArrayBuffer(8) } }); }, 0); }
};

beforeAll(() => {
  console.log('Test environment initialized');
});

afterEach(() => {
  vi.restoreAllMocks();
});
