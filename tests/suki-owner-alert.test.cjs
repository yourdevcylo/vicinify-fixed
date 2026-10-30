const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const dashboard = fs.readFileSync(path.join(root, 'js/dashboard.js'), 'utf8');
const common = fs.readFileSync(path.join(root, 'js/common.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function makeDashboardHarness() {
  const listeners = [];
  const nodes = new Map();
  function el(id) {
    if (!nodes.has(id)) {
      const classes = new Set(id === 'ownerSukiQuickLink' ? ['hidden'] : []);
      nodes.set(id, {
        id, textContent: '', innerHTML: '',
        classList: { add: x => classes.add(x), remove: x => classes.delete(x),
          toggle: (x, state) => { if (state) classes.add(x); else classes.delete(x); },
          contains: x => classes.has(x) },
        style: {}, querySelector: () => null,
        scrollIntoView: () => {}, click: () => { nodes.get(id).clicked = true; }
      });
    }
    return nodes.get(id);
  }
  const db = {
    collection(name) {
      return {
        where(field, op, value) {
          return this._spawn([{ field, op, value }]);
        },
        _spawn(filters) {
          return {
            filters,
            where(field, op, value) { return db.collection(name)._spawn([...filters, {field, op, value}]); },
            limit(n) { this.take = n; return this; },
            onSnapshot(onData, onError) {
              const entry = { name, filters, onData, onError, closed:false };
              listeners.push(entry);
              return () => { entry.closed = true; };
            }
          };
        }
      };
    }
  };
  const window = {db, auth:{currentUser:{uid:'owner-1'}}, showPage:id => {window.lastPage=id}};
  const ctx = {
    window, document:{getElementById:el,querySelector:() => el('sukiTab')},
    currentAdminPlaces:[{id:'place-A'}], setNotifBadge:(id,number) => {el(id).number=number},
    chunkArray:(arr,n) => [arr], escapeHtml:s=>String(s || ''),
  };
  const start = dashboard.indexOf('    let sukiUnsubs = [];');
  const stop = dashboard.indexOf('    async function deleteChatThread',start);
  assert(start > 0 && stop > start);
  const methods = vm.runInNewContext(dashboard.slice(start, stop) +
    '\n({listenToSukiInbox, openSukiInbox, renderSukiPanel})',ctx);
  return { ...methods, nodes, el, listeners, window };
}
function snap(...docs) {
  return {forEach: fn => docs.forEach(d => fn({id:d.id,data:()=>d}))};
}

test('Suki inbox can read pending requests with deployed composite index', () => {
  const h=makeDashboardHarness();
  h.listenToSukiInbox('owner-1',['place-A']);
  assert.equal(h.listeners.length,2);
  assert(h.listeners[0].filters.some(f=>f.field==='status' && f.value==='pending'));
  h.listeners[0].onData(snap({id:'stamp-1',status:'pending',customerName:'Mira',placeName:'Cafe A'}));
  h.listeners[1].onData(snap());
  assert.match(h.el('biz-panel-suki').innerHTML,/Mira.*requesting a stamp/);
  assert.match(h.el('biz-panel-suki').innerHTML,/Approve/);
  assert.equal(h.el('ownerSukiBadge').number,1);
  assert.equal(h.el('ownerSukiQuickLink').classList.contains('hidden'),false);
});

test('Missing index switches to placeId-only listener and keeps real-time request/approval sync', () => {
  const h=makeDashboardHarness();
  h.listenToSukiInbox('owner-1',['place-A']);
  h.listeners[0].onError({code:'failed-precondition',message:'The query requires an index'});
  const fallback=h.listeners.at(-1);
  assert.equal(fallback.name,'stamp_requests');
  assert.equal(fallback.filters.length,1);
  assert.equal(fallback.filters[0].field,'placeId');
  fallback.onData(snap(
    {id:'old-1',status:'approved',customerName:'Old'},
    {id:'req-2',status:'pending',customerName:'Ana',placeName:'Cafe'}
  ));
  assert.equal(h.el('ownerSukiBadge').number,1);
  assert.match(h.el('biz-panel-suki').innerHTML,/Ana/);
  assert.doesNotMatch(h.el('biz-panel-suki').innerHTML,/Old.*requesting a stamp/);
  // Owner approves: the same listener emits a new snapshot, no page refresh.
  fallback.onData(snap({id:'old-1',status:'approved'}, {id:'req-2',status:'approved'}));
  assert.equal(h.el('ownerSukiBadge').number,0);
  assert.equal(h.el('ownerSukiQuickLink').classList.contains('hidden'),true);
  assert.match(h.el('biz-panel-suki').innerHTML,/No pending stamp requests/);
});

test('Claim requests still render and load errors are visible with retry', () => {
  const h=makeDashboardHarness();
  h.listenToSukiInbox('owner-1',['place-A']);
  h.listeners[1].onData(snap({id:'card-1', claimRequested:true,claimed:false,customerName:'Pat'}));
  assert.equal(h.el('ownerSukiBadge').number,1);
  assert.match(h.el('biz-panel-suki').innerHTML,/Mark as claimed/);
  h.listeners[0].onError({code:'permission-denied',message:'Permission denied'});
  assert.match(h.el('biz-panel-suki').innerHTML,/Suki inbox needs attention/);
  assert.match(h.el('biz-panel-suki').innerHTML,/Retry loading requests/);
});

test('Open Suki Inbox navigates to Business Hub and selects Suki tab',()=>{
  const h=makeDashboardHarness();
  h.openSukiInbox();
  assert.equal(h.window.lastPage,'page-dashboard');
  assert.equal(h.el('sukiTab').clicked,true);
});

test('Global notification retains actionable alert and includes Suki in nav count',()=>{
  assert.match(common,/window\.showOwnerSukiAlert = function\(customerName, placeName\)/);
  assert.match(common,/window\.DashboardPage\?\.openSukiInbox\?\.\(\)/);
  assert.match(common,/_dashSukiCount \|\| 0/);
  assert.match(common,/ownerSukiPendingByChunk\.set\(idx, pending\)/);
  assert.match(common,/document\.getElementById\('ownerSukiNotification'\)\?\.remove\(\)/);
  assert.match(html,/id="ownerSukiQuickLink"/);
});
