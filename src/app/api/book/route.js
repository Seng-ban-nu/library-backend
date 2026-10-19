import { database } from '@/lib/mongodb';
import { authenticate,json,errorResponse,body,bookData,fail } from '@/lib/auth';
export { OPTIONS } from '@/lib/auth';
export async function GET(req) {
  try {
    const u=await authenticate(req); const p=new URL(req.url).searchParams; const query={status:'ACTIVE'};
    if(p.get('status')==='DELETED') { if(u.role!=='ADMIN') fail('Forbidden',403); query.status='DELETED'; }
    if(p.get('status')==='ALL') { if(u.role!=='ADMIN') fail('Forbidden',403); delete query.status; }
    for(const field of ['title','author']) if(p.get(field)) query[field]={$regex:Array.from(p.get(field).slice(0,200), c => '.*+?^${}()|[]\\'.includes(c) ? '\\'+c : c).join(''),$options:'i'};
    return json(await (await database()).collection('books').find(query).sort({title:1}).toArray());
  } catch(error) { return errorResponse(error); }
}
export async function POST(req) {
  try {
    await authenticate(req,['ADMIN']); const data=bookData(await body(req));
    const result=await (await database()).collection('books').insertOne({...data,status:'ACTIVE',createdAt:new Date()});
    return json({_id:result.insertedId,...data,status:'ACTIVE'},201);
  } catch(error) { return errorResponse(error); }
}
