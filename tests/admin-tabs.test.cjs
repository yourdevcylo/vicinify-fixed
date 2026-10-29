const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
test('admin panels are siblings and each selected tab remains visible',async()=>{
 const s=fs.readFileSync('js/dashboard.js','utf8'),dom=new JSDOM('<body><section id="adminReviewCard"><div id="pendingList"></div></section></body>',{runScripts:'outside-only'}),w=dom.window;
 const snap={empty:true,size:0,forEach(){}};
 w.db={collection:()=>({limit(){return this},orderBy(){return this},get:async()=>snap})};w.ViciData={command:async()=>({totalPlaces:0,pendingApprovals:0,totalBusinessOwners:0})};
 w.eval('const getRole=()=>"admin";let adminSnapCache=null,adminSnapAt=0;const adminData={};const escapeHtml=s=>String(s);'+s.slice(s.indexOf('    async function renderAdmin()'),s.indexOf('    async function loadAdminUsers()'))+';window.renderAdmin=renderAdmin;');
 await w.renderAdmin();
 const panels=[...w.document.querySelectorAll('[id^="biz-panel-admin-"]')];assert.equal(panels.length,8);
 for(const panel of panels){assert.equal(panel.parentElement.id,'pendingList');assert.equal(panel.closest('#adminFilterPopover'),null);}
 const handler=s.slice(s.indexOf('        document.body.addEventListener("click", (e) => {'),s.indexOf('\n    });\n\n    function stopAllListeners'));
 w.eval(handler);
 for(const button of w.document.querySelectorAll('[data-biztab]')){button.click();const visible=panels.filter(p=>p.classList.contains('active')&&!p.classList.contains('hidden'));assert.equal(visible.length,1);assert.equal(visible[0].id,'biz-panel-'+button.dataset.biztab);assert(!visible[0].parentElement.closest('.hidden'));}
 for(const group of ['category','is_verified','accepts_booking','approval_status'])assert(w.document.getElementById('fgroup-'+group));
 dom.window.close();
});
