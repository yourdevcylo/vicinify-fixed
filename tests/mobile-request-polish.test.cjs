const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const src=file=>fs.readFileSync(path.join(root,file),'utf8');
const css=src('css/request-mobile-polish.css');
test('new mobile request CSS is linked last, after other responsive styles',()=>{
 const html=src('index.html');
 assert.match(html,/css\/request-mobile-polish\.css/);
 assert.ok(html.lastIndexOf('css/request-mobile-polish.css')>html.lastIndexOf('css/operating-hours-editor.css'));
});
test('mobile layout uses one scroll container and sticky-safe header/footer',()=>{
 assert.match(css,/#bookingModal \.modalBody\s*\{[^}]*overflow-y:auto/s);
 assert.match(css,/booking-menu-picker \[data-book-menu\]\s*\{[^}]*max-height:none/s);
 assert.match(css,/#bookingModal \.booking-footer\s*\{[^}]*padding-bottom:max\(10px,env\(safe-area-inset-bottom\)\)/s);
});
test('quantity field wins over older global full-width input rule',()=>{
 assert.match(css,/#bookingModal input\[data-book-menu-qty\]\s*\{[^}]*width:72px !important/s);
 assert.match(css,/#bookingModal \.booking-menu-item-head label\s*\{[^}]*display:flex !important/s);
});
test('menu item options remain usable on touchscreens',()=>{
 assert.match(css,/\.booking-menu-options label\s*\{[^}]*display:flex !important/s);
 assert.match(css,/\.booking-menu-options input\[type="checkbox"\]/);
});
test('existing menu-only request functionality stays in source',()=>{
 const map=src('js/map.js');
 assert.match(map,/function collectBookingMenuLines/);
 assert.match(map,/id="bookTable"/);
 assert.match(map,/data-book-menu-qty/);
 assert.match(map,/expectedQuoteDigest:menuQuote\?\.digest/);
});
