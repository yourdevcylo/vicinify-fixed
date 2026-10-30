/* Real public menus and customer-confirmed transactions. Never execute model HTML or writes. */
(function(root){
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const money=c=>'₱'+(Number(c||0)/100).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});
 const photo=u=>{
  if(typeof u==='string'&&/^data:image\/webp;base64,[A-Za-z0-9+/]+={0,2}$/.test(u)&&u.length<=42000)return u;
  try{const v=new URL(u);return v.protocol==='https:'?v.href:'';}catch{return '';}
 };
 // Store only a tiny decoded-and-reencoded WebP image inside a menu document.
 // Firestore has a 1 MiB document limit; cap each image to 28 KiB raw/38 KiB base64.
 async function photoToFirestoreData(file){
  if(typeof root.compressImageFile!=='function')throw Error('Image processing is unavailable. Reload the website.');
  for(const [size,quality] of [[480,0.52],[400,0.47],[320,0.41],[256,0.36],[192,0.32],[144,0.28],[112,0.24]]){
   const {blob}=await root.compressImageFile(file,size,quality);
   if(blob.type!=='image/webp')throw Error('Your browser does not support WebP photo conversion.');
   if(blob.size>28*1024)continue;
   const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Photo could not be read.'));reader.readAsDataURL(blob);});
   if(typeof data==='string'&&/^data:image\/webp;base64,[A-Za-z0-9+/]+={0,2}$/.test(data)&&data.length<=42000)return data;
  }
  throw Error('This photo cannot be compressed enough. Try a simpler image.');
 };
 const menus=new Map();
 function dialog(title){const d=document.createElement('dialog');d.className='commerce-dialog';d.innerHTML=`<header><h2>${esc(title)}</h2><button type="button" data-close aria-label="Close">×</button></header><div class="commerce-body"></div>`;document.body.append(d);d.querySelector('[data-close]').onclick=()=>d.close();d.addEventListener('close',()=>d.remove());d.addEventListener('click',e=>{if(e.target===d)d.close();});d.showModal();return d;}
 async function getMenu(id,force=false){const old=menus.get(id);if(!force&&old?.until>Date.now())return old.items;const snap=await root.db.collection('places').doc(id).collection('menu_items').where('archived','==',false).limit(80).get();const items=snap.docs.map(doc=>({id:doc.id,...doc.data()})).filter(i=>!i.archived);menus.set(id,{items,until:Date.now()+30000});return items;}
 async function getPlace(id){const p=await root.db.collection('places').doc(id).get();if(!p.exists)throw Error('Establishment no longer exists.');return{id,...p.data()};}
 async function mountMenu(wrap,placeId,manage=false){
  if (!wrap) return;
  wrap._menuLiveUnsub?.();
  wrap._menuLiveUnsub = null;
  wrap.innerHTML='<p role="status">Loading listed menu…</p>';
  try{let [items,place]=await Promise.all([getMenu(placeId),getPlace(placeId)]);if(!wrap.isConnected)return;manage=manage&&root.auth?.currentUser?.uid===place.owner_uid;
   wrap.innerHTML=`<div class="commerce-tools"><input type="search" placeholder="Search menu items" aria-label="Search menu"><select aria-label="Menu category"><option value="">All categories</option>${[...new Set(items.map(i=>i.category||'Other'))].map(c=>`<option>${esc(c)}</option>`).join('')}</select>${manage?`<label class="commerce-check"><input type="checkbox" data-ordering ${place.accepts_orders===true?'checked':''}>Accept menu orders</label><button type="button" data-new>Add menu item</button><button type="button" data-template>Download CSV template</button><button type="button" data-import>Import menu CSV</button>`:''}</div><div class="commerce-menu-grid"></div><p class="commerce-hint">Menu prices are listed by the business. Availability is checked again before you confirm an order.</p>`;
   const render=()=>{const q=wrap.querySelector('input[type=search]').value.toLowerCase(),cat=wrap.querySelector('select').value;const found=items.filter(i=>(!cat||i.category===cat)&&[i.name,i.description].join(' ').toLowerCase().includes(q));wrap.querySelector('.commerce-menu-grid').innerHTML=found.length?found.map(i=>`<article class="commerce-item">${photo(i.photoData||i.photoUrl)?`<img src="${esc(photo(i.photoData||i.photoUrl))}" alt="${esc(i.name)}" loading="lazy">`:''}<div><small>${esc(i.category||'Other')}</small><h3 data-no-translate>${esc(i.name)}</h3><p data-no-translate>${esc(i.description)}</p><b>${money(i.priceCents)}</b><span class="commerce-availability">${i.available?'Available':'Unavailable'}</span><div class="commerce-actions"><button type="button" data-details="${esc(i.id)}">View details</button>${place.accepts_orders===true&&i.available&&root.auth?.currentUser?.uid!==place.owner_uid?`<button type="button" data-add="${esc(i.id)}">Add to order</button>`:''}${manage?`<button type="button" data-edit="${esc(i.id)}">Edit</button>`:''}</div></div></article>`).join(''):'<p>No matching menu items are listed. Please message the business for its menu.</p>';wrap.querySelectorAll('img').forEach(img=>img.onerror=()=>img.remove());};
   // A cached .get() previously left other devices up to 30 seconds behind.
   // Keep the displayed menu synced using one Firestore listener per mounted view.
   let menuStreamActive = true;
   const liveQuery = root.db.collection('places').doc(placeId).collection('menu_items').where('archived','==',false).limit(80);
   const menuLiveStop = liveQuery.onSnapshot(snap => {
       if (!menuStreamActive || !wrap.isConnected) return;
       items = snap.docs.map(doc => ({ id:doc.id, ...doc.data() })).filter(item => !item.archived);
       menus.set(placeId,{ items, until:Date.now()+30000 });
       // Preserve search text and category where available.
       const search = wrap.querySelector('input[type=search]');
       const select = wrap.querySelector('select');
       if (!search || !select) return;
       const categories = [...new Set(items.map(item => item.category || 'Other'))];
       const oldCategory = select.value;
       select.innerHTML = '<option value="">All categories</option>' + categories.map(c => `<option>${esc(c)}</option>`).join('');
       if (categories.includes(oldCategory)) select.value = oldCategory;
       render();
   }, error => {
       if (menuStreamActive && wrap.isConnected) {
           console.warn('[menu] Live updates unavailable:', error?.code || error);
           root.showToast?.('Live menu updates are unavailable. Reopen the menu to refresh.', 'info');
       }
   });
   wrap._menuLiveUnsub = () => { menuStreamActive=false; menuLiveStop?.(); wrap._menuLiveUnsub=null; };
   wrap.closest('dialog')?.addEventListener('close', () => wrap._menuLiveUnsub?.(), { once:true });
   wrap.querySelector('[data-ordering]')?.addEventListener('change',async e=>{e.target.disabled=true;try{await root.ViciData.command('menu',{action:'settings',placeId,acceptsOrders:e.target.checked});root.invalidatePlacesCache?.();mountMenu(wrap,placeId,true);}catch(error){e.target.checked=!e.target.checked;root.showToast?.(error.message,'error');e.target.disabled=false;}});
   wrap.querySelector('input[type=search]').oninput=render;wrap.querySelector('select').onchange=render;wrap.onclick=async e=>{const b=e.target.closest('button');if(!b)return;const item=items.find(i=>i.id===(b.dataset.add||b.dataset.edit||b.dataset.details));if(b.hasAttribute('data-template')){downloadMenuTemplate();return;}else if(b.hasAttribute('data-import')){await importMenuCSV(place,items,()=>{menus.delete(placeId);mountMenu(wrap,placeId,true);});return;}else if(b.hasAttribute('data-new')||b.dataset.edit){await editItem(place,item,()=>{menus.delete(placeId);root.PlacePreview?.refreshMenu?.(placeId);mountMenu(wrap,placeId,true);});}else if(b.dataset.add){addItem(place,item);}else if(b.dataset.details){const d=dialog(item.name);d.querySelector('.commerce-body').innerHTML=`<p data-no-translate>${esc(item.description)}</p><p>${money(item.priceCents)} · ${item.available?'Available':'Unavailable'}</p>${item.optionGroups?.map(g=>`<p>${esc(g.name)} (${g.required?'required':'optional'}): ${g.choices.map(c=>esc(c.name)+' +'+money(c.priceCents)+(c.available?'':' — unavailable')).join(', ')}</p>`).join('')||''}${item.available&&place.accepts_orders===true&&root.auth?.currentUser?.uid!==place.owner_uid?'<button type="button" data-add-detail>Add to order</button>':''}`;d.querySelector('[data-add-detail]')?.addEventListener('click',()=>{d.close();addItem(place,item);});}};render();
  }catch(e){if(wrap.isConnected)wrap.innerHTML=`<p role="alert">${esc(e.message||'Could not load menu.')}</p><button type="button">Retry</button>`;wrap.querySelector('button')?.addEventListener('click',()=>mountMenu(wrap,placeId,manage));}
 }
 async function openMenu(id){const place=await getPlace(id),d=dialog(place.name+' · Menu');await mountMenu(d.querySelector('.commerce-body'),id,root.auth?.currentUser?.uid===place.owner_uid);return true;}
 function addItem(place,item){if(!root.auth?.currentUser?.emailVerified)return root.showToast?.('Sign in with a verified email to request an order.','info');const old=root.ViciChat?.getOrderDraft?.();if(old?.pendingSubmission)return root.showToast?.('Recover your previous request before changing the order.','info');if(old?.lines?.length&&old.placeId!==place.id)return root.showToast?.('Finish or cancel the current order draft before ordering from another establishment.','info');const d=old?.placeId===place.id?old:{placeId:place.id,lines:[],requestType:'pickup_order',date:'',time:'',notes:'',key:crypto.randomUUID()};const line=d.lines.find(l=>l.itemId===item.id&&!Object.values(l.options||{}).some(a=>a.length));if(line)line.quantity=Math.min(99,line.quantity+1);else d.lines.push({itemId:item.id,quantity:1,options:{}});root.ViciChat?.setOrderDraft?.(d);openCart(d);}
 const CSV_HEADER=['Item Name','Description','Price','Category','Available','Option Groups JSON'];
 function csvCell(v){const text=String(v??'');return /[",\r\n]/.test(text)?'"'+text.replace(/"/g,'""')+'"':text;}
 function downloadMenuTemplate(){
  const sample=[['Chicken Inasal with Rice','Grilled chicken served with steamed rice and dipping sauce','159','Meals','TRUE',''],['Pork Sisig with Rice','Sizzling pork sisig served with rice','179','Meals','TRUE','']];
  const csv='\uFEFF'+[CSV_HEADER,...sample].map(row=>row.map(csvCell).join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='vicinify-menu-template.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
 }
 function parseCSV(source){
  const rows=[];let row=[],cell='',quoted=false;source=source.replace(/^\uFEFF/,'');
  for(let i=0;i<source.length;i++){const ch=source[i];if(quoted){if(ch==='"'&&source[i+1]==='"'){cell+='"';i++;}else if(ch==='"')quoted=false;else cell+=ch;}else if(ch==='"'){if(cell)throw Error('Invalid CSV quotes.');quoted=true;}else if(ch===','){row.push(cell);cell='';}else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&source[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell='';}else cell+=ch;}
  if(quoted)throw Error('Unclosed CSV quotation mark.');row.push(cell);if(row.some(v=>v.trim()))rows.push(row);return rows;
 }
 function normalizeCSV(source){
  const rows=parseCSV(source);if(!rows.length)throw Error('CSV is empty.');if(rows[0].join('|')!==CSV_HEADER.join('|'))throw Error('CSV columns must match the downloaded template.');
  if(rows.length<2||rows.length>21)throw Error('Import 1–20 items at a time.');const seen=new Set();
  return rows.slice(1).map((r,i)=>{
   if(r.length!==CSV_HEADER.length)throw Error('Row '+(i+2)+': wrong number of columns.');
   const [rawName,description,rawPrice,rawCategory,rawAvailability,rawOptions]=r;
   const name=rawName.trim(),category=rawCategory.trim(),price=rawPrice.trim(),a=rawAvailability.trim().toLowerCase();
   if(!name||name.length>100||description.length>1000||!category||category.length>60)throw Error('Row '+(i+2)+': invalid name, description, or category.');
   if(!/^\d{1,6}(?:\.\d{1,2})?$/.test(price)||Number(price)>100000)throw Error('Row '+(i+2)+': invalid price.');
   if(!['true','false','yes','no','1','0'].includes(a))throw Error('Row '+(i+2)+': Available must be TRUE or FALSE.');
   const key=name.toLocaleLowerCase();if(seen.has(key))throw Error('Row '+(i+2)+': duplicate item name.');seen.add(key);
   let optionGroups=[];if(rawOptions.trim()){try{optionGroups=JSON.parse(rawOptions);}catch{throw Error('Row '+(i+2)+': options must be valid JSON.');}if(!Array.isArray(optionGroups)||optionGroups.length>4)throw Error('Row '+(i+2)+': maximum four option groups.');optionGroups=optionGroups.map((g,gi)=>{if(!g||typeof g.name!=='string'||!Array.isArray(g.choices)||!g.choices.length||g.choices.length>12)throw Error('Row '+(i+2)+': invalid option group.');return{id:'g'+gi,name:g.name,required:g.required===true,maxSelect:g.maxSelect||1,choices:g.choices.map((c,ci)=>({id:'c'+ci,name:String(c.name||''),priceCents:Math.round(Number(c.price||0)*100),available:c.available!==false}))};});}
   return{name,description,priceCents:Math.round(Number(price)*100),category,available:['true','yes','1'].includes(a),photoUrl:'',optionGroups};
  });
 }
 async function importMenuCSV(place,existing,after){
  const d=dialog('Import menu CSV'),body=d.querySelector('.commerce-body');
  body.innerHTML='<div class="commerce-form"><p>Upload a completed CSV template. Preview all items before saving. Images are added separately through Edit Menu Item.</p><label>CSV file (maximum 100 KB)<input type="file" accept=".csv,text/csv" data-csv></label><p role="alert" data-error></p><div data-preview></div></div>';
  body.querySelector('[data-csv]').onchange=async event=>{
   const file=event.target.files[0],error=body.querySelector('[data-error]'),preview=body.querySelector('[data-preview]');preview.replaceChildren();error.textContent='';if(!file)return;
   try{if(!file.name.toLowerCase().endsWith('.csv')||file.size>100000)throw Error('Choose a CSV file no larger than 100 KB.');
    const items=normalizeCSV(await file.text());const names=new Set(existing.filter(x=>!x.archived).map(x=>x.name.toLocaleLowerCase()));
    if(items.some(x=>names.has(x.name.toLocaleLowerCase())))throw Error('CSV includes an item name that already exists. Edit existing items or remove duplicates before import.');
    if(items.length+existing.length>80)throw Error('Maximum 80 active menu items per establishment.');
    const table=document.createElement('div');table.innerHTML='<p><b>'+items.length+' items ready</b> · No photos included</p><div style="max-height:260px;overflow:auto"><table style="width:100%"><thead><tr><th>Item</th><th>Category</th><th>Price</th><th>Options</th></tr></thead><tbody>'+items.map(x=>'<tr><td>'+esc(x.name)+'</td><td>'+esc(x.category)+'</td><td>'+money(x.priceCents)+'</td><td>'+x.optionGroups.length+'</td></tr>').join('')+'</tbody></table></div><button type="button" data-confirm-import>Confirm and save '+items.length+' items</button><p role="status" data-progress></p>';
    preview.append(table);table.querySelector('[data-confirm-import]').onclick=async()=>{
     // One explicit confirmation button is enough: a nested vConfirm dialog can
     // leave this modal stuck even after Firestore has saved the CSV items.
     const button=table.querySelector('[data-confirm-import]');
     if(button.disabled)return;
     button.disabled=true;button.textContent='Importing…';
     body.querySelector('[data-csv]').disabled=true;let saved=0,failed=null;
     for(const item of items){
      try{await root.ViciData.command('menu',{action:'save',placeId:place.id,item});saved++;table.querySelector('[data-progress]').textContent='Saved '+saved+' of '+items.length+'…';}
      catch(e){failed=e;break;}
     }
     if(saved){menus.delete(place.id);root.PlacePreview?.refreshMenu?.(place.id);try{after();}catch(e){console.warn('[menu-import] Refresh failed:',e);}}
     if(saved===items.length){
      table.querySelector('[data-progress]').textContent='All '+saved+' items saved successfully.';
      button.textContent='Imported successfully ✓';
      d.close();root.showToast?.('Imported '+saved+' menu items.','success');
     }else{
      error.textContent='Import stopped after '+saved+' item'+(saved===1?'':'s')+': '+(failed?.message||'Please retry')+'. Saved items remain in the menu. Close this window and remove already-imported rows before retrying.';
      button.textContent='Import stopped';body.querySelector('[data-csv]').disabled=false;
     }
    };
   }catch(e){error.textContent=e.message;}
  };
 }
 async function editItem(place,existing,after){
  const d=dialog(existing?'Edit menu item':'Add menu item'),body=d.querySelector('.commerce-body');let groups=structuredClone(existing?.optionGroups||[]);
  body.innerHTML=`<form class="commerce-form"><label>Item name<input name="name" maxlength="100" required value="${esc(existing?.name||'')}"></label><label>Description<textarea name="description" maxlength="1000">${esc(existing?.description||'')}</textarea></label><div class="commerce-columns"><label>Price (₱)<input name="price" type="number" min="0" max="100000" step="0.01" required value="${existing?existing.priceCents/100:''}"></label><label>Category<input name="category" maxlength="60" required value="${esc(existing?.category||'Meals')}"></label></div><div class="commerce-photo-field"><span class="commerce-photo-field-label">Add Photo (optional)</span><label class="commerce-photo-dropzone" data-menu-photo-drop><input name="photoFile" type="file" accept="image/jpeg,image/png,image/webp" data-menu-photo-file aria-label="Choose a JPG, PNG or WebP menu photo"><div class="commerce-photo-empty" data-menu-photo-empty><span class="commerce-photo-icon" aria-hidden="true">⇧</span><strong>Drag & drop photo here</strong><span>or click to choose a photo</span><small>JPG, PNG or WebP · max 5 MB</small></div><div class="commerce-photo-preview" data-menu-photo-preview hidden><img data-menu-photo-image alt="Menu photo preview"><div><strong data-menu-photo-name></strong><span data-menu-photo-state></span></div></div></label><div class="commerce-photo-controls"><button type="button" data-menu-photo-clear hidden>Clear selection</button></div><p class="commerce-photo-error" role="alert" data-menu-photo-error></p></div>${existing?.photoData||existing?.photoUrl?`<p class="commerce-hint">Current photo will remain unless you select a replacement.</p>`:''}<label class="commerce-check"><input name="available" type="checkbox" ${existing?.available!==false?'checked':''}> Available for requests</label><h3>Options and add-ons</h3><div data-groups></div><button type="button" data-group>Add option group</button><p class="commerce-hint">Example: required Size; optional Extra cheese. Photo is optional. JPG, PNG, or WebP only (max 5 MB). Menu photos are automatically compressed and saved in Firestore (no Firebase Storage).</p><p role="alert" data-error></p><div class="commerce-actions"><button type="submit">Save menu item</button>${existing?'<button type="button" data-archive>Remove from menu</button>':''}</div></form>`;
  // Photo dropzone: selection is kept separately because DataTransfer -> input.files
  // assignment is not supported consistently by all mobile/desktop browsers.
  const photoInput=body.querySelector('[data-menu-photo-file]');
  const photoZone=body.querySelector('[data-menu-photo-drop]');
  const photoPreview=body.querySelector('[data-menu-photo-preview]');
  const photoEmpty=body.querySelector('[data-menu-photo-empty]');
  const photoImage=body.querySelector('[data-menu-photo-image]');
  const photoName=body.querySelector('[data-menu-photo-name]');
  const photoState=body.querySelector('[data-menu-photo-state]');
  const photoClear=body.querySelector('[data-menu-photo-clear]');
  const photoError=body.querySelector('[data-menu-photo-error]');
  let selectedPhotoFile=null, previewObjectUrl=null, dragDepth=0;
  const oldPhoto=photo(existing?.photoData||existing?.photoUrl||'');
  function releasePreview(){if(previewObjectUrl){URL.revokeObjectURL(previewObjectUrl);previewObjectUrl=null;}}
  function showPhotoPreview(){
   releasePreview();photoError.textContent='';
   if(selectedPhotoFile){
    previewObjectUrl=URL.createObjectURL(selectedPhotoFile);
    photoImage.src=previewObjectUrl;photoName.textContent=selectedPhotoFile.name;
    photoState.textContent='Ready to save with this menu item';
   }else if(oldPhoto){
    photoImage.src=oldPhoto;photoName.textContent='Current menu photo';
    photoState.textContent='Drop a new photo to replace it';
   }else{photoImage.removeAttribute('src');}
   const hasPreview=!!(selectedPhotoFile||oldPhoto);
   photoPreview.hidden=!hasPreview;photoEmpty.hidden=hasPreview;
   photoClear.hidden=!selectedPhotoFile;
  }
  function rejectPhoto(message){
   selectedPhotoFile=null;photoInput.value='';showPhotoPreview();
   photoError.textContent=message;
  }
  function choosePhoto(file){
   if(!file)return;
   if(!/\.(?:jpe?g|png|webp)$/i.test(file.name)||!['image/jpeg','image/png','image/webp'].includes(file.type)){
    rejectPhoto('Only JPG, PNG or WebP photos are allowed.');return;
   }
   if(!file.size||file.size>5*1024*1024){
    rejectPhoto('Choose a photo smaller than 5 MB.');return;
   }
   selectedPhotoFile=file;showPhotoPreview();
  }
  // Keep the file input directly tappable. Programmatic .click() on a display:none
  // file input can fail in installed PWAs and mobile Safari.
  photoInput.addEventListener('change',()=>{choosePhoto(photoInput.files?.[0]);});
  const containsFiles=event=>Array.from(event.dataTransfer?.types||[]).includes('Files');
  photoZone.addEventListener('dragenter',event=>{if(!containsFiles(event))return;event.preventDefault();dragDepth++;photoZone.classList.add('is-dragover');});
  photoZone.addEventListener('dragover',event=>{if(!containsFiles(event))return;event.preventDefault();if(event.dataTransfer)event.dataTransfer.dropEffect='copy';photoZone.classList.add('is-dragover');});
  photoZone.addEventListener('dragleave',event=>{if(!containsFiles(event))return;event.preventDefault();dragDepth=Math.max(0,dragDepth-1);if(!dragDepth)photoZone.classList.remove('is-dragover');});
  photoZone.addEventListener('drop',event=>{
   event.preventDefault();dragDepth=0;photoZone.classList.remove('is-dragover');
   const files=Array.from(event.dataTransfer?.files||[]);
   if(files.length!==1){rejectPhoto('Drop exactly one JPG, PNG or WebP image.');return;}
   choosePhoto(files[0]);
  });
  photoClear.addEventListener('click',()=>{
   selectedPhotoFile=null;photoInput.value='';showPhotoPreview();photoInput.focus();
  });
  d.addEventListener('close',releasePreview,{once:true});
  showPhotoPreview();
  const capture=()=>{body.querySelectorAll('[data-group-index]').forEach(box=>{const g=groups[Number(box.dataset.groupIndex)];g.name=box.querySelector('[data-group-name]').value;g.required=box.querySelector('[data-required]').checked;g.maxSelect=Number(box.querySelector('[data-max]').value);g.choices=[...box.querySelectorAll('[data-choice]')].map((row,i)=>({id:g.choices[i]?.id||'c'+i,name:row.querySelector('[data-choice-name]').value,priceCents:Math.round(Number(row.querySelector('[data-choice-price]').value)*100),available:row.querySelector('[data-choice-available]').checked}));});};
  const render=()=>{body.querySelector('[data-groups]').innerHTML=groups.map((g,index)=>`<fieldset data-group-index="${index}"><legend>Option group ${index+1}</legend><input data-group-name aria-label="Group name" placeholder="Size / Add-ons" value="${esc(g.name)}" required><label class="commerce-check"><input data-required type="checkbox" ${g.required?'checked':''}> Required</label><label>Maximum selections<input data-max type="number" min="1" max="12" value="${g.maxSelect||1}" required></label>${g.choices.map(c=>`<div class="commerce-choice" data-choice><input data-choice-name placeholder="Choice name" aria-label="Choice name" maxlength="80" value="${esc(c.name)}" required><input data-choice-price aria-label="Additional price" type="number" min="0" step="0.01" value="${c.priceCents/100}" required><label class="commerce-check"><input data-choice-available type="checkbox" ${c.available!==false?'checked':''}>Available</label></div>`).join('')}<button type="button" data-choice-add="${index}">Add choice</button><button type="button" data-group-remove="${index}">Remove group</button></fieldset>`).join('');};
  body.querySelector('[data-group]').onclick=()=>{capture();if(groups.length>=4)return;groups.push({id:'g'+crypto.randomUUID().replace(/-/g,''),name:'',required:false,maxSelect:1,choices:[{id:'c0',name:'',priceCents:0,available:true}]});render();};
  body.onclick=e=>{const b=e.target.closest('button');if(b?.dataset.choiceAdd!=null){capture();const g=groups[Number(b.dataset.choiceAdd)];if(g.choices.length<12)g.choices.push({id:'c'+crypto.randomUUID().replace(/-/g,''),name:'',priceCents:0,available:true});render();}if(b?.dataset.groupRemove!=null){capture();groups.splice(Number(b.dataset.groupRemove),1);render();}};
  body.querySelector('form').onsubmit=async e=>{e.preventDefault();capture();const f=e.target;if(!f.reportValidity())return;const button=f.querySelector('[type=submit]');const originalLabel=button.textContent;button.disabled=true;button.textContent='Processing & saving…';try{let photoUrl=existing?.photoUrl||'';let photoData=existing?.photoData||'';const selected=selectedPhotoFile||f.elements.photoFile?.files?.[0];if(selected){photoData=await photoToFirestoreData(selected);photoUrl='';}await root.ViciData.command('menu',{action:'save',placeId:place.id,itemId:existing?.id,item:{name:f.elements.name.value,description:f.elements.description.value,priceCents:Math.round(Number(f.elements.price.value)*100),category:f.elements.category.value,photoUrl,photoData,available:f.elements.available.checked,optionGroups:groups}});d.close();after();}catch(error){body.querySelector('[data-error]').textContent=error.message;}finally{button.disabled=false;button.textContent=originalLabel;}};
  body.querySelector('[data-archive]')?.addEventListener('click',async()=>{if(!await root.vConfirm('Remove menu item','Existing request records will remain unchanged.','Remove'))return;try{await root.ViciData.command('menu',{action:'archive',placeId:place.id,itemId:existing.id});d.close();after();}catch(e){body.querySelector('[data-error]').textContent=e.message;}});render();
 }
 async function openCart(initial){
  if(!root.auth?.currentUser?.emailVerified)return root.showToast?.('Sign in with a verified email.','info');document.getElementById('viciOrderDialog')?.close();const d=dialog('Review order request');d.id='viciOrderDialog';const body=d.querySelector('.commerce-body'),owner=root.auth.currentUser.uid,chatId=root.ViciChat?.getChatId?.();let draft=structuredClone(initial||root.ViciChat?.getOrderDraft?.()),quote=null,busy=false;
  const valid=()=>d.isConnected&&root.auth?.currentUser?.uid===owner&&root.ViciChat?.getChatId?.()===chatId;
  if(!draft?.lines?.length){body.textContent='Your order draft is empty. Add an item from a menu first.';return;}
  let items,place;try{[items,place]=await Promise.all([getMenu(draft.placeId,true),getPlace(draft.placeId)]);}catch(e){body.textContent=e.message;return;}if(!valid())return;
  const save=()=>{root.ViciChat?.setOrderDraft?.(draft);};
  const render=()=>{body.innerHTML=`<p data-no-translate><b>${esc(place.name)}</b></p><p class="commerce-hint">Draft only. The business must accept your request before preparation. Payment is separate.</p><form class="commerce-form"><div class="commerce-cart-lines">${draft.lines.map((line,i)=>{const item=items.find(m=>m.id===line.itemId);return `<fieldset data-line="${i}"><legend>${esc(item?.name||'Unlisted item')}</legend><div class="commerce-columns"><label>Quantity<input data-qty type="number" min="1" max="99" required value="${line.quantity}"></label><button type="button" data-remove="${i}">Remove item</button></div>${!item||!item.available?'<p role="alert">Item unavailable. Remove it to continue.</p>':`<small>Listed base price: ${money(item.priceCents)}</small>`}${item?.optionGroups?.map(g=>`<fieldset><legend>${esc(g.name)} · ${g.required?'Required':'Optional'} · max ${g.maxSelect}</legend>${g.choices.map(c=>`<label class="commerce-check"><input data-option data-group="${esc(g.id)}" value="${esc(c.id)}" type="${g.maxSelect===1?'radio':'checkbox'}" name="option-${i}-${esc(g.id)}" ${(line.options?.[g.id]||[]).includes(c.id)?'checked':''} ${c.available?'':'disabled'}>${esc(c.name)} +${money(c.priceCents)}${c.available?'':' (unavailable)'}</label>`).join('')}${g.maxSelect===1&&!g.required?`<label class="commerce-check"><input data-option data-group="${esc(g.id)}" value="" type="radio" name="option-${i}-${esc(g.id)}" ${!(line.options?.[g.id]||[]).length?'checked':''}>None</label>`:''}</fieldset>`).join('')||''}</fieldset>`;}).join('')}</div><div class="commerce-columns"><label>Request type<select name="requestType"><option value="pickup_order" ${draft.requestType==='pickup_order'?'selected':''}>Pickup pre-order</option>${place.delivery_inhouse===true?`<option value="delivery_order" ${draft.requestType==='delivery_order'?'selected':''}>Delivery request</option>`:''}</select></label><label>Payment method<select name="paymentMethod"><option>GCash</option><option>Maya</option><option>Bank Transfer</option></select></label></div><div class="commerce-columns"><label>Date<input name="date" type="date" min="${new Date(Date.now()+8*3600000).toISOString().slice(0,10)}" required value="${esc(draft.date||'')}"></label><label>Time<input name="time" type="time" required value="${esc(draft.time||'')}"></label></div><label>Notes (optional)<textarea name="notes" maxlength="1000">${esc(draft.notes||'')}</textarea></label><p data-error role="alert"></p><div class="commerce-actions"><button type="submit">Review current prices</button><button type="button" data-more>Add item</button><button type="button" data-cancel>Cancel draft</button></div><section class="commerce-quote" hidden></section></form>`;
   const form=body.querySelector('form');if(draft.paymentMethod)form.elements.paymentMethod.value=draft.paymentMethod;
   const capture=()=>{body.querySelectorAll('[data-line]').forEach(box=>{const line=draft.lines[Number(box.dataset.line)];line.quantity=Number(box.querySelector('[data-qty]').value);line.options={};box.querySelectorAll('[data-option]:checked').forEach(input=>{if(input.value)(line.options[input.dataset.group]||=[]).push(input.value);});});for(const k of ['requestType','paymentMethod','date','time','notes'])draft[k]=form.elements[k].value;save();};
   form.oninput=()=>{if(busy||draft.pendingSubmission)return;capture();quote=null;draft.key=crypto.randomUUID();body.querySelector('.commerce-quote').hidden=true;save();};form.onchange=form.oninput;
   body.onclick=e=>{const b=e.target.closest('button');if(b?.dataset.remove!=null&&!busy&&!draft.pendingSubmission){capture();draft.lines.splice(Number(b.dataset.remove),1);draft.key=crypto.randomUUID();save();if(draft.lines.length)render();else{root.ViciChat?.setOrderDraft?.(null);d.close();}}};
   body.querySelector('[data-more]').onclick=()=>{if(!busy&&!draft.pendingSubmission){capture();openMenu(place.id);}};
   body.querySelector('[data-cancel]').onclick=()=>{if(busy||draft.pendingSubmission)return;root.ViciChat?.setOrderDraft?.(null);d.close();};
   form.onsubmit=async e=>{e.preventDefault();if(busy)return;if(draft.pendingSubmission)return submit(draft.pendingSubmission);if(!form.reportValidity())return;capture();body.querySelector('[data-error]').textContent='';if(new Date(draft.date+'T'+draft.time+':00+08:00').getTime()<=Date.now()){body.querySelector('[data-error]').textContent='Choose a future date and time (Philippine time).';return;}busy=true;const controls=[...form.querySelectorAll('input,select,textarea,button')],disabled=controls.map(e=>e.disabled);controls.forEach(e=>e.disabled=true);try{quote=await root.ViciData.command('orderQuote',{placeId:draft.placeId,lines:draft.lines});if(!valid())return;const box=body.querySelector('.commerce-quote');box.innerHTML=`<h3>Confirm order request</h3><p><b>${esc(place.name)}</b> · ${esc(draft.date)} ${esc(draft.time)} · ${esc(draft.requestType==='delivery_order'?'Delivery request':'Pickup pre-order')}</p>${quote.lines.map(l=>`<p>${l.quantity} × ${esc(l.name)} ${esc(l.optionLabels.join(', '))}<b>${money(l.lineTotalCents)}</b></p>`).join('')}<p><b>Estimated subtotal ${money(quote.totalCents)}</b></p><p>${esc(quote.notice)}</p><p data-no-translate>${esc(draft.notes)}</p><p>Pending Establishment Confirmation after you send. Nothing is paid automatically.</p><button type="button" data-confirm>Confirm request</button>`;box.hidden=false;box.scrollIntoView({block:'start',behavior:'auto'});box.querySelector('[data-confirm]').focus({preventScroll:true});box.querySelector('[data-confirm]').onclick=()=>{if(busy||!quote)return;const payload={action:'create',confirmed:true,idempotencyKey:draft.key||(draft.key=crypto.randomUUID()),expectedQuoteDigest:quote.digest,request:{placeId:draft.placeId,requestType:draft.requestType,bookingDate:draft.date,bookingTime:draft.time,paymentMethod:draft.paymentMethod||'GCash',bookingDetails:draft.notes,menuLines:draft.lines}};draft.pendingSubmission=payload;save();submit(payload);};}catch(error){if(valid())body.querySelector('[data-error]').textContent=error.message;}finally{busy=false;if(valid())controls.forEach((e,i)=>e.disabled=disabled[i]);}};
   if(draft.pendingSubmission){form.querySelectorAll('input,select,textarea,button').forEach(e=>e.disabled=true);form.querySelector('[type=submit]').disabled=false;form.querySelector('[type=submit]').textContent='Recover request result';body.querySelector('[data-error]').textContent='The previous result was interrupted. Retry unchanged to safely recover the same request.';}
  };
  async function submit(payload){if(busy)return;busy=true;body.querySelectorAll('button,input,select,textarea').forEach(e=>e.disabled=true);try{const result=await root.ViciData.command('booking',payload);if(!valid())return;root.ViciChat.setOrderDraft(null);root.ViciChat.recordRequest({...result,placeId:place.id,placeName:place.name,requestType:payload.request.requestType});body.innerHTML=`<h3>Request submitted</h3><p>Pending Establishment Confirmation</p><p>Reference: <b>${esc(result.reference)}</b></p><button type="button" data-status>View request status</button>`;body.querySelector('[data-status]').onclick=()=>{d.close();root.ViciChat.close();root.openChatModal(place.id,place.name,null,'transaction',result.bookingId);};root.showToast?.('Your order request has been submitted.','success');}catch(e){if(!valid())return;if(e.status&&e.status<500){delete draft.pendingSubmission;quote=null;if(e.status===409){try{items=await getMenu(draft.placeId,true);}catch{}}if(!valid())return;save();render();body.querySelector('[data-error]').textContent=e.message+' Review current prices again before confirming.';}else{save();render();body.querySelector('[data-error]').textContent='Connection interrupted. Recover the request result before changing this draft.';}}finally{busy=false;}}
  render();
 }
 let account=root.auth?.currentUser?.uid;root.auth?.onAuthStateChanged?.(u=>{if(account!==(u?.uid)){document.querySelectorAll('.commerce-dialog').forEach(d=>d.close());menus.clear();account=u?.uid;}});
 root.ViciCommerce={addItem,getMenu,mountMenu,openMenu,openCart,editItem,money};
})(window);
