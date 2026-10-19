import bcrypt from 'bcrypt';
import { database } from './mongodb';
export async function ensureIndexes() {
  const db=await database();
  await db.collection('users').createIndex({email:1},{unique:true});
  await db.collection('books').createIndex({status:1,title:1});
  await db.collection('borrows').createIndex({userId:1,createdAt:-1});
  for (const [email,password,role] of [['admin@test.com','admin123','ADMIN'],['user@test.com','user123','USER']]) {
    await db.collection('users').updateOne({email},{$setOnInsert:{email,name:role,password:await bcrypt.hash(password,10),role,status:'ACTIVE',sessionVersion:0}},{upsert:true});
  }
}
