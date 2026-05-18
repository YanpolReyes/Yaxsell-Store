/**
 * Fix page_views + store_settings collection permissions to allow client-side writes.
 * Uses Appwrite REST API directly.
 * 
 * Uso: $env:APPWRITE_API_KEY="tu-key"; npx tsx scripts/fix-page-views-perms.ts
 */

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6a0a4e8d0032177f3f90';
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '6a0a58ca001798410d86';
const apiKey = process.env.APPWRITE_API_KEY || '';

if (!apiKey) {
  console.error('❌ Set APPWRITE_API_KEY env var');
  process.exit(1);
}

async function fixCollection(collectionId: string) {
  const url = `${endpoint}databases/${databaseId}/collections/${collectionId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-Appwrite-Project': projectId,
      'X-Appwrite-Key': apiKey,
    },
    body: JSON.stringify({
      enabled: true,
      documentSecurity: false,
    }),
  });

  if (res.ok) {
    console.log(`  ✅ ${collectionId} — enabled + documentSecurity=false`);
  } else {
    const text = await res.text();
    console.error(`  ❌ ${collectionId} — ${res.status}: ${text}`);
  }
}

async function main() {
  console.log('\n🔧 Fixing collection permissions...\n');
  await fixCollection('page_views');
  await fixCollection('store_settings');
  console.log('\n✅ Done! Collections now allow client-side writes without auth.');
}

main().catch(console.error);
