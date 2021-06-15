import { MongoMemoryServer } from 'mongodb-memory-server';

// let mongod: MongoMemoryServer;

export default async function() {
  console.log(`\n\nGlobal setup`);
  const mongod = new MongoMemoryServer({
    instance: {
      port: 47107
    }
  });

  (global as any).mongod = mongod;

  process.env.MONGO_URI = await mongod.getUri();
  console.log(`MongoMemoryServer start at ${process.env.MONGO_URI}\n`);
}
