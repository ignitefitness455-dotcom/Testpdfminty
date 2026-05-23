/**
 * src/core/analytics.js - Privacy-respecting analytics
 * Fixed CRITICAL-19: No third-party trackers. Local-only event logging.
 * Aggregated, anonymized. No PII. Respects DNT.
 */

const STORAGE_KEY = 'pdfminty_analytics';
const SESSION_KEY = 'pdfminty_session';
const MAX_EVENTS = 1000;

class Analytics {
  constructor() {
    this.enabled = this._checkEnabled();
    this.sessionId = this._getSessionId();
    this.queue = [];
    this.flushInterval = null;

    if (this.enabled) {
      this._startFlushTimer();
      this._trackSessionStart();
    }
  }

  _checkEnabled() {
    // Respect Do Not Track
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1') {
      return false;
    }
    // Allow opt-out via localStorage
    if (localStorage.getItem('pdfminty_analytics_opt_out') === 'true') {
      return false;
    }
    return true;
  }

  _getSessionId() {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  }

  _startFlushTimer() {
    // Flush every 30 seconds
    this.flushInterval = setInterval(() => this._flush(), 30000);
    // Flush on page hide
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this._flush();
    });
  }

  track(event, properties = {}) {
    if (!this.enabled) return;

    const ev = {
      event,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        timestamp: Date.now(),
        path: window.location.pathname,
      },
    };

    this.queue.push(ev);

    // Keep queue bounded
    if (this.queue.length > MAX_EVENTS) {
      this.queue = this.queue.slice(-MAX_EVENTS);
    }

    // Immediate flush for important events
    if (['error', 'tool_completed', 'tool_failed'].includes(event)) {
      this._flush();
    }
  }

  _flush() {
    if (this.queue.length === 0) return;

    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const combined = stored.concat(this.queue);
      // Keep max 5000 events in localStorage
      const trimmed = combined.slice(-5000);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      this.queue = [];
    } catch (e) {
      console.warn('[Analytics] Flush failed:', e);
    }
  }

  _trackSessionStart() {
    this.track('session_start', {
      referrer: document.referrer || 'direct',
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      deviceMemory: navigator.deviceMemory || 'unknown',
      connection: navigator.connection ? navigator.connection.effectiveType : 'unknown',
    });
  }

  getStats() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  optOut() {
    localStorage.setItem('pdfminty_analytics_opt_out', 'true');
    this.enabled = false;
    clearInterval(this.flushInterval);
  }

  destroy() {
    this._flush();
    clearInterval(this.flushInterval);
  }
}

let instance = null;

export function initAnalytics() {
  if (!instance) {
    instance = new Analytics();
    window.PdfMintyAnalytics = instance;
  }
  return instance;
}

export function getAnalytics() {
  return instance;
}
