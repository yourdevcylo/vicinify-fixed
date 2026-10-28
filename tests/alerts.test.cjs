const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom');
function runtime(){
 const dom=new JSDOM('<body class="vicinify-ui"><button id="opener">Open</button></body>',{runScripts:'outside-only'}),w=dom.window,s=fs.readFileSync(require.resolve('../js/common.js'),'utf8');
 w.eval(s.slice(s.indexOf('window.__nativeAlert ='),s.indexOf('// ---------- Firestore quota guard')));
 let locks=0;w.lockBodyScroll=on=>locks+=on?1:-1;
 const notify=s.indexOf('window.vicinifyNotify = function(');w.eval(s.slice(notify,s.indexOf('\n};',notify)+3));
 const start=s.indexOf('window.vConfirm = function(');w.eval(s.slice(start,s.indexOf('\n};',start)+3));
 return{dom,w,locks:()=>locks};
}
test('duplicate notices share one card, queue is bounded and user text is escaped',()=>{
 const r=runtime();try{const {w}=r;const a=w.vicinifyToast('Post published.','success'),b=w.vicinifyToast('Post published.','success');assert.equal(a,b);assert.equal(w.document.querySelectorAll('.v-toast').length,1);
 w.vicinifyToast('<img src=x onerror=alert(1)>','info');assert.equal(w.document.querySelector('.v-toast-text img'),null);w.vicinifyToast('Try again','error');assert.equal(w.document.querySelectorAll('.v-toast').length,2);assert.equal(w.document.querySelector('.v-toast-error').getAttribute('role'),'alert');
 }finally{r.dom.window.close();}
});
test('confirmations trap keyboard focus, cancel with Escape and restore the opener',async()=>{
 const r=runtime();try{const {w}=r,d=w.document;d.getElementById('opener').focus();let leaked=0;d.addEventListener('keydown',()=>leaked++);
 const answer=w.vConfirm('Delete post?','This action removes the post.','Delete',true),modal=d.querySelector('[role="alertdialog"]'),buttons=modal.querySelectorAll('button');assert.equal(r.locks(),1);assert.equal(d.activeElement,buttons[0]);
 d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true}));assert.equal(d.activeElement,buttons[1]);
 d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));assert.equal(await answer,false);assert.equal(r.locks(),0);assert.equal(d.activeElement.id,'opener');assert.equal(leaked,1);
 }finally{r.dom.window.close();}
});
test('same-time nested confirmations get unique ids and close only the top dialog',async()=>{
 const r=runtime();try{const {w}=r,d=w.document;w.Date.now=()=>1234;const first=w.vConfirm('First','First action'),second=w.vConfirm('Second','Second action');const modals=[...d.querySelectorAll('[role="alertdialog"]')];assert.equal(modals.length,2);assert.notEqual(modals[0].id,modals[1].id);
 d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));assert.equal(await second,false);assert.equal(d.querySelectorAll('[role="alertdialog"]').length,1);assert.equal(r.locks(),1);d.querySelector('[id^="confirmBtn_"]').click();assert.equal(await first,true);assert.equal(r.locks(),0);
 }finally{r.dom.window.close();}
});

test('live notifications use the shared queue and keep titles and messages as text',()=>{
 const r=runtime();try{const notice=r.w.vicinifyNotify('New message','<script>hello</script>');assert.equal(notice.querySelector('.v-toast-title').textContent,'New message');assert.equal(notice.querySelector('script'),null);assert.equal(r.w.document.getElementById('v-notify-host'),null);assert.equal(r.w.vicinifyNotify('New message','<script>hello</script>'),notice);}finally{r.dom.window.close();}
});
