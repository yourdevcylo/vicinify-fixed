/* Vicinify admin-managed establishment categories. Defaults remain available when Firestore has no category documents. */
(function(){
'use strict';
const defaults=[['restaurant','Restaurant'],['cafe','Café'],['bakery','Bakery'],['milktea','Milk Tea'],['snackhouse','Snack House'],['foodstall','Food Stall'],['eatery','Eatery'],['dessert','Dessert Shop'],['fastfood','Fast-Food']];
const defaultCategories=defaults.map(([id,name])=>({id,name,enabled:true,builtin:true}));
let categories=defaultCategories.slice(),started=false,unsubscribe=null,initialized=false;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isAdmin=()=>window.AppState?.userProfile?.role==='admin'||window.auth?.currentUser?.uid==='Z45NZhQTgsTUX79WJ5ksCH8N3c02';
const key=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'').slice(0,30);
function active(){return categories.filter(x=>x.enabled);}
const MAX_CATEGORIES=3;
const formFields=['bizCat','bizPortalCat','editCategory','dynCat'];
const selections=new Map();
function normalizeIds(values){return [...new Set((Array.isArray(values)?values:[]).filter(v=>typeof v==='string'&&/^[a-z0-9]{2,30}$/.test(v)))].slice(0,MAX_CATEGORIES);}
function initialSelection(id){
  const select=document.getElementById(id);
  if(!select)return {categories:[],primary:''};
  // New submission starts blank; edit form values are set by setSelection.
  const initial=id==='bizCat'?'':select.value;
  return {categories:normalizeIds(initial?[initial]:[]),primary:initial||''};
}
function renderForm(id){
  const select=document.getElementById(id),container=document.getElementById(id+'Choices');
  if(!select||!container)return;
  if(!selections.has(id))selections.set(id,initialSelection(id));
  const state=selections.get(id);
  state.categories=normalizeIds(state.categories);
  if(!state.categories.includes(state.primary))state.primary=state.categories[0]||'';
  const items=active().slice();
  // Keep a previously saved disabled category visible, instead of silently deleting it.
  for(const key of state.categories){if(!items.some(c=>c.id===key)){items.push(categories.find(c=>c.id===key)||{id:key,name:key+' (existing)',enabled:false});}}
  const limitReached=state.categories.length>=MAX_CATEGORIES;
  container.innerHTML=items.map(c=>`<label class="vici-category-option${c.enabled?'':' vici-category-disabled'}"><input type="checkbox" value="${esc(c.id)}" ${state.categories.includes(c.id)?'checked':''} ${(!state.categories.includes(c.id)&&(limitReached||!c.enabled))?'disabled':''}><span>${esc(c.name)}${!c.enabled?' (disabled)':''}</span></label>`).join('');
  select.innerHTML='<option value="">Choose primary category</option>'+state.categories.map(key=>{
    const c=categories.find(item=>item.id===key);
    return `<option value="${esc(key)}">${esc(c?.name||key)}</option>`;
  }).join('');
  select.value=state.primary;
  container.setAttribute('data-count',String(state.categories.length));
  if(!container.dataset.multiBound){
    container.dataset.multiBound='1';
    container.addEventListener('change',event=>{
      const input=event.target.closest('input[type="checkbox"]');if(!input)return;
      const current=selections.get(id)||{categories:[],primary:''};
      const next=input.checked?normalizeIds([...current.categories,input.value]):current.categories.filter(k=>k!==input.value);
      if(input.checked&&current.categories.length>=MAX_CATEGORIES&&!current.categories.includes(input.value)){
        input.checked=false;window.showToast?.('Select up to 3 categories only.','info');return;
      }
      current.categories=next;
      if(!next.includes(current.primary))current.primary=next[0]||'';
      selections.set(id,current);renderForm(id);
    });
  }
  if(!select.dataset.multiBound){
    select.dataset.multiBound='1';
    select.addEventListener('change',()=>{
      const current=selections.get(id);
      if(current&&current.categories.includes(select.value)){current.primary=select.value;}
      else if(current){select.value=current.primary;}
    });
  }
}
function setSelection(id,input){
  const raw=Array.isArray(input)?input:(Array.isArray(input?.categories)?input.categories:[]);
  const legacy=typeof input==='object'&&!Array.isArray(input)?(input.category||input.cat||''):'';
  const list=normalizeIds([...(legacy?[legacy]:[]),...raw]);
  const primary=legacy&&list.includes(legacy)?legacy:list[0]||'';
  selections.set(id,{categories:list,primary});renderForm(id);
}
function getSelection(id){
  const select=document.getElementById(id);
  const state=selections.get(id)||initialSelection(id);
  const selected=normalizeIds(state.categories);
  const primary=select&&selected.includes(select.value)?select.value:(selected.includes(state.primary)?state.primary:selected[0]||'');
  return {category:primary,categories:primary?[primary,...selected.filter(s=>s!==primary)]:[]};
}
function updateSelect(id){renderForm(id);}
function updateMap(){const root=document.getElementById('catChips');if(!root)return;const current=window.AppState?.activeCat||'all';const icons={restaurant:'utensils',cafe:'coffee',bakery:'croissant',milktea:'cup-soda',snackhouse:'cookie',foodstall:'store',eatery:'chef-hat',dessert:'ice-cream',fastfood:'pizza'};const colors={restaurant:'red',cafe:'amber',bakery:'orange',milktea:'pink',snackhouse:'cyan',foodstall:'green',eatery:'slate',dessert:'purple',fastfood:'blue'};
root.innerHTML=`<button type="button" class="chip ${current==='all'?'active':''}" data-cat="all" data-color="gray"><i data-lucide="package"></i> All</button>`+active().map(c=>`<button type="button" class="chip ${current===c.id?'active':''}" data-cat="${esc(c.id)}" data-color="${colors[c.id]||'emerald'}"><i data-lucide="${icons[c.id]||'store'}"></i> <span>${esc(c.name)}</span></button>`).join('');if(!active().some(c=>c.id===current)&&current!=='all'){if(window.AppState)window.AppState.activeCat='all';root.querySelector('[data-cat="all"]')?.classList.add('active');}try{window.lucide?.createIcons()}catch(_){} }
function refresh(){formFields.forEach(updateSelect);updateMap();renderAdmin();window.dispatchEvent(new CustomEvent('vicinify:categories-changed',{detail:categories}));}
function merge(documents){const byId=new Map(defaultCategories.map(c=>[c.id,c]));for(const doc of documents){const id=String(doc.id||'');if(!/^[a-z0-9]{2,30}$/.test(id))continue;const name=String(doc.name||'').trim();if(!name||name.length>40)continue;byId.set(id,{id,name,enabled:doc.enabled!==false,builtin:defaultCategories.some(c=>c.id===id)});}categories=Array.from(byId.values()).sort((a,b)=>a.name.localeCompare(b.name));refresh();}
function notice(message,error=false){const el=document.getElementById('categoryManagerNotice');if(el){el.textContent=message;el.dataset.error=String(error);}}
function renderAdmin(){const root=document.getElementById('categoryManager');if(!root)return;root.style.display=isAdmin()?'':'none';if(!isAdmin())return;const list=document.getElementById('categoryManagerList');if(!list)return;list.innerHTML=categories.map(c=>`<div class="category-row" data-category-id="${esc(c.id)}"><div><strong>${esc(c.name)}</strong> <small>${esc(c.id)} · ${c.enabled?'Enabled':'Disabled'}${c.builtin?' · default':''}</small></div><div class="category-row-actions"><button type="button" data-action="rename">Rename</button><button type="button" data-action="toggle">${c.enabled?'Disable':'Enable'}</button><button type="button" data-action="delete" ${c.builtin?'disabled title="Default categories cannot be deleted"':''}>Delete</button></div></div>`).join('');}
async function inUse(id){const db=window.db;for(const field of ['category','cat']){const res=await db.collection('places').where(field,'==',id).limit(1).get();if(!res.empty)return true;}const multi=await db.collection('places').where('categories','array-contains',id).limit(1).get();return !multi.empty;}
async function change(action,id){if(!isAdmin()){notice('Admin access required.',true);return;}const c=categories.find(x=>x.id===id);if(!c)return;try{const ref=window.db.collection('establishment_categories').doc(id);if(action==='rename'){const name=window.prompt('Category name:',c.name)?.trim();if(!name)return;if(name.length<2||name.length>40)throw Error('Use 2–40 characters.');if(categories.some(x=>x.id!==id&&x.name.toLowerCase()===name.toLowerCase()))throw Error('Category name already exists.');await ref.set({name,enabled:c.enabled,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});}
else if(action==='toggle'){if(c.enabled&&await inUse(id)&&!window.confirm('Existing establishments use this category. Disable it for new entries and map filters? Existing listings will keep their category.'))return;await ref.set({name:c.name,enabled:!c.enabled,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});}
else if(action==='delete'){if(c.builtin)throw Error('Default categories cannot be deleted. You may disable them.');if(await inUse(id))throw Error('This category is used by establishments. Reassign those listings before deleting.');if(!window.confirm('Permanently delete '+c.name+'?'))return;await ref.delete();}notice('Category updated.');}catch(e){notice(e.message||'Category update failed.',true);}}
function start(){if(started||!window.db)return;started=true;const ref=window.db.collection('establishment_categories');unsubscribe=ref.onSnapshot(snap=>merge(snap.docs.map(d=>({id:d.id,...d.data()}))),e=>{console.warn('Category list unavailable:',e);notice('Category list could not load. Check Firestore rules and deployment.',true);});}
function init(){if(initialized)return;initialized=true;const form=document.getElementById('categoryCreateForm');form?.addEventListener('submit',async e=>{e.preventDefault();if(!isAdmin()){notice('Admin access required.',true);return;}const input=document.getElementById('categoryNewName');const name=input.value.trim();const id=key(name);if(name.length<2||name.length>40||id.length<2){notice('Enter a valid category name (2–40 characters).',true);return;}if(categories.some(c=>c.id===id||c.name.toLowerCase()===name.toLowerCase())){notice('Category already exists.',true);return;}try{await window.db.collection('establishment_categories').doc(id).set({name,enabled:true,createdAt:firebase.firestore.FieldValue.serverTimestamp(),updatedAt:firebase.firestore.FieldValue.serverTimestamp()});input.value='';notice('Category added.');}catch(err){notice(err.message||'Unable to add category.',true);}});
document.getElementById('categoryManagerList')?.addEventListener('click',e=>{const btn=e.target.closest('button[data-action]');if(btn)change(btn.dataset.action,btn.closest('[data-category-id]').dataset.categoryId);});refresh();start();}
window.VicinifyCategories={start,refresh,getAll:()=>categories.slice(),getActive:()=>active().slice(),renderAdmin,setSelection,getSelection,MAX_CATEGORIES};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.addEventListener('load',()=>{start();refresh();});
})();
