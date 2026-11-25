'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),Module=require('node:module'),path=require('node:path');
const docs=new Map();let actor={uid:'customerA',email:'owner@example.com',email_verified:true},authUser={email:'owner@example.com',emailVerified:true,disabled:false};
const stamp=()=>new Date('2026-11-23T00:00:00Z');
const FieldValue={serverTimestamp:stamp};
const clone=v=>v===undefined?undefined:structuredClone(v);
function ref(collection,id){
 const key=`${collection}/${id}`;
 return {id,key,async get(){return snapshot(key);},async set(data,opts={}){docs.set(key,opts.merge?{...(docs.get(key)||{}),...clone(data)}:clone(data));},async update(data){docs.set(key,{...(docs.get(key)||{}),...clone(data)});}};
}
function snapshot(key){const value=docs.get(key);return {id:key.split('/').pop(),exists:value!==undefined,data:()=>clone(value)};}
const db={collection(name){return {doc(id=String(docs.size)){return ref(name,id);},limit(){return {async get(){return {docs:[...docs.keys()].filter(k=>k.startsWith(name+'/')).map(k=>snapshot(k))}}}},};},async runTransaction(fn){const tx={get:r=>r.get(),set:(r,data,options)=>r.set(data,options),update:(r,data)=>r.update(data),create:(r,data)=>{if(docs.has(r.key))throw Error('exists');return r.set(data)}};return fn(tx);},batch(){const actions=[];return {create:(r,v)=>actions.push(()=>r.set(v)),set:(r,v)=>actions.push(()=>r.set(v)),async commit(){for(const f of actions)await f();}};}};
const fake={services:()=>({db,auth:{getUser:async(uid)=>({...authUser,uid})}}),authenticate:async()=>actor,limit:async()=>{},reply:(statusCode,body)=>({statusCode,body:JSON.stringify(body)})};
const nativeLoad=Module._load;
Module._load=function(request,parent,...args){if(request==='./lib/admin'&&parent?.filename?.includes('/netlify/functions/'))return fake;if(request==='firebase-admin/firestore')return {FieldValue};return nativeLoad.call(this,request,parent,...args);};
const registration=require('../netlify/functions/businessRegistration.js');
const publishing=require('../netlify/functions/businessPlace.js');
Module._load=nativeLoad;
const details={legalName:'Kusina Lipa Foods',tradeName:'Kusina Lipa',registrationType:'sole_proprietorship',registrationNumber:'REG-123',permitNumber:'PERMIT-123',permitExpiry:'2099-12-31',representativeName:'Test Owner',contactNumber:'09123456789',representativeRole:'owner',barangay:'Sabang',address:'Lipa City, Batangas'};
const payload=(action,extra={})=>({httpMethod:'POST',body:JSON.stringify({action,...extra})});
const parse=async(fn,e)=>{const resp=await fn.handler(e);return {httpStatus:resp.statusCode,...JSON.parse(resp.body)};};
test('Business registration requires valid type and rejects expired permit',()=>{assert.equal(registration._test.validateDetails(details).city,'Lipa City');assert.throws(()=>registration._test.validateDetails({...details,permitExpiry:'2001-01-01'}));assert.throws(()=>registration._test.validateDetails({...details,registrationType:'unregistered'}));});
test('Business files reject fake type and oversized content',()=>{assert.throws(()=>registration._test.decodeFile({mimeType:'image/png',base64:Buffer.from('Hello').toString('base64')}));assert.throws(()=>registration._test.decodeFile({mimeType:'image/svg+xml',base64:Buffer.from('<svg/>').toString('base64')}));const x=registration._test.decodeFile({mimeType:'application/pdf',base64:Buffer.from('%PDF-1.4\nmock').toString('base64'),filename:'permit.pdf'});assert.equal(x.mimeType,'application/pdf');});
test('Draft can be saved, document uploaded, then pending after all requirements',async()=>{
 actor={uid:'customerA',email:'owner@example.com',email_verified:true};
 assert.equal((await parse(registration,payload('save',{details}))).httpStatus,200);
 for(const kind of ['mayor_permit','registration_certificate','barangay_clearance']){
  const uploaded=await parse(registration,payload('upload',{kind,mimeType:'application/pdf',base64:Buffer.from('%PDF-1.4\nfile').toString('base64'),filename:kind+'.pdf'}));assert.equal(uploaded.httpStatus,200);
 }
 const response=await parse(registration,payload('submit',{details,agreed:true}));assert.equal(response.httpStatus,200);
 assert.equal(docs.get('business_applications/customerA').status,'pending');
});
test('Applicant cannot approve self or list applications',async()=>{
 assert.equal((await parse(registration,payload('approve',{uid:'customerA'}))).httpStatus,403);
 assert.equal((await parse(registration,payload('list'))).httpStatus,403);
});
test('Admin approval grants business role, verified business and writes audit',async()=>{
 docs.set('users/customerA',{uid:'customerA',role:'user'});
 docs.set('users/adminA',{uid:'adminA',role:'admin'});
 actor={uid:'adminA',email:'admin@example.com'};
 const response=await parse(registration,payload('approve',{uid:'customerA',remarks:''}));
 assert.equal(response.httpStatus,200);
 assert.equal(docs.get('users/customerA').role,'business');
 assert.equal(docs.get('verified_businesses/customerA').status,'active');
 assert.equal(docs.get('business_applications/customerA').status,'approved');
});
test('Admin cannot approve same application twice',async()=>{assert.equal((await parse(registration,payload('approve',{uid:'customerA'}))).httpStatus,409);});
test('Approved applicant cannot upload or resubmit permits',async()=>{
 actor={uid:'customerA',email:'owner@example.com'};
 const r=await parse(registration,payload('upload',{kind:'mayor_permit',filename:'another.pdf',mimeType:'application/pdf',base64:Buffer.from('%PDF-1.4\nfile').toString('base64')}));assert.equal(r.httpStatus,409);
 assert.equal((await parse(registration,payload('submit',{details,agreed:true}))).httpStatus,409);
});
test('Applicant can read own private permit but another user cannot',async()=>{
 const own=await parse(registration,payload('document',{uid:'customerA',kind:'mayor_permit'}));assert.equal(own.httpStatus,200);
 actor={uid:'stranger',email:'stranger@example.com'};
 const other=await parse(registration,payload('document',{uid:'customerA',kind:'mayor_permit'}));assert.equal(other.httpStatus,403);
});
const place={name:'Kusina Lipa',description:'Authentic Filipino food in Lipa.',address:'Sabang, Lipa City',barangay:'Sabang',contact_phone:'09123456789',category:'restaurant',categories:['restaurant','cafe'],lat:13.943,lng:121.167,photos:[],logoUrl:'',priceRange:'Under ₱150',place_features:{accessibility:['wheelchair_entrance'],services:['dine_in']}};
test('Business publication validator rejects too many and fake categories',()=>{
 assert.equal(publishing._test.validatePlace(place).place_features.accessibility[0],'wheelchair_entrance');
 assert.throws(()=>publishing._test.validatePlace({...place,categories:['restaurant','cafe','bakery','milktea']}));
 assert.throws(()=>publishing._test.validatePlace({...place,category:'cafe',categories:['restaurant']}));
 assert.throws(()=>publishing._test.validatePlace({...place,barangay:'Unknown City'}));
});
test('Unapproved account cannot directly publish',async()=>{
 actor={uid:'stranger',email:'stranger@example.com'};
 assert.equal((await parse(publishing,payload('publish',{place}))).httpStatus,403);
});
test('Approved owner can publish directly and owner UID/email are server-derived',async()=>{
 actor={uid:'customerA',email:'owner@example.com'};
 const result=await parse(publishing,payload('publish',{place:{...place,owner_uid:'evil',owner_email:'evil@example.com',approval_status:'rejected'}}));
 assert.equal(result.httpStatus,200);
 const record=docs.get('places/'+result.placeId);
 assert.equal(record.owner_uid,'customerA');assert.equal(record.approval_status,'approved');
 assert.equal(docs.get('private_places/'+result.placeId).owner_email,'owner@example.com');
});
test('Suspended verified business cannot publish',async()=>{
 docs.set('verified_businesses/customerA',{...docs.get('verified_businesses/customerA'),status:'suspended'});
 assert.equal((await parse(publishing,payload('publish',{place}))).httpStatus,403);
});
