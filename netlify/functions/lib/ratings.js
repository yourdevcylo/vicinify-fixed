// One editable star rating per customer/place. Written transaction feedback is separate.
const valid=value=>Number.isInteger(Number(value))&&Number(value)>=1&&Number(value)<=5;
const time=value=>value?.toMillis?.()||value?.toDate?.().getTime?.()||Number(value)||0;
function latest(docs){
 const byUser=new Map();
 for(const doc of docs){const d=doc.data(),score=Number(d.rating);if(!d.userId||!valid(score))continue;const canonical=d.reviewSource==='star_rating',old=byUser.get(d.userId),stamp=time(d.updatedAt||d.createdAt);if(!old||canonical&&!old.canonical||canonical===old.canonical&&stamp>=old.stamp)byUser.set(d.userId,{score,canonical,stamp});}
 return byUser;
}
async function ratingChange(tx,db,place,uid,placeId,score,FieldValue){
 const ref=db.collection('reviews').doc(`${uid}_${placeId}`),previous=await tx.get(ref),data=place.data();
 let sum=Number(data.ratingSum),count=Number(data.ratingCount),old=previous.exists&&valid(previous.data().rating)?Number(previous.data().rating):null;
 const ready=data.ratingModelVersion===2&&Number.isFinite(sum)&&Number.isInteger(count)&&count>=0&&sum>=0&&sum<=count*5;
 if(!ready){
  const all=await tx.get(db.collection('reviews').where('placeId','==',placeId));const ratings=latest(all.docs);
  sum=[...ratings.values()].reduce((n,r)=>n+r.score,0);count=ratings.size;old=ratings.get(uid)?.score??null;
 }else if(old===null){
  // A legacy transaction review may already contribute to the migrated aggregate.
  const legacy=await tx.get(db.collection('reviews').where('userId','==',uid).where('placeId','==',placeId));old=latest(legacy.docs).get(uid)?.score??null;
 }
 if(old!==null)sum-=old;else count++;
 sum+=score;
 return {ref,data:{userId:uid,placeId,rating:score,feedback:'',isPublic:false,verifiedTransaction:false,reviewSource:'star_rating',createdAt:previous.data()?.createdAt||FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()},aggregate:{ratingSum:sum,ratingCount:count,reviewCount:count,avgRating:Number((sum/count).toFixed(1)),ratingModelVersion:2}};
}
module.exports={ratingChange};
