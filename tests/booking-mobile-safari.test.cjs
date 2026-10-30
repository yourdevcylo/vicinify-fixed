const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../js/map.js'), 'utf8');

test('booking form no longer uses iOS native reportValidity bubble', () => {
  const start = source.indexOf('window.confirmBookingSubmit = async function () {');
  const end = source.indexOf('window.deletePlacePost', start);
  assert(start !== -1 && end !== -1);
  const bookingSubmit = source.slice(start, end);
  assert.doesNotMatch(bookingSubmit, /\binput\.reportValidity\s*\(/);
  assert.match(bookingSubmit, /window\.showToast\(input\.validationMessage/);
});

test('closing booking sheet blurs its controls and clears stale date/time errors', () => {
  const start = source.indexOf('window.closeBookingModal = (force = false) => {');
  const end = source.indexOf('window.confirmBookingSubmit = async function () {', start);
  assert(start !== -1 && end !== -1);
  const state = { hidden: false, focused: false, locked: true };
  const fields = Object.fromEntries(['bookDate', 'bookTime'].map(id => [id, {
    message: 'Past date', setCustomValidity(message) { this.message = message; }
  }]));
  const modal = {
    classList: { add(name) { assert.equal(name, 'hidden'); state.hidden = true; } },
    setAttribute(name, value) { assert.equal(name, 'aria-hidden'); assert.equal(value, 'true'); },
    contains(element) { return element === active; }
  };
  const active = { blur() { state.focused = false; } };
  state.focused = true;
  const document = { activeElement: active, getElementById: id => id === 'bookingModal' ? modal : fields[id] };
  const window = { lockBodyScroll: value => {state.locked = value;} };
  const context = { document, window, bookingSending: false, bookingReviewSnapshot: { old: true } };
  vm.createContext(context);
  vm.runInContext(source.slice(start, end), context);
  context.window.closeBookingModal();
  assert.equal(state.hidden, true);
  assert.equal(state.focused, false);
  assert.equal(state.locked, false);
  assert.equal(fields.bookDate.message, '');
  assert.equal(fields.bookTime.message, '');
});

test('hidden booking sheet cannot start a request or validate date', async () => {
  const start = source.indexOf('window.confirmBookingSubmit = async function () {');
  const end = source.indexOf('        const placeId =', start);
  assert(start !== -1 && end !== -1);
  const modal = { classList: { contains: name => name === 'hidden' } };
  let authentication = 0;
  const document = { getElementById: id => id === 'bookingModal' ? modal : null };
  const window = {};
  const context = { document, window, bookingSending: false,
    requireVerifiedUser: async () => {authentication++; return {uid:'user'};} };
  vm.createContext(context);
  vm.runInContext(source.slice(start, end) + '\n}', context);
  await context.window.confirmBookingSubmit();
  assert.equal(authentication, 0);
});
