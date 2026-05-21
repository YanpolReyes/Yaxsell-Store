import { Client, Databases, ID, Query } from 'node-appwrite';

// =============================================
// CONFIG — REEMPLAZAR CON VALORES REALES
// =============================================
const OLD_ENDPOINT    = 'https://nyc.cloud.appwrite.io/v1';
const OLD_PROJECT_ID  = '6a0a4e8d0032177f3f90';
const OLD_DATABASE_ID = '6a0a58ca001798410d86';
const OLD_API_KEY     = 'standard_dea4a8654ed430bf3626a6cd6506a562cbfcebb7caeb417a1e83c8228ed1de0a84d60b11cc4776d023d0c5ac8d1dcb0ba59e43fef5fb8831a7252aaf5b2f13896769e2a5af222f9853d7f7abcada2d034e1d92e3b73d8de53d1c29adde00cd723aa5612189b2ee702e798acb0dffeb9ff154714a5f7af060c78567391d49923d';

const NEW_ENDPOINT    = 'https://NUEVO_ENDPOINT/v1';
const NEW_PROJECT_ID  = 'NUEVO_PROJECT_ID';
const NEW_DATABASE_ID = 'NUEVO_DATABASE_ID';
const NEW_API_KEY     = 'NUEVO_API_KEY';

const oldClient = new Client().setEndpoint(OLD_ENDPOINT).setProject(OLD_PROJECT_ID).setKey(OLD_API_KEY);
const newClient = new Client().setEndpoint(NEW_ENDPOINT).setProject(NEW_PROJECT_ID).setKey(NEW_API_KEY);
const oldDb = new Databases(oldClient);
const newDb = new Databases(newClient);

const idMap = new Map<string, string>();

const MIGRATION_ORDER = [
  'sequences', 'categories', 'subcategories', 'theme_config', 'store_settings',
  'apertura_settings', 'products', 'inventory_products', 'banners', 'discount_coupons',
  'users', 'timed_offers', 'orders', 'reviews', 'favorites', 'notifications',
  'addresses', 'house_product_positions', 'banner_overlay_positions', 'hotspot_panels',
  'product_votes', 'clips', 'live_streams', 'live_raffles', 'raffle_participants',
  'stock_alerts', 'stock_movements', 'support_tickets', 'fcm_tokens',
  'order_status_history', 'wholesale_requests', 'points_store_items', 'page_views',
];

const REFERENCE_FIELDS: Record<string, string[]> = {
  products: ['CATEGORYID', 'SUBCATEGORYID'],
  subcategories: ['categoryId'],
  inventory_products: ['CATEGORYID', 'SUBCATEGORYID', 'published_product_id'],
  orders: ['USERID'],
  reviews: ['PRODUCTID', 'USERID'],
  favorites: ['userId', 'productId'],
  notifications: ['userId'],
  addresses: ['userId'],
  house_product_positions: ['PRODUCTID', 'CATEGORYID'],
  banner_overlay_positions: ['BANNERID', 'PRODUCTID'],
  clips: ['PRODUCTID', 'USERID'],
  live_raffles: ['LIVESTREAMID'],
  raffle_participants: ['raffleId', 'userId'],
  stock_alerts: ['productId', 'userId'],
  stock_movements: ['productId'],
  support_tickets: ['userId'],
  fcm_tokens: ['userId'],
  order_status_history: ['orderId'],
  wholesale_requests: ['userId'],
  timed_offers: ['targetId'],
};

async function migrateCollection(collId: string) {
  console.log(`\n📋 Migrando: ${collId}`);

  let allDocs: any[] = [];
  let offset = 0;
  const limit = 100;

  try {
    while (true) {
      const res = await oldDb.listDocuments(OLD_DATABASE_ID, collId, [
        Query.limit(limit),
        Query.offset(offset),
      ]);
      allDocs.push(...res.documents);
      if (res.documents.length < limit) break;
      offset += limit;
    }
  } catch (e: any) {
    console.error(`  ❌ Error leyendo:`, e.message?.substring(0, 100));
    return;
  }

  if (allDocs.length === 0) {
    console.log(`  ⏭️  Vacía`);
    return;
  }

  console.log(`  📦 ${allDocs.length} documentos`);

  const refFields = REFERENCE_FIELDS[collId] || [];
  let created = 0;
  let skipped = 0;

  for (const doc of allDocs) {
    const oldId = doc.$id;
    const data: Record<string, any> = {};

    for (const [key, value] of Object.entries(doc)) {
      if (key.startsWith('$')) continue;
      if (refFields.includes(key)) {
        data[key] = idMap.get(value) || value;
      } else {
        data[key] = value;
      }
    }

    try {
      const newDoc = await newDb.createDocument(NEW_DATABASE_ID, collId, ID.unique(), data);
      idMap.set(oldId, newDoc.$id);
      created++;
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        skipped++;
      } else {
        console.error(`  ❌ Doc ${oldId}:`, e.message?.substring(0, 80));
      }
    }

    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`  ✅ Creados: ${created}, Saltados: ${skipped}`);
}

async function migrateAll() {
  console.log('🚀 Iniciando migración de datos...\n');

  for (const collId of MIGRATION_ORDER) {
    await migrateCollection(collId);
  }

  console.log('\n🎉 Migración completada!');
  console.log(`📊 IDs mapeados: ${idMap.size}`);
}

migrateAll().catch(console.error);
