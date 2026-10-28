// Customer input is validated here; trust, identity and payment state are server-owned.
const labels = {table_reservation:['Table Reservation','🪑'],food_reservation:['Food Reservation','🍱'],pickup_order:['Pickup Pre-order','🛍️'],delivery_order:['Delivery Order','🛵'],advance_order:['Advance Order','🗓️']};
const types = new Set(Object.keys(labels));
function invalid(message) { throw Object.assign(new Error(message), {status:400}); }
function createBooking(input, user, place, profile, now = Date.now()) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) invalid('Enter request details.');
    if (!types.has(input.requestType)) invalid('Choose a valid request type.');
    if (place.approval_status !== 'approved' || !place.owner_uid || place.owner_uid === user.uid)
        throw Object.assign(new Error('This establishment cannot accept this request.'),{status:409});
    const text = (key, max = 1000) => {
        const value = input[key];
        if (value == null) return null;
        if (typeof value !== 'string' || value.length > max || (max>=1000 && value.trim().split(/\s+/u).length>200)) invalid(`Invalid ${key}.`);
        return value.trim() || null;
    };
    const date=text('bookingDate',10),time=text('bookingTime',5);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time || '')) invalid('Choose a valid date and time.');
    const scheduled = new Date(`${date}T${time}:00+08:00`);
    if (!Number.isFinite(scheduled.getTime()) || new Date(scheduled.getTime()+8*3600000).toISOString().slice(0,10)!==date || scheduled.getTime() <= now)
        invalid('Choose a future date and time (Philippine time).');
    const requestType=input.requestType, orderItems=text('orderItems'),deliveryAddress=text('deliveryAddress'),paymentMethod=text('paymentMethod',80);
    const guests=Number(input.guestCount);
    if (requestType==='table_reservation' && (!Number.isInteger(guests)||guests<1||guests>500)) invalid('Enter 1 to 500 guests.');
    if (requestType!=='table_reservation' && !orderItems) invalid('Enter the food or items requested.');
    if (requestType==='delivery_order' && !deliveryAddress) invalid('Enter a delivery address.');
    if (requestType!=='table_reservation' && !paymentMethod) invalid('Choose a payment method.');
    const rate=Number(place.refund_percent ?? 50);
    return {
        placeId:input.placeId, placeName:String(place.name || 'Establishment').slice(0,120), userId:user.uid,
        userName:String(profile?.fullName || user.name || 'Customer').slice(0,120), requestType,
        requestLabel:labels[requestType][0],requestIcon:labels[requestType][1],
        requestGroup:['table_reservation','food_reservation'].includes(requestType)?'reservation':'order',
        bookingDate:date,bookingTime:time,scheduledAt:scheduled,
        bookingDetails:text('bookingDetails'),guestCount:requestType==='table_reservation'?guests:null,
        seatingPreference:text('seatingPreference',100),occasion:text('occasion',100),orderItems,
        fulfillmentType:text('fulfillmentType',100),deliveryAddress,paymentMethod,paymentType:text('paymentType',80),
        purpose:text('purpose'),details:text('details',4000),status:'pending',
        refundPercent:Number.isFinite(rate)?Math.max(0,Math.min(100,rate)):50
    };
}
module.exports={createBooking};
