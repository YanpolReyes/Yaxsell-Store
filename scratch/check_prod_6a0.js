const appwrite = require('appwrite');
const c = new appwrite.Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('6a0a4e8d0032177f3f90');
const db = new appwrite.Databases(c);

async function run() {
  try {
    const p = await db.getDocument('6a0a58ca001798410d86', 'products', '6a0b50b6003166b04a12');
    console.log('Product ID:', p.$id);
    console.log('NAME:', p.NAME);
    console.log('DESCRIPTION:', p.DESCRIPTION);
    console.log('FEATURES:', p.FEATURES);
  } catch(e) {
    console.error(e);
  }
}
run();
