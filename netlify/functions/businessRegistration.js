'use strict';
// Phase 7: private, server-owned business application lifecycle. No client may self-approve.
const {services, authenticate, limit, reply} = require('./lib/admin');
const {FieldValue} = require('firebase-admin/firestore');
const {newEvent,appended,publicHistory,deliverNotification}=require('./lib/business-notifications');

const DOCUMENT_KINDS = ['mayor_permit','registration_certificate','barangay_clearance','sanitary_permit','authorization_letter'];
const REG_TYPES = ['sole_proprietorship','partnership','corporation','cooperative'];
const MAX_FILE_BYTES = 600 * 1024; // one private Firestore document per file, under 1 MiB Firestore limit
function fail(message,status=400){throw Object.assign(new Error(message),{status});}
function safeText(value,max,field,required=true){
    if(typeof value!=='string')fail(`${field} must be text.`);
    const text=value.trim();
    if(required&&!text)fail(`${field} is required.`);
    if(text.length>max||/[<>\x00-\x1f]/.test(text))fail(`${field} contains invalid characters or is too long.`);
    return text;
}
function validateDetails(raw){
    if(!raw||typeof raw!=='object')fail('Enter your business information.');
    const details={
        legalName:safeText(raw.legalName,120,'Legal business name'),
        tradeName:safeText(raw.tradeName,120,'Trade or store name'),
        registrationType:safeText(raw.registrationType,32,'Registration type'),
        registrationNumber:safeText(raw.registrationNumber,80,'Registration number'),
        permitNumber:safeText(raw.permitNumber,80,'Business permit number'),
        permitExpiry:safeText(raw.permitExpiry||'',10,'Permit expiry',false),
        representativeName:safeText(raw.representativeName,100,'Representative name'),
        contactNumber:safeText(raw.contactNumber,28,'Contact number'),
        representativeRole:safeText(raw.representativeRole,24,'Applicant relationship'),
        barangay:safeText(raw.barangay,60,'Barangay'),
        address:safeText(raw.address,220,'Business address')
    };
    if(!REG_TYPES.includes(details.registrationType))fail('Select a valid registration type.');
    if(!['owner','authorized_representative'].includes(details.representativeRole))fail('Choose your applicant relationship.');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(details.permitExpiry)&&details.permitExpiry)fail('Use a valid expiration date.');
    if(details.permitExpiry){
        const d=new Date(details.permitExpiry+'T00:00:00Z');
        if(Number.isNaN(d.valueOf())||d.toISOString().slice(0,10)!==details.permitExpiry||details.permitExpiry<new Date().toISOString().slice(0,10))fail('Please submit a valid, current business permit.');
    }
    return {...details,city:'Lipa City',province:'Batangas'};
}
function decodeFile(body){
    const type=String(body.mimeType||'');
    if(!['application/pdf','image/jpeg','image/png','image/webp'].includes(type))fail('Use a PDF, PNG, JPEG or WebP file.');
    const b64=String(body.base64||'');
    if(b64.length>830000||!b64||!/^[A-Za-z0-9+/]+={0,2}$/.test(b64)||b64.length%4!==0)fail('Invalid or oversized document.');
    const buffer=Buffer.from(b64,'base64');
    if(!buffer.length||buffer.length>MAX_FILE_BYTES||buffer.toString('base64')!==b64)fail('Each document must be 600 KB or smaller.');
    const pdf=buffer.subarray(0,5).toString()==='%PDF-';
    const jpg=buffer[0]===0xff&&buffer[1]===0xd8&&buffer[2]===0xff;
    const png=buffer.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'));
    const webp=buffer.subarray(0,4).toString()==='RIFF'&&buffer.subarray(8,12).toString()==='WEBP';
    if(!(type==='application/pdf'&&pdf||type==='image/jpeg'&&jpg||type==='image/png'&&png||type==='image/webp'&&webp))fail('Document content does not match its file type.');
    return {base64:b64,bytes:buffer.length,mimeType:type,filename:safeText(body.filename||'document',100,'Filename')};
}
async function requireAdmin(db,user){
    if(user.uid==='Z45NZhQTgsTUX79WJ5ksCH8N3c02')return;
    const snap=await db.collection('users').doc(user.uid).get();
    if(snap.data()?.role!=='admin')fail('Administrator access required.',403);
}
function sanitizeApp(doc){
    if(!doc.exists)return null;
    const a=doc.data();
    return {id:doc.id,status:a.status,ownerUid:a.ownerUid,ownerEmail:a.ownerEmail,details:a.details||null,
        files:a.files||{},remarks:a.remarks||'',submittedAt:a.submittedAt||null,
        updatedAt:a.updatedAt||null,approvedAt:a.approvedAt||null,notificationStatus:a.notificationStatus||null,
        notifications:publicHistory(a.notificationHistory)};
}
async function handlerLogic(event){
    if(event.httpMethod!=='POST')return reply(405,{error:'POST only'});
    const user=await authenticate(event);
    const {db,auth}=services();
    const body=JSON.parse(event.body||'{}');
    const action=String(body.action||'status');
    const ref=db.collection('business_applications').doc(user.uid);
    if(action==='status')return reply(200,{application:sanitizeApp(await ref.get()),verifiedEmail:user.email||''});
    if(action==='save'){
        await limit(user.uid,'business_app_save',12,60000);
        const details=validateDetails(body.details);
        await db.runTransaction(async tx=>{
            const old=await tx.get(ref);
            if(['pending','approved','suspended'].includes(old.data()?.status))fail('This application cannot be edited while under review or approved.',409);
            tx.set(ref,{ownerUid:user.uid,ownerEmail:user.email,details,status:'draft',files:old.data()?.files||{},remarks:'',updatedAt:FieldValue.serverTimestamp(),createdAt:old.data()?.createdAt||FieldValue.serverTimestamp()},{merge:true});
        });
        return reply(200,{saved:true});
    }
    if(action==='upload'){
        await limit(user.uid,'business_app_upload',10,60000);
        if(!DOCUMENT_KINDS.includes(body.kind))fail('Invalid document type.');
        const file=decodeFile(body);
        const docRef=db.collection('business_application_files').doc(`${user.uid}_${body.kind}`);
        await db.runTransaction(async tx=>{
            const app=await tx.get(ref);
            if(['pending','approved','suspended'].includes(app.data()?.status))fail('Documents cannot be changed during review or after approval.',409);
            const files={...(app.data()?.files||{}),[body.kind]:{filename:file.filename,mimeType:file.mimeType,bytes:file.bytes}};
            tx.set(docRef,{ownerUid:user.uid,kind:body.kind,...file,updatedAt:FieldValue.serverTimestamp()});
            tx.set(ref,{ownerUid:user.uid,ownerEmail:user.email,status:'draft',files,updatedAt:FieldValue.serverTimestamp()}, {merge:true});
        });
        return reply(200,{saved:true,kind:body.kind,bytes:file.bytes});
    }
    if(action==='submit'){
        await limit(user.uid,'business_app_submit',3,3600000);
        const details=validateDetails(body.details);
        if(body.agreed!==true)fail('Accept the declaration and privacy notice first.');
        let notificationId;
        await db.runTransaction(async tx=>{
            const old=await tx.get(ref);const existing=old.data()||{};
            if(['pending','approved','suspended'].includes(existing.status))fail('Your application is already pending or approved.',409);
            const required=['mayor_permit','registration_certificate','barangay_clearance',...(details.representativeRole==='authorized_representative'?['authorization_letter']:[])];
            if(!required.every(kind=>existing.files?.[kind]))fail('Upload all required business verification documents first.');
            const event=newEvent('submitted');notificationId=event.id;
            tx.set(ref,{ownerUid:user.uid,ownerEmail:user.email,details,files:existing.files,status:'pending',remarks:'',agreedAt:FieldValue.serverTimestamp(),submittedAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp(),notificationStatus:'pending',notificationHistory:appended(existing.notificationHistory,event),createdAt:existing.createdAt||FieldValue.serverTimestamp()});
        });
        try{await deliverNotification(db,user.uid,notificationId);}catch(e){console.error('Application received; email dispatch could not finish:',e.message);}
        return reply(200,{submitted:true,status:'pending'});
    }
    if(action==='list'){
        await requireAdmin(db,user);
        const result=await db.collection('business_applications').limit(100).get();
        return reply(200,{applications:result.docs.filter(d=>d.data()?.status!=='draft').map(sanitizeApp)});
    }
    if(action==='document'){
        const uid=String(body.uid||user.uid),kind=String(body.kind||'');
        if(!/^[A-Za-z0-9_-]{1,180}$/.test(uid)||!DOCUMENT_KINDS.includes(kind))fail('Invalid document reference.');
        if(uid!==user.uid)await requireAdmin(db,user);
        const doc=await db.collection('business_application_files').doc(`${uid}_${kind}`).get();
        if(!doc.exists||doc.data().ownerUid!==uid)fail('Document unavailable.',404);
        const file=doc.data();
        return reply(200,{mimeType:file.mimeType,base64:file.base64,filename:file.filename});
    }
    if(['approve','changes_required','reject'].includes(action)){
        await requireAdmin(db,user);
        const uid=String(body.uid||'');
        if(!/^[A-Za-z0-9_-]{1,128}$/.test(uid))fail('Invalid applicant.');
        const target=db.collection('business_applications').doc(uid);
        const applicant=await auth.getUser(uid);
        if(!applicant.emailVerified||applicant.disabled)fail('The applicant must have a verified and active email account.',409);
        const remarks=safeText(body.remarks||'',800,'Review remarks',false);
        if(action!=='approve'&&remarks.length<8)fail('Enter an explanation (at least 8 characters).');
        if(uid===user.uid)fail('You cannot review your own application.',403);
        let notificationId;
        await db.runTransaction(async tx=>{
            const old=await tx.get(target),a=old.data();
            if(!a||a.status!=='pending')fail('This application is no longer pending.',409);
            if(a.ownerEmail!==applicant.email)fail('Account email changed. Ask the applicant to resubmit.',409);
            const profileRef=db.collection('users').doc(uid),profile=await tx.get(profileRef), deletion=await tx.get(db.collection('account_deletions').doc(uid));
            if(deletion.exists)fail('This applicant is deleting their account.',409);
            if(!profile.exists)fail('Applicant user profile is missing.',409);
            const notification=newEvent(action==='approve'?'approved':action==='reject'?'rejected':'changes_required');notificationId=notification.id;
            const status=action==='approve'?'approved':action==='reject'?'rejected':'changes_required';
            tx.update(target,{status,remarks,reviewedBy:user.uid,reviewedAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp(),...(action==='approve'?{approvedAt:FieldValue.serverTimestamp()}:{}) ,notificationStatus:'pending',notificationHistory:appended(a.notificationHistory,notification)});
            if(action==='approve'){
                if(profile.data()?.role==='admin')fail('Administrator accounts cannot be converted to business accounts.',403);
                tx.update(profileRef,{role:'business',businessVerificationStatus:'approved',businessApplicationId:uid});
                tx.set(db.collection('verified_businesses').doc(uid),{ownerUid:uid,ownerEmail:applicant.email,legalName:a.details.legalName,tradeName:a.details.tradeName,approvedBy:user.uid,approvedAt:FieldValue.serverTimestamp(),status:'active'});
            }
            tx.create(db.collection('admin_audit').doc(),{action:`BUSINESS_APPLICATION_${status.toUpperCase()}`,adminUid:user.uid,targetUid:uid,createdAt:FieldValue.serverTimestamp()});
        });
        try { await deliverNotification(db,uid,notificationId); }
        catch (emailError) { console.error('Approval saved, notification dispatch failed:',emailError.message); }
        return reply(200,{saved:true,status:action==='reject'?'rejected':action==='approve'?'approved':'changes_required'});
    }
    if(action==='retryEmail'){
        await requireAdmin(db,user);
        const uid=String(body.uid||'');if(!/^[A-Za-z0-9_-]{1,128}$/.test(uid))fail('Invalid applicant.');
        const a=(await db.collection('business_applications').doc(uid).get()).data();
        if(!a||!['pending','approved','rejected','changes_required'].includes(a.status))fail('No notification is available for this application.',409);
        const recipient=await auth.getUser(uid);
        if(recipient.disabled||!recipient.emailVerified||recipient.email!==a.ownerEmail)fail('Applicant email changed or is not verified. Email retry is unavailable.',409);
        await limit(user.uid,'business_app_email_retry',8,3600000);
        let latest=(a.notificationHistory||[]).at(-1);
        // Legacy Phase 7/8 applications only have notificationStatus, not a history entry.
        // Preserve their ability to retry without repeating any admin approval.
        if(!latest){
            if(a.notificationStatus==='sent')fail('This notification has already been sent.',409);
            const target=db.collection('business_applications').doc(uid);
            await db.runTransaction(async tx=>{
                const snap=await tx.get(target),record=snap.data();
                if(!record||record.status!==a.status)fail('Application status changed. Refresh the page.',409);
                const existing=(record.notificationHistory||[]).at(-1);
                if(existing){latest=existing;return;}
                latest=newEvent(record.status==='pending'?'submitted':record.status);
                tx.update(target,{notificationHistory:[latest],notificationStatus:'pending'});
            });
        }
        if((latest.type==='submitted'?'pending':latest.type)!==a.status)fail('Only the latest application notification may be retried.',409);
        if(latest.deliveryStatus==='sent')fail('This notification has already been sent.',409);
        const result=await deliverNotification(db,uid,latest.id);
        if(result.status==='already_claimed_or_sent')fail('Notification is already being sent or has reached its retry limit.',409);
        return reply(200,{saved:true,notificationStatus:result.status});
    }
    fail('Unknown action.');
}
exports.handler=async event=>{
    try{return await handlerLogic(event);}catch(error){
        console.error('Business registration error:',error.status||error.code||'server_error');
        return reply(error.status||500,{error:error.status?error.message:'Business registration service is temporarily unavailable.'});
    }
};
exports._test={validateDetails,decodeFile,DOCUMENT_KINDS};
