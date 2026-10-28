const fs=require('node:fs'),path=require('node:path');
const out=path.join(__dirname,'dist');
// Start from the source allowlist so stale assets cannot leak into a deploy or its cache version.
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});
// Publish only this allowlist; never publish server credentials, tests, logs or dependencies.
for(const name of ['index.html','update.html','manifest.json','sw.js','notif.mp3','css','js','icons','logo-options']){
 const source=path.join(__dirname,name);
 if(!fs.existsSync(source))throw new Error('Required asset missing: '+name);
 fs.cpSync(source,path.join(out,name),{recursive:true});
}
// Fingerprint every deployed client asset so changed ZIPs get a fresh cache automatically.
const crypto=require('node:crypto');
const digest=crypto.createHash('sha256');
function hashTree(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const file=path.join(dir,entry.name);if(entry.isDirectory())hashTree(file);else{digest.update(path.relative(out,file));digest.update(fs.readFileSync(file));}}}
hashTree(out);
const version='VICI_'+digest.digest('hex').slice(0,16);
for(const name of ['index.html','update.html','sw.js']){
 const file=path.join(out,name);let text=fs.readFileSync(file,'utf8');
 text=text.replace(/VICINIFY_GREEN_EDITOR_20261029/g,version);
 if(name==='sw.js')text=text.replace(/const CACHE_NAME = "[^"]+";/,'const CACHE_NAME = "vicinify-ui-'+version+'";');
 fs.writeFileSync(file,text);
}
console.log('Static assets built in dist/. Netlify functions deploy separately.');

