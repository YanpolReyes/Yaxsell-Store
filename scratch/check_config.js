const appwrite = require('appwrite');
const c = new appwrite.Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('6a0a4e8d0032177f3f90');
const db = new appwrite.Databases(c);

async function run() {
  try {
    const r = await db.listDocuments('6a0a58ca001798410d86', 'theme_config');
    r.documents.forEach(d => {
      console.log('ID:', d.$id);
      const keys = Object.keys(d).filter(k => !k.startsWith('$'));
      keys.forEach(k => {
        console.log(`  ${k}:`, typeof d[k] === 'object' ? JSON.stringify(d[k]).slice(0, 150) : d[k]);
      });
      console.log('------------------------------------');
    });
  } catch(e) {
    console.error(e);
  }
}
run();
