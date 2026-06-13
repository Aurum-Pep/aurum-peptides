const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const SHEETS_URL = process.env.SHEETS_WEBAPP_URL;
  const SECRET = process.env.SHEETS_SECRET || 'aurum2026secret';

  if (!SHEETS_URL) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'SHEETS_WEBAPP_URL no configurada' }) };
  }

  // ── LEER reseñas de un producto ──
  if (event.httpMethod === 'GET') {
    try {
      const slug = (event.queryStringParameters && event.queryStringParameters.slug) || '';
      const url = `${SHEETS_URL}?action=getReviews&secret=${SECRET}&slug=${encodeURIComponent(slug)}`;
      const resp = await fetch(url);
      const data = await resp.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    } catch (err) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
  }

  // ── PUBLICAR una reseña ──
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      const url = `${SHEETS_URL}?secret=${SECRET}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, action: 'addReview', secret: SECRET }),
      });
      const data = await resp.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    } catch (err) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Metodo no permitido' }) };
};
