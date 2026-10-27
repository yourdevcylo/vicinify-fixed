const {test}=require('node:test'),assert=require('node:assert/strict');
test('private endpoints reject requests with no bearer token before any database access',async()=>{
 for(const name of ['booking','proof','review','adminSummary']){
  const handler=require('../netlify/functions/'+name).handler;
  const response=await handler({httpMethod:'POST',headers:{},body:'{}'});
  assert.equal(response.statusCode,401,name);
  assert.equal((await handler({httpMethod:'GET',headers:{}})).statusCode,405,name);
 }
 const old=process.env.GEMINI_API_KEY;process.env.GEMINI_API_KEY='unit-test-no-network';
 try{assert.equal((await require('../netlify/functions/askVici').handler({httpMethod:'POST',headers:{},body:'{}'})).statusCode,401);}
 finally{if(old===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=old;}
});
test('catalog shares concurrent work, projects public fields and serializes timestamps',async()=>{
 const helpers=require('../netlify/functions/lib/admin'),old=helpers.services;
 let reads=0,projection;
 const query={where(){return this;},select(...fields){projection=fields;return this;},limit(n){assert.equal(n,2001);return this;},
  async get(){reads++;await Promise.resolve();return{size:1,docs:[{id:'real-id',data:()=>({id:'spoof',name:'Cafe',updatedAt:{toDate:()=>new Date('2026-10-26T00:00:00Z')}})}]};}};
 helpers.services=()=>({db:{collection:name=>{assert.equal(name,'places');return query;}}});
 try{
  delete require.cache[require.resolve('../netlify/functions/lib/catalog')];
  const {catalog}=require('../netlify/functions/lib/catalog');
  const results=await Promise.all([catalog(),catalog()]);
  assert.equal(reads,1);assert.equal(results[0].places[0].id,'real-id');
  assert.equal(results[0].places[0].updatedAt,'2026-10-26T00:00:00.000Z');
  assert.ok(!projection.includes('owner_email'));assert.ok(projection.includes('refund_percent'));
  await catalog();assert.equal(reads,1);
 }finally{helpers.services=old;delete require.cache[require.resolve('../netlify/functions/lib/catalog')];}
});

