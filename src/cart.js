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
    var id = slugify(name);
    var existing = items.find(function (i) { return i.id === id; });
    if (existing) {
      existing.qty += 1;
    } else {
      items.push({ id: id, name: name, price: price, type: type || 'product', colour: 'No preference', qty: 1 });
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

  function clear() {
    _save([]);
    updateBadge();
  }

  function getCount() {
    return getItems().reduce(function (sum, i) { return sum + i.qty; }, 0);
  }

  function toSummaryText() {
    return getItems().map(function (i) {
      return i.qty + 'x ' + i.name + ' (' + i.colour + ') - ' + i.price + ' each';
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
    clear: clear,
    getCount: getCount,
    toSummaryText: toSummaryText,
    updateBadge: updateBadge,
    flashAdded: flashAdded
  };
})();
