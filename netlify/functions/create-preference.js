const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const BASE_URL = process.env.BASE_URL || 'https://aurumpeptides.mx';
const SUCCESS_URL = BASE_URL + '/success.html';
const FAILURE_URL = BASE_URL + '/failure.html';

const PROMO_CODES = {
  'AURUM10': 0.10,
  'BIENVENIDO': 0.15,
};

exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Metodo no permitido' }) };
  }

  try {
    const { items, buyerEmail, promoCode } = JSON.parse(event.body || '{}');

    if (!items || !items.length) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Carrito vacio' }) };
    }

    const discountPct = PROMO_CODES[(promoCode || '').toUpperCase()] || 0;

    const mpItems = items.map((item, i) => {
      const basePrice = Number(item.price);
      const finalPrice = discountPct > 0 ? Math.round(basePrice * (1 - discountPct)) : basePrice;
      return {
        id: 'aurum-' + item.name.toLowerCase().replace(/\s+/g, '-') + '-' + i,
        title: item.name + ' — ' + item.dose,
        description: 'Peptido de investigacion · Aurum Peptides',
        quantity: Number(item.qty) || 1,
        unit_price: finalPrice,
        currency_id: 'MXN',
      };
    });

    const preference = {
      items: mpItems,
      ...(buyerEmail && { payer: { email: buyerEmail } }),
      back_urls: {
        success: SUCCESS_URL,
        failure: FAILURE_URL,
        pending: SUCCESS_URL + '?status=pending',
      },
      auto_return: 'approved',
      external_reference: 'AURUM-' + Date.now(),
      statement_descriptor: 'AURUM PEPTIDES',
      expires: true,
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + MP_ACCESS_TOKEN,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': 'aurum-' + Date.now(),
      },
      body: JSON.stringify(preference),
    });

    if (!mpResponse.ok) {
      const errText = await mpResponse.text();
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Error MP', detail: errText }) };
    }

    const mpData = await mpResponse.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        checkoutUrl: mpData.init_point,
        sandboxUrl: mpData.sandbox_init_point,
        preferenceId: mpData.id,
        externalRef: preference.external_reference,
      }),
    };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Error interno', detail: err.message }) };
  }
};
