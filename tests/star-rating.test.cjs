const test=require('node:test'),assert=require('node:assert/strict');
const {memory}=require('./helpers/memory-admin.cjs');
test('star ratings need no booking, replace the customer score and cannot submit written feedback',async()=>{
 const helpers=require('../netlify/functions/lib/admin'),old={...helpers},state=memory({'places/shop':{owner_uid:'owner',approval_status:'approved'}});let actor='customer';
 helpers.authenticate=async()=>({uid:actor});helpers.limit=async()=>{};helpers.services=()=>state;
 try{
 delete require.cache[require.resolve('../netlify/functions/review')];const {handler}=require('../netlify/functions/review');
 const call=patch=>handler({httpMethod:'POST',body:JSON.stringify({action:'rate',placeId:'shop',rating:5,...patch})});
 assert.equal((await call({})).statusCode,200);
 assert.equal((await call({rating:3})).statusCode,200);
 assert.equal(state.rows.get('places/shop').ratingCount,1);assert.equal(state.rows.get('places/shop').ratingSum,3);
 actor='second';assert.equal((await call({rating:5})).statusCode,200);assert.equal(state.rows.get('places/shop').ratingCount,2);assert.equal(state.rows.get('places/shop').avgRating,4);
 assert.equal((await call({feedback:'Not allowed'})).statusCode,400);
 assert.equal((await call({action:'feedback',feedback:'Written review'})).statusCode,403);
 actor='owner';assert.equal((await call({})).statusCode,403);
 assert.equal(state.rows.get('reviews/customer_shop').isPublic,false);
 }finally{Object.assign(helpers,old);delete require.cache[require.resolve('../netlify/functions/review')];}
});
