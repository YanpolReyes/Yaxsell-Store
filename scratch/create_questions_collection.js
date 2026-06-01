const sdk = require('node-appwrite');
const c = new sdk.Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('6a0a4e8d0032177f3f90')
  .setKey('standard_c476eaadc21bbecc3b6949ee4d0a932613b7a3d4ee52c80cf2c1406750ff75267becfad617da0acd444d0b903b8faea19661d48b2f8b6dc09b678e0db164ddd4b472417c3477a091188554bdd2adfad944778a2927090744ae991c9dcf48c7cebc60e437f5c8a841ffb0736da27daf197bf5716065c2ea5dda65070b07d74642');
const db = new sdk.Databases(c);

async function run() {
  const dbId = '6a0a58ca001798410d86';
  const colId = 'product_questions';
  
  try {
    console.log('Creating collection "product_questions"...');
    const col = await db.createCollection(
      dbId,
      colId,
      'Preguntas y Respuestas',
      [
        sdk.Permission.read('any'),
        sdk.Permission.create('users'),
        sdk.Permission.update('users'),
        sdk.Permission.delete('users')
      ]
    );
    console.log('Collection created successfully! Creating attributes...');
    
    // Create attributes sequentially to avoid API collision issues
    await db.createStringAttribute(dbId, colId, 'PRODUCTID', 255, true);
    console.log('- PRODUCTID attribute created');
    
    await db.createStringAttribute(dbId, colId, 'USERID', 255, true);
    console.log('- USERID attribute created');
    
    await db.createStringAttribute(dbId, colId, 'USERNAME', 255, false);
    console.log('- USERNAME attribute created');
    
    await db.createStringAttribute(dbId, colId, 'QUESTION', 1000, true);
    console.log('- QUESTION attribute created');
    
    await db.createStringAttribute(dbId, colId, 'ANSWER', 1000, false);
    console.log('- ANSWER attribute created');
    
    await db.createStringAttribute(dbId, colId, 'ANSWEREDBY', 255, false);
    console.log('- ANSWEREDBY attribute created');
    
    await db.createIntegerAttribute(dbId, colId, 'CREATEDAT', false);
    console.log('- CREATEDAT attribute created');
    
    await db.createIntegerAttribute(dbId, colId, 'ANSWEREDAT', false);
    console.log('- ANSWEREDAT attribute created');
    
    console.log('All attributes and schemas successfully built in Appwrite!');
  } catch (e) {
    if (e.message && e.message.includes('already exists')) {
      console.log('Collection "product_questions" already exists. Verifying setup...');
    } else {
      console.error('Error setting up product_questions collection:', e);
    }
  }
}
run();
