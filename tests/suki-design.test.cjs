const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function renderer(){const w={};const source=fs.readFileSync(require.resolve('../js/common.js'),'utf8');vm.runInNewContext(source.slice(source.indexOf('window.SukiDesign =')),{window:w});return w;}
test('Suki styles retain custom artwork and keep completion/claim actions distinct',()=>{
 const w=renderer(),place={name:'Cafe',suki_stamp_count:8,suki_color:'#394455',suki_reward:'Free coffee'};
 const html=w.Suki.renderCard(place,{cardId:'card',stamps:8});assert(html.includes('background:#394455'));assert(html.includes('data-suki-claim="card"'));assert(html.includes('Reward ready'));assert(!html.includes('linear-gradient(135deg,#7c5a00'));
 assert(!w.Suki.renderCard(place,{cardId:'card',stamps:8,claimed:true}).includes('data-suki-claim='));
 assert(!w.Suki.renderCard(place,{cardId:'card',stamps:8,claimRequested:true}).includes('data-suki-claim='));
 assert(!w.Suki.renderCard(place,{cardId:'card',stamps:8},{hideActions:true}).includes('data-suki-claim='));
});
test('stamp layout grows to 24 slots without negative remaining counts or unsafe CSS',()=>{
 const w=renderer(),html=w.Suki.renderCard({name:'Shop',suki_stamp_count:24,suki_color:'red;background-image:url(https://evil.test)',suki_pattern:'none extra',suki_reward:'Reward'},{stamps:99});
 assert.equal((html.match(/class="suki-slot /g)||[]).length,24);assert(html.includes('24 / 24'));assert(!html.includes('evil.test'));assert(!html.includes('suki-pattern-none extra'));assert(html.includes('data-stamp-count="24"'));assert(!html.includes('-75 more'));
});
test('new card styles coexist with the existing template choices',()=>{
 const w=renderer();for(const id of ['forest','linen','kraft','minimal','midnight','pastel','ginto','custom'])assert(w.SukiDesign.TEMPLATES[id],id);
 const html=w.Suki.renderCard({name:'<img onerror=alert(1)>',suki_reward:'<script>no</script>'},{stamps:1});assert(!html.includes('<img'));assert(!html.includes('<script>'));assert(html.includes('&lt;img'));
});
