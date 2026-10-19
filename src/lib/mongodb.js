import { MongoClient } from 'mongodb';
export function getClientPromise() {
  if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI');
  if (!globalThis.libraryClient) {
    globalThis.libraryClient = new MongoClient(process.env.MONGODB_URI).connect().catch(error => {
      globalThis.libraryClient = undefined;
      throw error;
    });
  }
  return globalThis.libraryClient;
}
export async function database() { return (await getClientPromise()).db(process.env.MONGODB_DB || 'library_practice'); }
