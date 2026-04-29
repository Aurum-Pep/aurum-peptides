// ═══════════════════════════════════════════════════════════════
// Netlify Function: order-admin.js
// Proxy seguro para que el admin actualice pedidos en Google Sheets
// Deploy en: /netlify/functions/order-admin.js
// ═══════════════════════════════════════════════════════════════

const GAS_URL  = process.env.GAS_URL || 'https://script.google.com/macros/s/AKfycbwIYuMzIQNVVeOi3R73ZhYH6ayW6vIW5vC6Gh66iDvE-3w6tPOaeH5L2-2Ch0N6V5qM/exec';
const SECRET   = process.env.SHEETS_SECRET || 'aurum2026secret';
const ADMIN_KEY = process.env.ADMIN_KEY || 'aurum2026admin';

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  // Auth check via Authorization header or body
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch(e) {}
  const authHeader = (event.headers.authorization || '').replace('Bearer ', '');
  const adminKey = authHeader || body.adminKey;

  if (adminKey !== ADMIN_KEY) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'No autorizado' }) };
  }

  try {
    const { action, ref, status, guia, carrier, note } = body;

    if (!action) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Falta action' }) };

    // Forward to Google Apps Script with internal secret
    const gasBody = { action, secret: SECRET, ref, status, guia, carrier, note };

    const gasRes = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gasBody),
    });

    if (!gasRes.ok) {
      const errText = await gasRes.text();
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Error GAS', detail: errText }) };
    }

    const gasData = await gasRes.json();
    return { statusCode: 200, headers, body: JSON.stringify(gasData) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Error interno', detail: err.message }) };
  }
};
