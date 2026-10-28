// Dry run by default. Run locally with server credentials in the environment.
// node scripts/migrate-private-owners.cjs [--apply]
const {services}=require('../netlify/functions/lib/admin');
(async()=>{
 const {db,FieldValue}=services();let cursor,count=0;const apply=process.argv.includes('--apply');
 while(true){
  let query=db.collection('places').orderBy('__name__').limit(200);if(cursor)query=query.startAfter(cursor);
  const snapshot=await query.get();if(snapshot.empty)break;
  for(const document of snapshot.docs){
   const data=document.data();if(!Object.hasOwn(data,'owner_email'))continue;
   count++;
   if(apply)await db.runTransaction(async tx=>{
    const current=await tx.get(document.ref);if(!current.exists||!Object.hasOwn(current.data(),'owner_email'))return;
    const value=current.data();
    tx.set(db.collection('private_places').doc(document.id),{owner_email:value.owner_email||null,owner_uid:value.owner_uid||null,updatedAt:FieldValue.serverTimestamp()},{merge:true});
    tx.update(document.ref,{owner_email:FieldValue.delete()});
   });
  }
  cursor=snapshot.docs.at(-1);
 }
 let buzzCursor,emails=0;
 while(true){
  let query=db.collection('buzz_posts').orderBy('__name__').limit(200);if(buzzCursor)query=query.startAfter(buzzCursor);
  const snapshot=await query.get();if(snapshot.empty)break;
  for(const document of snapshot.docs){
   if(!Object.hasOwn(document.data(),'authorEmail'))continue;
   emails++;if(apply)await document.ref.update({authorEmail:FieldValue.delete()});
  }
  buzzCursor=snapshot.docs.at(-1);
 }
 console.log(`${apply?'Migrated':'Would migrate'} ${count} ownership contact records; ${emails} public Buzz author-email fields removed in apply mode. No email addresses logged.`);
})().catch(()=>{console.error('Migration failed. Check server credentials, project and Firestore access.');process.exitCode=1;});
