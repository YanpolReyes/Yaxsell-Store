const appwrite = require('appwrite');
const c = new appwrite.Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('6a0a4e8d0032177f3f90');
const db = new appwrite.Databases(c);

async function run() {
  try {
    const p = await db.getDocument('6a0a58ca001798410d86', 'products', '6a1b22f10033e59ac736');
    console.log('PRODUCT DETAILS:', JSON.stringify(p, null, 2));
  } catch(e) {
    console.error('ERROR FETCHING PRODUCT:', e);
  }
}
run();
