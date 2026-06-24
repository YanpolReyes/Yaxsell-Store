/**
 * CLONAR BACKEND APPWRITE — Crea toda la infraestructura para un cliente NUEVO
 * - 34 colecciones con schemas completos
 * - 3 storage buckets
 * - Permisos any en todas las colecciones
 * - Documentos semilla (sequences, store_settings, theme_config)
 * 
 * SIN migrar datos del proyecto original. Cliente nuevo = data limpia.
 * 
 * Uso: npx tsx scripts/clone-backend.ts
 */

import { Client, Databases, Storage, ID } from 'node-appwrite';

// ============================================
// CONFIG — PROYECTO NUEVO CLIENTE
// ============================================
const ENDPOINT    = 'https://nyc.cloud.appwrite.io/v1';
const PROJECT_ID  = '6a3c200f000d5437f6c4';
const DATABASE_ID = '6a3c237900227a52bcb2';
const API_KEY     = 'standard_2d173f58f38634c70435e2aa17c03320dc959192545a2e6ec9834b09d80c4f459b4e92b139ee85efba504c423f5bcb1443448799dc7d3b06e811dc0d910d058e7f1093442a87e957beaaaa09569a448ec9e6e8eb178e648e6c48a6451fdffe8716722a1162d89f96e7b243109f537eca0ee1480ef0b639f24ea32e5fdd886f9d';

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const db = new Databases(client);
const storage = new Storage(client);

const ANY_PERMS = ['read("any")', 'create("any")', 'update("any")', 'delete("any")'];

// ============================================
// 34 COLECCIONES — SCHEMAS REALES DEL ORIGINAL
// ============================================

type AttrType = 'string' | 'integer' | 'double' | 'boolean';
interface Attr { key: string; type: AttrType; size?: number; required?: boolean; default?: string | number | boolean | null }
interface Coll { id: string; name: string; attrs: Attr[] }

