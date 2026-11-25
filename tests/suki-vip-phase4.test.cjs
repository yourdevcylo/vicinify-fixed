'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {vipPolicy,activeVip,setVip}=require('../netlify/functions/lib/suki-vip');
class FakeFirestore {
  constructor(places,card){
    this.docs=new Map([['places/shop',structuredClone(places)],['loyalty_cards/shop_customer',structuredClone(card)]]);
    this.count=0;this.queue=Promise.resolve();
  }
  collection(name){return {doc:id=>({key:`${name}/${id||'generated'+(++this.count)}`})};}
  async runTransaction(cb){
    const call=async()=>{
      const writes=[];
      const tx={get:async ref=>({exists:this.docs.has(ref.key),data:()=>structuredClone(this.docs.get(ref.key))}),
        update:(ref,data)=>writes.push(['update',ref.key,data]),
        create:(ref,data)=>writes.push(['create',ref.key,data])};
      const result=await cb(tx);
      for(const [op,key,value] of writes){
        if(op==='create'&&this.docs.has(key))throw new Error('duplicate');
        this.docs.set(key, op==='create'?{...value}:{...this.docs.get(key),...value});
      }
      return result;
    };
    const result=this.queue.then(call,call);this.queue=result.catch(()=>{});return result;
  }
  data(key){return this.docs.get(key);}
}
const FieldValue={serverTimestamp:()=>({serverTimestamp:true})};
const place={owner_uid:'owner',suki_enabled:true,suki_vip_enabled:true,suki_vip_days:10,suki_vip_duration_days:0,suki_vip_benefit:'Priority reservation'};
const card={placeId:'shop',customerUid:'customer',customerName:'Patron',verifiedPurchaseDays:10,stamps:5,redemptionCount:3,claimRequested:false};
const db=(p=place,c=card)=>new FakeFirestore(p,c);
const run=(store,grant=true,reason='',actorUid='owner',now=Date.now())=>setVip({db:store,FieldValue,actorUid,placeId:'shop',customerUid:'customer',grant,reason,now});
test('policy defaults and owner-configured duration normalized safely',()=>{
  assert.deepEqual(vipPolicy({}),{enabled:false,days:10,durationDays:0,benefit:''});
  assert.deepEqual(vipPolicy({...place,suki_vip_days:-6,suki_vip_duration_days:9}).days,10);
  assert.equal(vipPolicy({...place,suki_vip_days:30,suki_vip_duration_days:90}).durationDays,90);
});
test('customer cannot grant their own VIP; owner approval is required',async()=>{
  const s=db();await assert.rejects(run(s,true,'','customer'),/Only this business owner/);
  assert.equal(s.data('loyalty_cards/shop_customer').vipActive,undefined);
});
test('owner grants eligible VIP, stamps and redemption count are retained',async()=>{
  const s=db();const result=await run(s);
  assert.equal(result.vipActive,true);
  const c=s.data('loyalty_cards/shop_customer');
  assert.equal(c.vipActive,true);assert.equal(c.stamps,5);
  assert.equal(c.redemptionCount,3);assert.equal(c.verifiedPurchaseDays,10);
  assert.equal([...s.docs.keys()].filter(k=>k.startsWith('suki_vip_events/')).length,1);
  assert.equal(activeVip(c),true);
  await assert.rejects(run(s),/already VIP/);
});
test('below-threshold grant requires a review reason, owner can still manually approve',async()=>{
  const s=db(place,{...card,verifiedPurchaseDays:2});
  await assert.rejects(run(s),/Manual VIP grants/);
  await run(s,true,'Long-term walk-in loyal customer');
  assert.equal(s.data('loyalty_cards/shop_customer').vipActive,true);
});
test('revoke requires a reason, is idempotent safe, and preserves lifetime counts',async()=>{
  const s=db();await run(s);
  await assert.rejects(run(s,false),/Revocation reason/);
  await run(s,false,'Requested by the customer');
  const c=s.data('loyalty_cards/shop_customer');
  assert.equal(c.vipActive,false);assert.equal(c.verifiedPurchaseDays,10);assert.equal(c.redemptionCount,3);
  assert.equal([...s.docs.keys()].filter(k=>k.startsWith('suki_vip_events/')).length,2);
  await assert.rejects(run(s,false,'Another reason'),/no active VIP/);
});
test('time-limited VIP expires automatically in display/status checks',async()=>{
  const now=Date.parse('2026-11-21T09:00:00+08:00');
  const s=db({...place,suki_vip_duration_days:30});
  await run(s,true,'','owner',now);
  const c=s.data('loyalty_cards/shop_customer');
  assert.equal(activeVip(c,now+29*86400000),true);
  assert.equal(activeVip(c,now+30*86400000+1),false);
});
test('VIP disabled prevents grants; owner self-grant prevented',async()=>{
  const s=db({...place,suki_vip_enabled:false});
  await assert.rejects(run(s),/Enable Suki/);
  const t=db({...place,owner_uid:'customer'});
  await assert.rejects(run(t,true,'','customer'),/owner cannot receive/);
});
test('frontend retains controls and private Firestore rules prohibit direct VIP edits',()=>{
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  const dashboard=fs.readFileSync(path.join(__dirname,'../js/dashboard.js'),'utf8');
  const common=fs.readFileSync(path.join(__dirname,'../js/common.js'),'utf8');
  const rules=fs.readFileSync(path.join(__dirname,'../firestore.rules'),'utf8');
  for(const field of ['sukiVipEnabled','sukiVipDays','sukiVipDuration','sukiVipBenefit','sukiVipCustomerList'])assert.match(html,new RegExp(field));
  assert.match(dashboard,/action:'set_vip'/);
  assert.match(common,/VIP SUKI/);
  assert.match(rules,/match \/suki_vip_events\/\{eventId\} \{ allow read, write: if false; \}/);
  const rule=rules.slice(rules.indexOf('match /loyalty_cards/'),rules.indexOf('match /stamp_requests/'));
  assert.match(rule,/hasOnly\(\['claimRequested', 'claimRequestedAt', 'updatedAt'\]\)/);
});
