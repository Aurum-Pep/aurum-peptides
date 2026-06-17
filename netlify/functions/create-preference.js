const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxay66mRRs4QZPCvMK0c4Digkv2LTHkoIZfuJ6Gh5nxlLcjxVjqvUrIeZE1igDXjZ4I/exec';
const GAS_SECRET = 'aurum2026secret';
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
    const { items, buyerEmail, promoCode, shipping, orderRef, shippingData } = JSON.parse(event.body || '{}');

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

    // Agregar costo de envío como ítem si aplica
    const shippingCost = Number(shipping) || 0;
    if (shippingCost > 0) {
      mpItems.push({
        id: 'aurum-envio',
        title: 'Envío express',
        description: 'Envío a domicilio · Aurum Peptides',
        quantity: 1,
        unit_price: shippingCost,
        currency_id: 'MXN',
      });
    }

    const totalAmount = mpItems.reduce(function(s, it){ return s + it.unit_price * it.quantity; }, 0);

    // Correo del comprador: usar el del checkout (shippingData.email) si no vino buyerEmail.
    // Sin esto, Mercado Pago no tiene a quién enviar el recibo de pago.
    const payerEmail = buyerEmail || (shippingData && shippingData.email) || null;

    const preference = {
      items: mpItems,
      ...(payerEmail && { payer: { email: payerEmail } }),
      back_urls: {
        success: SUCCESS_URL + '?ref=' + encodeURIComponent(orderRef || '') + '&status=approved',
        failure: FAILURE_URL,
        pending: SUCCESS_URL + '?status=pending',
      },
      auto_return: 'approved',
      notification_url: BASE_URL + '/.netlify/functions/mp-webhook',
      external_reference: JSON.stringify({ ref: orderRef || ('AURUM-'+Date.now()), shipping: shipping || null }),
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

    // Guardar pedido en Sheets desde el servidor (sin CORS, confiable)
    try {
      const sh = (typeof shippingData === 'object' && shippingData) ? shippingData : {};
      const itemsTxt = items.map(function(i){ return i.name + ' ' + (i.dose||'') + ' x' + i.qty; }).join(', ');
      await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addOrder', secret: GAS_SECRET, sheet: 'Pedidos',
          ref: orderRef || ('AURUM-' + Date.now()),
          fecha: new Date().toLocaleDateString('es-MX', { timeZone: 'America/Ciudad_Juarez' }),
          nombre: sh.nombre || '', email: sh.email || '', tel: sh.tel || '',
          calle: sh.calle || '', colonia: sh.colonia || '', cp: sh.cp || '',
          ciudad: sh.ciudad || '', estado: sh.estado || '',
          total: totalAmount, envio: shippingCost,
          items: itemsTxt, itemsStr: itemsTxt,
          statusPago: 'pending', paymentId: mpData.id || ''
        }),
      });
    } catch (e) { console.error('Sheets save error:', e.message); }

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