const COLLECTIONS: Coll[] = [
  // 1. products
  {
    id: 'products', name: 'Products',
    attrs: [
      { key: 'NAME', type: 'string', size: 256, required: true },
      { key: 'DESCRIPTION', type: 'string', size: 8192 },
      { key: 'PRICE', type: 'integer', required: true },
      { key: 'CURRENTPRICE', type: 'integer' },
      { key: 'COST', type: 'integer' },
      { key: 'STOCK', type: 'integer', required: true },
      { key: 'SOLDQUANTITY', type: 'integer' },
      { key: 'CATEGORYID', type: 'string', size: 256 },
      { key: 'SUBCATEGORYID', type: 'string', size: 256 },
      { key: 'IMAGEURL', type: 'string', size: 2048 },
      { key: 'IMAGEURL2', type: 'string', size: 2048 },
      { key: 'IMAGEURL3', type: 'string', size: 2048 },
      { key: 'RATING', type: 'double' },
      { key: 'NUMREVIEWS', type: 'integer' },
      { key: 'WHOLESALEPRICE', type: 'integer' },
      { key: 'WHOLESALEMINQUANTITY', type: 'integer' },
      { key: 'ISFEATURED', type: 'boolean' },
      { key: 'ISACTIVE', type: 'boolean' },
      { key: 'PACKQTY', type: 'integer' },
      { key: 'RESTOCKTHRESHOLD', type: 'integer' },
      { key: 'jumpseller_id', type: 'string', size: 256 },
      { key: 'section', type: 'integer' },
      { key: 'barcode', type: 'string', size: 64 },
      { key: 'sku', type: 'string', size: 128 },
      { key: 'COMING_SOON', type: 'boolean' },
      { key: 'DATE_ADDED', type: 'string', size: 20 },
    ],
  },
  // 2. inventory_products
  {
    id: 'inventory_products', name: 'Inventory Products',
    attrs: [
      { key: 'sku', type: 'string', size: 256 },
      { key: 'barcode', type: 'string', size: 256 },
      { key: 'NAME', type: 'string', size: 256, required: true },
      { key: 'PRICE', type: 'integer', default: '0' },
      { key: 'STOCK', type: 'integer', default: '0' },
      { key: 'CATEGORYID', type: 'string', size: 256 },
      { key: 'SUBCATEGORYID', type: 'string', size: 256 },
      { key: 'IMAGEURL', type: 'string', size: 2048 },
      { key: 'IMAGEURL2', type: 'string', size: 2048 },
      { key: 'IMAGEURL3', type: 'string', size: 2048 },
      { key: 'WHOLESALEPRICE', type: 'integer' },
      { key: 'WHOLESALEMINQUANTITY', type: 'integer' },
      { key: 'ISACTIVE', type: 'boolean', default: false },
      { key: 'published_product_id', type: 'string', size: 256 },
      { key: 'published_at', type: 'string', size: 64 },
      { key: 'imported_at', type: 'string', size: 64 },
      { key: 'FEATURES', type: 'string', size: 2048 },
      { key: 'TAGS', type: 'string', size: 512 },
      { key: 'name_cn', type: 'string', size: 256 },
      { key: 'IMAGEURL4', type: 'string', size: 1024 },
      { key: 'IMAGEURL5', type: 'string', size: 1024 },
      { key: 'PACKQTY', type: 'integer', default: '0' },
      { key: 'section', type: 'integer' },
      { key: 'COMING_SOON', type: 'boolean' },
      { key: 'DATE_ADDED', type: 'string', size: 256 },
    ],
  },
  // 3. categories
  {
    id: 'categories', name: 'Categories',
    attrs: [
      { key: 'name', type: 'string', size: 256, required: true },
      { key: 'iconUrl', type: 'string', size: 2048 },
      { key: 'order', type: 'integer' },
      { key: 'color', type: 'string', size: 50 },
      { key: 'BACKGROUND_IMAGE_URL', type: 'string', size: 2048 },
    ],
  },
  // 4. subcategories
  {
    id: 'subcategories', name: 'Subcategories',
    attrs: [
      { key: 'name', type: 'string', size: 256, required: true },
      { key: 'categoryId', type: 'string', size: 256, required: true },
      { key: 'order', type: 'integer' },
      { key: 'ICON_URL', type: 'string', size: 2048 },
      { key: 'BACKGROUND_IMAGE_URL', type: 'string', size: 2048 },
    ],
  },
  // 5. banners
  {
    id: 'banners', name: 'Banners',
    attrs: [
      { key: 'IMAGEURL', type: 'string', size: 2048, required: true },
      { key: 'LINKURL', type: 'string', size: 2048 },
      { key: 'TITLE', type: 'string', size: 256 },
      { key: 'SUBTITLE', type: 'string', size: 256 },
      { key: 'ISACTIVE', type: 'boolean', default: true },
      { key: 'DISPLAYORDER', type: 'integer', default: '0' },
      { key: 'BANNERTYPE', type: 'string', size: 50, default: 'full' },
    ],
  },
  // 6. orders
  {
    id: 'orders', name: 'Orders',
    attrs: [
      { key: 'ORDERID', type: 'string', size: 50, required: true },
      { key: 'USERID', type: 'string', size: 256 },
      { key: 'ITEMS', type: 'string', size: 16384, required: true },
      { key: 'TOTAL', type: 'integer', required: true },
      { key: 'STATUS', type: 'string', size: 50, required: true, default: 'pending' },
      { key: 'CREATEDAT', type: 'string', size: 50, required: true },
      { key: 'UPDATEDAT', type: 'string', size: 50 },
      { key: 'SHIPPINGADDRESS', type: 'string', size: 2048 },
      { key: 'CUSTOMERNAME', type: 'string', size: 256 },
      { key: 'CUSTOMERPHONE', type: 'string', size: 50 },
      { key: 'CUSTOMEREMAIL', type: 'string', size: 256 },
      { key: 'PAYMENTMETHOD', type: 'string', size: 50 },
      { key: 'PAYMENTPROOF', type: 'string', size: 2048 },
      { key: 'NOTES', type: 'string', size: 2048 },
      { key: 'SHIPPINGCOST', type: 'integer', default: '0' },
      { key: 'DISCOUNT', type: 'integer', default: '0' },
      { key: 'WHOLESALE', type: 'boolean', default: false },
      { key: 'COMUNA', type: 'string', size: 100 },
      { key: 'REGION', type: 'string', size: 100 },
      { key: 'TRACKINGNUMBER', type: 'string', size: 100 },
    ],
  },
  // 7. users
  {
    id: 'users', name: 'Users',
    attrs: [
      { key: 'userId', type: 'string', size: 256, required: true },
      { key: 'email', type: 'string', size: 256, required: true },
      { key: 'name', type: 'string', size: 256 },
      { key: 'phone', type: 'string', size: 100 },
      { key: 'createdAt', type: 'string', size: 100, required: true },
      { key: 'adminNotes', type: 'string', size: 4096 },
      { key: 'isWholesale', type: 'boolean', default: false },
      { key: 'isBanned', type: 'boolean', default: false },
      { key: 'lastAccessAt', type: 'string', size: 100 },
      { key: 'profileCreatedAt', type: 'string', size: 100 },
      { key: 'region', type: 'string', size: 100 },
    ],
  },
  // 8. notifications
  {
    id: 'notifications', name: 'Notifications',
    attrs: [
      { key: 'userId', type: 'string', size: 256, required: true },
      { key: 'type', type: 'string', size: 50, required: true },
      { key: 'title', type: 'string', size: 256, required: true },
      { key: 'message', type: 'string', size: 1024, required: true },
      { key: 'isRead', type: 'boolean', default: false },
      { key: 'data', type: 'string', size: 1024 },
    ],
  },
  // 9. timed_offers
  {
    id: 'timed_offers', name: 'Timed Offers',
    attrs: [
      { key: 'targetId', type: 'string', size: 256, required: true },
      { key: 'targetType', type: 'string', size: 50, required: true },
      { key: 'discountPrice', type: 'integer', required: true },
      { key: 'startTime', type: 'integer', required: true },
      { key: 'endTime', type: 'integer', required: true },
      { key: 'isActive', type: 'boolean', default: true },
    ],
  },
  // 10. support_tickets
  {
    id: 'support_tickets', name: 'Support Tickets',
    attrs: [
      { key: 'userId', type: 'string', size: 256, required: true },
      { key: 'subject', type: 'string', size: 256, required: true },
      { key: 'message', type: 'string', size: 4096, required: true },
      { key: 'status', type: 'string', size: 50, default: 'open' },
      { key: 'createdAt', type: 'string', size: 50, required: true },
      { key: 'updatedAt', type: 'string', size: 50 },
    ],
  },
  // 11. sequences
  {
    id: 'sequences', name: 'Sequences',
    attrs: [
      { key: 'key', type: 'string', size: 100, required: true },
      { key: 'value', type: 'integer', required: true, default: '0' },
    ],
  },
  // 12. discount_coupons
  {
    id: 'discount_coupons', name: 'Discount Coupons',
    attrs: [
      { key: 'CODE', type: 'string', size: 50, required: true },
      { key: 'DISCOUNTTYPE', type: 'string', size: 20, required: true },
      { key: 'DISCOUNTVALUE', type: 'integer', required: true },
      { key: 'ISACTIVE', type: 'boolean', default: true },
      { key: 'STARTDATE', type: 'string', size: 20 },
      { key: 'ENDDATE', type: 'string', size: 20 },
      { key: 'MAXUSES', type: 'integer', default: '0' },
      { key: 'USEDCOUNT', type: 'integer', default: '0' },
      { key: 'MINORDERAMOUNT', type: 'integer', default: '0' },
    ],
  },
  // 13. points_store_items
  {
    id: 'points_store_items', name: 'Points Store Items',
    attrs: [
      { key: 'NAME', type: 'string', size: 256, required: true },
      { key: 'DESCRIPTION', type: 'string', size: 1024 },
      { key: 'IMAGEURL', type: 'string', size: 2048 },
      { key: 'POINTS_COST', type: 'integer', required: true },
      { key: 'ISACTIVE', type: 'boolean', default: true },
    ],
  },
  // 14. wholesale_requests
  {
    id: 'wholesale_requests', name: 'Wholesale Requests',
    attrs: [
      { key: 'userId', type: 'string', size: 256, required: true },
      { key: 'companyName', type: 'string', size: 256 },
      { key: 'rut', type: 'string', size: 50 },
      { key: 'phone', type: 'string', size: 50 },
      { key: 'status', type: 'string', size: 50, default: 'pending' },
      { key: 'createdAt', type: 'string', size: 50, required: true },
    ],
  },
  // 15. reviews
  {
    id: 'reviews', name: 'Reviews',
    attrs: [
      { key: 'PRODUCTID', type: 'string', size: 256, required: true },
      { key: 'USERID', type: 'string', size: 256, required: true },
      { key: 'RATING', type: 'integer', required: true },
      { key: 'COMMENT', type: 'string', size: 2048 },
      { key: 'CREATEDAT', type: 'string', size: 50, required: true },
    ],
  },
  // 16. favorites
  {
    id: 'favorites', name: 'Favorites',
    attrs: [
      { key: 'userId', type: 'string', size: 256, required: true },
      { key: 'productId', type: 'string', size: 256, required: true },
      { key: 'createdAt', type: 'string', size: 50 },
    ],
  },
  // 17. stock_alerts
  {
    id: 'stock_alerts', name: 'Stock Alerts',
    attrs: [
      { key: 'productId', type: 'string', size: 256, required: true },
      { key: 'userId', type: 'string', size: 256, required: true },
      { key: 'createdAt', type: 'integer', required: true },
      { key: 'status', type: 'string', size: 32, default: 'pending' },
      { key: 'productName', type: 'string', size: 256 },
      { key: 'productImage', type: 'string', size: 2048 },
      { key: 'userName', type: 'string', size: 128 },
      { key: 'email', type: 'string', size: 256 },
      { key: 'notified', type: 'boolean', default: false },
      { key: 'sku', type: 'string', size: 128 },
      { key: 'jumpsellerId', type: 'string', size: 64 },
      { key: 'quantity', type: 'integer', default: '1' },
    ],
  },
  // 18. apertura_settings
  {
    id: 'apertura_settings', name: 'Apertura Settings',
    attrs: [
      { key: 'isActive', type: 'boolean', default: false },
      { key: 'startDate', type: 'string', size: 20 },
      { key: 'endDate', type: 'string', size: 20 },
      { key: 'title', type: 'string', size: 256 },
      { key: 'subtitle', type: 'string', size: 256 },
      { key: 'bgColor', type: 'string', size: 50 },
      { key: 'textColor', type: 'string', size: 50 },
      { key: 'config', type: 'string', size: 8192 },
    ],
  },
  // 19. product_votes
  {
    id: 'product_votes', name: 'Product Votes',
    attrs: [
      { key: 'PRODUCTTITLE', type: 'string', size: 256, required: true },
      { key: 'USERID', type: 'string', size: 256 },
      { key: 'USERNAME', type: 'string', size: 256 },
      { key: 'USEREMAIL', type: 'string', size: 256 },
      { key: 'CREATEDAT', type: 'integer', required: true },
      { key: 'IPADDRESS', type: 'string', size: 256 },
    ],
  },
  // 20. banner_overlay_positions
  {
    id: 'banner_overlay_positions', name: 'Banner Overlay Positions',
    attrs: [
      { key: 'BANNERID', type: 'string', size: 256, required: true },
      { key: 'PRODUCTID', type: 'string', size: 256, required: true },
      { key: 'POSITION_X', type: 'double' },
      { key: 'POSITION_Y', type: 'double' },
      { key: 'LABEL', type: 'string', size: 100 },
    ],
  },
  // 21. house_product_positions
  {
    id: 'house_product_positions', name: 'House Product Positions',
    attrs: [
      { key: 'PRODUCTID', type: 'string', size: 256, required: true },
      { key: 'CATEGORYID', type: 'string', size: 256 },
      { key: 'POSITION_X', type: 'double' },
      { key: 'POSITION_Y', type: 'double' },
      { key: 'POSITION_Z', type: 'double' },
      { key: 'CUSTOMIMAGEURL', type: 'string', size: 2048 },
      { key: 'DISPLAYTYPE', type: 'string', size: 50, default: 'default' },
      { key: 'CIRCLECOLOR', type: 'string', size: 50, default: '#3483fa' },
      { key: 'BACKGROUND', type: 'string', size: 50, default: 'house3' },
    ],
  },
  // 22. hotspot_panels
  {
    id: 'hotspot_panels', name: 'Hotspot Panels',
    attrs: [
      { key: 'IMAGEURL', type: 'string', size: 2048, required: true },
      { key: 'TITLE', type: 'string', size: 256 },
      { key: 'LINKURL', type: 'string', size: 2048 },
      { key: 'MOSAICGROUP', type: 'string', size: 50, default: 'main' },
      { key: 'CELLINDEX', type: 'integer', default: '0' },
      { key: 'ISACTIVE', type: 'boolean', default: true },
      { key: 'DISPLAYORDER', type: 'integer', default: '0' },
    ],
  },
  // 23. theme_config
  {
    id: 'theme_config', name: 'Theme Config',
    attrs: [
      { key: 'NAME', type: 'string', size: 100 },
      { key: 'SECTIONS', type: 'string', size: 65536 },
      { key: 'config', type: 'string', size: 65536 },
    ],
  },
  // 24. store_settings
  {
    id: 'store_settings', name: 'Store Settings',
    attrs: [
      { key: 'STORENAME', type: 'string', size: 256 },
      { key: 'ADDRESS', type: 'string', size: 512 },
      { key: 'PHONE', type: 'string', size: 50 },
      { key: 'EMAIL', type: 'string', size: 256 },
      { key: 'WHATSAPP', type: 'string', size: 50 },
      { key: 'LOGOURL', type: 'string', size: 2048 },
      { key: 'CURRENCY', type: 'string', size: 10, default: 'CLP' },
      { key: 'INSTAGRAM', type: 'string', size: 256 },
      { key: 'FACEBOOK', type: 'string', size: 256 },
      { key: 'TIKTOK', type: 'string', size: 256 },
    ],
  },
  // 25. page_views
  {
    id: 'page_views', name: 'Page Views',
    attrs: [
      { key: 'PAGE', type: 'string', size: 256, required: true },
      { key: 'DATE', type: 'string', size: 20, required: true },
      { key: 'VIEWS', type: 'integer', required: true, default: '0' },
    ],
  },
  // 26. admin_chat
  {
    id: 'admin_chat', name: 'Admin Chat',
    attrs: [
      { key: 'userId', type: 'string', size: 128, required: true },
      { key: 'senderRole', type: 'string', size: 20, required: true },
      { key: 'message', type: 'string', size: 2000, required: true },
      { key: 'readByUser', type: 'boolean', default: false },
      { key: 'readByAdmin', type: 'boolean', default: false },
    ],
  },
  // === COLECCIONES QUE EL CÓDIGO REFERENCIA PERO NO EXISTÍAN EN ORIGINAL ===
  // 27. live_streams
  {
    id: 'live_streams', name: 'Live Streams',
    attrs: [
      { key: 'TITLE', type: 'string', size: 256, required: true },
      { key: 'STREAMURL', type: 'string', size: 2048 },
      { key: 'THUMBNAILURL', type: 'string', size: 2048 },
      { key: 'ISLIVE', type: 'boolean', default: false },
      { key: 'CREATEDAT', type: 'string', size: 50, required: true },
      { key: 'ENDEDAT', type: 'string', size: 50 },
      { key: 'PRODUCTIDS', type: 'string', size: 4096 },
    ],
  },
  // 28. live_raffles
  {
    id: 'live_raffles', name: 'Live Raffles',
    attrs: [
      { key: 'LIVESTREAMID', type: 'string', size: 256, required: true },
      { key: 'PRODUCTID', type: 'string', size: 256 },
      { key: 'WINNERID', type: 'string', size: 256 },
      { key: 'STATUS', type: 'string', size: 50, default: 'active' },
      { key: 'CREATEDAT', type: 'string', size: 50, required: true },
    ],
  },
  // 29. raffle_participants
  {
    id: 'raffle_participants', name: 'Raffle Participants',
    attrs: [
      { key: 'raffleId', type: 'string', size: 256, required: true },
      { key: 'userId', type: 'string', size: 256, required: true },
      { key: 'createdAt', type: 'string', size: 50, required: true },
    ],
  },
  // 30. clips
  {
    id: 'clips', name: 'Clips',
    attrs: [
      { key: 'PRODUCTID', type: 'string', size: 256 },
      { key: 'USERID', type: 'string', size: 256 },
      { key: 'VIDEOURL', type: 'string', size: 2048, required: true },
      { key: 'TITLE', type: 'string', size: 256 },
      { key: 'CREATEDAT', type: 'string', size: 50, required: true },
    ],
  },
  // 31. stock_movements
  {
    id: 'stock_movements', name: 'Stock Movements',
    attrs: [
      { key: 'productId', type: 'string', size: 256, required: true },
      { key: 'quantity', type: 'integer', required: true },
      { key: 'type', type: 'string', size: 20, required: true },
      { key: 'reason', type: 'string', size: 256 },
      { key: 'createdAt', type: 'string', size: 50, required: true },
    ],
  },
  // 32. fcm_tokens
  {
    id: 'fcm_tokens', name: 'FCM Tokens',
    attrs: [
      { key: 'userId', type: 'string', size: 256, required: true },
      { key: 'token', type: 'string', size: 512, required: true },
      { key: 'platform', type: 'string', size: 20 },
      { key: 'createdAt', type: 'string', size: 50, required: true },
    ],
  },
  // 33. order_status_history
  {
    id: 'order_status_history', name: 'Order Status History',
    attrs: [
      { key: 'orderId', type: 'string', size: 256, required: true },
      { key: 'status', type: 'string', size: 50, required: true },
      { key: 'changedAt', type: 'string', size: 50, required: true },
      { key: 'changedBy', type: 'string', size: 256 },
      { key: 'note', type: 'string', size: 512 },
    ],
  },
  // 34. addresses
  {
    id: 'addresses', name: 'Addresses',
    attrs: [
      { key: 'userId', type: 'string', size: 256, required: true },
      { key: 'label', type: 'string', size: 100 },
      { key: 'recipientName', type: 'string', size: 256 },
      { key: 'phone', type: 'string', size: 50 },
      { key: 'street', type: 'string', size: 512, required: true },
      { key: 'comuna', type: 'string', size: 100 },
      { key: 'region', type: 'string', size: 100 },
      { key: 'isDefault', type: 'boolean', default: false },
      { key: 'createdAt', type: 'string', size: 50, required: true },
    ],
  },
];

