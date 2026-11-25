'use strict';
// Business Analytics Phase 8. Only server-verified, customer-confirmed transactions
// enter reports. This is an in-app payment RECORD, not proof of bank settlement.
const HOUR=3600000;
function phDay(instant){
  const d=new Date(instant);
  if(!Number.isFinite(d.getTime()))return '';
  return new Date(d.getTime()+8*HOUR).toISOString().slice(0,10);
}
function stamp(value){
  if(value&&typeof value.toDate==='function')return value.toDate().getTime();
  if(value instanceof Date)return value.getTime();
  if(typeof value==='number'&&Number.isFinite(value))return value;
  if(typeof value==='string'&&value.trim())return new Date(value).getTime();
  return NaN;
}
function monday(day){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return '';
  const date=new Date(`${day}T00:00:00Z`);
  const offset=(date.getUTCDay()+6)%7;
  date.setUTCDate(date.getUTCDate()-offset);
  return date.toISOString().slice(0,10);
}
function shiftDay(day,n){
  const d=new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate()+n);
  return d.toISOString().slice(0,10);
}
function shiftMonth(key,n){
  const [year,month]=key.split('-').map(Number);
  return new Date(Date.UTC(year,month-1+n,1)).toISOString().slice(0,7);
}
function amountCents(value){
  const str=String(value??'').trim();
  if(!/^\d{1,7}(?:\.\d{1,2})?$/.test(str))return null;
  const parts=str.split('.');
  const cents=Number(parts[0])*100+Number((parts[1]||'').padEnd(2,'0'));
  return Number.isSafeInteger(cents)&&cents>0&&cents<=100000000?cents:null;
}
function qualifies(order){
  return !!order&&order.status==='received'&&order.customer_confirmed===true&&
    order.paymentStatus==='confirmed'&&Number.isFinite(stamp(order.paymentVerifiedAt));
}
function paidCents(order){
  // Only amounts reconciled against the business-established payment terms.
  if(!qualifies(order))return null;
  if(order.refundStatus&&!['not_required'].includes(order.refundStatus))return null;
  const paid=amountCents(order.paymentAmount);
  const due=amountCents(order.paymentAmountDue);
  return paid!==null&&due!==null&&paid===due?paid:null;
}
function keyFor(day,view){return view==='weekly'?monday(day):view==='monthly'?day.slice(0,7):day.slice(0,4);}
function makeBuckets(nowDay,view){
  if(view==='weekly'){
    const current=monday(nowDay);
    return Array.from({length:10},(_,i)=>shiftDay(current,7*(i-9)));
  }
  if(view==='monthly'){
    const current=nowDay.slice(0,7);
    return Array.from({length:13},(_,i)=>shiftMonth(current,i-12));
  }
  const year=Number(nowDay.slice(0,4));
  return [String(year-1),String(year)];
}
function newEntry(period){return{period,verifiedSalesCents:0,completedOrders:0,paidOrders:0,unpricedOrders:0,reservationCount:0,itemsSold:0,_customers:new Set()};}
function decorate(entry){
  return {period:entry.period,verifiedSalesCents:entry.verifiedSalesCents,completedOrders:entry.completedOrders,
    paidOrders:entry.paidOrders,unpricedOrders:entry.unpricedOrders,reservationCount:entry.reservationCount,
    itemsSold:entry.itemsSold,uniqueCustomers:entry._customers.size};
}
function percentage(current,previous){return previous>0?Math.round((current-previous)*10000/previous)/100:null;}
function aggregateBookings(records, now=Date.now(), {partial=false,scanned=0}={}){
  const today=phDay(now), views=['weekly','monthly','annual'];
  const buckets={};const maps={};
  for(const view of views){
    const keys=makeBuckets(today,view),map=new Map(keys.map(key=>[key,newEntry(key)]));
    maps[view]=map;
  }
  const sellers=new Map(),sellerStart=makeBuckets(today,'monthly')[0];let totalQualified=0,totalMissingAmount=0,legacyDateCount=0;
  for(const row of records){
    const order=row?.data||row||{};
    if(!qualifies(order))continue;
    const hasReceipt=Number.isFinite(stamp(order.customerConfirmedAt));
    const day=phDay(hasReceipt?stamp(order.customerConfirmedAt):stamp(order.createdAt));
    if(!day||day>today)continue;
    if(!hasReceipt)legacyDateCount++;
    const paid=paidCents(order);
    totalQualified++;
    if(paid===null)totalMissingAmount++;
    const lines=Array.isArray(order.menuLines)?order.menuLines:[];
    const validLines=lines.filter(line=>line&&typeof line.itemId==='string'&&line.itemId.length<=180&&
        Number.isInteger(line.quantity)&&line.quantity>0&&line.quantity<=99&&typeof line.name==='string');
    for(const view of views){
      const bucket=maps[view].get(keyFor(day,view));if(!bucket)continue;
      bucket.completedOrders++;
      if(typeof order.userId==='string'&&order.userId)bucket._customers.add(order.userId);
      if(['table_reservation','food_reservation'].includes(order.requestType))bucket.reservationCount++;
      if(paid!==null){bucket.verifiedSalesCents+=paid;bucket.paidOrders++;}
      else bucket.unpricedOrders++;
      for(const line of validLines)bucket.itemsSold+=line.quantity;
    }
    // Best sellers reflect 13-month trend window, not all historical orders.
    if(day.slice(0,7)<sellerStart)continue;
    for(const line of validLines){
      const previous=sellers.get(line.itemId)||{itemId:line.itemId,name:line.name.slice(0,100),quantity:0,orders:0};
      previous.quantity+=line.quantity;previous.orders++;sellers.set(line.itemId,previous);
    }
  }
  for(const view of views){
    const items=[...maps[view].values()].map(decorate);
    const a=items[items.length-1],b=items[items.length-2];
    buckets[view]={series:items,changePercent:percentage(a.verifiedSalesCents,b.verifiedSalesCents),
      periodIsPartial:view==='weekly'||view==='monthly'||view==='annual'};
  }
  return {asOfDay:today,currency:'PHP',timezone:'Asia/Manila',views:buckets,
    topItems:[...sellers.values()].sort((a,b)=>b.quantity-a.quantity||a.name.localeCompare(b.name)).slice(0,8),
    scanned,partial,totalQualified,totalMissingAmount,legacyDateCount,
    disclaimer:'Vicinify records business-confirmed manual payments; figures are not independent bank/POS verification. Current calendar periods may be incomplete. Transactions with missing/mismatched payment amounts or refunds are excluded from monetary totals.'};
}
module.exports={phDay,stamp,monday,shiftDay,shiftMonth,amountCents,qualifies,paidCents,makeBuckets,aggregateBookings};
