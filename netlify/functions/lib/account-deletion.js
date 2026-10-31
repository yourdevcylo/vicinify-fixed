const crypto = require('node:crypto');
const PAGE = 10;
const closed = new Set(['received', 'rejected', 'cancelled']);
const settledRefund = new Set(['received', 'not_required']);
function obligation(order) {
    if (!closed.has(order.status || order.bookingStatus)) return 'active_transaction';
    if (order.status === 'cancelled' && !settledRefund.has(order.refundStatus || (order.paymentAmount || order.paymentStatus === 'confirmed' ? '' : 'not_required'))) return 'unresolved_refund';
    return null;
}
async function eachPage(query, visit) {
    let cursor;
    for (;;) { let q=query.orderBy('__name__').limit(100);if(cursor)q=q.startAfter(cursor);const snap=await q.get();for(const doc of snap.docs)await visit(doc);if(snap.docs.length<100)return;cursor=snap.docs.at(-1); }
}
async function preflight(db,uid) {
    const profile=(await db.collection('users').doc(uid).get()).data()||{};
    const blockers=[];let active=0,refunds=0;
    if(uid==='Z45NZhQTgsTUX79WJ5ksCH8N3c02')blockers.push('protected_admin');else if(profile.role==='admin')blockers.push('admin_handoff');
    const owned=await db.collection('places').where('owner_uid','==',uid).limit(101).get();
    if(owned.docs.length>100)blockers.push('too_many_establishments');
    const check=doc=>{const why=obligation(doc.data());if(why==='active_transaction')active++;if(why==='unresolved_refund')refunds++;};
    await eachPage(db.collection('bookings').where('userId','==',uid),check);
    for(const place of owned.docs)await eachPage(db.collection('bookings').where('placeId','==',place.id),check);
    if(active)blockers.push('active_transactions');if(refunds)blockers.push('unresolved_refunds');
    let claims=0;await eachPage(db.collection('business_claims').where('userId','==',uid),doc=>{if(['pending','under_review'].includes(doc.data().status))claims++;});if(claims)blockers.push('pending_claims');
    let transfers=0;for(const field of ['fromUid','toUid'])await eachPage(db.collection('ownership_transfers').where(field,'==',uid),doc=>{if(['pending','preparing'].includes(doc.data().status))transfers++;});if(transfers)blockers.push('pending_transfers');
    return {blockers,activeTransactions:active,pendingRefunds:refunds,pendingClaims:claims,pendingTransfers:transfers,ownedPlaces:owned.docs.map(d=>({id:d.id,name:String(d.data().name||'Establishment').slice(0,120)}))};
}
function plan(uid,places) {
    const tasks=places.map(id=>({kind:'close',id}));const add=(kind,collection,field,value)=>tasks.push({kind,collection,field,value});
    for(const name of ['favorites','business_claims','place_reports'])add('delete',name,'userId',uid);
    for(const name of ['loyalty_cards','stamp_requests'])add('delete',name,'customerUid',uid);
    add('delete','buzz_posts','authorUid',uid);
    add('delete','buzz_media','authorUid',uid);
    add('delete','private_places','owner_uid',uid);
    tasks.push({kind:'events',collection:'events'});
    for(const field of ['actorUid','adminUid'])add('audit','admin_audit',field,uid);
    add('review','reviews','userId',uid);
    add('booking','bookings','userId',uid);
    for(const field of ['userId','senderUid','createdBy'])add('message','messages',field,uid);
    add('contribution','places','addedBy',uid);
    for(const field of ['fromUid','toUid']){add('transfer','ownership_transfers',field,uid);add('audit','admin_audit',field,uid);}
    for(const id of places){
        add('owner_booking','bookings','placeId',id);
        add('owner_message','messages','placeId',id);
        add('delete','place_posts','placeId',id);
        add('close_card','loyalty_cards','placeId',id);
        add('close_stamp','stamp_requests','placeId',id);
    }
    tasks.push({kind:'buzz_scan',collection:'buzz_posts'},{kind:'rates_scan',collection:'_rate_limits'});
    for(const prefix of [`places/${uid}/`,`buzz_posts/${uid}/`,...places.flatMap(id=>[`place_covers/${id}/`,`place_posts/${id}/`,`place_assets/${id}/`])])tasks.push({kind:'storage',prefix});
    tasks.push({kind:'profiles'},{kind:'auth'});return tasks;
}
function keep(data,keys) { return Object.fromEntries(keys.filter(key=>data[key]!==undefined).map(key=>[key,data[key]])); }
const ledger=['placeId','placeName','userId','userName','requestType','requestLabel','requestGroup','bookingDate','bookingTime','guestCount','status','bookingStatus','paymentStatus','paymentAmount','paymentAmountDue','paymentMethod','paymentType','refundStatus','refundAmount','refundBaseAmount','refundPercent','refundPaymentVerified','createdAt','updatedAt','customer_confirmed','bookingId','transactionId'];
function sanitize(kind,data,anon,uid) {
    if(kind==='review')return {...keep(data,['placeId','bookingId','transactionId','rating','isPublic','verifiedTransaction','reviewSource','requestType','createdAt','updatedAt']),userId:anon,userName:'Deleted account',feedback:'',accountDeleted:true};
    if(kind==='transfer'||kind==='audit'){const copy=kind==='audit'?keep(data,['action','target','targetId','fromUid','toUid','actorUid','adminUid','createdAt','updatedAt']):{...data};for(const field of ['actorUid','adminUid','targetId'])if(copy[field]===uid)copy[field]=anon;for(const field of ['fromUid','toUid'])if(copy[field]===uid)copy[field]=anon;delete copy.recipientEmail;delete copy.fromName;return copy;}
    if(kind==='close_card'||kind==='close_stamp'){const copy={...data,placeName:'Closed establishment',establishmentClosed:true};if(kind==='close_stamp'&&copy.status==='pending')copy.status='cancelled';delete copy.ownerUid;delete copy.ownerName;return copy;}
    if(kind==='contribution'){const copy={...data,addedBy:anon};delete copy.addedByName;delete copy.addedByEmail;return copy;}
    const copy=keep(data,ledger);
    if(kind==='booking'||(kind==='message'&&data.userId===uid)){copy.userId=anon;copy.userName='Deleted account';}
    if(kind==='owner_booking'||kind==='owner_message'){copy.placeName='Closed establishment';Object.assign(copy,keep(data,['paymentProofPath','paymentProofUrl','paymentReference','refundReference']));}
    if(kind.includes('message'))Object.assign(copy,{type:'system_update',text:'Transaction record retained after account deletion.',senderUid:anon,createdBy:anon,senderName:'Deleted account',senderRole:'system'});
    return {...copy,accountDeleted:true};
}
async function erasePrefix(storage,prefix) {
    const bucket=storage.bucket();let files;
    try{[files]=await bucket.getFiles({prefix,maxResults:25,autoPaginate:false});}catch(error){if(error.code===404)return true;throw error;}
    await Promise.all(files.map(file=>file.delete({ignoreNotFound:true})));return files.length<25;
}
async function step(services,uid,job) {
    const {db,auth,storage}=services,tasks=plan(uid,job.places),task=tasks[job.phase];if(!task)return {done:true};
    if(task.kind==='close'){
        const ref=db.collection('places').doc(task.id);
        await db.runTransaction(async tx=>{const current=await tx.get(ref);if(!current.exists)return;const data=current.data();if(![uid,job.anon].includes(data.owner_uid))throw Object.assign(new Error('Establishment ownership changed. Contact support before resuming.'),{status:409});tx.set(ref,{...keep(data,['createdAt','ratingSum','reviewCount','avgRating']),name:'Closed establishment',owner_uid:job.anon,addedBy:job.anon,approval_status:'archived',status:'closed',accepts_booking:false,accountDeleted:true});tx.delete(db.collection('private_places').doc(task.id));});return {advance:true};
    }
    if(task.kind==='profiles'){
        const batch=db.batch();for(const name of ['users','public_profiles','message_limits'])batch.delete(db.collection(name).doc(uid));
        for(const scope of ['chat','comment','place','report','claim','menu','buzz'])batch.delete(db.collection('write_cooldowns').doc(uid+'_'+scope));await batch.commit();return {advance:true};
    }
    if(task.kind==='auth'){try{await auth.deleteUser(uid);}catch(error){if(error.code!=='auth/user-not-found')throw error;}return {done:true};}
    if(task.kind==='storage') {
        if (!storage?.bucket) return {advance:true};
        try { return (await erasePrefix(storage,task.prefix))?{advance:true}:{}; }
        catch(error) { if([404,403,'storage/bucket-not-found'].includes(error.code)) return {advance:true}; throw error; }
    }
    let q=task.kind==='events'?db.collectionGroup('events').where('actorUid','==',uid):db.collection(task.collection);
    if(task.field)q=q.where(task.field,'==',task.value);
    q=q.orderBy('__name__');if(job.cursor&&task.kind!=='events')q=q.startAfter(job.cursor);const snap=await q.limit(PAGE).get();
    for(const doc of snap.docs){
        const assets=task.kind==='contribution'?await require('./transfer-assets').migrateAssets(storage,doc.id,uid,doc.data()):{};
        if(task.kind==='booking') {
            await db.collection('payment_proofs').doc(doc.id).delete();
            // Legacy Firebase Storage cleanup is optional: new installations do
            // not have Storage enabled; account deletion must still complete.
            if (storage?.bucket) try { await eraseAllProofs(storage,doc.id); }
            catch(error) { if(!['storage/bucket-not-found',404,403].includes(error.code)) console.warn('Legacy proof cleanup unavailable:',error.code); }
        }
        await db.runTransaction(async tx=>{
            const fresh=await tx.get(doc.ref);if(!fresh.exists)return;const data=fresh.data();
            if(task.kind==='delete'){tx.delete(doc.ref);return;}
            if(task.kind==='events'){tx.set(doc.ref,{...keep(data,['from','to','action','paymentAmountDue','refundAmount','refundStatus','paymentReviewDecision','createdAt']),actorUid:job.anon});return;}
            if(task.kind==='buzz_scan'){
                const liked=(data.likedBy||[]).filter(id=>id!==uid),comments=(data.comments||[]).filter(c=>c.authorUid!==uid&&c.userId!==uid);
                if(liked.length!==(data.likedBy||[]).length||comments.length!==(data.comments||[]).length)tx.update(doc.ref,{likedBy:liked,likes:Math.max(0,Number(data.likes||0)-((data.likedBy||[]).includes(uid)?1:0)),comments});return;
            }
            if(task.kind==='rates_scan'){if(doc.id.endsWith('_'+uid))tx.delete(doc.ref);return;}
            if(task.kind==='review'){
                // Remove UID-bearing deterministic review IDs while retaining the rating aggregate.
                const next=db.collection('reviews').doc('deleted_'+crypto.createHash('sha256').update(job.anon+':'+doc.id).digest('hex'));
                tx.set(next,sanitize('review',data,job.anon));tx.delete(doc.ref);return;
            }
            tx.set(doc.ref,{...sanitize(task.kind,data,job.anon,uid),...assets});
        });
    }
    return snap.docs.length<PAGE?{advance:true}:task.kind==='events'?{}:{cursor:snap.docs.at(-1).id};
}
async function eraseAllProofs(storage,id){let done=false;while(!done)done=await erasePrefix(storage,`payment_proofs/${id}/`);}
function digest(value){return crypto.createHash('sha256').update(String(value)).digest('hex');}
module.exports={preflight,obligation,plan,sanitize,step,digest,eachPage};
