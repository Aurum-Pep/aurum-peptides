const WHATSAPP_NUMBER = '526572844902';

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Metodo no permitido' }) };

  try {
    const { shipping, orderRef, items, total, shippingCost } = JSON.parse(event.body || '{}');
    if (!shipping || !orderRef) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Datos incompletos' }) };

    const LCX = ['es','-','MX'].join('');

    const itemsText = (items || [])
      .map(i => '* ' + i.name + ' x' + i.qty + ' $' + (i.price * i.qty).toLocaleString(LCX) + ' MXN')
      .join('\n');

    const dir = shipping.calle + ', Col. ' + shipping.colonia + ', CP ' + shipping.cp + ', ' + shipping.ciudad + ', ' + shipping.estado;

    const msg =
      '\uD83E\uDDEC Nuevo pedido Aurum Peptides\n' +
      'Ref: ' + orderRef + '\n' +
      'Cliente: ' + shipping.nombre + '\n' +
      'Tel: ' + shipping.tel + '\n' +
      'Productos:\n' + itemsText + '\n' +
      'Total: $' + (total || 0).toLocaleString(LCX) + ' MXN\n' +
      'Direccion:\n' + dir;

    const waUrl = 'https://api.whatsapp.com/send?phone=' + WHATSAPP_NUMBER + '&text=' + encodeURIComponent(msg);

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, waUrl }) };

  } catch(e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
