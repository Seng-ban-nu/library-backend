import { ensureIndexes } from '@/lib/ensureIndexes';
import { json, errorResponse, fail, body } from '@/lib/auth';
export async function POST(req) {
  try {
    const data=await body(req);
    if(!process.env.ADMIN_SETUP_PASS || data.pass!==process.env.ADMIN_SETUP_PASS) fail('Forbidden',403);
    await ensureIndexes(); return json({message:'Test users and indexes ready'});
  } catch(error) { return errorResponse(error); }
}
