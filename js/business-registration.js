// Phase 7 - Business registration: personal account remains "user" until server approval.
// All application decisions/documents are handled by protected Netlify functions.
window.BusinessRegistration = (() => {
  const docs = [
    ['mayor_permit',"Mayor's / Business Permit",true],
    ['registration_certificate','DTI / SEC / CDA Registration Certificate',true],
    ['barangay_clearance','Barangay Business Clearance',true],
    ['sanitary_permit','Sanitary Permit (where applicable)',false],
    ['authorization_letter','Owner Authorization Letter (if representative)',false]
  ];
  let current=null, busy=false, resumeTimer=0;
  const $=id=>document.getElementById(id);
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const message=(s,type='info')=>{const el=$('businessApplicationMessage');if(el){el.textContent=s;el.dataset.type=type;}else window.showToast?.(s,type);};
  function getDetails(){
    const ids=['legalName','tradeName','registrationType','registrationNumber','permitNumber','permitExpiry','representativeName','contactNumber','representativeRole','barangay','address'];
    return Object.fromEntries(ids.map(k=>[k,$('br_'+k)?.value?.trim()||'']));
  }
  async function command(action,body={}){return window.ViciData.command('businessRegistration',{action,...body});}
  function renderDetails(data){
    for(const [key,value] of Object.entries(data||{})){const field=$('br_'+key);if(field)field.value=value||'';}
  }
  function paintFiles(files={}){
    const role=$('br_representativeRole')?.value;
    const wrap=$('businessDocumentList');if(!wrap)return;
    wrap.innerHTML=docs.map(([kind,title,required])=>{
      const needed=required||kind==='authorization_letter'&&role==='authorized_representative';
      const file=files[kind];
      return `<div class="br-document-row"><div><strong>${escape(title)}</strong><p>${needed?'Required':'Optional'} · ${file?`Uploaded: ${escape(file.filename)} (${Math.ceil(file.bytes/1024)} KB)`:'Not uploaded'}</p></div><label class="br-file-button">${file?'Replace':'Upload'}<input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" data-business-doc="${kind}" aria-label="Upload ${escape(title)}"></label></div>`;
    }).join('');
  }
  const noticeLabel={submitted:'Application received',approved:'Business approved',rejected:'Application rejected',changes_required:'Changes requested'};
  const emailLabel={sent:'Email sent',failed:'Email delivery failed',not_configured:'Email not configured',sending:'Sending email',pending:'Email queued'};
  function formatNotificationList(items){
    if(!Array.isArray(items)||!items.length)return '<p class="br-fine">No application updates yet.</p>';
    return `<ol class="br-notification-list">${items.map(item=>{
      const date=Number.isFinite(Date.parse(item.createdAt))?new Date(item.createdAt).toLocaleString('en-PH',{dateStyle:'medium',timeStyle:'short'}):'';
      return `<li><strong>${escape(noticeLabel[item.type]||'Application update')}</strong><span>${escape(date)}</span><small>${escape(emailLabel[item.deliveryStatus]||'Email status unavailable')}</small></li>`;
    }).join('')}</ol>`;
  }
  async function refresh(){
    if(!window.auth?.currentUser)return;
    const u=window.auth.currentUser;
    await u.reload();
    const data=await command('status');current=data.application;
    $('businessOwnerEmail').textContent=u.email||'—';
    const verified=!!u.emailVerified;
    $('businessVerifyNotice').hidden=verified;
    $('businessRegistrationForm').hidden=!verified;
    if(!verified){message('Verify your email before submitting your application.');return;}
    const status=current?.status||'not_started';
    $('businessApplicationStatus').textContent=({not_started:'Not started',draft:'Draft',pending:'Pending Admin Review',approved:'Approved — Business Hub Ready',changes_required:'Changes Required',rejected:'Rejected',suspended:'Suspended'})[status]||status;
    $('businessApplicationStatus').dataset.status=status;
    $('businessAdminRemarks').textContent=current?.remarks||'';
    $('businessAdminRemarks').hidden=!current?.remarks;
    const history=$('businessNotificationHistory');if(history)history.innerHTML=formatNotificationList(current?.notifications);
    if(current?.details)renderDetails(current.details);
    paintFiles(current?.files||{});
    const editable=!['pending','approved','suspended'].includes(status);
    $('businessRegistrationFields').disabled=!editable;
    $('br_save').disabled=!editable;
    $('br_submit').disabled=!editable;
    $('businessRegistrationFiles').hidden=!editable;
    $('businessRegistrationApproveNext').hidden=status!=='approved';
    if(status==='pending')message('Application submitted. The administrator will review your documents.');
    else if(status==='approved')message('Approved! You may create and publish your establishment from Business Hub.','success');
    else if(status==='changes_required'||status==='rejected')message('Read the administrator remarks, update the application, and resubmit.');
    else message('Complete your business details and upload required documents.');
    window.debouncedIcons?.();
  }
  async function open(){
    if(!window.auth?.currentUser){sessionStorage.setItem('viciBusinessIntent','1');showPage('page-login');document.getElementById('authTabSignUp')?.click();return;}
    sessionStorage.removeItem('viciBusinessIntent');showPage('page-business-register');
    try{await refresh();}catch(e){message(e.message,'error');}
  }
  function resumeIfRequested(){
    if(sessionStorage.getItem('viciBusinessIntent')!=='1')return;
    clearTimeout(resumeTimer);
    resumeTimer=setTimeout(()=>{if(window.auth?.currentUser)open();},250);
  }
  async function saveDetails(){
    const res=await command('save',{details:getDetails()});
    message('Draft saved. Upload documents, then submit when ready.','success');return res;
  }
  async function submit(){
    if(!$('br_declaration').checked)throw Error('Please accept the declaration and privacy notice.');
    if(!window.confirm('Submit your business registration and verification documents for administrator review?'))return;
    await command('submit',{details:getDetails(),agreed:true});
    await refresh();message('Your application was submitted successfully.','success');
  }
  async function upload(kind,file){
    if(file.size>600*1024)throw Error('This document is too large. Use PDF/JPG/PNG/WebP up to 600 KB.');
    if(!['application/pdf','image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Unsupported file type.');
    const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||'').split(',')[1]||'');reader.onerror=()=>reject(new Error('Unable to read document.'));reader.readAsDataURL(file);});
    await command('upload',{kind,filename:file.name,mimeType:file.type,base64});
    const result=await command('status');current=result.application;paintFiles(current?.files);
    message(`${file.name} uploaded privately.`,`success`);
  }
  async function loadAdminApplications(){
    const target=$('adminBusinessApplicationsList');if(!target)return;
    target.textContent='Loading private business applications…';
    try{
      const {applications}=await command('list');
      if(!applications.length){target.textContent='No business applications submitted yet.';return;}
      target.innerHTML=applications.sort((a,b)=>(a.status==='pending'?-1:0)-(b.status==='pending'?-1:0)).map(a=>{
        const d=a.details||{},uid=escape(a.ownerUid);
        const actions=a.status==='pending'?`<div class="br-admin-actions"><button type="button" data-business-action="approve" data-business-uid="${uid}">Approve</button><button type="button" data-business-action="changes_required" data-business-uid="${uid}">Request Changes</button><button type="button" data-business-action="reject" data-business-uid="${uid}">Reject</button></div>`:'';
        return `<article class="br-admin-card"><h4>${escape(d.tradeName||'Business Application')}</h4><p><b>${escape(a.status)}</b> · ${escape(a.ownerEmail)}</p><p>Legal: ${escape(d.legalName)} · Registration: ${escape(d.registrationType)} · Brgy. ${escape(d.barangay)}</p><p>Applicant: ${escape(d.representativeName)} · Permit #: ${escape(d.permitNumber)}</p><div class="br-admin-docs">${docs.filter(([k])=>a.files?.[k]).map(([k,t])=>`<button type="button" data-business-document="${k}" data-business-uid="${uid}">View ${escape(t)}</button>`).join(' ')}</div>${a.remarks?`<p>Admin remarks: ${escape(a.remarks)}</p>`:''}${actions}<details class="br-admin-history"><summary>Notification history (${(a.notifications||[]).length})</summary>${formatNotificationList(a.notifications)}</details>${a.notificationStatus!=='sent'&&['pending','approved','rejected','changes_required'].includes(a.status)?`<button type="button" data-business-action="retryEmail" data-business-uid="${uid}">Retry latest email (${escape(a.notificationStatus||'pending')})</button>`:''}</article>`;
      }).join('');
    }catch(error){target.textContent=error.message;}
  }
  async function decide(uid,action){
    let remarks='';
    if(action==='retryEmail'){
      if(!window.confirm('Retry the business application notification email?'))return;
    }else if(action==='approve'){
      if(!window.confirm('Approve this verified business and grant Business Hub access? The owner can publish establishments without a second approval.'))return;
    }else{
      remarks=window.prompt('Enter the reason and required next steps (at least 8 characters):')||'';
      if(remarks.trim().length<8)return;
    }
    await command(action==='retryEmail'?'retryEmail':action,{uid,remarks});
    await loadAdminApplications();
  }
  async function viewDocument(uid,kind){
    // Open synchronously to avoid popup blockers; never store document in page HTML or URLs.
    const tab=window.open('about:blank','_blank');
    if(tab)tab.document.body.textContent='Loading secured business document…';
    try{
      const {base64,mimeType}=await command('document',{uid,kind});
      const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));
      const url=URL.createObjectURL(new Blob([bytes],{type:mimeType}));
      if(tab)tab.location.href=url;
      else window.showToast?.('Allow popups to view the document.','error');
      setTimeout(()=>URL.revokeObjectURL(url),60000);
    }catch(error){if(tab)tab.document.body.textContent=error.message;else window.alert(error.message);}
  }
  document.addEventListener('DOMContentLoaded',()=>{
    $('registerBusinessAuthBtn')?.addEventListener('click',open);
    $('registerBusinessFromActivity')?.addEventListener('click',open);
    $('br_refresh')?.addEventListener('click',async()=>{try{await refresh();}catch(e){message(e.message,'error');}});
    $('br_resend')?.addEventListener('click',()=>window.resendVerificationEmail?.());
    $('br_representativeRole')?.addEventListener('change',()=>paintFiles(current?.files));
    $('br_save')?.addEventListener('click',async()=>{try{await saveDetails();}catch(e){message(e.message,'error');}});
    $('br_submit')?.addEventListener('click',async()=>{try{await submit();}catch(e){message(e.message,'error');}});
    $('businessDocumentList')?.addEventListener('change',async event=>{
      const input=event.target.closest('[data-business-doc]');if(!input?.files?.[0]||busy)return;
      busy=true;input.disabled=true;message('Uploading document privately…');
      try{await upload(input.dataset.businessDoc,input.files[0]);}catch(e){message(e.message,'error');}
      finally{busy=false;input.disabled=false;}
    });
    document.body.addEventListener('click',event=>{
      const doc=event.target.closest('[data-business-document]');if(doc){viewDocument(doc.dataset.businessUid,doc.dataset.businessDocument);return;}
      const act=event.target.closest('[data-business-action]');if(act)decide(act.dataset.businessUid,act.dataset.businessAction).catch(e=>window.alert(e.message));
    });
  });
  return {open,refresh,resumeIfRequested,loadAdminApplications,viewDocument};
})();
