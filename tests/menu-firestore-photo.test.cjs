const test=require('node:test');
const assert=require('node:assert/strict');
const Menu=require('../netlify/functions/lib/menu');
const original={name:'Demo Coffee',description:'Demo menu item',category:'Drinks',priceCents:9500,available:true,archived:false,photoUrl:'',optionGroups:[]};
const photo='data:image/webp;base64,UklGRj4AAABXRUJQVlA4IDIAAAAQAwCdASogACAAPu1wsVIppiSiqAgBMB2JZwDKABanFAAA/sTvxhNJOhVf3zUNkYAAAA==';

test('inline compressed WebP is accepted and preserved for direct Firestore clients',()=>{
 const menu=Menu.item({...original,photoData:photo});
 assert.equal(menu.photoData,photo);
 assert.equal(menu.photoUrl,'');
});
test('AI/public menu excludes inline image payload to avoid huge model prompts',()=>{
 const item=Menu.publicItem({id:'coffee',data:()=>({...original,photoData:photo,version:3})});
 assert.equal(item.photoData,undefined);
 assert.equal(item.name,'Demo Coffee');
});
test('menu rejects scripts, SVG, oversized photo data, mismatched RIFF size and forged base64',()=>{
 for(const invalid of [
  'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
  'data:text/html;base64,PHNjcmlwdD4=',
  'data:image/webp;base64,'+'A'.repeat(45000),
  'data:image/webp;base64,'+Buffer.from('not a webp').toString('base64'),
  photo.slice(0,-4),
  'https://evil.example/a.webp'
 ])assert.throws(()=>Menu.item({...original,photoData:invalid}),{status:400});
});
test('legacy menu item with URL remains supported',()=>{
 const menu=Menu.item({...original,photoUrl:'https://example.com/coffee.webp'});
 assert.equal(menu.photoUrl,'https://example.com/coffee.webp');
 assert.equal(menu.photoData,'');
});
