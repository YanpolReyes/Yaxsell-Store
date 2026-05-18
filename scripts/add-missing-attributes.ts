/**
 * Agrega atributos faltantes (section, barcode, sku, PACKQTY) 
 * a las colecciones de Appwrite (products e inventory_products).
 * 
 * Uso: npx tsx scripts/add-missing-attributes.ts
 * 
 * Requiere APPWRITE_API_KEY (desde Appwrite Dashboard > API Keys)
 * Ejemplo PowerShell:
 *   $env:APPWRITE_API_KEY="your-key"; npx tsx scripts/add-missing-attributes.ts
 */

import { Client, Databases } from 'node-appwrite';

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6a0a4e8d0032177f3f90';
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '6a0a58ca001798410d86';
const apiKey = process.env.APPWRITE_API_KEY || '';

if (!apiKey) {
  console.error('❌ Set APPWRITE_API_KEY env var (from Appwrite Dashboard > API Keys)');
  console.error('   Example: $env:APPWRITE_API_KEY="your-key"; npx tsx scripts/add-missing-attributes.ts');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const db = new Databases(client);

const collections = ['products', 'inventory_products'];

async function createAttr(fn: () => Promise<any>, name: string, collId: string) {
  try {
    await fn();
    console.log(`  ✅ ${name} created in ${collId}`);
  } catch (e: any) {
    const msg = String(e?.message || e || '');
    if (msg.includes('already exists') || msg.includes('409') || msg.includes('Attribute already')) {
      console.log(`  ⏭️  ${name} already exists in ${collId}`);
    } else {
      console.error(`  ❌ ${name} in ${collId}: ${msg}`);
    }
  }
}

async function main() {
  for (const collId of collections) {
    console.log(`\n📦 Collection: ${collId}`);

    await createAttr(
      () => db.createIntegerAttribute(databaseId, collId, 'section', false),
      'section (integer)', collId,
    );

    await createAttr(
      () => db.createStringAttribute(databaseId, collId, 'barcode', 64, false),
      'barcode (string 64)', collId,
    );

    await createAttr(
      () => db.createStringAttribute(databaseId, collId, 'sku', 128, false),
      'sku (string 128)', collId,
    );

    // PACKQTY para inventory_products (products ya lo tiene probablemente)
    await createAttr(
      () => db.createIntegerAttribute(databaseId, collId, 'PACKQTY', false),
      'PACKQTY (integer)', collId,
    );
  }

  console.log('\n⏳ Wait ~30s for Appwrite to process attributes, then try again.');
}

main().catch(console.error);
