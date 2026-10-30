const test=require('node:test'),assert=require('node:assert/strict');
const admin=require('../netlify/functions/lib/admin');
const {memory}=require('./helpers/memory-admin.cjs');
test('Vici AI daily limit resets at Philippine midnight and caps across tabs',async()=>{
 const db=memory();
 {
  const day1=Date.parse('2026-10-30T15:59:00Z'),day2=Date.parse('2026-10-30T16:00:00Z');
  assert.notEqual(admin.manilaDay(day1),admin.manilaDay(day2));
  for(let i=0;i<20;i++)await admin.limitDaily('customer','ai_daily',20,day1,{db:db.db});
  await assert.rejects(admin.limitDaily('customer','ai_daily',20,day1,{db:db.db}),{status:429});
  await admin.limitDaily('customer','ai_daily',20,day2,{db:db.db});
  assert.equal(db.rows.get(`_rate_limits/ai_daily_${admin.manilaDay(day1)}_customer`).count,20);
  assert.equal(db.rows.get(`_rate_limits/ai_daily_${admin.manilaDay(day2)}_customer`).count,1);
 }
});
