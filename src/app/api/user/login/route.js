import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { database } from '@/lib/mongodb';
import { body, json, fail, errorResponse } from '@/lib/auth';
export { OPTIONS } from '@/lib/auth';
export async function POST(req) {
  try {
    const {email,password}=await body(req);
    if(typeof email!=='string' || typeof password!=='string') fail('Enter email and password');
    const user=await (await database()).collection('users').findOne({email:email.trim().toLowerCase(),status:'ACTIVE'});
    if(!user || !(await bcrypt.compare(password,user.password))) fail('Invalid email or password',401);
    if(!process.env.JWT_SECRET) throw new Error('Set JWT_SECRET');
    const token=jwt.sign({id:String(user._id),version:user.sessionVersion||0},process.env.JWT_SECRET,{expiresIn:'2h',algorithm:'HS256'});
    const response=json({user:{id:String(user._id),email:user.email,name:user.name,role:user.role}});
    response.cookies.set('token',token,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:7200});
    return response;
  } catch(error) { return errorResponse(error); }
}
