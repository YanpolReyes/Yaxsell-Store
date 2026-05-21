import { Client, Databases, Query } from 'node-appwrite';

const client = new Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('6a0e374b0009138bc6fa')
  .setKey('standard_4fc3847401fa354922245a979fdbb343bf0ba794d2b569f63fd8083bb493cd21ce2571d2c9f2d88747e7a79553faa4635eddf5500842d0ee132f9f0b853a12f678e88c4a3b2327f8dcc13ac9981f52e6cffd9efbbb2eab7a3e353f9ba18466821df3d08f7d40a5625388a3ce4bd2f6248b1ac12661045180dd2a031fec206641');

const db = new Databases(client);
const DB = '6a0e37ac0016762b9dc4';
const COLL = 'inventory_products';

async function deleteAll() {
  let deleted = 0;
  while (true) {
    const res = await db.listDocuments(DB, COLL, [Query.limit(100)]);
    if (res.documents.length === 0) break;
    for (const doc of res.documents) {
      await db.deleteDocument(DB, COLL, doc.$id);
      deleted++;
    }
    console.log(`Deleted ${deleted} so far...`);
  }
  console.log(`\n✅ Total deleted: ${deleted}`);
}

deleteAll().catch(console.error);
