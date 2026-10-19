import { authenticate,json,errorResponse } from '@/lib/auth';
export { OPTIONS } from '@/lib/auth';
export async function GET(req) {
  try { const u=await authenticate(req); return json({user:{id:String(u._id),email:u.email,name:u.name,role:u.role}}); }
  catch(error) { return errorResponse(error); }
}
