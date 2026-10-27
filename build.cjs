const fs=require('node:fs'),path=require('node:path');
const out=path.join(__dirname,'dist');
fs.mkdirSync(out,{recursive:true});
// Publish only this allowlist; never publish server credentials, tests, logs or dependencies.
for(const name of ['index.html','manifest.json','sw.js','notif.mp3','css','js','icons','logo-options']){
 const source=path.join(__dirname,name);
 if(!fs.existsSync(source))throw new Error('Required asset missing: '+name);
 fs.cpSync(source,path.join(out,name),{recursive:true});
}
console.log('Static assets built in dist/. Netlify functions deploy separately.');

