const h: Record<string, string> = {
  'Content-Type': 'application/json',
  'X-Appwrite-Project': '6a0a4e8d0032177f3f90',
  'X-Appwrite-Key': 'standard_dea4a8654ed430bf3626a6cd6506a562cbfcebb7caeb417a1e83c8228ed1de0a84d60b11cc4776d023d0c5ac8d1dcb0ba59e43fef5fb8831a7252aaf5b2f13896769e2a5af222f9853d7f7abcada2d034e1d92e3b73d8de53d1c29adde00cd723aa5612189b2ee702e798acb0dffeb9ff154714a5f7af060c78567391d49923d',
};
const DB = '6a0a58ca001798410d86';
const BASE = 'https://nyc.cloud.appwrite.io/v1';

const collections = [
  'products', 'inventory_products', 'categories', 'subcategories', 'banners',
  'orders', 'timed_offers', 'sequences', 'discount_coupons', 'points_store_items',
  'users', 'live_streams', 'banner_overlay_positions', 'house_product_positions',
  'hotspot_panels', 'product_votes', 'reviews', 'clips', 'favorites',
  'live_raffles', 'raffle_participants', 'stock_alerts', 'notifications',
  'theme_config', 'apertura_settings', 'support_tickets', 'stock_movements',
  'fcm_tokens', 'order_status_history', 'wholesale_requests', 'addresses',
];

async function main() {
  const results: Record<string, any> = {};
  for (const col of collections) {
    try {
      const r = await fetch(`${BASE}/databases/${DB}/collections/${col}/attributes`, { headers: h });
      const d = await r.json();
      if (d.attributes) {
        results[col] = d.attributes
          .filter((a: any) => a.status === 'available')
          .map((a: any) => ({ key: a.key, type: a.type, size: a.size, required: a.required, default: a.default, array: a.array }));
      } else {
        results[col] = { error: d.message || 'unknown' };
      }
    } catch (e: any) {
      results[col] = { error: e.message };
    }
  }

  // Also get indexes
  for (const col of collections) {
    try {
      const r = await fetch(`${BASE}/databases/${DB}/collections/${col}/indexes`, { headers: h });
      const d = await r.json();
      if (d.indexes && d.indexes.length > 0) {
        results[col]._indexes = d.indexes.map((i: any) => ({ key: i.key, type: i.type, attributes: i.attributes }));
      }
    } catch {}
  }

  console.log(JSON.stringify(results, null, 2));
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
