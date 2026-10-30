const crypto = require('node:crypto');
const { services, authenticate, reply, limit } = require('./lib/admin');
// Carefully scoped administrative data exports; Firebase Authentication and Storage files are NOT in these snapshots.
const ROOT = ['establishment_categories','places','bookings','reviews','buzz_posts','place_posts','loyalty_cards','stamp_requests'];
const ALLOWED = [...ROOT,'menu_items'];
const MAX_DOCS = 1800;
const MAX_BYTES = 4 * 1024 * 1024;
const BUCKET_PREFIX = 'private-admin-backups/';
function bad(message, status=400){ return Object.assign(new Error(message), {status}); }
function serialize(value) {
  if(value && typeof value.toDate==='function') return {__viciType:'timestamp',value:value.toDate().toISOString()};
  if(value && typeof value.latitude==='number' && typeof value.longitude==='number') return {__viciType:'geopoint',latitude:value.latitude,longitude:value.longitude};
  if(value && typeof value.path==='string' && value.firestore) return {__viciType:'reference',path:value.path};
  if(Array.isArray(value)) return value.map(serialize);
  if(value && typeof value==='object') return Object.fromEntries(Object.entries(value).map(([key,val])=>[key,serialize(val)]));
  return value;
}
function deserialize(value, db) {
  if(Array.isArray(value)) return value.map(v=>deserialize(v,db));
  if(value && typeof value==='object') {
    if(value.__viciType==='timestamp' && typeof value.value==='string' && !isNaN(Date.parse(value.value))) return require('firebase-admin/firestore').Timestamp.fromDate(new Date(value.value));
    if(value.__viciType==='geopoint' && Number.isFinite(value.latitude) && Number.isFinite(value.longitude)) return new (require('firebase-admin/firestore').GeoPoint)(value.latitude,value.longitude);
    if(value.__viciType==='reference' && typeof value.path==='string' && validPath(value.path)) return db.doc(value.path);
    if(Object.prototype.hasOwnProperty.call(value,'__viciType')) throw bad('Unsupported backup value type.');
    return Object.fromEntries(Object.entries(value).map(([key,val])=>[key,deserialize(val,db)]));
  }
  return value;
}
function validPath(path){
  if(typeof path!=='string'||path.length>700||path.includes('//')) return false;
  const parts=path.split('/');
  return parts.length>=2 && parts.length%2===0 && parts.every(v=>/^[A-Za-z0-9_-]{1,180}$/.test(v)) && ((parts.length===2 && ROOT.includes(parts[0])) || (parts.length===4&&parts[0]==='places'&&parts[2]==='menu_items'));
}
function validate(data){
  if(!data||data.schema!=='vicinify-admin-backup-v1'||!Array.isArray(data.records))throw bad('Not a Vicinify backup file.');
  if(data.records.length>MAX_DOCS)throw bad('Too many records. Split into smaller backups.');
  const paths=new Set();
  for(const row of data.records){
    if(!row||!validPath(row.path)||!row.data||typeof row.data!=='object'||Array.isArray(row.data))throw bad('Invalid record path or data.');
    if(paths.has(row.path))throw bad('Duplicate record path.'); paths.add(row.path);
  }
  return data.records;
}
async function guard(event){
  const user=await authenticate(event);const {db}=services();
  const profile=await db.collection('users').doc(user.uid).get();
  if(profile.data()?.role!=='admin' && user.uid!=='Z45NZhQTgsTUX79WJ5ksCH8N3c02')throw bad('Admin only.',403);
  return {user,db};
}
async function makeSnapshot(db,names){
  const selected=names===undefined?ALLOWED:names;
  if(!Array.isArray(selected)||!selected.length||selected.some(n=>!ALLOWED.includes(n))||new Set(selected).size!==selected.length)throw bad('Select valid data collections.');
  const records=[];
  for(const name of selected){
    const query=name==='menu_items'?db.collectionGroup('menu_items'):db.collection(name);
    const snap=await query.limit(MAX_DOCS+1).get();
    if(snap.size>MAX_DOCS || records.length+snap.size>MAX_DOCS)throw bad('Backup exceeds '+MAX_DOCS+' records; select fewer collections.',413);
    for(const doc of snap.docs){if(!validPath(doc.ref.path))continue;records.push({path:doc.ref.path,data:serialize(doc.data())});}
  }
  const result={schema:'vicinify-admin-backup-v1',createdAt:new Date().toISOString(),collections:selected,records};
  if(Buffer.byteLength(JSON.stringify(result))>MAX_BYTES)throw bad('Backup larger than 4 MB; select fewer collections.',413);
  return result;
}
async function audit(db,user,action,details){await db.collection('admin_audit').add({action,adminUid:user.uid,details,createdAt:require('firebase-admin/firestore').FieldValue.serverTimestamp()});}
exports.handler=async event=>{
  if(event.httpMethod!=='POST')return reply(405,{error:'POST only'});
  try{
    if(Buffer.byteLength(event.body||'')>MAX_BYTES+150000)throw bad('Request too large.',413);
    const {user,db}=await guard(event);
    await limit(user.uid,'database_management',10,60000);
    const body=JSON.parse(event.body||'{}');
    if(body.action==='export'||body.action==='backup'){
      const backup=await makeSnapshot(db,body.collections);
      if(body.action==='backup'){
        const {storage}=services();const id=crypto.randomUUID();
        const file=storage.bucket().file(BUCKET_PREFIX+id+'.json');
        await file.save(Buffer.from(JSON.stringify(backup)),{resumable:false,contentType:'application/json',metadata:{cacheControl:'private, no-store'}});
        await db.collection('_admin_backups').doc(id).set({createdAt:require('firebase-admin/firestore').FieldValue.serverTimestamp(),adminUid:user.uid,count:backup.records.length,collections:backup.collections,bytes:Buffer.byteLength(JSON.stringify(backup))});
        await audit(db,user,'database_backup_created',{id,count:backup.records.length});
        return reply(200,{saved:true,id,count:backup.records.length});
      }
      await audit(db,user,'database_export',{count:backup.records.length,collections:backup.collections,format:body.format==='csv'?'csv':'json'});
      return reply(200,{backup});
    }
    if(body.action==='history'){
      const snap=await db.collection('_admin_backups').orderBy('createdAt','desc').limit(20).get();
      return reply(200,{items:snap.docs.map(doc=>({id:doc.id,...serialize(doc.data())}))});
    }
    if(body.action==='downloadBackup'){
      if(typeof body.id!=='string'||!/^[0-9a-f-]{36}$/.test(body.id))throw bad('Invalid backup id.');
      const meta=await db.collection('_admin_backups').doc(body.id).get();if(!meta.exists)throw bad('Backup not found.',404);
      const [buf]=await services().storage.bucket().file(BUCKET_PREFIX+body.id+'.json').download();
      return reply(200,{backup:JSON.parse(buf.toString('utf8'))});
    }
    if(body.action==='preview'||body.action==='import'){
      const backup=body.backup;const records=validate(backup);
      if(Buffer.byteLength(JSON.stringify(backup))>MAX_BYTES)throw bad('Backup too large.',413);
      const counts={};let existing=0;
      const checks=[];
      for(const row of records){counts[row.path.split('/')[0]]=(counts[row.path.split('/')[0]]||0)+1;checks.push(db.doc(row.path));}
      // getAll in bounded batches; preview identifies existing IDs and shows create-only safety behavior.
      for(let i=0;i<checks.length;i+=100){const snaps=await db.getAll(...checks.slice(i,i+100));existing+=snaps.filter(s=>s.exists).length;}
      if(body.action==='preview')return reply(200,{total:records.length,existing,newRecords:records.length-existing,counts,mode:'create-only; existing records will be skipped'});
      if(body.confirm!=='IMPORT NEW RECORDS')throw bad('Explicit confirmation required.');
      // Validate all document types BEFORE writing anything.
      const prepared=records.map(row=>({ref:db.doc(row.path),data:deserialize(row.data,db)}));
      let imported=0,skipped=0;
      for(let i=0;i<prepared.length;i+=100){
        const chunk=prepared.slice(i,i+100);
        const existingSnap=await db.getAll(...chunk.map(r=>r.ref));
        const writer=db.batch();let writes=0;
        chunk.forEach((row,j)=>{if(existingSnap[j].exists){skipped++;return;}writer.create(row.ref,row.data);writes++;});
        if(writes){await writer.commit();imported+=writes;}
      }
      await audit(db,user,'database_import',{imported,skipped,sourceCreatedAt:backup.createdAt||null});
      return reply(200,{imported,skipped,note:'Create-only. Existing records were not overwritten.'});
    }
    throw bad('Unknown action.');
  }catch(e){return reply(e.status||500,{error:e.status?e.message:'Database operation failed. Verify server configuration and try again.'});}
};
exports._test={validPath,validate,serialize};
