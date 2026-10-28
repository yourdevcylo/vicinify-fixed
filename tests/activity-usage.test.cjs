const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom');
function activity(){
 const dom=new JSDOM('<section id="customerActivitySection"><button class="cust-tab active" data-custtab="chats"></button><div id="myBookingsList"></div><div id="myChatsList"></div><div id="myFavoritesList"></div><div id="mySukiCardsList"></div></section>',{runScripts:'outside-only'}),w=dom.window,calls=[];
 const user={uid:'customer'},empty={empty:true,docs:[]};
 const messages={empty:false,docs:[{id:'text',data:()=>({placeId:'shop',placeName:'Wrong cached name',senderUid:'owner',type:'text',text:'Our menu is available.',createdAt:{toMillis:()=>1,toDate:()=>new Date(1)}})}]};
 w.auth={currentUser:user};w.AppState={user,userProfile:{fullName:'Customer'}};w.setNotifBadge=()=>{};w.isCustomerUnreadMessage=()=>true;w.isCustomerUnreadTransaction=()=>false;
 w.MapPage={getCachedPlace:()=>({name:'Neighborhood Café'})};w.markDocsCustomerRead=async()=>{};
 w.db={collection:name=>({where(){return this},limit(){return this},onSnapshot(next){calls.push(name);next(empty);return()=>{};}})};
 w.ViciData={customerFeed(name,uid,next){calls.push(name);next(name==='messages'?messages:empty);return()=>{};},sukiFeed(uid,next){calls.push('suki');next(empty);return()=>{};}};
 w.eval(fs.readFileSync(require.resolve('../js/settings.js'),'utf8'));
 return{dom,w,calls};
}
test('My Activity starts optional feeds only when their tabs are opened',()=>{
 const r=activity();try{
  r.w.SettingsPage.startCustomerActivity();assert.deepEqual(r.calls,['bookings','messages']);
  r.w.document.querySelector('.cust-tab').dataset.custtab='favorites';r.w.SettingsPage.startCustomerActivity();r.w.SettingsPage.startCustomerActivity();assert.equal(r.calls.filter(x=>x==='favorites').length,1);
  r.w.document.querySelector('.cust-tab').dataset.custtab='suki';r.w.SettingsPage.startCustomerActivity();r.w.SettingsPage.startCustomerActivity();assert.equal(r.calls.filter(x=>x==='suki').length,1);
 }finally{r.dom.window.close();}
});
test('chat rows use cached establishment name, correct sender label and separate actions',()=>{
 const r=activity();try{
  r.w.SettingsPage.startCustomerActivity();const d=r.w.document,row=d.querySelector('.activity-thread');
  assert.equal(row.querySelector('strong').textContent,'Neighborhood Café');assert.match(row.textContent,/Business: Our menu/);assert(!row.textContent.includes('undefined'));
  assert.equal(row.querySelectorAll('button').length,2);assert.equal(row.querySelector('button button'),null);
  const opened=[];r.w.openChatModal=(...args)=>opened.push(args);r.w.eval(row.querySelector('.activity-thread-open').getAttribute('onclick'));assert.equal(opened[0][0],'shop');assert.equal(opened[0][1],'Neighborhood Café');
 }finally{r.dom.window.close();}
});
test('Suki subscribers share one underlying query and release it after the last consumer',async()=>{
 const dom=new JSDOM('<body></body>',{runScripts:'outside-only'}),w=dom.window;let starts=0,stops=0;
 w.db={collection:()=>({where(){return this},limit(){return this},onSnapshot(){starts++;return()=>stops++;}})};
 w.eval(fs.readFileSync(require.resolve('../js/data.js'),'utf8'));
 const a=w.ViciData.sukiFeed('customer',()=>{}),b=w.ViciData.sukiFeed('customer',()=>{});
 assert.equal(starts,1);a();assert.equal(stops,0);b();assert.equal(stops,1);dom.window.close();
});
