// Cart module — localStorage CRUD, badge update, flash feedback
window.Cart = (function () {
  var KEY = 'christoCart';

  function slugify(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
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

  function addItem(name, price, type) {
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
      items.push({ id: id, name: name, price: '£1.00', type: type || 'product', colour: 'No preference', qty: 1, keychainName: '' });
    } else {
      var id = slugify(name);
      var existing = items.find(function (i) { return i.id === id; });
      if (existing) {
        existing.qty += 1;
      } else {
        items.push({ id: id, name: name, price: price, type: type || 'product', colour: 'No preference', qty: 1 });
      }
    }
    _save(items);
    updateBadge();
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
    return getItems().reduce(function (sum, i) {
      var p = parseFloat((i.price || '0').replace('£', '')) || 0;
      return sum + (p * i.qty);
    }, 0);
  }

  function toSummaryText() {
    return getItems().map(function (i) {
      var line = i.qty + 'x ' + i.name + ' (' + i.colour + ') - ' + i.price + ' each';
      if (i.keychainName) line += ' [Name: ' + i.keychainName + ']';
      return line;
    }).join('\n');
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
    }, 1200);
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
    clear: clear,
    getCount: getCount,
    getTotal: getTotal,
    toSummaryText: toSummaryText,
    updateBadge: updateBadge,
    flashAdded: flashAdded
  };
})();
