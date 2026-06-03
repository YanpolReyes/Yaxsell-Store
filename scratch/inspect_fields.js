const appwrite = require('appwrite');
const c = new appwrite.Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('6a0a4e8d0032177f3f90');
const db = new appwrite.Databases(c);

async function run() {
  try {
    const r = await db.listDocuments('6a0a58ca001798410d86', 'products', [
      appwrite.Query.limit(5)
    ]);
    if (r.documents.length > 0) {
      console.log('Document keys:', Object.keys(r.documents[0]));
      console.log('Sample Document:', JSON.stringify(r.documents[0], null, 2));
    } else {
      console.log('No documents found.');
    }
  } catch(e) {
    console.error(e);
  }
}
run();
