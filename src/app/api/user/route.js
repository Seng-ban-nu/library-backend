import { authenticate,json,errorResponse } from '@/lib/auth';
export { OPTIONS } from '@/lib/auth';
// Test accounts are created by the protected setup route.
export async function POST(req) {
  try { await authenticate(req,['ADMIN']); return json({message:'Use the protected setup route to create test users'},405); }
  catch(error) { return errorResponse(error); }
}
