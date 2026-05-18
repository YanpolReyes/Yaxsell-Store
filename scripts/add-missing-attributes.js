/**
 * Script para agregar atributos faltantes (section, barcode, sku) 
 * a las colecciones de Appwrite.
 * 
 * Uso: node scripts/add-missing-attributes.js
 * 
 * Requiere: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_DATABASE_ID, APPWRITE_API_KEY
 */

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6a0a4e8d0032177f3f90';
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '6a0a58ca001798410d86';

// Appwrite REST API para crear atributos
async function createAttribute(collectionId, attribute) {
  const url = `${endpoint}/databases/${databaseId}/collections/${collectionId}/attributes`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Appwrite-Project': projectId,
    },
    body: JSON.stringify(attribute),
  });
  
  if (res.ok) {
    console.log(`✅ Created ${attribute.key} in ${collectionId}`);
    return true;
  }
  const data = await res.json();
  if (data.message?.includes('already exists') || data.message?.includes('Attribute already exists')) {
    console.log(`⏭️  ${attribute.key} already exists in ${collectionId}`);
    return true;
  }
  console.error(`❌ Error creating ${attribute.key} in ${collectionId}:`, data.message);
  return false;
}

async function main() {
  const collections = ['products', 'inventory_products'];
  
  const attributes = [
    // Integer attribute for section
    { key: 'section', type: 'integer', size: 4, required: false, default: null },
    // String attribute for barcode
    { key: 'barcode', type: 'string', size: 64, required: false, default: null },
    // String attribute for sku
    { key: 'sku', type: 'string', size: 128, required: false, default: null },
  ];

  for (const collectionId of collections) {
    console.log(`\n📦 Processing collection: ${collectionId}`);
    for (const attr of attributes) {
      // Use the correct Appwrite REST API format for each type
      if (attr.type === 'integer') {
        await createAttribute(collectionId, {
          key: attr.key,
          size: attr.size,
          required: attr.required,
          default: attr.default,
        });
      } else {
        await createAttribute(collectionId, {
          key: attr.key,
          size: attr.size,
          required: attr.required,
          default: attr.default,
        });
      }
    }
  }

  console.log('\n⏳ Attributes are being created. Wait ~30s for Appwrite to process, then try again.');
}

main().catch(console.error);
