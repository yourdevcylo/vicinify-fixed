'use strict';
const {services,authenticate,limit,reply}=require('./lib/admin');
const {FieldValue}=require('firebase-admin/firestore');
const BASE_CATEGORIES=new Set(['restaurant','cafe','bakery','milktea','snackhouse','foodstall','eatery','dessert','fastfood']);
const LIPA_BARANGAYS=new Set(["adya", "anilao", "anilao-labac", "antipolo del norte", "antipolo del sur", "bagong pook", "balintawak", "banaybanay", "barangay 1 (poblacion)", "barangay 2 (poblacion)", "barangay 3 (poblacion)", "barangay 4 (poblacion)", "barangay 5 (poblacion)", "barangay 6 (poblacion)", "barangay 7 (poblacion)", "barangay 8 (poblacion)", "barangay 9 (poblacion)", "barangay 10 (poblacion)", "barangay 11 (poblacion)", "barangay 12 (poblacion)", "barangay 13 (poblacion)", "barangay 14 (poblacion)", "barangay 15 (poblacion)", "barangay 16 (poblacion)", "barangay 17 (poblacion)", "barangay 18 (poblacion)", "barangay 19 (poblacion)", "barangay 20 (poblacion)", "barangay 21 (poblacion)", "barangay 22 (poblacion)", "barangay 23 (poblacion)", "barangay 24 (poblacion)", "barangay 25 (poblacion)", "barangay 26 (poblacion)", "barangay 27 (poblacion)", "barangay 28 (poblacion)", "barangay 29 (poblacion)", "barangay 30 (poblacion)", "barangay 31 (poblacion)", "barangay 32 (poblacion)", "barangay 33 (poblacion)", "barangay 34 (poblacion)", "barangay 35 (poblacion)", "bolbok", "bugtong na pulo", "bulacnin", "calamias", "cumba", "dagatan", "duhatan", "halang", "inosloban", "kayumanggi", "latag", "lodlod", "mabini", "malagonlong", "malitlit", "marauoy", "mataas na lupa", "munting pulo", "pagolingin east", "pagolingin west", "pinagtongulan", "plaridel", "quezon", "sabang", "san benito", "san carlos", "san celestino", "san francisco", "san guillermo", "san isidro", "san jose", "san juan", "san salvador", "san sebastian", "sapac", "sico", "talisay", "tambo", "tangob", "tanguay", "tipacan"]);
function invalid(message){throw Object.assign(new Error(message),{status:400});}
function text(value,max,required=false){if(typeof value!=='string')invalid('Invalid listing text.');const v=value.trim();if(v.length>max||/[<>\x00-\x1f]/.test(v)||(required&&!v))invalid('Invalid or missing listing details.');return v;}
function validatePlace(p,allowedCategories=BASE_CATEGORIES){
    if(!p||typeof p!=='object')invalid('Enter the establishment details.');
    const name=text(p.name,120,true),desc=text(p.description||p.desc||'',1000,true),address=text(p.address||p.addr||'',220,true);
    const barangay=text(p.barangay||p.brgy||'',65,true),phone=text(p.contact_phone||p.phone||'',35);
    if(!LIPA_BARANGAYS.has(barangay.toLowerCase()))invalid('Choose a valid Lipa City barangay.');
    const category=text(p.category||p.cat||'',30,true),categories=p.categories;
    if(!Array.isArray(categories)||categories.length<1||categories.length>3||new Set(categories).size!==categories.length||!categories.includes(category)||!categories.every(c=>allowedCategories.has(c)))invalid('Choose 1 to 3 valid categories and a primary category.');
    if(name.length<3||desc.length<10)invalid('Enter a complete business name and description.');
    const lat=Number(p.lat),lng=Number(p.lng);
    if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat<13.65||lat>14.18||lng<120.98||lng>121.48)invalid('Choose a location near Lipa City.');
    const photos=Array.isArray(p.photos)?p.photos:[];
    if(photos.length>5||!photos.every(s=>typeof s==='string'&&s.length<=40000&&/^data:image\/webp;base64,[A-Za-z0-9+/=]+$/.test(s)))invalid('Invalid establishment photos.');
    const logo=typeof p.logoUrl==='string'?p.logoUrl:'';
    if(logo&&(logo.length>40000||!/^data:image\/webp;base64,[A-Za-z0-9+/=]+$/.test(logo)))invalid('Invalid establishment logo.');
    const priceRange=text(p.priceRange||'',40),allowedPrices=['','Under ₱150','₱150–₱300','₱300–₱500','₱500–₱1,000','Over ₱1,000'];
    if(!allowedPrices.includes(priceRange))invalid('Choose a valid price range.');
    const featureKeys={accessibility:['wheelchair_entrance','wheelchair_parking','wheelchair_restroom','wheelchair_seating'],services:['dine_in','takeout','outdoor_seating'],amenities:['wifi','parking','restroom','air_conditioning'],highlights:['coffee_specialty','fresh_pastries','live_music','sports'],popular_for:['breakfast','lunch','dinner','groups','solo_dining'],offerings:['coffee','tea','desserts','vegetarian','vegan','late_night']};
    const rawFeatures=p.place_features||{};
    if(!rawFeatures||Array.isArray(rawFeatures)||typeof rawFeatures!=='object'||Object.keys(rawFeatures).some(k=>!Object.hasOwn(featureKeys,k)))invalid('Invalid establishment features.');
    const place_features={};
    for(const [k,allow] of Object.entries(featureKeys)){const items=rawFeatures[k]||[];if(!Array.isArray(items)||items.length>allow.length||items.some(v=>!allow.includes(v)))invalid('Invalid establishment feature choice.');place_features[k]=[...new Set(items)];}
    return {name,desc,description:desc,addr:address,address,brgy:barangay,barangay,cat:category,category,categories,city:'Lipa City',phone,contact_phone:phone,lat,lng,photos,logoUrl:logo,priceRange,place_features};
}
exports.handler=async event=>{
    if(event.httpMethod!=='POST')return reply(405,{error:'POST only'});
    try{
        const user=await authenticate(event),{db}=services(),body=JSON.parse(event.body||'{}');
        if(body.action!=='publish')invalid('Unsupported action.');
        await limit(user.uid,'business_publish',3,3600000);
        const [app,profile,business,customCats]=await Promise.all([db.collection('business_applications').doc(user.uid).get(),db.collection('users').doc(user.uid).get(),db.collection('verified_businesses').doc(user.uid).get(),db.collection('establishment_categories').limit(100).get()]);
        if(app.data()?.status!=='approved'||profile.data()?.role!=='business'||profile.data()?.businessVerificationStatus!=='approved'||app.data()?.ownerEmail!==user.email||business.data()?.status!=='active')throw Object.assign(new Error('Your business registration must be approved before publishing.'),{status:403});
        const allowedCategories=new Set(BASE_CATEGORIES);
        customCats.docs.forEach(doc=>{if(doc.data()?.enabled && /^[a-z0-9]{2,30}$/.test(doc.id))allowedCategories.add(doc.id);});
        const fields=validatePlace(body.place,allowedCategories);
        const ref=db.collection('places').doc();
        const batch=db.batch();
        batch.create(ref,{...fields,addedBy:user.uid,owner_uid:user.uid,approval_status:'approved',is_verified:false,is_premium:false,is_featured:false,status:'closed',auto_reply_enabled:false,auto_reply_answers:{},avgRating:0,reviewCount:0,ratingSum:0,ratingCount:0,createdAt:FieldValue.serverTimestamp()});
        batch.set(db.collection('private_places').doc(ref.id),{owner_uid:user.uid,owner_email:user.email,verifiedBusinessUid:user.uid,createdAt:FieldValue.serverTimestamp()});
        await batch.commit();
        return reply(200,{published:true,placeId:ref.id});
    }catch(error){console.error('Business publication error:',error.status||'server_error');return reply(error.status||500,{error:error.status?error.message:'Unable to publish the establishment.'});}
};
exports._test={validatePlace};
