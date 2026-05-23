/**
 * Netlify Function: Gemini API Proxy
 * Proxies requests to Google Gemini API with rate limiting and input sanitization.
 */

const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  const noHtml = str.replace(/<\/?[^>]+(>|$)/g, '');
  const escaped = noHtml.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const injectionPatterns = [/ignore previous/i, /bypass rules/i, /system prompt/i, /you are now/i];
  for (const p of injectionPatterns) { if (p.test(escaped)) throw new Error('Security violation detected'); }
  return escaped;
};

const getCorsHeaders = (request) => {
  const origin = request?.headers?.get?.('Origin') || 'https://pdfminty.com';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
};

const checkRateLimit = (ip) => {
  const map = globalThis._geminiRateMap || (globalThis._geminiRateMap = new Map());
  const windowBucket = Math.floor(Date.now() / 60000);
  const key = `${ip}:${windowBucket}`;
  const current = map.get(key) || 0;
  if (current >= 10) return { allowed: false };
  map.set(key, current + 1);
  return { allowed: true };
};

export async function handler(event, context) {
  const headers = getCorsHeaders(event);
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const clientIp = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
  const rl = checkRateLimit(clientIp);
  if (!rl.allowed) {
    return { statusCode: 429, headers, body: JSON.stringify({ error: 'Too many requests. Try again later.' }) };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Service not configured' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const prompt = sanitizeString(body.prompt || '').substring(0, 500);
    const context = sanitizeString(body.context || '').substring(0, 500);

    const parts = [];
    if (context) parts.push({ text: `Context: ${context}` });
    if (prompt) parts.push({ text: `Prompt: ${prompt}` });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }] }),
      }
    );
    const data = await response.json();
    return { statusCode: response.ok ? 200 : 502, headers, body: JSON.stringify(data) };
  } catch (err) {
    console.error('Gemini proxy error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'AI service unavailable' }) };
  }
}
