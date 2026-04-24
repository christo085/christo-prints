// Cart module — localStorage CRUD, badge update, flash feedback
window.Cart = (function () {
  var KEY = 'christoCart';

  function slugify(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  function parsePrice(price) {
    if (typeof price === 'number') return price;
    return parseFloat(String(price || '0').replace('£', '').replace('+', '')) || 0;
  }

  function pricePence(price) {
    return Math.round(parsePrice(price) * 100);
  }

  function itemUnitPence(item) {
    if (typeof item.pricePence === 'number') return item.pricePence;
    return pricePence(item.price);
  }

  function formatPence(pence) {
    return '£' + ((pence || 0) / 100).toFixed(2);
  }

  function track(eventName, details) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      details: details || {},
      timestamp: new Date().toISOString()
    });
    document.dispatchEvent(new CustomEvent('cpAnalytics', { detail: { event: eventName, details: details || {} } }));
  }

  function getItems() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function _save(items) {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch (e) { /* storage full / unavailable */ }
  }

  function addItem(name, price, type, opts) {
    var options = opts || {};
    var items = getItems();
    var isKeychain = name === 'Name Keychain';

    if (isKeychain) {
      // Each keychain is a separate entry with unique ID
      var count = items.filter(function (i) { return i.name === 'Name Keychain'; }).length;
      var id = 'name-keychain-' + (count + 1);
      // Ensure unique ID
      while (items.find(function (i) { return i.id === id; })) {
        count++;
        id = 'name-keychain-' + (count + 1);
      }
      items.push({ id: id, name: name, price: '£1.00', pricePence: 100, type: type || 'product', colour: options.colour || 'No preference', qty: 1, keychainName: '' });
    } else if (options.uniqueId) {
      // Force a new entry with a specific ID (used by bundle builder to avoid qty-merging)
      items.push({ id: options.uniqueId, name: name, price: price, pricePence: pricePence(price), type: type || 'product', colour: options.colour || 'No preference', qty: 1 });
    } else {
      var id = slugify(name);
      var existing = items.find(function (i) { return i.id === id; });
      if (existing) {
        existing.qty += 1;
      } else {
        items.push({ id: id, name: name, price: price, pricePence: pricePence(price), type: type || 'product', colour: options.colour || 'No preference', qty: 1 });
      }
    }
    _save(items);
    updateBadge();
    track('add_to_basket', { name: name, type: type || 'product' });
    document.dispatchEvent(new CustomEvent('cartItemAdded', { detail: { name: name } }));
  }

  function removeItem(id) {
    var items = getItems().filter(function (i) { return i.id !== id; });
    _save(items);
    updateBadge();
  }

  function updateQty(id, delta) {
    var items = getItems();
    var item = items.find(function (i) { return i.id === id; });
    if (!item) return;
    item.qty = Math.max(1, item.qty + delta);
    _save(items);
    updateBadge();
  }

  function updateColour(id, colour) {
    var items = getItems();
    var item = items.find(function (i) { return i.id === id; });
    if (!item) return;
    item.colour = colour;
    _save(items);
  }

  function updateKeychainName(id, name) {
    var items = getItems();
    var item = items.find(function (i) { return i.id === id; });
    if (!item) return;
    item.keychainName = name;
    item.price = keychainPrice(name);
    item.pricePence = pricePence(item.price);
    _save(items);
  }

  function keychainPrice(name) {
    var len = (name || '').trim().length;
    if (len <= 4) return '£1.00';
    if (len <= 7) return '£1.50';
    return '£2.00';
  }

  function clear() {
    _save([]);
    updateBadge();
  }

  function getCount() {
    return getItems().reduce(function (sum, i) { return sum + i.qty; }, 0);
  }

  function getTotal() {
    return getItems().reduce(function (sum, i) { return sum + (itemUnitPence(i) * i.qty); }, 0) / 100;
  }

  function toSummaryText() {
    return getItems().map(function (i) {
      var line = i.qty + 'x ' + i.name + ' (' + i.colour + ') - ' + i.price + ' each';
      if (i.keychainName) line += ' [Name: ' + i.keychainName + ']';
      return line;
    }).join('\n');
  }

  function encodeShare() {
    var items = getItems().map(function (i) {
      return {
        id: i.id,
        name: i.name,
        price: i.price,
        pricePence: itemUnitPence(i),
        type: i.type || 'product',
        colour: i.colour || 'No preference',
        qty: i.qty || 1,
        keychainName: i.keychainName || ''
      };
    });
    return btoa(unescape(encodeURIComponent(JSON.stringify(items))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  function restoreShare(encoded) {
    if (!encoded) return false;
    try {
      var normalised = encoded.replace(/-/g, '+').replace(/_/g, '/');
      while (normalised.length % 4) normalised += '=';
      var items = JSON.parse(decodeURIComponent(escape(atob(normalised))));
      if (!Array.isArray(items)) return false;
      var safeItems = items.slice(0, 50).map(function (i) {
        return {
          id: String(i.id || slugify(i.name || 'item')).slice(0, 120),
          name: String(i.name || 'Item').slice(0, 120),
          price: String(i.price || formatPence(i.pricePence || 0)).slice(0, 20),
          pricePence: typeof i.pricePence === 'number' ? i.pricePence : pricePence(i.price),
          type: String(i.type || 'product').slice(0, 40),
          colour: String(i.colour || 'No preference').slice(0, 80),
          qty: Math.max(1, Math.min(99, parseInt(i.qty, 10) || 1)),
          keychainName: String(i.keychainName || '').slice(0, 40)
        };
      });
      _save(safeItems);
      updateBadge();
      track('restore_shared_basket', { count: safeItems.length });
      return true;
    } catch (e) {
      return false;
    }
  }

  function updateBadge() {
    var count = getCount();
    var ids = ['cart-count', 'cart-count-mobile'];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.textContent = count;
      el.hidden = count === 0;
    });
  }

  function flashAdded(buttonEl) {
    var originalHTML = buttonEl.innerHTML;
    buttonEl.textContent = 'Added!';
    buttonEl.classList.add('btn-added');
    setTimeout(function () {
      buttonEl.innerHTML = originalHTML;
      buttonEl.classList.remove('btn-added');
    }, 600);
  }

  document.addEventListener('DOMContentLoaded', updateBadge);

  return {
    getItems: getItems,
    addItem: addItem,
    removeItem: removeItem,
    updateQty: updateQty,
    updateColour: updateColour,
    updateKeychainName: updateKeychainName,
    keychainPrice: keychainPrice,
    parsePrice: parsePrice,
    pricePence: pricePence,
    itemUnitPence: itemUnitPence,
    formatPence: formatPence,
    encodeShare: encodeShare,
    restoreShare: restoreShare,
    track: track,
    clear: clear,
    getCount: getCount,
    getTotal: getTotal,
    toSummaryText: toSummaryText,
    updateBadge: updateBadge,
    flashAdded: flashAdded
  };
})();
