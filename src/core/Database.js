/**
 * src/core/Database.js - IndexedDB wrapper with TTL-based expiration
 * Fixed CRITICAL-7: Added timestamp-based expiration, periodic cleanup,
 * and automatic expiry after 1 hour.
 */

const DB_NAME = 'PDFMintyDB';
const STORE_NAME = 'files';
const META_STORE = 'fileMeta';
const DB_VERSION = 2;
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

class Database {
  constructor() {
    this.dbInstance = null;
    this.useMemory = false;
    this.memoryFallback = new Map();
    this.cleanupTimer = null;
    this._startCleanupTimer();
  }

  _startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      this._cleanupExpired().catch((e) => console.warn('[DB] Cleanup error:', e));
    }, CLEANUP_INTERVAL_MS);
  }

  async _cleanupExpired() {
    try {
      const meta = await this._getAllMeta();
      const now = Date.now();
      let cleaned = 0;
      for (const [id, data] of meta) {
        if (data.expiresAt && data.expiresAt < now) {
          await this.deleteFile(id);
          cleaned++;
        }
      }
      if (cleaned > 0) {
        console.info(`[DB] Cleaned up ${cleaned} expired file(s)`);
      }
    } catch (e) {
      console.warn('[DB] Expiry cleanup failed:', e);
    }
  }

  async init() {
    if (this.useMemory) return null;
    if (this.dbInstance) return this.dbInstance;
    if (!window.indexedDB) {
      this.useMemory = true;
      return null;
    }

    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => {
          console.warn('[DB] IndexedDB error, falling back to memory');
          this.useMemory = true;
          resolve(null);
        };
        request.onsuccess = (event) => {
          this.dbInstance = event.target.result;
          resolve(this.dbInstance);
        };
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
          if (!db.objectStoreNames.contains(META_STORE)) {
            db.createObjectStore(META_STORE);
          }
        };
      } catch (e) {
        console.warn('[DB] IndexedDB init failed:', e);
        this.useMemory = true;
        resolve(null);
      }
    });
  }

  async saveFile(id, arrayBuffer, ttlMs = DEFAULT_TTL_MS) {
    const db = await this.init();
    const expiresAt = Date.now() + ttlMs;

    if (this.useMemory) {
      this.memoryFallback.set(id, { data: arrayBuffer, expiresAt });
      return id;
    }

    await new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME, META_STORE], 'readwrite');
      tx.objectStore(STORE_NAME).put(arrayBuffer, id);
      tx.objectStore(META_STORE).put({ savedAt: Date.now(), expiresAt }, id);
      tx.oncomplete = () => resolve(id);
      tx.onerror = () => reject(tx.error);
    });

    return id;
  }

  async getFile(id) {
    const db = await this.init();

    if (this.useMemory) {
      const entry = this.memoryFallback.get(id);
      if (!entry) return undefined;
      if (entry.expiresAt && entry.expiresAt < Date.now()) {
        this.memoryFallback.delete(id);
        return undefined;
      }
      return entry.data;
    }

    // Check expiry
    try {
      const meta = await new Promise((resolve) => {
        const tx = db.transaction(META_STORE, 'readonly');
        const req = tx.objectStore(META_STORE).get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      });
      if (meta && meta.expiresAt && meta.expiresAt < Date.now()) {
        await this.deleteFile(id);
        return undefined;
      }
    } catch (e) {
      // Continue even if meta check fails
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteFile(id) {
    const db = await this.init();

    if (this.useMemory) {
      this.memoryFallback.delete(id);
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME, META_STORE], 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.objectStore(META_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async clearAll() {
    const db = await this.init();

    if (this.useMemory) {
      this.memoryFallback.clear();
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME, META_STORE], 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.objectStore(META_STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async _getAllMeta() {
    const db = await this.init();
    if (this.useMemory) {
      const result = new Map();
      for (const [id, entry] of this.memoryFallback) {
        result.set(id, entry);
      }
      return result;
    }

    return new Promise((resolve) => {
      const result = new Map();
      try {
        const tx = db.transaction(META_STORE, 'readonly');
        const store = tx.objectStore(META_STORE);
        const cursor = store.openCursor();
        cursor.onsuccess = (event) => {
          const c = event.target.result;
          if (c) {
            result.set(c.key, c.value);
            c.continue();
          } else {
            resolve(result);
          }
        };
        cursor.onerror = () => resolve(new Map());
      } catch (e) {
        resolve(new Map());
      }
    });
  }

  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

// Singleton instance
const db = new Database();
export { db };
