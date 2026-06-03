const sdk = require('node-appwrite');

const client = new sdk.Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('6a0a4e8d0032177f3f90')
  .setKey('standard_c476eaadc21bbecc3b6949ee4d0a932613b7a3d4ee52c80cf2c1406750ff75267becfad617da0acd444d0b903b8faea19661d48b2f8b6dc09b678e0db164ddd4b472417c3477a091188554bdd2adfad944778a2927090744ae991c9dcf48c7cebc60e437f5c8a841ffb0736da27daf197bf5716065c2ea5dda65070b07d74642');

const databases = new sdk.Databases(client);
const dbId = '6a0a58ca001798410d86';
const colId = 'products';

async function run() {
  try {
    const r = await databases.listAttributes(dbId, colId, [
      sdk.Query.limit(100)
    ]);
    console.log('Total attributes:', r.total);
    const keys = r.attributes.map(a => a.key);
    console.log('Keys present in schema:', keys);
    
    // Attempt to create attributes if not present
    if (!keys.includes('GROUPID')) {
      console.log('Creating GROUPID...');
      await databases.createStringAttribute(dbId, colId, 'GROUPID', 100, false, null);
      console.log('GROUPID created.');
    } else {
      console.log('GROUPID already exists.');
    }

    if (!keys.includes('GROUP_NAME')) {
      console.log('Creating GROUP_NAME...');
      await databases.createStringAttribute(dbId, colId, 'GROUP_NAME', 255, false, null);
      console.log('GROUP_NAME created.');
    } else {
      console.log('GROUP_NAME already exists.');
    }

    if (!keys.includes('VARIANT_NAME')) {
      console.log('Creating VARIANT_NAME...');
      await databases.createStringAttribute(dbId, colId, 'VARIANT_NAME', 255, false, null);
      console.log('VARIANT_NAME created.');
    } else {
      console.log('VARIANT_NAME already exists.');
    }

  } catch(e) {
    console.error('Error:', e.message);
  }
}
run();
