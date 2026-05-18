/**
 * Crea colecciones faltantes en Appwrite.
 * 
 * Uso: $env:APPWRITE_API_KEY="tu-key"; npx tsx scripts/create-collections.ts
 */

import { Client, Databases } from 'node-appwrite';

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6a0a4e8d0032177f3f90';
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '6a0a58ca001798410d86';
const apiKey = process.env.APPWRITE_API_KEY || '';

if (!apiKey) {
  console.error('❌ Set APPWRITE_API_KEY env var');
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const db = new Databases(client);

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
  // ── store_settings ──
  console.log('\n📦 Collection: store_settings');
  try {
    await db.createCollection(databaseId, 'store_settings', 'Store Settings');
    console.log('  ✅ Collection created');
  } catch (e: any) {
    if (String(e?.message || '').includes('already exists') || String(e?.code || '').includes('409'))
      console.log('  ⏭️  Collection already exists');
    else console.error('  ❌ Create collection:', e?.message || e);
  }

  const collId = 'store_settings';
  await createAttr(() => db.createStringAttribute(databaseId, collId, 'STORENAME', 200, false), 'STORENAME', collId);
  await createAttr(() => db.createStringAttribute(databaseId, collId, 'PHONE', 50, false), 'PHONE', collId);
  await createAttr(() => db.createStringAttribute(databaseId, collId, 'EMAIL', 200, false), 'EMAIL', collId);
  await createAttr(() => db.createStringAttribute(databaseId, collId, 'ADDRESS', 500, false), 'ADDRESS', collId);
  await createAttr(() => db.createStringAttribute(databaseId, collId, 'WEBSITE', 300, false), 'WEBSITE', collId);
  await createAttr(() => db.createStringAttribute(databaseId, collId, 'DESCRIPTION', 1000, false), 'DESCRIPTION', collId);
  await createAttr(() => db.createBooleanAttribute(databaseId, collId, 'SHOWINANNOUNCEMENTBAR', false), 'SHOWINANNOUNCEMENTBAR', collId);

  // ── page_views ──
  console.log('\n📦 Collection: page_views');
  try {
    await db.createCollection(databaseId, 'page_views', 'Page Views');
    console.log('  ✅ Collection created');
  } catch (e: any) {
    if (String(e?.message || '').includes('already exists') || String(e?.code || '').includes('409'))
      console.log('  ⏭️  Collection already exists');
    else console.error('  ❌ Create collection:', e?.message || e);
  }

  const pvColl = 'page_views';
  await createAttr(() => db.createStringAttribute(databaseId, pvColl, 'PAGE', 200, true), 'PAGE', pvColl);
  await createAttr(() => db.createIntegerAttribute(databaseId, pvColl, 'VIEWS', false), 'VIEWS', pvColl);
  await createAttr(() => db.createStringAttribute(databaseId, pvColl, 'DATE', 20, true), 'DATE', pvColl);

  console.log('\n⏳ Wait ~30s for Appwrite to process attributes.');
}

main().catch(console.error);
