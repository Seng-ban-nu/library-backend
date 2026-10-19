import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { database } from './mongodb';
import corsHeaders from './cors';
export function fail(message, status=400) { throw Object.assign(new Error(message), {status}); }
export function json(data, status=200) { return NextResponse.json(data, {status, headers:corsHeaders}); }
export function errorResponse(error) {
  if (!error.status) console.error(error);
  return json({message: error.status ? error.message : 'Server error. Check database settings.'}, error.status || 500);
}
export function id(value) {
  if (typeof value !== 'string' || !/^[a-f0-9]{24}$/i.test(value)) fail('Invalid ID');
  return new ObjectId(value);
}
export async function body(req) { try { return await req.json(); } catch { fail('Invalid JSON'); } }
export async function authenticate(req, roles=[]) {
  const token = req.headers.get('authorization')?.replace(/^Bearer /i,'') || req.cookies.get('token')?.value;
  if (!token) fail('Login required',401);
  if (!process.env.JWT_SECRET) throw new Error('Set JWT_SECRET');
  let payload;
  try { payload=jwt.verify(token,process.env.JWT_SECRET,{algorithms:['HS256']}); } catch { fail('Invalid or expired login',401); }
  const user=await (await database()).collection('users').findOne({_id:id(payload.id),status:'ACTIVE'});
  if (!user || (user.sessionVersion || 0)!==payload.version) fail('Login expired',401);
  if (roles.length && !roles.includes(user.role)) fail('Forbidden',403);
  return user;
}
export function bookData(data) {
  const result={};
  for (const key of ['title','author','location']) {
    if(typeof data[key] !== 'string' || !data[key].trim() || data[key].length>200) fail('Enter title, author and location (maximum 200 characters)');
    result[key]=data[key].trim();
  }
  if(typeof data.quantity !== 'number' || !Number.isSafeInteger(data.quantity) || data.quantity<0) fail('Quantity must be a whole number, zero or more');
  return {...result,quantity:data.quantity};
}
export function OPTIONS() { return new Response(null,{status:204,headers:corsHeaders}); }
