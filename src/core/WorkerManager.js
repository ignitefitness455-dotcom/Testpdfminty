/**
 * src/core/WorkerManager.js - Web Worker Pool Manager
 * Manages dedicated workers for each PDF operation type.
 */

const MAX_WORKERS = Math.min(4, navigator.hardwareConcurrency || 2);
const TASK_TIMEOUT_MS = 120000; // 2 minutes for large files
const workerPool = [];
const taskQueue = [];
let taskCounter = 0;
const activeTasks = new Map();

const workerMap = {
  'add-blank-page': () => new Worker(new URL('../../workers/add-blank-page.js', import.meta.url), { type: 'module' }),
  'add-page-numbers': () => new Worker(new URL('../../workers/add-page-numbers.js', import.meta.url), { type: 'module' }),
  'compress': () => new Worker(new URL('../../workers/compress.js', import.meta.url), { type: 'module' }),
  'delete-pages': () => new Worker(new URL('../../workers/delete-pages.js', import.meta.url), { type: 'module' }),
  'extract-pages': () => new Worker(new URL('../../workers/extract-pages.js', import.meta.url), { type: 'module' }),
  'image-to-pdf': () => new Worker(new URL('../../workers/image-to-pdf.js', import.meta.url), { type: 'module' }),
  'merge': () => new Worker(new URL('../../workers/merge.js', import.meta.url), { type: 'module' }),
  'protect': () => new Worker(new URL('../../workers/protect.js', import.meta.url), { type: 'module' }),
  'reorder': () => new Worker(new URL('../../workers/reorder.js', import.meta.url), { type: 'module' }),
  'rotate': () => new Worker(new URL('../../workers/rotate.js', import.meta.url), { type: 'module' }),
  'split': () => new Worker(new URL('../../workers/split.js', import.meta.url), { type: 'module' }),
  'unlock': () => new Worker(new URL('../../workers/unlock.js', import.meta.url), { type: 'module' }),
  'watermark': () => new Worker(new URL('../../workers/watermark.js', import.meta.url), { type: 'module' }),
};

function createDedicatedWorker(taskName) {
  if (workerMap[taskName]) {
    return workerMap[taskName]();
  }
  throw new Error(`Unknown worker task: ${taskName}`);
}

class WorkerInstance {
  constructor(taskName) {
    this.taskName = taskName;
    this.worker = createDedicatedWorker(taskName);
    this.currentTaskId = null;
    this.isTerminated = false;

    this.worker.onmessage = (e) => {
      if (this.isTerminated) return;
      const { id, status, result, error, progress, type } = e.data;

      // Progress reporting
      if (status === 'progress' || type === 'progress') {
        const task = activeTasks.get(id);
        if (task && task.onProgress) {
          task.onProgress(e.data);
        }
        return;
      }

      // Final state
      const task = activeTasks.get(id);
      if (task) {
        clearTimeout(task.timeoutId);
        if (status === 'success') {
          task.resolve(result);
        } else {
          const errMsg = error
            ? (error.message || error.errorType || JSON.stringify(error))
            : 'Unknown worker error';
          task.reject(new Error(errMsg));
        }
        activeTasks.delete(id);
      }
      this.currentTaskId = null;
      processQueue();
    };

    this.worker.onerror = (err) => {
      if (this.isTerminated) return;
      console.error(`[WorkerManager] Worker [${this.taskName}] error:`, err);
      if (this.currentTaskId !== null) {
        const task = activeTasks.get(this.currentTaskId);
        if (task) {
          clearTimeout(task.timeoutId);
          task.reject(new Error(`Worker for ${this.taskName} crashed`));
          activeTasks.delete(this.currentTaskId);
        }
      }
      this.terminate();
      removeWorkerFromPool(this);
      processQueue();
    };
  }

  terminate() {
    this.isTerminated = true;
    try {
      this.worker.terminate();
    } catch (e) {
      // Worker may already be terminated
    }
  }
}

function removeWorkerFromPool(instance) {
  const idx = workerPool.indexOf(instance);
  if (idx !== -1) workerPool.splice(idx, 1);
}

function processQueue() {
  // Clean terminated workers
  for (let i = workerPool.length - 1; i >= 0; i--) {
    if (workerPool[i].isTerminated) workerPool.splice(i, 1);
  }

  if (taskQueue.length === 0) return;

  const task = taskQueue[0];
  let idleWorker = workerPool.find(
    (w) => w.taskName === task.taskName && w.currentTaskId === null && !w.isTerminated
  );

  // Evict idle worker of different type if at capacity
  if (!idleWorker && workerPool.length >= MAX_WORKERS) {
    const idleOther = workerPool.find(
      (w) => w.currentTaskId === null && w.taskName !== task.taskName && !w.isTerminated
    );
    if (idleOther) {
      idleOther.terminate();
      removeWorkerFromPool(idleOther);
    }
  }

  // Spawn new worker if under capacity
  if (!idleWorker && workerPool.length < MAX_WORKERS) {
    try {
      idleWorker = new WorkerInstance(task.taskName);
      workerPool.push(idleWorker);
    } catch (err) {
      console.error(`[WorkerManager] Failed to spawn worker for ${task.taskName}:`, err);
      taskQueue.shift();
      task.reject(err);
      processQueue();
      return;
    }
  }

  if (idleWorker) {
    taskQueue.shift();
    idleWorker.currentTaskId = task.id;

    const timeoutId = setTimeout(() => {
      const activeTask = activeTasks.get(task.id);
      if (activeTask) {
        activeTask.reject(new Error(
          `Task ${task.taskName} timed out after ${TASK_TIMEOUT_MS / 1000}s`
        ));
        activeTasks.delete(task.id);
      }
      idleWorker.terminate();
      removeWorkerFromPool(idleWorker);
      processQueue();
    }, TASK_TIMEOUT_MS);

    activeTasks.set(task.id, {
      resolve: task.resolve,
      reject: task.reject,
      onProgress: task.onProgress,
      timeoutId,
      worker: idleWorker,
    });

    try {
      const validTransferables = (task.transferables || []).filter(
        (t) => t && t.byteLength > 0
      );
      idleWorker.worker.postMessage(
        { id: task.id, task: task.taskName, payload: task.payload },
        validTransferables
      );
    } catch (e) {
      console.warn('[WorkerManager] Buffer transfer failed, using copy:', e);
      idleWorker.worker.postMessage({
        id: task.id,
        task: task.taskName,
        payload: task.payload,
      });
    }
  }
}

/**
 * Run a PDF worker task with automatic queue management.
 */
export function runPdfWorkerTask(taskName, payload, transferables = [], onProgress = null) {
  return new Promise((resolve, reject) => {
    const id = ++taskCounter;
    taskQueue.push({
      id,
      taskName,
      payload,
      transferables,
      onProgress,
      resolve,
      reject,
    });
    processQueue();
  });
}

/**
 * Pre-initialize a worker for a given task type.
 */
export function initPdfWorker(taskName) {
  const exists = workerPool.find(
    (w) => w.taskName === taskName && !w.isTerminated
  );
  if (!exists && workerPool.length < MAX_WORKERS) {
    try {
      workerPool.push(new WorkerInstance(taskName));
    } catch (e) {
      console.error('[WorkerManager] Pre-init failed:', e);
    }
  }
}

// Expose globally for backward compat
window.runPdfWorkerTask = runPdfWorkerTask;
