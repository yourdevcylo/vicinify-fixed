const crypto=require('node:crypto');
async function migrateAssets(storage,placeId,oldUid,data){
 const bucket=storage.bucket(),cache=new Map();
 async function move(value){
  if(typeof value!=='string')return value;if(cache.has(value))return cache.get(value);
  let url;try{url=new URL(value);}catch{return value;}
  if(url.hostname!=='firebasestorage.googleapis.com')return value;
  const match=url.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);if(!match||decodeURIComponent(match[1])!==bucket.name)return value;
  const source=decodeURIComponent(match[2]);if(!source.startsWith(`places/${oldUid}/`)&&!source.startsWith(`buzz_posts/${oldUid}/`))return value;
  const destination=`place_assets/${placeId}/${crypto.createHash('sha256').update(source).digest('hex')}`;const file=bucket.file(destination);let metadata;
  try{[metadata]=await file.getMetadata();}catch(error){if(error.code!==404)throw error;await bucket.file(source).copy(file);const token=crypto.randomUUID();[metadata]=await file.setMetadata({metadata:{firebaseStorageDownloadTokens:token}});}
  const token=metadata.metadata?.firebaseStorageDownloadTokens;if(!token)throw Error('Transferred image has no download token.');
  const result=`https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket.name)}/o/${encodeURIComponent(destination)}?alt=media&token=${encodeURIComponent(token.split(',')[0])}`;cache.set(value,result);return result;
 }
 const result={};for(const key of ['coverPhoto','logo','logoURL','logoUrl','brand_logo','brandLogo','profileLogo','avatarUrl'])if(data[key])result[key]=await move(data[key]);
 if(Array.isArray(data.photos))result.photos=await Promise.all(data.photos.map(move));return result;
}
module.exports={migrateAssets};
