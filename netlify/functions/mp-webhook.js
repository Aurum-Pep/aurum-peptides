// Webhook de Mercado Pago: cuando un pago queda 'approved',
// avisa a Apps Script (notifyPaid) para enviar los correos (a ti y al cliente).
// MP espera un 200 rapido; por eso siempre respondemos 200 aunque algo falle.

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxay66mRRs4QZPCvMK0c4Digkv2LTHkoIZfuJ6Gh5nxlLcjxVjqvUrIeZE1igDXjZ4I/exec';
const GAS_SECRET = 'aurum2026secret';

exports.handler = async function (event) {
  try {
    const qs = event.queryStringParameters || {};
    let body = {};
    try { body = event.body ? JSON.parse(event.body) : {}; } catch (e) {}

    const type = qs.type || qs.topic || body.type || '';
    let paymentId =
      qs['data.id'] ||
      (body.data && body.data.id) ||
      (type === 'payment' ? qs.id : null) ||
      null;

    // Si MP avisa por merchant_order, buscamos el pago aprobado dentro de la orden
    if (!paymentId && (type === 'merchant_order' || qs.topic === 'merchant_order')) {
      const moId = qs.id || (body.data && body.data.id);
      if (moId) {
        const moRes = await fetch('https://api.mercadopago.com/merchant_orders/' + moId, {
          headers: { 'Authorization': 'Bearer ' + MP_ACCESS_TOKEN },
        });
        if (moRes.ok) {
          const mo = await moRes.json();
          const pays = (mo && mo.payments) || [];
          const approved = pays.find(function (p) { return p.status === 'approved'; }) || pays[0];
          if (approved) paymentId = approved.id;
        }
      }
    }

    if (!paymentId) {
      return { statusCode: 200, body: 'no payment id' };
    }

    // Consultar el estado real del pago en MP
    const payRes = await fetch('https://api.mercadopago.com/v1/payments/' + paymentId, {
      headers: { 'Authorization': 'Bearer ' + MP_ACCESS_TOKEN },
    });
    if (!payRes.ok) {
      return { statusCode: 200, body: 'payment fetch failed' };
    }
    const pay = await payRes.json();

    if (pay.status !== 'approved') {
      return { statusCode: 200, body: 'not approved: ' + pay.status };
    }

    // external_reference = JSON { ref, shipping }  (lo arma create-preference.js)
    let ref = '';
    try {
      const ext = JSON.parse(pay.external_reference || '{}');
      ref = ext.ref || '';
    } catch (e) {
      ref = pay.external_reference || '';
    }
    if (!ref) {
      return { statusCode: 200, body: 'no ref' };
    }

    // Disparar el envio de correos (notifyPaid es idempotente del lado de GAS)
    await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'notifyPaid', secret: GAS_SECRET, ref: ref, paymentId: paymentId }),
    });

    return { statusCode: 200, body: 'ok' };
  } catch (e) {
    console.error('mp-webhook error:', e.message);
    return { statusCode: 200, body: 'error handled' };
  }
};
