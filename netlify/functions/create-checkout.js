const { Client, Environment } = require('square');
const crypto = require('crypto');

const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Production,
});

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
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
        basePriceMoney: {
          amount: BigInt(Math.round(price * 100)),
          currency: 'GBP',
        },
      };
    });

    var orderNote = [
      name ? 'Name: ' + name : '',
      phone ? 'Phone: ' + phone : '',
      notes ? 'Notes: ' + notes : '',
    ].filter(Boolean).join(' | ');

    const response = await client.checkoutApi.createPaymentLink({
      idempotencyKey: crypto.randomUUID(),
      order: {
        locationId: process.env.SQUARE_LOCATION_ID,
        lineItems: lineItems,
        referenceId: name || 'Web Order',
        note: orderNote || undefined,
      },
      checkoutOptions: {
        redirectUrl: process.env.URL + '/success/',
      },
      prePopulatedData: {
        buyerEmail: email || undefined,
      },
    });

    // Surface any Square API validation errors
    if (response.result.errors && response.result.errors.length > 0) {
      var errorMsg = response.result.errors.map(function (e) {
        return e.detail || e.code;
      }).join('; ');
      return { statusCode: 400, body: JSON.stringify({ error: 'Square: ' + errorMsg }) };
    }

    if (!response.result.paymentLink || !response.result.paymentLink.url) {
      return { statusCode: 500, body: JSON.stringify({ error: 'No payment URL returned from Square' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ url: response.result.paymentLink.url }),
    };
  } catch (err) {
    console.error('Square error:', err);
    // Square ApiError has errors array
    if (err.errors && err.errors.length > 0) {
      var msg = err.errors.map(function (e) { return e.detail || e.code; }).join('; ');
      return { statusCode: 400, body: JSON.stringify({ error: 'Square: ' + msg }) };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Payment error' }),
    };
  }
};
