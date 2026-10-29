const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
test('list actions preserve untrusted names, use current render and do not trigger card navigation',()=>{
 const dom=new JSDOM('<div id="listViewContainer"></div>',{runScripts:'dangerously'}),w=dom.window;
 const source=fs.readFileSync(path.join(__dirname,'../js/common.js'),'utf8');
 const start=source.indexOf('window.renderListView = function(');
 const end=source.indexOf('\n};',start)+3;
 w.escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 w.safeImageUrl=()=>'';w.__injected=false;
 w.eval(source.slice(start,end));
 let calls=[],opened=[];
 w.openChatModal=(...args)=>calls.push(args);w.viewPlace=id=>opened.push(id);
 w.openBookingModal=(...args)=>calls.push(args);w.routeToPlace=(...args)=>calls.push(args);w.toggleFavorite=()=>{};
 const payload="Cafe &#39;);window.__injected=true;// <img src=x onerror=window.__injected=true>";
 w.renderListView([{id:'first',name:payload,status:'open',lat:14,lng:121}]);
 w.document.querySelector('[data-action="chat"]').click();
 assert.deepEqual(calls[0],['first',payload]);assert.equal(opened.length,0);assert.equal(w.__injected,false);
 w.renderListView([{id:'second',name:'Updated',lat:14,lng:121}]);
 w.document.querySelector('[data-action="booking"]').click();
 assert.deepEqual(calls[1],['second','Updated']);
 w.document.querySelector('[data-action="route"]').click();
 assert.deepEqual(calls[2],[14,121,'Updated']);
 w.document.querySelector('[data-place-card]').click();assert.deepEqual(opened,['second']);
 w.renderListView([]);assert.equal(w.document.querySelector('[data-place-card]'),null);
 dom.window.close();
});
test('remaining inline string helpers survive HTML parsing without executing user text',()=>{
 for(const name of ['map','settings','dashboard','buzz']){
  const source=fs.readFileSync(path.join(__dirname,'../js/'+name+'.js'),'utf8');
  const helper=source.match(/function (safeString|safeJsString)\(str\) \{[^\n]*\}/)[0];
  const dom=new JSDOM('<body></body>',{runScripts:'dangerously'}),w=dom.window;
  w.eval(helper);const encode=w.safeString||w.safeJsString;
  const payload="&#39;);window.__injected=true;//\n'\"\\<&";
  w.__injected=false;let received;w.receive=s=>received=s;
  w.document.body.innerHTML='<button onclick="receive(\''+encode(payload)+'\')">Test</button>';
  w.document.querySelector('button').click();
  assert.equal(received,payload);assert.equal(w.__injected,false);dom.window.close();
 }
});


function requestOutputRuntime(){
 const dom=new JSDOM('<main></main>',{runScripts:'outside-only'}),w=dom.window;
 w.escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const s=fs.readFileSync(path.join(__dirname,'../js/common.js'),'utf8'),a=s.indexOf('function renderRequestDetailRows(d) {');w.eval(s.slice(a,s.indexOf('\nfunction getCardSide(',a)));
 return{dom,w,render:d=>{w.document.querySelector('main').innerHTML=w.renderRequestDetailRows(d);return w.document.querySelector('main')}};
}
test('request output uses structured fields, hides empty defaults and avoids repeating order items as notes',()=>{
 const r=requestOutputRuntime();try{
  const main=r.render({bookingDate:'2026-10-30',bookingTime:'08:15',guestCount:1,seatingPreference:'No preference',occasion:'None',orderItems:'1x Meal\n2x Rice',bookingDetails:'1x Meal\n2x Rice'});
  assert.equal(main.querySelector('[data-request-field=date] time').getAttribute('datetime'),'2026-10-30');assert.match(main.querySelector('[data-request-field=time]').textContent,/8:15/);
  assert.equal(main.querySelector('[data-request-field=guests] dd').textContent,'1');assert.equal(main.querySelector('[data-request-field=seating]'),null);assert.equal(main.querySelector('[data-request-field=occasion]'),null);assert.equal(main.querySelector('[data-request-field=notes]'),null);
  assert.equal(main.querySelector('[data-request-field=items] dd').textContent,'1x Meal\n2x Rice');
 }finally{r.dom.window.close();}
});
test('legacy request text becomes the same labeled rows and all user content stays escaped',()=>{
 const r=requestOutputRuntime();try{
  const main=r.render({details:'Table Reservation Request\nDate: 2026-10-30\nTime: 08:15\nGuests: 2\nSeating: No preference\nOccasion: None\nNotes:\n<img src=x onerror=alert(1)>\nA quiet table.'});
  assert.equal(main.querySelector('img'),null);assert.equal(main.querySelector('[data-request-field=guests] dd').textContent,'2');assert.match(main.querySelector('[data-request-field=notes] dd').textContent,/<img/);assert.match(main.querySelector('[data-request-field=notes] dd').textContent,/A quiet table/);assert(!main.textContent.includes('No preference'));
  const fallback=r.render({details:'An old request with no labeled fields <script>bad</script>'});assert.equal(fallback.querySelector('script'),null);assert.match(fallback.textContent,/An old request/);
 }finally{r.dom.window.close();}
});
test('request labels and known choices translate while personal notes, items and address keep their original text',()=>{
 const r=requestOutputRuntime();try{
  r.w.LangManager={getLanguage:()=> 'ph',translateKey:s=>({Date:'Petsa',Time:'Oras',Payment:'Bayad','Cash on Pickup':'Salapi sa pagkuha',Notes:'Mga tala'})[s]||s};
  const main=r.render({bookingDate:'2026-10-30',bookingTime:'08:15',paymentMethod:'Cash on Pickup',bookingDetails:'Please reserve a table.',deliveryAddress:'English Street',orderItems:'Chicken Meal'});
  assert.equal(main.querySelector('[data-request-field=date] dt').textContent,'Petsa');assert.equal(main.querySelector('[data-request-field=payment] dd').textContent,'Salapi sa pagkuha');assert.equal(main.querySelector('[data-request-field=notes] dd').textContent,'Please reserve a table.');assert(main.querySelector('[data-request-field=notes] dd').hasAttribute('data-no-translate'));assert.equal(main.querySelector('[data-request-field=address] dd').textContent,'English Street');
 }finally{r.dom.window.close();}
});

