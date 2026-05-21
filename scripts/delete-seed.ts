// Delete seed documents from new Appwrite project
import { Client, Databases, Query } from 'node-appwrite';

const ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const PROJECT_ID = '6a0e374b0009138bc6fa';
const DATABASE_ID = '6a0e37ac0016762b9dc4';
const API_KEY = 'standard_4fc3847401fa354922245a979fdbb343bf0ba794d2b569f63fd8083bb493cd21ce2571d2c9f2d88747e7a79553faa4635eddf5500842d0ee132f9f0b853a12f678e88c4a3b2327f8dcc13ac9981f52e6cffd9efbbb2eab7a3e353f9ba18466821df3d08f7d40a5625388a3ce4bd2f6248b1ac12661045180dd2a031fec206641';

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const db = new Databases(client);

async function deleteSeedDocs() {
  const docs = await db.listDocuments(DATABASE_ID, 'sequences');
  for (const doc of docs.documents) {
    await db.deleteDocument(DATABASE_ID, 'sequences', doc.$id);
    console.log(`🗑️ Deleted: ${doc.key} (${doc.$id})`);
  }
  console.log(`\n✅ ${docs.total} documentos eliminados`);
}

deleteSeedDocs().catch(console.error);
