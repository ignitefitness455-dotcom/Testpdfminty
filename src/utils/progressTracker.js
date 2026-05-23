/**
 * src/utils/progressTracker.js - Unified progress tracking
 * Fixed CRITICAL-15: All tools use consistent progress reporting.
 */

const STEPS = {
  idle: { label: 'Ready', percent: 0 },
  loading: { label: 'Loading...', percent: 10 },
  validating: { label: 'Validating...', percent: 15 },
  processing: { label: 'Processing...', percent: 50 },
  optimizing: { label: 'Optimizing...', percent: 75 },
  saving: { label: 'Saving...', percent: 90 },
  done: { label: 'Done!', percent: 100 },
  error: { label: 'Error', percent: 0 },
};

export class ProgressTracker {
  constructor(onUpdate = null) {
    this.step = 'idle';
    this.percent = 0;
    this.label = STEPS.idle.label;
    this.onUpdate = onUpdate;
  }

  setStep(stepName, extra = {}) {
    const step = STEPS[stepName] || STEPS.idle;
    this.step = stepName;
    this.percent = extra.percent !== undefined ? extra.percent : step.percent;
    this.label = extra.label || step.label;
    this._notify();
  }

  setPercent(percent, label) {
    this.percent = Math.min(100, Math.max(0, percent));
    if (label) this.label = label;
    this._notify();
  }

  done(label = 'Complete!') {
    this.step = 'done';
    this.percent = 100;
    this.label = label;
    this._notify();
  }

  error(message) {
    this.step = 'error';
    this.label = message || 'An error occurred';
    this._notify();
  }

  _notify() {
    if (this.onUpdate) {
      this.onUpdate({
        step: this.step,
        percent: this.percent,
        label: this.label,
      });
    }
  }
}

/**
 * Wrap a function with progress tracking.
 */
export async function withProgress(fn, onUpdate) {
  const tracker = new ProgressTracker(onUpdate);
  tracker.setStep('loading');
  try {
    tracker.setStep('processing');
    const result = await fn(tracker);
    tracker.done();
    return result;
  } catch (error) {
    tracker.error(error.message || 'Processing failed');
    throw error;
  }
}