test('sent request card keeps owner actions, shows one status and omits irrelevant payment content',()=>{
 const r=requestOutputRuntime();try{
  const {w}=r,s=fs.readFileSync(path.join(__dirname,'../js/common.js'),'utf8');let paymentCards=0;
  w.getRequestMeta=()=>({key:'table_reservation',shortLabel:'Table Reservation',light:'#eee'});w.getCardSide=()=> 'flex-start';w.renderBookingNextAction=()=>'';w.renderPaymentFlowCard=()=>{paymentCards++;return '<section class="payment-flow-card"></section>'};
  const a=s.indexOf('            if (d.type === "booking_card") {',s.indexOf('function listenToChatRoom')),b=s.indexOf('            if (d.type === "requirement_request") {',a);let block=s.slice(a,b);block=block.slice(block.indexOf('                const status'),block.lastIndexOf('                return;'));
  w.eval(`window.testCard=function(d,isOwner){const user={uid:'customer'},activeTransactionDocs=[],dateStr='8:16 AM';let html='';${block}return html;}`);
  const d={id:'message',bookingId:'order',placeName:'Real Shop',requestType:'table_reservation',bookingDate:'2026-10-30',bookingTime:'08:15',guestCount:1,status:'pending'};
  const main=w.document.querySelector('main');main.innerHTML=w.testCard(d,true);assert.equal(main.querySelectorAll('.request-output-grid').length,1);assert.equal(main.querySelectorAll('.request-output-header .status-badge').length,1);assert.equal(main.querySelectorAll('button').length,2);assert.match(main.textContent,/Accept Request/);assert.equal(paymentCards,0);
  main.innerHTML=w.testCard(d,false);assert.equal(main.querySelectorAll('button').length,0);assert.equal(paymentCards,0);
  main.innerHTML=w.testCard({...d,paymentMethod:'GCash'},false);assert.equal(paymentCards,1);assert(main.querySelector('.payment-flow-card'));
 }finally{r.dom.window.close();}
});

