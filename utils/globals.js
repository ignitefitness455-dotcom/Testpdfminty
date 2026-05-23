import { downloadFile as originalDownloadFile, downloadBlob } from '../src/utils/fileUtils.js';
import { UI } from '../src/utils/UIManager.js';

export function downloadFile(uint8Array, filename) {
  try {
    if (!uint8Array) throw new Error('No data provided');
    if (!filename) throw new Error('No filename provided');
    originalDownloadFile(uint8Array, filename);
  } catch (error) {
    console.error('[globals] downloadFile failed:', error);
    throw error;
  }
}

export function downloadBlobFile(blob, filename) {
  try {
    downloadBlob(blob, filename);
  } catch (error) {
    console.error('[globals] downloadBlob failed:', error);
    throw error;
  }
}

export function showSuccess(message) {
  try {
    UI.showSuccess(message);
  } catch (error) {
    console.error('[globals] showSuccess failed:', error);
  }
}

export function showError(message) {
  try {
    UI.showError(message);
  } catch (error) {
    console.error('[globals] showError failed:', error);
  }
}

export function showProgress(percentOrData, labelText) {
  try {
    UI.showProgress(percentOrData, labelText);
  } catch (error) {
    console.error('[globals] showProgress failed:', error);
  }
}

export function hideProgress() {
  try {
    UI.hideProgress();
  } catch (error) {
    console.error('[globals] hideProgress failed:', error);
  }
}
