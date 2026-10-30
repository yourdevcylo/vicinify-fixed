/* A local, draggable launcher. Moving/minimizing it never sends an AI request. */
window.FloatingVici=(()=>{
 let host,button,minimized=false,position=null,drag=null,suppress=false;
 const key='vicinify_floating_ai';
 function save(){try{localStorage.setItem(key,JSON.stringify({position,minimized}));}catch{}}
 function place(x,y){const r=host.getBoundingClientRect(),v=window.visualViewport;const left=v?.offsetLeft||0,top=v?.offsetTop||0,width=v?.width||innerWidth,height=v?.height||innerHeight;position={x:Math.max(left+8,Math.min(x,left+width-r.width-8)),y:Math.max(top+8,Math.min(y,top+height-r.height-84))};host.style.left=position.x+'px';host.style.top=position.y+'px';}
 function collapse(value){minimized=value;host.classList.toggle('is-minimized',value);host.querySelector('.vici-float-restore').hidden=!value;host.querySelector('.vici-float-hide').hidden=value;button.hidden=value;button.classList.toggle('hidden',value);if(position)place(position.x,position.y);save();}
 function mount(btn){
  if(host){if(button!==btn){button=btn;host.prepend(btn);}collapse(minimized);return;}
  button=btn;btn.querySelectorAll('img').forEach(img=>img.draggable=false);host=document.createElement('div');host.id='viciFloatingDock';document.body.append(host);host.append(btn);
  host.insertAdjacentHTML('beforeend','<button type="button" class="vici-float-hide" aria-label="Hide floating AI" title="Hide floating AI">−</button><button type="button" class="vici-float-restore" aria-label="Restore floating AI" title="Restore floating AI" hidden>AI</button><button type="button" class="vici-float-move" aria-label="Move floating AI" title="Move floating AI">⠿</button>');
  try{const saved=JSON.parse(localStorage.getItem(key)||'null');minimized=saved?.minimized===true;if(Number.isFinite(saved?.position?.x)&&Number.isFinite(saved?.position?.y))position=saved.position;}catch{}
  host.querySelector('.vici-float-hide').onclick=()=>collapse(true);host.querySelector('.vici-float-restore').onclick=()=>collapse(false);
  host.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('.vici-float-hide,.vici-float-restore'))return;const r=host.getBoundingClientRect();drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:r.left,top:r.top,moved:false};});
  window.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>6)drag.moved=true;if(drag.moved){e.preventDefault();place(drag.left+dx,drag.top+dy);}});
  function end(e){if(!drag||e.pointerId!==drag.id)return;suppress=drag.moved;drag=null;save();setTimeout(()=>suppress=false,0);}
  window.addEventListener('pointerup',end);window.addEventListener('pointercancel',end);host.addEventListener('click',e=>{if(suppress){e.preventDefault();e.stopImmediatePropagation();}},true);
  host.querySelector('.vici-float-move').addEventListener('keydown',e=>{const step=e.shiftKey?40:12,delta={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]}[e.key];if(!delta)return;e.preventDefault();const r=host.getBoundingClientRect();place(r.left+delta[0],r.top+delta[1]);save();});
  const fit=()=>{if(position)place(position.x,position.y);};window.addEventListener('resize',fit);window.visualViewport?.addEventListener('resize',fit);
  place(position?.x??innerWidth-100,position?.y??innerHeight-180);collapse(minimized);window.LangManager?.translateDOM?.(undefined,host);
 }
 return {mount};
})();
