const { services } = require('./admin');
const fields = ['place_features', 'name', 'category', 'cat', 'description', 'desc', 'address', 'addr', 'barangay', 'brgy', 'lat', 'lng', 'phone', 'contact_phone', 'photos', 'coverPhoto', 'logo', 'logoURL', 'brand_logo', 'brandLogo', 'profileLogo', 'avatarUrl', 'status', 'hours', 'operatingHours', 'operating_hours', 'is_verified', 'is_featured', 'is_premium', 'owner_uid', 'addedBy', 'approval_status', 'avgRating', 'reviewCount', 'priceRange', 'accepts_booking', 'refund_percent', 'suki_stamp_count', 'suki_icon', 'suki_template', 'suki_color_mode', 'suki_color', 'suki_gradient', 'suki_gradient_from', 'suki_gradient_to', 'suki_pattern', 'delivery_grab', 'delivery_inhouse', 'delivery_radius', 'suki_enabled', 'sukiEnabled', 'suki_design', 'sukiDesign', 'suki_required', 'suki_reward', 'suki_stamps', 'sukiRequired', 'sukiReward', 'createdAt', 'infoConfirmedAt', 'businessConfirmedAt', 'lastBusinessUpdateAt', 'updatedAt', 'lastConfirmedAt', 'last_verified_at'];
function publicValue(value) {
    if (value && typeof value.toDate === "function") return value.toDate().toISOString();
    if (Array.isArray(value)) return value.map(publicValue);
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, publicValue(entry)]));
    return value;
}
let cached = null, expiresAt = 0, inFlight = null;

const selectedCache = new Map();
async function selectedCatalog(ids) {
    const unique = [...new Set([...ids].filter(id => typeof id === 'string' && /^[A-Za-z0-9_-]{1,180}$/.test(id)))].slice(0,20);
    const now=Date.now();
    const missing=unique.filter(id=>!selectedCache.has(id) || selectedCache.get(id).expiresAt<=now);
    if(missing.length){
        const db=services().db;
        const docs=await db.getAll(...missing.map(id=>db.collection('places').doc(id)),{fieldMask:fields});
        docs.forEach(doc=>selectedCache.set(doc.id,{expiresAt:Date.now()+60000,value:doc.exists && doc.data().approval_status==='approved'?{...publicValue(doc.data()),id:doc.id}:null}));
        if(selectedCache.size>2000) for(const [id,entry] of selectedCache){if(entry.expiresAt<=Date.now() || selectedCache.size>2000)selectedCache.delete(id);}
    }
    return {places:unique.map(id=>selectedCache.get(id)?.value).filter(Boolean),truncated:false};
}
async function catalog(ids) {
    if(ids) return selectedCatalog(ids);
    if (cached && Date.now() < expiresAt) return cached;
    if (inFlight) return inFlight;
    inFlight = (async () => {
        const snapshot = await services().db.collection('places').where('approval_status', '==', 'approved').select(...fields).limit(2001).get();
        cached = { places: snapshot.docs.slice(0, 2000).map(document => ({ ...publicValue(document.data()), id: document.id })), truncated: snapshot.size > 2000 };
        expiresAt = Date.now() + 60000;
        return cached;
    })();
    try { return await inFlight; } finally { inFlight = null; }
}
module.exports = { catalog };

