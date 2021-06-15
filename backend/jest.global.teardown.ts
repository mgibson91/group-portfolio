
export default async function() {
  console.log(`Global teardown`);

  await (global as any).mongod.stop()

  console.log(`MongoMemoryServer stopped`);


}