test('pinned transaction desk shows the next role action, agreed instructions and refund receipt separately',()=>{
 const r=requestOutputRuntime();try{
  const {w}=r;w.PaymentPolicy=require('../js/payment-policy');w.currentChatDocsCache=[];
  const s=fs.readFileSync(path.join(__dirname,'../js/common.js'),'utf8');w.eval(s.slice(s.indexOf('let chatDeskOrders ='),s.indexOf('function listenToChatRoom(')));
  const d={id:'order',bookingId:'order',status:'accepted',paymentMethod:'GCash',paymentFlowVersion:2};const main=w.document.querySelector('main');
  main.innerHTML=w.renderTransactionDesk(d,false,[d]);assert.equal(main.querySelector('[data-tx-action=proof]'),null);assert.match(main.textContent,/instructions first/);
  main.innerHTML=w.renderTransactionDesk(d,true,[d]);assert(main.querySelector('[data-tx-action=terms]'));
  const agreed={...d,paymentAmountDue:'500.00',paymentInstructions:'GCash <script>bad</script>'};main.innerHTML=w.renderTransactionDesk(agreed,false,[agreed]);assert(main.querySelector('[data-tx-action=proof]'));assert.equal(main.querySelector('script'),null);assert.match(main.textContent,/500.00/);
  main.innerHTML=w.renderTransactionDesk({...agreed,status:'payment_submitted',paymentAmount:'500.00',paymentReference:'REF123'},true);assert(main.querySelector('[data-tx-action=verify]'));assert(main.querySelector('[data-tx-action=decline]'));
  const refund={...agreed,status:'cancelled',refundStatus:'sent',refundBaseAmount:'500.00',refundPercent:70,refundAmount:'350.00',refundReference:'RETURN123'};main.innerHTML=w.renderTransactionDesk(refund,false);assert(main.querySelector('[data-tx-action=refund-receive]'));assert.match(main.textContent,/350.00/);assert.match(main.textContent,/500.00 × 70%/);
  main.innerHTML=w.renderTransactionDesk(refund,true);assert.equal(main.querySelector('[data-tx-action=refund-receive]'),null);
 }finally{r.dom.window.close();}
});
test('legacy requirement confirmation no longer displays a second independent payment confirmation status',()=>{
 const r=requestOutputRuntime();try{
  const {w}=r,s=fs.readFileSync(path.join(__dirname,'../js/common.js'),'utf8'),a=s.indexOf('function renderRequirementResponseDetails(');w.eval(s.slice(a,s.indexOf('// ---- Message receipts',a)));
  const html=w.renderRequirementResponseDetails({requirements:{payment:true},paymentMethod:'GCash',paymentAmount:'500',paymentReference:'REF123',paymentStatus:'pending_confirmation'},false,'8:19 AM');assert.match(html,/Earlier payment details/);assert.match(html,/transaction summary/);assert(!html.includes('Waiting for Business Confirmation'));assert(!html.includes('makeBadge'));
 }finally{r.dom.window.close();}
});

test('delivery summary requests the address first rather than asking for payment or preparation',()=>{
 const r=requestOutputRuntime();try{
  const {w}=r;w.PaymentPolicy=require('../js/payment-policy');w.currentChatDocsCache=[];const s=fs.readFileSync(path.join(__dirname,'../js/common.js'),'utf8');w.eval(s.slice(s.indexOf('let chatDeskOrders ='),s.indexOf('function listenToChatRoom(')));
  const d={id:'order',status:'accepted',paymentFlowVersion:2,requestType:'delivery_order',paymentMethod:'GCash'};const main=w.document.querySelector('main');main.innerHTML=w.renderTransactionDesk(d,false);assert(main.querySelector('[data-tx-action=delivery-details]'));assert.equal(main.querySelector('[data-tx-action=proof]'),null);
  main.innerHTML=w.renderTransactionDesk(d,true);assert.equal(main.querySelector('[data-tx-action=terms]'),null);assert.equal(main.querySelector('[data-tx-action=prepare]'),null);
 }finally{r.dom.window.close();}
});

test('requirements and request progress stay in the desk with separate customer and owner actions',()=>{
 const r=requestOutputRuntime();try{
  const {w}=r;w.PaymentPolicy=require('../js/payment-policy');w.currentChatDocsCache=[];const s=fs.readFileSync(path.join(__dirname,'../js/common.js'),'utf8');w.eval(s.slice(s.indexOf('let chatDeskOrders ='),s.indexOf('function listenToChatRoom(')));
  const d={id:'order',status:'accepted',paymentFlowVersion:2,paymentMethod:'GCash',requirementsState:{requestId:'req',status:'waiting_customer',required:{address:true,location:true},notes:'Gate details please.',data:{}}},main=w.document.querySelector('main');
  main.innerHTML=w.renderTransactionDesk(d,false);assert.equal(main.querySelectorAll('.transaction-process li').length,6);assert.match(main.querySelector('[aria-current=step]').textContent,/Requirements/);assert(main.querySelector('[data-tx-action=requirements-submit]'));assert(main.querySelector('.transaction-requirements'));assert.match(main.textContent,/0\/2/);assert.equal(main.querySelector('[data-tx-action=proof]'),null);
  const submitted={...d,requirementsState:{...d.requirementsState,status:'submitted',responseId:'resp',data:{houseStreet:'10 Test',city:'Lipa',barangay:'West',landmark:'<img src=x>',lat:14,lng:121}}};main.innerHTML=w.renderTransactionDesk(submitted,true);assert(main.querySelector('[data-tx-action=requirements-confirm]'));assert(main.querySelector('[data-tx-action=requirements-waive]'));assert.match(main.textContent,/2\/2 Submitted/);assert.equal(main.querySelector('img'),null);assert.equal(main.querySelector('[data-tx-action=prepare]'),null);
  main.innerHTML=w.renderTransactionDesk({...d,status:'cancelled',refundStatus:'not_required'},false);assert.equal(main.querySelector('.transaction-process'),null);
 }finally{r.dom.window.close();}
});


