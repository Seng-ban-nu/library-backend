import { database } from '@/lib/mongodb';
import { authenticate,json,errorResponse } from '@/lib/auth';
export { OPTIONS } from '@/lib/auth';
export async function POST(req) {
  try {
    const user=await authenticate(req);
    await (await database()).collection('users').updateOne({_id:user._id},{$inc:{sessionVersion:1}});
    const response=json({message:'Logged out'});
    response.cookies.set('token','',{httpOnly:true,path:'/',sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:0});
    return response;
  } catch(error) { return errorResponse(error); }
}
