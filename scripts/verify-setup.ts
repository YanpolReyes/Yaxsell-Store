// Verify new Appwrite project setup
import { Client, Databases } from 'node-appwrite';

const ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const PROJECT_ID = '6a0e374b0009138bc6fa';
const DATABASE_ID = '6a0e37ac0016762b9dc4';
const API_KEY = 'standard_4fc3847401fa354922245a979fdbb343bf0ba794d2b569f63fd8083bb493cd21ce2571d2c9f2d88747e7a79553faa4635eddf5500842d0ee132f9f0b853a12f678e88c4a3b2327f8dcc13ac9981f52e6cffd9efbbb2eab7a3e353f9ba18466821df3d08f7d40a5625388a3ce4bd2f6248b1ac12661045180dd2a031fec206641';

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const db = new Databases(client);

async function verify() {
  console.log('🔍 VERIFICACIÓN DEL NUEVO PROYECTO APPWRITE\n');

  // 1. Check database
  try {
    const database = await db.get(DATABASE_ID);
    console.log(`✅ Database: ${database.name} (${database.$id})`);
  } catch (e: any) {
    console.error(`❌ Database error: ${e.message}`);
    return;
  }

  // 2. Check collections
  const expectedCollections = [
    'products', 'inventory_products', 'categories', 'subcategories', 'banners',
    'orders', 'timed_offers', 'sequences', 'discount_coupons', 'points_store_items',
    'users', 'live_streams', 'banner_overlay_positions', 'house_product_positions',
    'hotspot_panels', 'product_votes', 'reviews', 'clips', 'favorites',
    'live_raffles', 'raffle_participants', 'stock_alerts', 'notifications',
    'theme_config', 'apertura_settings', 'support_tickets', 'stock_movements',
    'fcm_tokens', 'order_status_history', 'wholesale_requests', 'addresses',
    'page_views', 'store_settings'
  ];

  let okCount = 0;
  let failCount = 0;

  for (const collId of expectedCollections) {
    try {
      const coll = await db.listAttributes(DATABASE_ID, collId);
      const attrCount = coll.attributes?.length || 0;
      const available = coll.attributes?.filter((a: any) => a.status === 'available').length || 0;
      const processing = attrCount - available;
      const status = processing > 0 ? `⚠️ ${processing} processing` : '✅';
      console.log(`  ${status} ${collId}: ${available}/${attrCount} attrs available`);
      okCount++;
    } catch (e: any) {
      console.error(`  ❌ ${collId}: ${e.message?.substring(0, 80)}`);
      failCount++;
    }
  }

  console.log(`\n📊 Colecciones: ${okCount} OK, ${failCount} fallidas`);

  // 3. Check sequences seed
  try {
    const seqDocs = await db.listDocuments(DATABASE_ID, 'sequences');
    console.log(`\n🌱 Sequences: ${seqDocs.total} documentos`);
    seqDocs.documents.forEach((d: any) => console.log(`   - ${d.key} = ${d.value}`));
  } catch (e: any) {
    console.error(`\n❌ Sequences error: ${e.message}`);
  }

  console.log('\n✅ Verificación completada');
}

verify().catch(console.error);
