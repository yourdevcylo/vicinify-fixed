function memory(seed={}){
 const rows=new Map(Object.entries(seed).map(([id,data])=>[id,structuredClone(data)]));let next=0;
 const remove=Symbol('delete');
 function ref(collection,id){const path=collection+'/'+(id||'new'+(++next));return{path,id:path.split('/').at(-1),collection,get:async()=>snapshot(path),set:async(data,opts)=>set(path,data,opts?.merge),update:async data=>set(path,data,true),delete:async()=>rows.delete(path),create:async data=>{if(rows.has(path))throw Error('Already exists');set(path,data);}};}
 function set(path,data,merge=false){const value=merge?{...(rows.get(path)||{}),...data}:{...data};for(const key of Object.keys(value))if(value[key]===remove)delete value[key];rows.set(path,value);}
 function snapshot(path){return{id:path.split('/').at(-1),exists:rows.has(path),data:()=>rows.get(path),ref:ref(path.split('/').slice(0,-1).join('/'),path.split('/').at(-1))};}
 function query(collection,filters=[],size=Infinity,cursor=''){
  return{where:(field,operator,value)=>query(collection,[...filters,[field,operator,value]],size,cursor),orderBy:()=>query(collection,filters,size,cursor),limit:limit=>query(collection,filters,limit,cursor),startAfter:value=>query(collection,filters,size,typeof value==='string'?value:value.id),get:async()=>{
   const docs=[...rows.keys()].filter(path=>(collection.startsWith('GROUP:')?path.split('/').at(-2)===collection.slice(6):path.startsWith(collection+'/')&&path.split('/').length===collection.split('/').length+1)&&path.split('/')[1]>cursor).sort().map(snapshot).filter(doc=>filters.every(([field,op,value])=>op==='=='?doc.data()?.[field]===value:false)).slice(0,size);return{docs,empty:!docs.length,forEach:fn=>docs.forEach(fn)};
  },doc:id=>ref(collection,id)};
 }
 const db={collection:name=>query(name),collectionGroup:name=>query('GROUP:'+name),runTransaction:async fn=>{const writes=[];const tx={get:ref=>ref.get(),set:(ref,data,opts)=>writes.push(()=>set(ref.path,data,opts?.merge)),update:(ref,data)=>writes.push(()=>set(ref.path,data,true)),create:(ref,data)=>writes.push(()=>{if(rows.has(ref.path))throw Error('Already exists');set(ref.path,data);}),delete:ref=>writes.push(()=>rows.delete(ref.path))};const value=await fn(tx);writes.forEach(fn=>fn());return value;},batch:()=>{const writes=[];return{delete:ref=>writes.push(()=>rows.delete(ref.path)),commit:async()=>writes.forEach(fn=>fn())};}};
 const files=new Map(),bucket={name:'vicinify-c9828.firebasestorage.app',getFiles:async({prefix,maxResults})=>[[...files.keys()].filter(path=>path.startsWith(prefix)).slice(0,maxResults).map(path=>bucket.file(path))],file:path=>({name:path,delete:async()=>files.delete(path),getMetadata:async()=>{if(!files.has(path))throw Object.assign(Error('Missing'),{code:404});return[files.get(path)];},copy:async target=>files.set(target.name,{...files.get(path)}),setMetadata:async meta=>{files.set(path,meta);return[meta];}})};
 const deleted=[];return{db,rows,files,bucket,auth:{deleteUser:async uid=>deleted.push(uid),getUserByEmail:async email=>({uid:'next',email,emailVerified:true})},storage:{bucket:()=>bucket},deleted,FieldValue:{serverTimestamp:()=>Date.now(),delete:()=>remove}};
}
module.exports={memory};
