'use strict';
const {services,authenticate,identifier,reply,limit}=require('./lib/admin');
const {aggregateBookings,phDay}=require('./lib/business-analytics');
const MAX_RECORDS=4000,PAGE_SIZE=250;
exports.handler=async event=>{
  if(event.httpMethod!=='POST')return reply(405,{error:'POST only'});
  try{
    const user=await authenticate(event);
    if((event.body||'').length>1500)return reply(413,{error:'Request too large.'});
    const body=JSON.parse(event.body||'{}');
    const placeId=identifier(body.placeId);
    await limit(user.uid,'business_analytics',10);
    const {db}=services();
    const place=await db.collection('places').doc(placeId).get();
    if(!place.exists||place.data()?.owner_uid!==user.uid)
      return reply(403,{error:'Only the assigned business owner can view these analytics.'});
    const today=phDay(Date.now());
    const year=Number(today.slice(0,4));
    // Covers previous calendar year and the current one, plus 12-month charts.
    const lower=new Date(`${year-1}-01-01T00:00:00+08:00`);
    const {Timestamp}=require('firebase-admin/firestore');
    let query=db.collection('bookings').where('placeId','==',placeId)
      .where('createdAt','>=',Timestamp.fromDate(lower)).orderBy('createdAt','desc');
    const orders=[];let scanned=0,last=null,partial=false;
    while(scanned<MAX_RECORDS){
      const page=await (last?query.startAfter(last):query).limit(Math.min(PAGE_SIZE,MAX_RECORDS-scanned)).get();
      if(page.empty)break;
      for(const snap of page.docs){orders.push(snap.data());scanned++;}
      last=page.docs[page.docs.length-1];
      if(page.size<PAGE_SIZE)break;
    }
    if(scanned===MAX_RECORDS){const next=await query.startAfter(last).limit(1).get();partial=!next.empty;}
    const result=aggregateBookings(orders,Date.now(),{partial,scanned});
    return reply(200,{placeId,placeName:String(place.data().name||'Establishment').slice(0,120),...result});
  }catch(error){
    // Do not leak private Firestore exceptions or financial data via error messages.
    console.error('[businessAnalytics]',error.code||error.status||'unknown');
    return reply(error.status||(error instanceof SyntaxError?400:500),{
      error:error.status?error.message:'Business analytics could not load. Check the Firestore index and try again.'});
  }
};
