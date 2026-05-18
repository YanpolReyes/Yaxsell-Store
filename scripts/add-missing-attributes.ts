/**
 * Agrega atributos faltantes (section, barcode, sku) a las colecciones de Appwrite.
 * 
 * Uso: npx tsx scripts/add-missing-attributes.ts
 * 
 * O con variables de entorno:
 *   APPWRITE_API_KEY=xxx npx tsx scripts/add-missing-attributes.ts
 */

import { Client, Databases } from 'node-appwrite';

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6a0a4e8d0032177f3f90';
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '6a0a58ca001798410d86';
const apiKey = process.env.APPWRITE_API_KEY || '';

if (!apiKey) {
  console.error('❌ Set APPWRITE_API_KEY env var (from Appwrite Dashboard > API Keys)');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const db = new Databases(client);

const collections = ['products', 'inventory_products'];

async function main() {
  for (const collId of collections) {
    console.log(`\n📦 Collection: ${collId}`);
    
    try {
      await db.createIntegerAttribute(databaseId, collId, 'section', false, undefined);
      console.log(`  ✅ section (integer) created`);
    } catch (e: any) {
      if (e.message?.includes('already exists')) console.log(`  ⏭️  section already exists`);
      else console.error(`  ❌ section: ${e.message}`);
    }

    try {
      await db.createStringAttribute(databaseId, collId, 'barcode', 64, false, undefined);
      console.log(`  ✅ barcode (string) created`);
    } catch (e: any) {
      if (e.message?.includes('already exists')) console.log(`  ⏭️  barcode already exists`);
      else console.error(`  ❌ barcode: ${e.message}`);
    }

    try {
      await db.createStringAttribute(databaseId, collId, 'sku', 128, false, undefined);
      console.log(`  ✅ sku (string) created`);
    } catch (e: any) {
      if (e.message?.includes('already exists')) console.log(`  ⏭️  sku already exists`);
      else console.error(`  ❌ sku: ${e.message}`);
    }
  }

  console.log('\n⏳ Wait ~30s for Appwrite to process attributes, then try again.');
}

main().catch(console.error);
