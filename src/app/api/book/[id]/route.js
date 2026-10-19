import { database } from '@/lib/mongodb';
import { authenticate,json,errorResponse,body,bookData,fail,id } from '@/lib/auth';
export { OPTIONS } from '@/lib/auth';
export async function GET(req,{params}) {
  try {
    const u=await authenticate(req); const query={_id:id((await params).id)};
    if(u.role!=='ADMIN') query.status='ACTIVE';
    const book=await (await database()).collection('books').findOne(query);
    if(!book) fail('Book not found',404); return json(book);
  } catch(error) { return errorResponse(error); }
}
export async function PATCH(req,{params}) {
  try {
    await authenticate(req,['ADMIN']); const db=await database(); const query={_id:id((await params).id),status:'ACTIVE'};
    const old=await db.collection('books').findOne(query); if(!old) fail('Active book not found',404);
    const data=await body(req); const fields=bookData({...old,...data});
    const book=await db.collection('books').findOneAndUpdate({...query,quantity:old.quantity},{$set:fields},{returnDocument:'after'});
    if(!book) fail('Book changed. Reload and try again',409); return json(book);
  } catch(error) { return errorResponse(error); }
}
export async function DELETE(req,{params}) {
  try {
    await authenticate(req,['ADMIN']); const book=await (await database()).collection('books').findOneAndUpdate({_id:id((await params).id),status:'ACTIVE'},{$set:{status:'DELETED'}},{returnDocument:'after'});
    if(!book) fail('Active book not found',404); return json({message:'Book soft deleted'});
  } catch(error) { return errorResponse(error); }
}