// ============================================
// STORAGE BUCKETS
// ============================================
const BUCKETS = [
  { id: 'products', name: 'Products', maxSize: 50000000 },
  { id: 'ia', name: 'IA Assets', maxSize: 5000000000 },
  { id: 'despachos', name: 'Despachos', maxSize: 5000000000 },
];

// ============================================
// DOCUMENTOS SEMILLA — para que la app arranque
// ============================================
async function seedDocuments() {
  console.log('\n🌱 Creando documentos semilla...\n');

  // sequences — store_template (plantilla por defecto)
  try {
    await db.createDocument(DATABASE_ID, 'sequences', 'store_template', {
      key: 'store_template', value: 1,
    });
    console.log('  ✅ sequences/store_template (value=1)');
  } catch (e: any) {
    if (e.message?.includes('already')) console.log('  ⏭️  sequences/store_template ya existe');
    else console.error(`  ❌ sequences/store_template: ${e.message?.substring(0, 80)}`);
  }

  // sequences — order_sequence
  try {
    await db.createDocument(DATABASE_ID, 'sequences', 'order_sequence', {
      key: 'order_sequence', value: 0,
    });
    console.log('  ✅ sequences/order_sequence (value=0)');
  } catch (e: any) {
    if (e.message?.includes('already')) console.log('  ⏭️  sequences/order_sequence ya existe');
    else console.error(`  ❌ order_sequence: ${e.message?.substring(0, 80)}`);
  }

  // store_settings — config vacía para que el admin la complete
  try {
    await db.createDocument(DATABASE_ID, 'store_settings', 'store_settings_doc', {
      STORENAME: 'Nueva Tienda', ADDRESS: '', PHONE: '', EMAIL: '',
      WHATSAPP: '', LOGOURL: '', CURRENCY: 'CLP',
      INSTAGRAM: '', FACEBOOK: '', TIKTOK: '',
    });
    console.log('  ✅ store_settings/store_settings_doc (vacío)');
  } catch (e: any) {
    if (e.message?.includes('already')) console.log('  ⏭️  store_settings ya existe');
    else console.error(`  ❌ store_settings: ${e.message?.substring(0, 80)}`);
  }

  // theme_config — homepage_sections vacío
  try {
    await db.createDocument(DATABASE_ID, 'theme_config', 'homepage_sections', {
      NAME: 'default', SECTIONS: '[]', config: JSON.stringify({}),
    });
    console.log('  ✅ theme_config/homepage_sections (vacío)');
  } catch (e: any) {
    if (e.message?.includes('already')) console.log('  ⏭️  theme_config/homepage_sections ya existe');
    else console.error(`  ❌ theme_config: ${e.message?.substring(0, 80)}`);
  }
}

