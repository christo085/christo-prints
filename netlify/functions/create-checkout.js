const crypto = require('crypto');

function parsePrice(price) {
  return parseFloat(String(price || '0').replace('£', '').replace('+', '')) || 0;
}

function keychainPrice(name) {
  const len = String(name || '').trim().length;
  if (len <= 4) return 1;
  if (len <= 7) return 1.5;
  return 2;
}

function formatPrice(price) {
  return '£' + price.toFixed(2);
}

function productLookup() {
  const products = require('../../src/_data/products.json');
  const events = require('../../src/_data/events.json');
  const bundles = require('../../src/_data/bundles.json');
  const map = new Map();

  (products.items || []).forEach(function (item) {
    map.set(item.name, { price: parsePrice(item.price), active: item.active !== false });
  });
  (events.seasonal || []).forEach(function (item) {
    map.set(item.name, { price: parsePrice(item.price), active: item.active !== false, seasonal: true });
  });
  (bundles.items || []).forEach(function (item) {
    map.set(item.name, { price: parsePrice(item.price), active: item.active !== false, bundle: true });
  });

  return map;
}

function validatedLineItems(items) {
  const lookup = productLookup();

  return items.map(function (item) {
    const qty = Math.max(1, Math.min(99, parseInt(item.qty, 10) || 1));
    const isBundleItem = /^bndl-\d+-\d+$/.test(String(item.id || ''));
    let price;

    if (item.name === 'Name Keychain') {
      price = keychainPrice(item.keychainName);
    } else {
      const record = lookup.get(item.name);
      if (!record || !record.active) {
        throw new Error('Unavailable item in basket: ' + item.name);
      }
      price = isBundleItem ? Math.round(record.price * 90) / 100 : record.price;
    }

    const safeItem = {
      name: String(item.name || 'Item').slice(0, 120),
      colour: String(item.colour || 'No preference').slice(0, 80),
      keychainName: String(item.keychainName || '').slice(0, 40),
      qty: qty,
      price: price,
    };

    let itemName = safeItem.name;
    if (safeItem.colour && safeItem.colour !== 'No preference') itemName += ' (' + safeItem.colour + ')';
    if (safeItem.keychainName) itemName += ' — Name: ' + safeItem.keychainName;

    return {
      cartItem: safeItem,
      squareItem: {
        name: itemName,
        quantity: String(qty),
        base_price_money: {
          amount: Math.round(price * 100),
          currency: 'GBP',
        },
      },
    };
  });
}

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
    const { items, name, email, phone, notes, couponCode } = JSON.parse(event.body);

    if (!items || items.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No items in basket' }) };
    }

    const validated = validatedLineItems(items);
    const subtotal = validated.reduce(function (sum, line) {
      return sum + (line.cartItem.price * line.cartItem.qty);
    }, 0);
    const totalQty = validated.reduce(function (sum, line) {
      return sum + line.cartItem.qty;
    }, 0);

    // Validate coupon server-side
    const coupons = require('../../src/_data/coupons.json');
    const coupon = couponCode
      ? coupons.items.find(function (c) { return c.code.toUpperCase() === couponCode.toUpperCase() && c.active; })
      : null;

    // For percentage coupons use LINE_ITEM scope so the fee isn't discounted
    const discountUid = coupon ? 'coupon-' + coupon.code : null;
    const useLineItemScope = coupon && coupon.type === 'percentage';

    let discount = 0;
    if (coupon) {
      discount = coupon.type === 'percentage'
        ? subtotal * (coupon.value / 100)
        : Math.min(coupon.value, subtotal);
    }
    const finalTotal = Math.max(0, subtotal - discount);
    if (finalTotal > 30 || totalQty > 20) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Card payment unavailable for large orders' }) };
    }
    const cardFee = Math.round((finalTotal * 0.014 + 0.25) * 100) / 100;

    const lineItems = validated.map(function (line) {
      var lineItem = line.squareItem;
      if (useLineItemScope) {
        lineItem.applied_discounts = [{ discount_uid: discountUid }];
      }
      return lineItem;
    });

    if (cardFee && cardFee > 0) {
      lineItems.push({
        name: 'Card processing fee (1.4% + 25p)',
        quantity: '1',
        base_price_money: {
          amount: Math.round(cardFee * 100),
          currency: 'GBP',
        },
        // No applied_discounts — fee is never discounted
      });
    }

    const orderNote = [
      name ? 'Name: ' + name : '',
      phone ? 'Phone: ' + phone : '',
      coupon ? '[DISCOUNT CODE: ' + coupon.code + ' — ' + coupon.description + ']' : '',
      'Server total before card fee: ' + formatPrice(finalTotal),
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
          ...(coupon ? {
            discounts: [{
              uid: discountUid,
              name: coupon.description,
              scope: useLineItemScope ? 'LINE_ITEM' : 'ORDER',
              ...(coupon.type === 'percentage'
                ? { percentage: String(coupon.value) }
                : { amount_money: { amount: Math.round(coupon.value * 100), currency: 'GBP' } }
              ),
            }],
          } : {}),
        },
        checkout_options: {
          redirect_url: process.env.URL + '/success/?ref=sq',
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