test('normal chat updates preserve the pinned requirements panel and expanded details',()=>{
 const r=requestOutputRuntime();try{
  const {w}=r;w.PaymentPolicy=require('../js/payment-policy');w.currentChatDocsCache=[];w.debouncedIcons=()=>{};
  w.document.querySelector('main').innerHTML='<section id="chatTransactionSummary"></section>';
  const s=fs.readFileSync(path.join(__dirname,'../js/common.js'),'utf8');w.eval(s.slice(s.indexOf('let chatDeskOrders ='),s.indexOf('function listenToChatRoom('))+'\nwindow.setDeskData=d=>{chatDeskOrders=[d];refreshTransactionDesk(false)};');
  const d={id:'order',status:'accepted',requirementsState:{requestId:'req',status:'waiting_customer',required:{address:true},data:{}}};w.setDeskData(d);
  const panel=w.document.getElementById('chatTransactionSummary'),requirements=panel.querySelector('.transaction-requirements');requirements.open=true;const action=panel.querySelector('[data-tx-action=requirements-submit]');action.focus();
  w.setDeskData(d);assert.equal(panel.querySelector('.transaction-requirements'),requirements);assert.equal(w.document.activeElement,action);
  w.setDeskData({...d,requirementsState:{...d.requirementsState,status:'submitted',responseId:'response',data:{houseStreet:'10 Street'}}});assert.equal(panel.querySelector('.transaction-requirements').open,true);
 }finally{r.dom.window.close();}
});

test('admin dropdown preserves completed and payment states instead of defaulting to pending',()=>{
 const dom=new JSDOM('<select></select>',{runScripts:'outside-only'}),w=dom.window;
 try{w.escapeHtml=s=>String(s).replace(/"/g,'&quot;').replace(/</g,'&lt;');const s=fs.readFileSync(path.join(__dirname,'../js/dashboard.js'),'utf8'),a=s.indexOf('    function adminBookingStatusOptions(');w.eval(s.slice(a,s.indexOf('    async function loadAdminBookings()',a)));
 for(const status of ['pending','accepted','rejected','fulfilled','received','cancelled','payment_submitted','payment_confirmed','ready','out_for_delivery','delivered','legacy_completed']){const select=w.document.querySelector('select');select.innerHTML=w.adminBookingStatusOptions(status);assert.equal(select.value,status);}
 }finally{w.close()}
});

test('navigation fades changed pages without delaying activation and respects reduced motion',()=>{
 const {JSDOM}=require('jsdom');const dom=new JSDOM('<section id="page-map" class="page active"></section><section id="page-place" class="page"></section>',{runScripts:'outside-only'}),w=dom.window;
 const source=require('fs').readFileSync(require.resolve('../js/common.js'),'utf8');let calls=0,cancelled=0,reduced=false;
 w.AppState={activePage:'page-map'};w.applyViciPageScrollState=()=>{};w.resetViciPageScroll=()=>{};w.requestAnimationFrame=()=>{};w.setTimeout=()=>{};w.matchMedia=()=>({matches:reduced});
 w.document.getElementById('page-place').animate=(frames,options)=>{calls++;assert.equal(options.duration,160);assert.deepEqual(Array.from(frames,f=>f.opacity),[.35,1]);return{cancel(){cancelled++;}}};
 w.eval(source.slice(source.indexOf('function showPage(pageId)'),source.indexOf('function initNav()')));
 w.showPage('page-place');assert(w.document.getElementById('page-place').classList.contains('active'));assert.equal(calls,1);
 w.showPage('page-place');assert.equal(calls,1);assert.equal(cancelled,1);
 reduced=true;w.AppState.activePage='page-map';w.showPage('page-place');assert.equal(calls,1);dom.window.close();
});
test('logout clears login/settings passwords and email and resets password visibility',()=>{const {JSDOM}=require('jsdom');const dom=new JSDOM('<input id="loginEmail"><input id="loginPass" type="text"><input id="settingsCurrentPass"><input id="settingsNewPass"><input id="settingsConfirmPass"><button id="togglePassBtn" aria-pressed="true"></button><i id="eyeIcon"></i>',{runScripts:'outside-only'}),w=dom.window;for(const field of w.document.querySelectorAll('input')){field.value='Sensitive';field.defaultValue='Sensitive';}const source=fs.readFileSync(require.resolve('../js/common.js'),'utf8');w.eval(source.slice(source.indexOf('window.clearAccountCredentials ='),source.indexOf("window.addEventListener('pageshow'")));w.clearAccountCredentials();for(const field of w.document.querySelectorAll('input')){assert.equal(field.value,'');assert.equal(field.defaultValue,'');}assert.equal(w.document.getElementById('loginPass').type,'password');assert.equal(w.document.getElementById('togglePassBtn').getAttribute('aria-pressed'),'false');dom.window.close();});
