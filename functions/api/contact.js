/**
 * Netlify Function: Contact Form Handler
 * Processes contact form submissions with validation.
 */

const getCorsHeaders = (request) => {
  const origin = request?.headers?.get?.('Origin') || request?.headers?.origin || 'https://pdfminty.com';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
};

const checkRateLimit = (ip) => {
  const map = globalThis._contactRateMap || (globalThis._contactRateMap = new Map());
  const windowBucket = Math.floor(Date.now() / 60000);
  const key = `${ip}:${windowBucket}`;
  const current = map.get(key) || 0;
  if (current >= 5) return { allowed: false };
  map.set(key, current + 1);
  return { allowed: true };
};

const sanitize = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/<\/?[^>]+(>|$)/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
    return { statusCode: 429, headers, body: JSON.stringify({ error: 'Too many requests' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const name = sanitize((body.name || '').trim());
    const email = sanitize((body.email || '').trim());
    const type = sanitize((body.type || '').trim());
    const message = sanitize((body.message || '').trim());

    if (!name || name.length < 2) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Name is required (2+ characters)' }) };
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Valid email is required' }) };
    if (!type || !['General Inquiry', 'Feedback', 'Bug Report', 'Business'].includes(type)) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid topic' }) };
    if (!message || message.length < 10) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Message must be at least 10 characters' }) };

    console.log(`[Contact] ${type} from ${name} <${email}>: ${message.substring(0, 100)}`);
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Thank you! Your message was received.' }) };
  } catch (err) {
    console.error('Contact error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to process submission' }) };
  }
}
