const sdk = require('node-appwrite');
const c = new sdk.Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('6a0a4e8d0032177f3f90')
  .setKey('standard_c476eaadc21bbecc3b6949ee4d0a932613b7a3d4ee52c80cf2c1406750ff75267becfad617da0acd444d0b903b8faea19661d48b2f8b6dc09b678e0db164ddd4b472417c3477a091188554bdd2adfad944778a2927090744ae991c9dcf48c7cebc60e437f5c8a841ffb0736da27daf197bf5716065c2ea5dda65070b07d74642');
const db = new sdk.Databases(c);

async function run() {
  try {
    const res = await db.updateDocument(
      '6a0a58ca001798410d86', // database ID
      'products',             // collection ID
      '6a1b22f10033e59ac736', // document ID
      {},                     // data
      [
        'read("any")',
        'update("user:6a0a5eb9001e2fb8c16d")',
        'delete("user:6a0a5eb9001e2fb8c16d")'
      ]
    );
    console.log('PERMISSIONS UPDATED SUCCESSFULLY:', JSON.stringify(res.$permissions, null, 2));
  } catch(e) {
    console.error('ERROR UPDATING PERMISSIONS:', e);
  }
}
run();
