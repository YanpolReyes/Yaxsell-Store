const appwrite = require('appwrite');
const c = new appwrite.Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('6a0a4e8d0032177f3f90');
const db = new appwrite.Databases(c);

async function run() {
  try {
    // Note: listAttributes might require administrative permissions, but let's see if it works
    const r = await db.listAttributes('6a0a58ca001798410d86', 'products');
    console.log('Attributes:');
    r.attributes.forEach(a => {
      console.log(`- ${a.key} (${a.type}) - required: ${a.required}, status: ${a.status}`);
    });
  } catch(e) {
    console.error('Error listing attributes:', e.message);
  }
}
run();
