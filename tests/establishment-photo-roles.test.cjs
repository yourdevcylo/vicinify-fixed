const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const src=f=>fs.readFileSync(path.join(root,f),'utf8');
const common=src('js/common.js');
const preview=src('js/place-preview.js');
const map=src('js/map.js');
const dashboard=src('js/dashboard.js');
const css=src('css/components.css');
test('List view displays profile logo, not cover as thumbnail',()=>{
 const section=common.slice(common.indexOf('window.renderListView ='),common.indexOf('let ratingHtml =',common.indexOf('window.renderListView =')));
 assert.match(section,/const profilePhoto\s*=\s*safeImageUrl\(place\.logoUrl/);
 assert.doesNotMatch(section,/const profilePhoto\s*=\s*safeImageUrl\(place\.coverPhoto/);
 assert.match(section,/imgHtml = profilePhoto/);
});
test('Small list modal displays profile logo',()=>{
 assert.match(preview,/const photo=safeImage\(place\.logoUrl/);
});
test('Full establishment uses cover for banner and logo only for brand avatar',()=>{
 assert.match(map,/let finalCoverImg = p\.coverPhoto/);
 assert.match(map,/class="place-cover-photo" src="\$\{escapeHtml\(finalCoverImg\)\}"/);
 assert.match(map,/class="placeCover.*\$\{coverPhotoHtml\}/s);
 assert.match(map,/const logoUrl = getSafeImageUrl\(p\.logoUrl/);
 assert.match(map,/class="placeBrandLogo">\$\{brandLogoHtml\}/);
});
test('Banner image survives dark theme CSS background overrides',()=>{
 assert.match(css,/\.placeCover > \.place-cover-photo\s*\{/);
 assert.match(css,/object-fit:\s*cover/);
 assert.match(css,/\.placeCover\.has-cover::after\s*\{\s*z-index:\s*1/);
});
test('Separate cover and profile writes retained in Firestore',()=>{
 assert.match(dashboard,/updateData\.coverPhoto = await bizSaveWithDeadline\(bizSmallWebPData\(coverInput\.files\[0\], "cover"\)\)/);
 assert.match(dashboard,/updateData\.logoUrl = await bizSaveWithDeadline\(bizSmallWebPData\(logoInputEl\.files\[0\], "logo"\)\)/);
});
test('Catalog cache invalidates old photo-rendering snapshots',()=>{
 assert.match(map,/vicinify:approved-catalog:20261031-photo-roles/);
});
