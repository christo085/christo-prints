const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function exists(relativePath) {
  return fs.existsSync(path.join(SRC, relativePath));
}

function priceValue(price) {
  return parseFloat(String(price || '').replace('£', '').replace('+', ''));
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) && !Number.isNaN(new Date(value).getTime());
}

const products = readJson('src/_data/products.json');
const events = readJson('src/_data/events.json');
const bundles = readJson('src/_data/bundles.json');
const colours = readJson('src/_data/colours.json');
const coupons = readJson('src/_data/coupons.json');

const errors = [];
const warnings = [];
const productNames = new Set();
const colourNames = new Set([].concat(colours.standard || [], colours.special || []).map((c) => c.name));

function error(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function checkPrice(label, price, allowPlus) {
  const value = priceValue(price);
  if (!Number.isFinite(value) || value < 0) {
    error(`${label} has invalid price "${price}"`);
  }
  if (!allowPlus && String(price || '').includes('+')) {
    error(`${label} price should not include "+"`);
  }
}

function checkImage(label, image) {
  if (!image) {
    error(`${label} is missing an image`);
    return;
  }
  if (!exists(image)) error(`${label} references missing image: ${image}`);
}

(products.items || []).forEach((product) => {
  if (!product.name) error('Product missing name');
  if (productNames.has(product.name)) error(`Duplicate product name: ${product.name}`);
  productNames.add(product.name);

  checkPrice(`Product "${product.name}"`, product.price, true);
  checkImage(`Product "${product.name}"`, product.image);

  (product.images || []).forEach((entry) => {
    checkImage(`Product "${product.name}" gallery item`, entry.image);
    (entry.colours || []).forEach((colour) => {
      if (!colourNames.has(colour)) warn(`Product "${product.name}" gallery references unknown colour: ${colour}`);
    });
  });

  (product.colours || []).forEach((colour) => {
    if (!colourNames.has(colour)) error(`Product "${product.name}" references unknown colour: ${colour}`);
  });

  if (product.dateAdded && !isIsoDate(product.dateAdded)) {
    error(`Product "${product.name}" has invalid dateAdded: ${product.dateAdded}`);
  }
});

(events.upcoming || []).forEach((event) => {
  if (!event.name) error('Event missing name');
  if (!isIsoDate(event.date)) error(`Event "${event.name}" must use YYYY-MM-DD date, got "${event.date}"`);
});

(events.seasonal || []).forEach((item) => {
  checkPrice(`Seasonal item "${item.name}"`, item.price, false);
  if (item.image) checkImage(`Seasonal item "${item.name}"`, item.image);
  if (item.activeFrom && !isIsoDate(item.activeFrom)) error(`Seasonal item "${item.name}" has invalid activeFrom`);
  if (item.activeTo && !isIsoDate(item.activeTo)) error(`Seasonal item "${item.name}" has invalid activeTo`);
});

(bundles.items || []).forEach((bundle) => {
  checkPrice(`Bundle "${bundle.name}"`, bundle.price, false);
  if (bundle.oldPrice) checkPrice(`Bundle "${bundle.name}" oldPrice`, bundle.oldPrice, false);
  checkImage(`Bundle "${bundle.name}"`, bundle.image);
  (bundle.items || []).forEach((name) => {
    if (!productNames.has(name)) error(`Bundle "${bundle.name}" references missing product: ${name}`);
  });
});

(coupons.items || []).forEach((coupon) => {
  if (!coupon.code) error('Coupon missing code');
  if (!['percentage', 'fixed'].includes(coupon.type)) error(`Coupon "${coupon.code}" has invalid type`);
  if (typeof coupon.value !== 'number' || coupon.value <= 0) error(`Coupon "${coupon.code}" has invalid value`);
});

warnings.forEach((message) => console.warn(`Warning: ${message}`));

if (errors.length) {
  errors.forEach((message) => console.error(`Error: ${message}`));
  process.exit(1);
}

console.log(`Data validation passed (${productNames.size} products, ${(events.upcoming || []).length} upcoming events).`);