// ============================================
// EJECUCIÓN
// ============================================
async function cloneAll() {
  console.log('🚀 Clonando backend Appwrite para nuevo cliente...');
  console.log(`📊 ${COLLECTIONS.length} colecciones + ${BUCKETS.length} buckets\n`);

  let ok = 0, fail = 0;

  // 1. Colecciones
  for (const coll of COLLECTIONS) {
    try {
      try {
        await db.createCollection(DATABASE_ID, coll.id, coll.name, ANY_PERMS);
        console.log(`  ✅ Colección: ${coll.id}`);
      } catch (e: any) {
        if (e.message?.includes('already exists')) {
          console.log(`  ⏭️  Ya existe: ${coll.id}`);
        } else { throw e; }
      }

      // Atributos
      for (const attr of coll.attrs) {
        try {
          if (attr.type === 'string') {
            await db.createStringAttribute(DATABASE_ID, coll.id, attr.key, attr.size || 256, attr.required || false, attr.default as string, false);
          } else if (attr.type === 'integer') {
            await db.createIntegerAttribute(DATABASE_ID, coll.id, attr.key, attr.required || false, undefined, undefined, attr.default as number, false);
          } else if (attr.type === 'double') {
            await db.createFloatAttribute(DATABASE_ID, coll.id, attr.key, attr.required || false, undefined, undefined, attr.default as number, false);
          } else if (attr.type === 'boolean') {
            await db.createBooleanAttribute(DATABASE_ID, coll.id, attr.key, attr.required || false, attr.default as boolean, false);
          }
          await new Promise(r => setTimeout(r, 200));
        } catch (e: any) {
          if (!e.message?.includes('already') && !e.message?.includes('already in use')) {
            console.error(`  ⚠️  ${coll.id}.${attr.key}: ${e.message?.substring(0, 80)}`);
          }
        }
      }
      ok++;
    } catch (e: any) {
      console.error(`  ❌ ${coll.id}: ${e.message?.substring(0, 100)}`);
      fail++;
    }
  }

  console.log(`\n📊 Colecciones: ${ok} OK, ${fail} fallidas`);

  // 2. Buckets
  console.log('\n🪣 Creando storage buckets...\n');
  for (const bucket of BUCKETS) {
    try {
      await storage.createBucket(bucket.id, bucket.name, ANY_PERMS, false, bucket.maxSize);
      console.log(`  ✅ Bucket: ${bucket.id}`);
    } catch (e: any) {
      if (e.message?.includes('already exists')) console.log(`  ⏭️  Bucket ya existe: ${bucket.id}`);
      else console.error(`  ❌ Bucket ${bucket.id}: ${e.message?.substring(0, 80)}`);
    }
  }

  // 3. Documentos semilla
  await seedDocuments();

  console.log('\n🎉 Backend clonado! Colecciones vacías listas para el nuevo cliente.');
}

cloneAll().catch(console.error);
