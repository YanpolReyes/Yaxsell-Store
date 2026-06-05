const { Client, Databases, Query } = require('node-appwrite');

const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const PROJECT_ID = '6a0a4e8d0032177f3f90';
const DATABASE_ID = '6a0a58ca001798410d86';
const COLLECTION_ID = 'sequences';
const TEMPLATE_KEY = 'store_template';
const API_KEY = 'standard_c476eaadc21bbecc3b6949ee4d0a932613b7a3d4ee52c80cf2c1406750ff75267becfad617da0acd444d0b903b8faea19661d48b2f8b6dc09b678e0db164ddd4b472417c3477a091188554bdd2adfad944778a2927090744ae991c9dcf48c7cebc60e437f5c8a841ffb0736da27daf197bf5716065c2ea5dda65070b07d74642';

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

async function run() {
  try {
    const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal("key", TEMPLATE_KEY),
      Query.limit(1)
    ]);
    console.log("Global template ID:", res.documents[0]?.value);
    
    const resLanding = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal("key", "store_template_landing"),
      Query.limit(1)
    ]);
    console.log("Landing page template ID:", resLanding.documents[0]?.value);
  } catch (e) {
    console.error("Error reading database:", e);
  }
}

run();
