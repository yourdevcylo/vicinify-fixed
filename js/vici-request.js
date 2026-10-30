/* Draft preparation only. No database writes, payment actions or automatic submission. */
(function(root){
 const types=['table_reservation','food_reservation','pickup_order','delivery_order','advance_order'];
 const clean=value=>{const v=value||{};return {active:v.active===true,placeId:typeof v.placeId==='string'&&/^[A-Za-z0-9_-]{1,180}$/.test(v.placeId)?v.placeId:'',requestType:types.includes(v.requestType)?v.requestType:'table_reservation',date:/^\d{4}-\d{2}-\d{2}$/.test(v.date||'')?v.date:'',time:/^([01]\d|2[0-3]):[0-5]\d$/.test(v.time||'')?v.time:'',guests:Number.isInteger(v.guests)&&v.guests>=1&&v.guests<=99?v.guests:null,items:typeof v.items==='string'?v.items.slice(0,1000):''};};
 const start=q=>/\b(book|booking|reserve|reservation|magbook|magpa-book|magpareserve|magpa-reserve|magrequest|mag-request|pre-order|preorder|order|pickup|pick-up)\b/i.test(q)&&!/\b(my booking|booking ko|booking status|cancel booking)\b/i.test(q);
 function prepare({query,previous,places=[],focus=[],now=Date.now()}){
  const q=String(query||'').trim(),old=clean(previous);
  if(/^(cancel|discard|stop|never mind|nevermind|wag na|huwag na|cancel draft)( this| that| draft| request)?[.!]?$/i.test(q)&&old.active)return {draft:clean(),state:'discarded'};
  if(!old.active&&!start(q))return null;
  const namedNow=places.some(p=>String(p.name||'').length>=3&&q.toLowerCase().includes(p.name.toLowerCase()));
  const details=/\d|\b(tomorrow|today|bukas|ngayon|guests?|people|pax|kami|tao|items?|first|second|third|una|pangalawa|pangatlo|yes|oo|sige|review|isa|dalawa|tatlo|apat|lima|anim|pito|walo|siyam|sampu)\b/i.test(q);
  if(old.active&&!start(q)&&!namedNow&&!details)return null;
  const d=old.active?{...old}:clean({active:true});
  if(/\b(delivery|deliver|padeliver)\b/i.test(q))d.requestType='delivery_order';
  else if(/\b(pickup|pick-up|pick up)\b/i.test(q))d.requestType='pickup_order';
  else if(/\b(advance|bulk|event order)\b/i.test(q))d.requestType='advance_order';
  else if(/\b(food reservation|reserve food|food reserve)\b/i.test(q))d.requestType='food_reservation';
  else if(/\b(table|seats?|mesa)\b/i.test(q))d.requestType='table_reservation';
  const named=places.filter(p=>String(p.name||'').length>=3&&q.toLowerCase().includes(p.name.toLowerCase()));
  const ordinal=/\b(first|una)\b/i.test(q)?0:/\b(second|pangalawa)\b/i.test(q)?1:/\b(third|pangatlo)\b/i.test(q)?2:null;
  const unknownNamedPlace=!named.length&&/\b(?:sa|at|in)\s+(?![0-9]|noon\b|midnight\b|tomorrow\b|today\b|bukas\b|ngayon\b)[a-z]/i.test(q);
  if(unknownNamedPlace){d.placeId='';}
  else if(named.length===1)d.placeId=named[0].id;
  else if(ordinal!==null&&focus[ordinal])d.placeId=focus[ordinal];
  else if(!unknownNamedPlace&&!d.placeId&&focus.length===1)d.placeId=focus[0];
  const place=places.find(p=>p.id===d.placeId);
  const iso=q.match(/\b(\d{4}-\d{2}-\d{2})\b/);const day=new Date(now+8*3600000);
  if(iso)d.date=iso[1];
  else if(/\b(tomorrow|bukas)\b/i.test(q)&&!/bukas\s+ba|ba\s+.*bukas/i.test(q))d.date=new Date(day.getTime()+86400000).toISOString().slice(0,10);
  else if(/\b(today|ngayon)\b/i.test(q))d.date=day.toISOString().slice(0,10);
  const tm=q.match(/\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(am|pm)\b/i),mil=q.match(/\b([01]\d|2[0-3]):([0-5]\d)\b/);
  if(tm)d.time=String(Number(tm[1])%12+(tm[3].toLowerCase()==='pm'?12:0)).padStart(2,'0')+':'+(tm[2]||'00');
  else if(mil)d.time=mil[1]+':'+mil[2];
  const words={isa:1,dalawa:2,tatlo:3,apat:4,lima:5,anim:6,pito:7,walo:8,siyam:9,sampu:10};
  const count=q.match(/\b(\d{1,3}|isa|dalawa|tatlo|apat|lima|anim|pito|walo|siyam|sampu)\s*(?:na\s+)?(guests?|people|persons?|pax|kami|tao)\b/i)||q.match(/\b(?:for|para sa)\s+(\d{1,3})\b/i);
  if(count){const n=words[count[1].toLowerCase()]||Number(count[1]);d.guests=n>=1&&n<=99?n:null;}
  if(old.active&&/^\d{1,2}$/.test(q)&&!d.guests&&d.date&&d.time){const n=Number(q);if(n>=1&&n<=99)d.guests=n;}
  const items=q.match(/(?:items?|order details)\s*:\s*(.+)/i);if(items)d.items=items[1].slice(0,1000);
  if(d.date){const parsed=new Date(d.date+'T12:00:00+08:00');if(!Number.isFinite(parsed.getTime())||new Date(parsed.getTime()+8*3600000).toISOString().slice(0,10)!==d.date||d.date<day.toISOString().slice(0,10))d.date='';}
  if(d.date&&d.time&&new Date(`${d.date}T${d.time}:00+08:00`).getTime()<=now){d.date='';d.time='';}
  if(!place){d.placeId='';return{draft:d,state:'choose_place'};}
  if(place.accepts_booking!==true)return{draft:{...d,active:false},state:'unavailable',place};
  if(d.requestType==='delivery_order'&&place.delivery_inhouse!==true)return{draft:{...d,active:false},state:'delivery_unavailable',place};
  const missing=[!d.date&&'date',!d.time&&'time',d.requestType==='table_reservation'?!d.guests&&'guests':!d.items&&'items'].filter(Boolean);
  return {draft:d,state:missing.length?'incomplete':'ready',missing,place};
 }
 const api={clean,prepare};if(typeof module==='object'&&module.exports)module.exports=api;else root.ViciRequest=api;
})(typeof window==='object'?window:globalThis);
