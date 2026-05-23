import { runPdfWorkerTask as originalRunPdfWorkerTask } from '../src/core/WorkerManager.js';

export function runPdfWorkerTask(taskName, payload, transferables, onProgress) {
  try {
    return originalRunPdfWorkerTask(taskName, payload, transferables || [], onProgress || null);
  } catch (error) {
    console.error('[pdfWorker] runPdfWorkerTask failed:', error);
    throw error;
  }
}
