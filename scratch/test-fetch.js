const { Client, Databases } = require('node-appwrite');

async function test() {
  const client = new Client()
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject('6a0a4e8d0032177f3f90');
  
  const databases = new Databases(client);
  const databaseId = '6a0a58ca001798410d86';
  const collectionId = 'products';
  const productId = '6a1b22f10033e59ac736';
  
  try {
    const doc = await databases.getDocument(databaseId, collectionId, productId);
    console.log('SUCCESS: Product found in Appwrite!');
    console.log(JSON.stringify(doc, null, 2));
  } catch (err) {
    console.log('ERROR: Failed to fetch product from Appwrite!');
    console.error(err);
  }
}

test();
