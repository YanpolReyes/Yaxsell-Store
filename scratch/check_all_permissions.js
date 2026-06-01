const sdk = require('node-appwrite');
const c = new sdk.Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('6a0a4e8d0032177f3f90')
  .setKey('standard_c476eaadc21bbecc3b6949ee4d0a932613b7a3d4ee52c80cf2c1406750ff75267becfad617da0acd444d0b903b8faea19661d48b2f8b6dc09b678e0db164ddd4b472417c3477a091188554bdd2adfad944778a2927090744ae991c9dcf48c7cebc60e437f5c8a841ffb0736da27daf197bf5716065c2ea5dda65070b07d74642');
const db = new sdk.Databases(c);

async function run() {
  try {
    let all = [];
    let offset = 0;
    while(true) {
      const r = await db.listDocuments('6a0a58ca001798410d86', 'products', [
        sdk.Query.limit(100),
        sdk.Query.offset(offset)
      ]);
      all.push(...r.documents);
      if (r.documents.length < 100) break;
      offset += 100;
    }
    console.log('Total products checked:', all.length);
    
    let restricted = all.filter(p => !p.$permissions.includes('read("any")'));
    console.log('Restricted products count:', restricted.length);
    
    for (let p of restricted) {
      console.log(`Fixing permissions for product: ${p.$id} (${p.NAME})`);
      const newPermissions = p.$permissions.filter(perm => !perm.startsWith('read('));
      newPermissions.push('read("any")');
      
      await db.updateDocument(
        '6a0a58ca001798410d86',
        'products',
        p.$id,
        {},
        newPermissions
      );
    }
    console.log('All restricted product permissions have been fixed!');
  } catch(e) {
    console.error('Error during permissions scan:', e);
  }
}
run();
