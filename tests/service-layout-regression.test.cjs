const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/service-management-layout.css'), 'utf8');

test('existing four service switches retain their stable IDs', () => {
  for (const id of ['bizPortalBooking','bizPortalOrders','bizPortalAdvance','bizPortalRequests']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});
test('service layout override is loaded after the mobile stylesheet', () => {
  const mobile = html.indexOf('css/mobile.css');
  const override = html.indexOf('css/service-management-layout.css');
  assert.ok(mobile >= 0 && override > mobile);
});
test('legacy conflicting inline service styles are removed', () => {
  assert.doesNotMatch(html, /<style>\.bizedit-service-grid\{/);
});
test('rows use padding, a two-column grid, and shrinkable text', () => {
  assert.match(css, /grid-template-columns:minmax\(0,1fr\) 22px/);
  assert.match(css, /padding:14px 16px !important/);
  assert.match(css, /overflow-wrap:anywhere/);
  assert.match(css, /margin:0 !important/);
});
test('checkboxes remain visible and accessible within each row', () => {
  assert.match(css, /input\.bizedit-switch\[type="checkbox"\]/);
  assert.match(css, /width:20px !important/);
  assert.match(css, /position:static !important/);
});
