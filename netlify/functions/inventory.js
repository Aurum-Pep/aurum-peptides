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

                      if (event.httpMethod === 'GET') {
                          try {
                                const url = `${SHEETS_URL}?action=getInventory&secret=${SECRET}`;
                                      const resp = await fetch(url);
                                            const data = await resp.json();
                                                  return { statusCode: 200, headers, body: JSON.stringify(data) };
                                                      } catch (err) {
                                                            return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
                                                                }
                                                                  }

                                                                    if (event.httpMethod === 'POST') {
                                                                        try {
                                                                              const body = JSON.parse(event.body || '{}');
                                                                                    const action = body.action === 'update' ? 'updateInventory' : 'deductInventory';
                                                                                          const url = `${SHEETS_URL}?secret=${SECRET}`;
                                                                                                const resp = await fetch(url, {
                                                                                                        method: 'POST',
                                                                                                                headers: { 'Content-Type': 'application/json' },
                                                                                                                        body: JSON.stringify({ ...body, action, secret: SECRET }),
                                                                                                                              });
                                                                                                                                    const data = await resp.json();
                                                                                                                                          return { statusCode: 200, headers, body: JSON.stringify(data) };
                                                                                                                                              } catch (err) {
                                                                                                                                                    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
                                                                                                                                                        }
                                                                                                                                                          }
                                                                                                                                                          
                                                                                                                                                            return { statusCode: 405, headers, body: JSON.stringify({ error: 'Metodo no permitido' }) };
                                                                                                                                                            };
