import { database,getClientPromise } from '@/lib/mongodb';
import { authenticate,json,errorResponse,body,fail,id } from '@/lib/auth';
export { OPTIONS } from '@/lib/auth';
export async function GET(req) {
  try { const u=await authenticate(req); return json(await (await database()).collection('borrows').find(u.role==='ADMIN'?{}:{userId:String(u._id)}).sort({createdAt:-1}).toArray()); }
  catch(error) { return errorResponse(error); }
}
export async function POST(req) {
  try {
    const u=await authenticate(req,['USER']); const data=await body(req); const db=await database();
    if(typeof data.targetDate!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(data.targetDate)) fail('Enter a pickup date');
    const date=new Date(data.targetDate+'T00:00:00+07:00');
    if(!Number.isFinite(date.getTime()) || new Date(date.getTime()+7*3600000).toISOString().slice(0,10)!==data.targetDate) fail('Invalid pickup date');
    const today=new Date(Date.now()+7*3600000).toISOString().slice(0,10);
    if(data.targetDate<today) fail('Pickup date cannot be in the past');
    const book=await db.collection('books').findOne({_id:id(data.bookId),status:'ACTIVE'});
    if(!book) fail('Book not found',404);
    const request={bookId:String(book._id),bookTitle:book.title,userId:String(u._id),userEmail:u.email,createdAt:new Date(),targetDate:data.targetDate,status:'INIT'};
    const result=await db.collection('borrows').insertOne(request); return json({_id:result.insertedId,...request},201);
  } catch(error) { return errorResponse(error); }
}
export async function PATCH(req) {
  let session;
  try {
    const u=await authenticate(req); const data=await body(req); const requestId=id(data.id);
    const allowed=u.role==='ADMIN'?['ACCEPTED','CLOSE-NO-AVAILABLE-BOOK','CANCEL-ADMIN']:['CANCEL-USER'];
    if(!allowed.includes(data.status)) fail('Forbidden',403);
    const db=await database(); session=(await getClientPromise()).startSession(); let updated;
    // Keep the request and stock change together, even with two admins.
    await session.withTransaction(async()=>{
      const r=await db.collection('borrows').findOne({_id:requestId},{session});
      if(!r) fail('Request not found',404);
      if(u.role!=='ADMIN' && r.userId!==String(u._id)) fail('Forbidden',403);
      if(!['INIT','ACCEPTED'].includes(r.status)) fail('Request is already closed',409);
      if(r.status==='ACCEPTED' && !['CANCEL-ADMIN','CANCEL-USER'].includes(data.status)) fail('Only cancellation is allowed after acceptance',409);
      let next=data.status;
      if(next==='ACCEPTED') {
        const book=await db.collection('books').findOneAndUpdate({_id:id(r.bookId),status:'ACTIVE',quantity:{$gt:0}},{$inc:{quantity:-1}},{session,returnDocument:'after'});
        if(!book) next='CLOSE-NO-AVAILABLE-BOOK';
      }
      if(next==='CLOSE-NO-AVAILABLE-BOOK' && data.status===next) {
        const book=await db.collection('books').findOne({_id:id(r.bookId),status:'ACTIVE',quantity:{$gt:0}},{session});
        if(book) fail('Copies are available. Accept or cancel this request',409);
      }
      if(r.status==='ACCEPTED') await db.collection('books').updateOne({_id:id(r.bookId)},{$inc:{quantity:1}},{session});
      updated=await db.collection('borrows').findOneAndUpdate({_id:requestId,status:r.status},{$set:{status:next,updatedAt:new Date()}},{session,returnDocument:'after'});
    });
    return json(updated);
  } catch(error) { return errorResponse(error); }
  finally { if(session) await session.endSession(); }
}
