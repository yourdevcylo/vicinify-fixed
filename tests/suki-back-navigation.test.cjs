const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const code = fs.readFileSync(path.join(root, 'js/dashboard.js'), 'utf8');

function makeHarness({saved = 'same', edited = 'same', saving = false, confirmed = false} = {}) {
  const calls = [];
  const qr = { classList: {add: x => calls.push(['hideQr',x])}, _sukiQrTimer: 12 };
  const context = {
    sukiSaving: saving,
    sukiDraft: { reward: edited },
    sukiSavedSnapshot: JSON.stringify({reward:saved}),
    sukiReadStudioToDraft: () => ({ reward: edited }),
    window: {
      vConfirm: async (...args) => {calls.push(['confirm',...args]);return confirmed;},
      showToast: (...args) => calls.push(['toast',...args]),
      ViciNavigation:{canGoBack:()=>true,allowStudioBackOnce:()=>calls.push(['skipOneGuard'])},
      viciGoBack: target=>calls.push(['back',target]),
    },
    document:{getElementById: name => name === 'sukiStudioQr' ? qr : null},
    clearInterval: id => calls.push(['clearTimer',id]),
  };
  const from = code.indexOf('    async function confirmLeaveSukiStudio() {');
  const to = code.indexOf('    async function saveSukiStudio() {', from);
  assert(from > 0 && to > from);
  const fn = vm.runInNewContext(code.slice(from,to) + '\nbackFromSukiStudio',context);
  return {fn,calls,qr};
}

test('Suki Studio keeps Back at top only and Save at bottom only', () => {
  const page = html.split('<main id="page-suki-studio"')[1].split('</main>')[0];
  assert.match(page, /id="sukiStudioHeaderBackBtn"/);
  assert.doesNotMatch(page, /id="sukiStudioBackBtn"/);
  assert.match(page, /onclick="window.DashboardPage.backFromSukiStudio\(\)"/);
  assert.equal((page.match(/id="saveSukiStudioBtn"/g)||[]).length,1);
  assert.match(page, /suki-editor-actions-save-only/);
});

test('Suki Studio Back returns to actual previous page and stops QR timer', async () => {
  const h=makeHarness();
  assert.equal(await h.fn(), true);
  assert(!h.calls.some(c=>c[0] === 'confirm'));
  assert(h.calls.some(c=>c[0] === 'back'));
  assert(h.calls.some(c=>c[0] === 'clearTimer' && c[1] === 12));
  assert.equal(h.qr._sukiQrTimer,null);
});

test('Back with unsaved changes warns, cancel keeps editor', async () => {
  const h=makeHarness({edited:'changed'});
  assert.equal(await h.fn(), false);
  assert(h.calls.some(c=>c[0] === 'confirm'));
  assert(!h.calls.some(c=>c[0] === 'back'));
});

test('Confirm discard returns to previous page, not hardcoded Map/Hub', async () => {
  const h=makeHarness({edited:'changed',confirmed:true});
  assert.equal(await h.fn(), true);
  assert(h.calls.some(c=>c[0] === 'back'));
  assert(h.calls.some(c=>c[0] === 'skipOneGuard'));
});

test('Back is blocked while Suki save is in progress', async () => {
  const h=makeHarness({saving:true});
  assert.equal(await h.fn(), false);
  assert(h.calls.some(c=>c[0] === 'toast'));
  assert(!h.calls.some(c=>c[0] === 'back'));
});

test('After successful Firestore update the clean baseline changes, never on save failure', () => {
  const writeIdx=code.indexOf('await window.db.collection("places").doc(id).update(updateData);');
  const baselineIdx=code.indexOf('sukiSavedSnapshot = savingSnapshot;',writeIdx);
  assert(writeIdx > 0 && baselineIdx > writeIdx);
  assert(baselineIdx < code.indexOf('} catch (error)',baselineIdx));
  assert.match(code,/sukiSavedSnapshot = JSON\.stringify\(sukiReadStudioToDraft\(\)\)/);
  assert.match(code,/backFromSukiStudio,\s*confirmLeaveSukiStudio,\s*cleanupSukiStudio,\s*saveSukiStudio,/);
});
