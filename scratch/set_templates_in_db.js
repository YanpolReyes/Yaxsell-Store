const sdk = require('node-appwrite');
const c = new sdk.Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('6a0a4e8d0032177f3f90')
  .setKey('standard_c476eaadc21bbecc3b6949ee4d0a932613b7a3d4ee52c80cf2c1406750ff75267becfad617da0acd444d0b903b8faea19661d48b2f8b6dc09b678e0db164ddd4b472417c3477a091188554bdd2adfad944778a2927090744ae991c9dcf48c7cebc60e437f5c8a841ffb0736da27daf197bf5716065c2ea5dda65070b07d74642');
const db = new sdk.Databases(c);

const dbId = '6a0a58ca001798410d86';
const colId = 'sequences';

async function upsertKey(key, value) {
  try {
    const list = await db.listDocuments(dbId, colId, [
      sdk.Query.equal('key', key),
      sdk.Query.limit(1)
    ]);
    if (list.documents.length > 0) {
      const doc = list.documents[0];
      await db.updateDocument(dbId, colId, doc.$id, { value });
      console.log(`Updated key "${key}" to value ${value}`);
    } else {
      await db.createDocument(dbId, colId, 'unique()', { key, value });
      console.log(`Created key "${key}" with value ${value}`);
    }
  } catch(e) {
    console.error(`Error with key "${key}":`, e);
  }
}

async function run() {
  // Global store template = 1
  await upsertKey('store_template', 1);
  // Landing = 1 (Plantilla 1)
  await upsertKey('store_template_landing', 1);
  // Product Detail = 5 (Plantilla 5)
  await upsertKey('store_template_productDetail', 5);
  // Cart = 1
  await upsertKey('store_template_cart', 1);
  // Checkout = 1
  await upsertKey('store_template_checkout', 1);
  
  console.log('Database templates configured successfully!');
}
run();
