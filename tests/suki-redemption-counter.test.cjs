'use strict';
// The customer card renderer remains client-side. Redemption updates are now
// server-owned and separately tested in suki-daily-ledger.test.cjs.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../js/common.js'),'utf8');
const start=source.indexOf('window.SukiDesign = (() => {');
const end=source.indexOf('\n})();',source.indexOf('window.Suki = (() => {'))+5;
const code=source.slice(start,end);
function app(response={saved:true}){
  const messages=[],commands=[];
  const w={vConfirm:async()=>true,showToast:message=>messages.push(message),
    handleFirestoreError:error=>{throw error},
    ViciData:{command:async(name,data)=>{commands.push({name,data});if(response instanceof Error)throw response;return response;}},
    debouncedIcons(){}};
  vm.runInNewContext(code,{window:w,document:{},console,Promise,Number,Math,Date,parseInt,clearInterval,setInterval});
  return {w,messages,commands};
}
test('Suki renderer shows total redeemed on front and back without changing stamp count',()=>{
  const {w}=app(),html=w.Suki.renderCard({name:'Kusina Lipa',suki_stamp_count:8},{stamps:3,redemptionCount:4,customerName:'Sam',verifiedPurchaseDays:12});
  assert.match(html,/3 \/ 8/);assert.match(html,/4<\/b> rewards redeemed/);
  assert.match(html,/Total redeemed<\/span><b>4<\/b>/);
  assert.match(html,/Verified loyalty days<\/span><b>12<\/b>/);
});
test('prior claimed card without count shows one known legacy redemption',()=>{
  const {w}=app(),html=w.Suki.renderCard({name:'Kusina Lipa'},{stamps:8,claimed:true});
  assert.match(html,/1<\/b> reward redeemed/);
  assert.doesNotMatch(html,/data-suki-claim=/);
});
test('owner redemption is sent to authenticated backend instead of directly editing Firestore',async()=>{
  const {w,commands,messages}=app();await w.Suki.markClaimed('shop_customer');
  assert.equal(commands.length,1);assert.deepEqual(commands.map(c=>c.name),['sukiStamp']);
  assert.equal(commands[0].data.action,'redeem');assert.equal(commands[0].data.cardId,'shop_customer');
  assert.match(messages.join(' '),/Reward redeemed/);
});
test('owner redemption error remains visible; UI never reports success on backend rejection',async()=>{
  const {w,messages}=app(new Error('No active reward claim to complete.'));
  await assert.rejects(w.Suki.markClaimed('shop_customer'),/No active reward claim/);
  assert.doesNotMatch(messages.join(' '),/Reward redeemed/);
});
test('owner stamp approval uses authenticated backend daily check',async()=>{
  const {w,commands,messages}=app({saved:true,awarded:false,reason:'daily-limit'});
  await w.Suki.approveRequest('request_1');
  assert.equal(commands[0].name,'sukiStamp');assert.equal(commands[0].data.action,'approve_request');
  assert.match(messages.join(' '),/already received a Suki stamp today/);
});
