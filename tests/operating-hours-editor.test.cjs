'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'js/operating-hours-editor.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/operating-hours-editor.css'), 'utf8');
const dashboard = fs.readFileSync(path.join(root, 'js/dashboard.js'), 'utf8');

test('operating hours weekdays render in chronological order with unchanged IDs', () => {
  const weekdays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const offsets = weekdays.map(day=>html.indexOf(`id="bizHours${day}"`));
  assert.ok(offsets.every(n=>n>0));
  assert.deepEqual(offsets, offsets.slice().sort((a,b)=>a-b));
  assert.equal((html.match(/class="bizedit-hours-row"/g) || []).length, 7);
});
test('copy and closed buttons are explicit non-submitting actions', () => {
  assert.match(html, /type="button" data-copy-hours="weekdays"/);
  assert.match(html, /type="button" data-copy-hours="all"/);
  assert.equal((html.match(/data-close-hours=/g)||[]).length,7);
  assert.match(js, /range === 'all' \? ids\.slice\(1\) : ids\.slice\(1, 5\)/);
});
test('existing Firestore operating_hours field mapping remains intact', () => {
  for(const day of ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']) {
    const short = day.slice(0,3);
    assert.match(dashboard, new RegExp(`${day}: document\\.getElementById\\("bizHours${short.charAt(0).toUpperCase()+short.slice(1)}"\\)\\.value`));
  }
  assert.match(dashboard,/let ops = place\.operating_hours \|\| \{\}/);
});
test('CSS has mobile-safe one-column weekday flow', () => {
  assert.match(css, /grid-template-columns:minmax\(0,1fr\) !important/);
  assert.match(css, /@media\(max-width:460px\)/);
  assert.match(css, /grid-template-areas:"day day" "time closed"/);
});
test('new assets are included in production HTML and existing delivery controls preserved',()=>{
  assert.match(html,/css\/operating-hours-editor\.css/);
  assert.match(html,/js\/operating-hours-editor\.js/);
  assert.match(html,/id="bizGrab"/);
  assert.match(html,/id="bizInHouse"/);
  assert.match(html,/id="bizRadius"/);
});
