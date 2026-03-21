const crypto = require('crypto');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const token = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;

  if (!token || !locationId) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Square credentials not configured on server' }) };
  }

  try {
    const { items, name, email, phone, notes } = JSON.parse(event.body);

    if (!items || items.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No items in basket' }) };
    }

    const lineItems = items.map(function (item) {
      var price = parseFloat((item.price || '0').replace('£', '').replace('+', '')) || 0;
      var itemName = item.name;
      if (item.colour && item.colour !== 'No preference') itemName += ' (' + item.colour + ')';
      if (item.keychainName) itemName += ' — Name: ' + item.keychainName;
      return {
        name: itemName,
        quantity: String(item.qty),
        base_price_money: {
          amount: Math.round(price * 100),
          currency: 'GBP',
        },
      };
    });

    const orderNote = [
      name ? 'Name: ' + name : '',
      phone ? 'Phone: ' + phone : '',
      notes ? 'Notes: ' + notes : '',
    ].filter(Boolean).join(' | ');

    const squareRes = await fetch('https://connect.squareup.com/v2/online-checkout/payment-links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
        'Square-Version': '2024-10-17',
      },
      body: JSON.stringify({
        idempotency_key: crypto.randomUUID(),
        order: {
          location_id: locationId,
          line_items: lineItems,
          reference_id: name || 'Web Order',
          note: orderNote || undefined,
        },
        checkout_options: {
          redirect_url: process.env.URL + '/success/',
        },
        pre_populated_data: {
          buyer_email: email || undefined,
        },
      }),
    });

    const data = await squareRes.json();

    if (!squareRes.ok || data.errors) {
      var errMsg = data.errors
        ? data.errors.map(function (e) { return e.detail || e.code; }).join('; ')
        : 'Square API error ' + squareRes.status;
      return { statusCode: 400, body: JSON.stringify({ error: errMsg }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ url: data.payment_link.url }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Unexpected error' }),
    };
  }
};
