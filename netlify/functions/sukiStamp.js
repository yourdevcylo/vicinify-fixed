'use strict';
const {services,authenticate,identifier,limit,reply}=require('./lib/admin');
const {approveInStore,awardConfirmedOrder,redeem}=require('./lib/suki-stamps');
const {setVip}=require('./lib/suki-vip');
exports.handler=async event=>{
    if(event.httpMethod!=='POST')return reply(405,{error:'POST only'});
    try{
        const user=await authenticate(event);
        if((event.body||'').length>2048)return reply(413,{error:'Request too large.'});
        const body=JSON.parse(event.body||'{}');
        const {db,FieldValue}=services();
        const userDoc=await db.collection('users').doc(user.uid).get();
        const isAdmin=user.uid==='Z45NZhQTgsTUX79WJ5ksCH8N3c02'||userDoc.data()?.role==='admin';
        let outcome;
        switch(body.action){
            case 'approve_request':outcome=await approveInStore({db,FieldValue,actorUid:user.uid,requestId:identifier(body.requestId),isAdmin});break;
            case 'redeem':outcome=await redeem({db,FieldValue,actorUid:user.uid,cardId:identifier(body.cardId),isAdmin});break;
            case 'set_vip':{
                if (typeof body.grant !== 'boolean') return reply(400,{error:'Invalid VIP action.'});
                await limit(user.uid,'suki_vip',20);
                outcome=await setVip({db,FieldValue,actorUid:user.uid,isAdmin,
                    placeId:identifier(body.placeId),customerUid:identifier(body.customerUid),
                    grant:body.grant,reason:body.reason});
                break;
            }
            case 'retry_order':{
                const id=identifier(body.bookingId);
                const booking=await db.collection('bookings').doc(id).get();
                if(!booking.exists)return reply(404,{error:'Order not found.'});
                const order=booking.data();
                const place=await db.collection('places').doc(order.placeId).get();
                if(!isAdmin&&order.userId!==user.uid&&place.data()?.owner_uid!==user.uid)
                    return reply(403,{error:'Not authorized for this order.'});
                outcome=await awardConfirmedOrder({db,FieldValue,bookingId:id});break;
            }
            default:return reply(400,{error:'Unknown Suki action.'});
        }
        return reply(200,{saved:true,...outcome});
    }catch(e){return reply(e.status||(e instanceof SyntaxError?400:500),{error:e.status?e.message:'Could not update Suki Card.'});}
};
