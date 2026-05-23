/**
 * tools/shared.js - Shared utilities for all PDF tools
 */

import { db } from '../src/core/Database.js';

export async function getPdfBytes(input) {
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (typeof input === 'string') {
    const ab = await db.getFile(input);
    if (!ab) throw new Error('File not found in storage. Please re-upload.');
    return new Uint8Array(ab);
  }
  throw new Error('Could not retrieve file data.');
}

export function parsePageRanges(text, totalPages) {
  const pages = new Set();
  for (const part of text.split(',')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed.includes('-')) {
      let [s, e] = trimmed.split('-').map(Number);
      if (s > e) [s, e] = [e, s];
      for (let i = s; i <= e; i++) {
        if (i >= 1 && i <= totalPages) pages.add(i);
      }
    } else {
      const n = Number(trimmed);
      if (n >= 1 && n <= totalPages) pages.add(n);
    }
  }
  return Array.from(pages).sort((a, b) => a - b);
}

export function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + units[i];
}

/**
 * Standard error handler for tools.
 */
export function handleToolError(error, context = '') {
  console.error(`[Tool Error${context ? ' ' + context : ''}]:`, error);
  let message = error?.message || 'An unexpected error occurred.';

  const lowered = message.toLowerCase();
  if (lowered.includes('password') || lowered.includes('encrypted')) {
    message = 'This PDF is password-protected. Please unlock it first.';
  } else if (lowered.includes('corrupt') || lowered.includes('invalid')) {
    message = 'The PDF appears to be corrupted or invalid.';
  } else if (lowered.includes('timeout')) {
    message = 'The operation timed out. Try with a smaller file.';
  } else if (lowered.includes('memory')) {
    message = 'Not enough memory. Try with a smaller file or fewer pages.';
  }

  return message;
}
