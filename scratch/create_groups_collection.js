const sdk = require('node-appwrite');

const client = new sdk.Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('6a0a4e8d0032177f3f90')
  .setKey('standard_c476eaadc21bbecc3b6949ee4d0a932613b7a3d4ee52c80cf2c1406750ff75267becfad617da0acd444d0b903b8faea19661d48b2f8b6dc09b678e0db164ddd4b472417c3477a091188554bdd2adfad944778a2927090744ae991c9dcf48c7cebc60e437f5c8a841ffb0736da27daf197bf5716065c2ea5dda65070b07d74642');

const databases = new sdk.Databases(client);
const dbId = '6a0a58ca001798410d86';
const colId = 'product_groups';

async function run() {
  try {
    console.log('Checking if product_groups collection already exists...');
    try {
      await databases.getCollection(dbId, colId);
      console.log('Collection already exists.');
      return;
    } catch (e) {
      console.log('Collection does not exist. Attempting to create it...');
    }

    // Create the collection
    await databases.createCollection(
      dbId,
      colId,
      'Product Groups',
      [
        sdk.Permission.read(sdk.Role.any()),
        sdk.Permission.write(sdk.Role.any()) // Allow read/write for now
      ],
      false
    );
    console.log('Collection created successfully. Creating attributes...');

    // Wait a bit for Appwrite
    await new Promise(r => setTimeout(r, 2000));

    // Create GROUPID attribute (same as document ID, but we can also have a string attribute)
    await databases.createStringAttribute(dbId, colId, 'GROUPID', 100, true);
    console.log('Attribute GROUPID created.');

    // Create GROUP_NAME attribute
    await databases.createStringAttribute(dbId, colId, 'GROUP_NAME', 255, false, null);
    console.log('Attribute GROUP_NAME created.');

    // Create VARIANT_LABELS attribute (JSON string)
    await databases.createStringAttribute(dbId, colId, 'VARIANT_LABELS', 5000, false, null);
    console.log('Attribute VARIANT_LABELS created.');

    console.log('All attributes created successfully. Wait a bit for them to become available...');
  } catch(e) {
    console.error('Error:', e.message);
  }
}
run();
