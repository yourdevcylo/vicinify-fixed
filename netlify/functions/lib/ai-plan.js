// Model proposes public UI actions; server owns IDs, prices, capabilities and drafts.
const Request=require('../../../js/vici-request');
const Menu=require('./menu');
const ACTIONS=new Set(['VIEW_RESTAURANT','VIEW_MENU','SHOW_ON_MAP','GET_DIRECTIONS','ADD_TO_ORDER','VIEW_ORDER','EDIT_ORDER','REQUEST_ORDER','REQUEST_RESERVATION','CANCEL_DRAFT','VIEW_REQUEST_STATUS']);
function parse(text,places,query,now=Date.now(),menus={},ownedRequest=null){
 let plan;try{plan=JSON.parse(String(text).trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''));}catch{return null;}
 if(!plan||!['recommend','details','menu','order','draft','clarify','refuse'].includes(plan.mode)||typeof plan.answer!=='string'||!plan.answer.trim()||plan.answer.length>2500)throw Error('Invalid AI plan');
 const ids=Array.isArray(plan.placeIds)?[...new Set(plan.placeIds)].slice(0,3):[];if(ids.some(id=>!places.some(p=>p.id===id)))throw Error('Unknown establishment');
 const kind=plan.kind==='delivery',budget=Number.isFinite(plan.budget)&&plan.budget>0?plan.budget:null;
 if(plan.mode==='recommend'&&ids.some(id=>{const p=places.find(p=>p.id===id);return kind&&!p.delivery_inhouse&&!p.delivery_grab||budget&&require('../askVici').rangeMax(p.priceRange)>budget;}))return{answer:'I could not verify those suggestions against your delivery or budget requirements. Please refine your request.',placeIds:[],requestDraft:Request.clean(),orderDraft:null,actions:[]};
 const actions=(Array.isArray(plan.actions)?plan.actions:[]).slice(0,8).filter(a=>a&&ACTIONS.has(a.type)).flatMap(a=>{if(a.type==='VIEW_REQUEST_STATUS')return ownedRequest?[{type:a.type,requestId:ownedRequest.id,placeId:ownedRequest.placeId,placeName:ownedRequest.placeName}]:[];if(['VIEW_ORDER','EDIT_ORDER','CANCEL_DRAFT'].includes(a.type))return[{type:a.type}];const p=places.find(p=>p.id===a.placeId);if(!p)return[];if(a.type==='REQUEST_RESERVATION'&&p.accepts_booking!==true||a.type==='REQUEST_ORDER'&&(p.accepts_orders!==true||!(menus[p.id]||[]).some(i=>i.available)))return[];if(['SHOW_ON_MAP','GET_DIRECTIONS'].includes(a.type)&&(typeof p.lat!=='number'||typeof p.lng!=='number'||!Number.isFinite(p.lat)||!Number.isFinite(p.lng)||Math.abs(p.lat)>90||Math.abs(p.lng)>180))return[];if(a.type==='ADD_TO_ORDER'){const i=(menus[p.id]||[]).find(i=>i.id===a.itemId);return p.accepts_orders===true&&i?.available?[{type:a.type,placeId:p.id,itemId:i.id}]:[];}return[{type:a.type,placeId:p.id}];});
 const result={answer:plan.answer.trim(),placeIds:plan.mode==='refuse'?[]:ids,actions:plan.mode==='refuse'?[]:actions,requestDraft:undefined,requestReady:false};
 if(plan.mode==='recommend'||plan.mode==='refuse'){result.requestDraft=Request.clean();result.orderDraft=null;}
 if(plan.mode==='menu'){const placeId=places.some(p=>p.id===plan.menuPlaceId)?plan.menuPlaceId:ids[0];if(placeId)result.menuPreview={placeId,items:(menus[placeId]||[]).slice(0,6),placeName:places.find(p=>p.id===placeId).name,canOrder:places.find(p=>p.id===placeId).accepts_orders===true};}
 if(plan.mode==='clarify'&&plan.requestDraft){result.requestDraft=Request.clean({...plan.requestDraft,active:true});if(result.requestDraft.placeId&&!places.some(p=>p.id===result.requestDraft.placeId))result.requestDraft.placeId='';}
 if(plan.mode==='order'){
  const d=plan.orderDraft,p=places.find(p=>p.id===d?.placeId);if(!p||p.accepts_orders!==true||!(menus[p.id]||[]).length)return{...result,answer:'Menu ordering is not enabled for that establishment. Please message the business.',orderDraft:null,requestDraft:Request.clean(),actions:[]};
  if(d.requestType&&!['pickup_order','delivery_order'].includes(d.requestType))throw Error('Unsupported order type');
  if(d.requestType==='delivery_order'&&p.delivery_inhouse!==true)return{...result,answer:'Delivery requests are not supported by this establishment. Please choose pickup or message the business.',orderDraft:null,actions:[]};
  if(!Array.isArray(d.lines)||!d.lines.length||d.lines.length>30)throw Error('Invalid order draft');
  const lines=d.lines.map(l=>{const item=(menus[p.id]||[]).find(i=>i.id===l.itemId);if(!item||!item.available||!Number.isInteger(l.quantity)||l.quantity<1||l.quantity>99)throw Error('Invalid menu item or quantity');const options={};if(l.options&&typeof l.options==='object')for(const [key,values]of Object.entries(l.options)){const group=item.optionGroups.find(g=>g.id===key);if(!group||!Array.isArray(values)||values.length>group.maxSelect||new Set(values).size!==values.length||values.some(v=>!group.choices.some(c=>c.id===v&&c.available)))throw Error('Invalid menu choices');options[key]=values;}return{itemId:item.id,quantity:l.quantity,options};});
  result.orderDraft={placeId:p.id,lines,requestType:['pickup_order','delivery_order'].includes(d.requestType)?d.requestType:'pickup_order',date:Request.clean(d).date,time:Request.clean(d).time,notes:typeof d.notes==='string'?d.notes.slice(0,1000):''};result.requestDraft=Request.clean();
  let estimated=0,complete=true;for(const line of lines){const item=menus[p.id].find(i=>i.id===line.itemId);try{estimated+=(item.priceCents+Menu.optionsFor(item,line.options).extra)*line.quantity;}catch{complete=false;}}if(complete)result.estimatedSubtotalCents=estimated;
  result.answer=`${p.name}: order draft — ${lines.map(l=>l.quantity+' × '+menus[p.id].find(i=>i.id===l.itemId).name).join(', ')}. Review options and current prices before confirming. Nothing has been submitted.`+(complete?' Listed estimate: ₱'+(estimated/100).toFixed(2)+', before delivery fees and any agreed charges.':' Required options still need to be selected.');
 }
 if(plan.mode==='draft'){
  if(plan.requestDraft?.requestType&&plan.requestDraft.requestType!=='table_reservation')throw Error('Unsupported reservation type');
  const d=Request.clean({...plan.requestDraft,active:true}),p=places.find(p=>p.id===d.placeId);if(!p)return{...result,answer:'Which establishment would you like to request?',requestDraft:{...d,placeId:''}};
  if(p.accepts_booking!==true||d.requestType!=='table_reservation')return{...result,answer:'Use the listed menu to request food orders, or message the business if this reservation option is unavailable.',requestDraft:{...d,active:false},requestUnavailable:true};
  const today=new Date(now+8*3600000).toISOString().slice(0,10),parsed=new Date(d.date+'T12:00:00+08:00');if(d.date&&(!Number.isFinite(parsed.getTime())||new Date(parsed.getTime()+8*3600000).toISOString().slice(0,10)!==d.date||d.date<today))d.date='';if(d.date&&d.time&&new Date(`${d.date}T${d.time}:00+08:00`).getTime()<=now){d.date='';d.time='';}
  return{...result,answer:`${p.name}: review and complete the reservation form. Nothing has been submitted; business confirmation is still required.`,placeIds:[p.id],requestDraft:d,requestReady:true,orderDraft:null};
 }
 return result;
}
module.exports={parse};
