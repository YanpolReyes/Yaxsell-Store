/**
 * Script para crear la infraestructura de Appwrite en una nueva cuenta
 * Atributos extraidos de src/types/index.ts y src/types/admin.ts
 * 
 * USO:
 * 1. Actualizar las credenciales abajo
 * 2. Ejecutar: npx tsx scripts/create-appwrite-infrastructure.ts
 *    (requiere Node 18+ para fetch global)
 */

// ============================================
// CONFIGURACIÓN - ACTUALIZAR ESTO
// ============================================
const NEW_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const NEW_PROJECT_ID = '6a0a4e8d0032177f3f90';
const NEW_DATABASE_ID = '6a0a58ca001798410d86';
const NEW_API_KEY = 'standard_dea4a8654ed430bf3626a6cd6506a562cbfcebb7caeb417a1e83c8228ed1de0a84d60b11cc4776d023d0c5ac8d1dcb0ba59e43fef5fb8831a7252aaf5b2f13896769e2a5af222f9853d7f7abcada2d034e1d92e3b73d8de53d1c29adde00cd723aa5612189b2ee702e798acb0dffeb9ff154714a5f7af060c78567391d49923d';

const headers: Record<string, string> = {
  'Content-Type': 'application/json',
  'X-Appwrite-Project': NEW_PROJECT_ID,
  'X-Appwrite-Key': NEW_API_KEY,
};

// ============================================
// TIPO PARA ATRIBUTOS
// ============================================
type AttrDef = {
  key: string;
  type: 'string' | 'integer' | 'boolean' | 'double';
  size?: number;         // solo string
  required?: boolean;
  min?: number;          // integer/double
  max?: number;          // integer/double
  default?: any;
};

type CollDef = {
  collectionId: string;
  name: string;
  attributes: AttrDef[];
};

type BucketDef = {
  bucketId: string;
  name: string;
};

// ============================================
// COLECCIONES — Basado en src/types/index.ts + admin.ts
// ============================================
const COLLECTIONS: CollDef[] = [
  // ── products ──────────────────────────────────────────
  // Fuente: types/index.ts Product + types/admin.ts Product + import-jumpseller
  {
    collectionId: 'products',
    name: 'Products',
    attributes: [
      { key: 'NAME',               type: 'string',  size: 256,  required: true },
      { key: 'DESCRIPTION',        type: 'string',  size: 8192, required: false },
      { key: 'PRICE',              type: 'integer', required: true, min: 0 },
      { key: 'CURRENTPRICE',       type: 'integer', required: false, min: 0 },
      { key: 'COST',               type: 'integer', required: false, min: 0 },
      { key: 'STOCK',              type: 'integer', required: true, min: 0 },
      { key: 'SOLDQUANTITY',       type: 'integer', required: false, min: 0 },
      { key: 'CATEGORYID',         type: 'string',  size: 256,  required: false },
      { key: 'SUBCATEGORYID',      type: 'string',  size: 256,  required: false },
      { key: 'SELLERID',           type: 'string',  size: 256,  required: false },
      { key: 'IMAGEURL',           type: 'string',  size: 2048, required: false },
      { key: 'IMAGEURL2',          type: 'string',  size: 2048, required: false },
      { key: 'IMAGEURL3',          type: 'string',  size: 2048, required: false },
      { key: 'IMAGEURL4',          type: 'string',  size: 2048, required: false },
      { key: 'IMAGEURL5',          type: 'string',  size: 2048, required: false },
      { key: 'VIDEOURL',           type: 'string',  size: 2048, required: false },
      { key: 'PRODUCT_VIDEO_URL',  type: 'string',  size: 2048, required: false },
      { key: 'RATING',             type: 'double',  required: false },
      { key: 'NUMREVIEWS',         type: 'integer', required: false, min: 0 },
      { key: 'WHOLESALEPRICE',     type: 'integer', required: false, min: 0 },
      { key: 'WHOLESALEMINQUANTITY', type: 'integer', required: false, min: 0 },
      { key: 'TAGS',               type: 'string',  size: 2048, required: false },
      { key: 'FEATURES',           type: 'string',  size: 8192, required: false },
      { key: 'ISFEATURED',         type: 'boolean', required: false },
      { key: 'ISACTIVE',           type: 'boolean', required: false },
      { key: 'PACKQTY',            type: 'integer', required: false, min: 0 },
      { key: 'RESTOCKTHRESHOLD',   type: 'integer', required: false, min: 0 },
      { key: 'CUSTOM_PRIMARY_COLOR',    type: 'string', size: 50,  required: false },
      { key: 'CUSTOM_SECONDARY_COLOR', type: 'string', size: 50,  required: false },
      { key: 'CUSTOM_USE_GRADIENT',    type: 'boolean', required: false },
      { key: 'CUSTOM_COVER_URL',       type: 'string', size: 2048, required: false },
      { key: 'jumpseller_id',      type: 'string',  size: 256,  required: false },
    ],
  },

  // ── categories ─────────────────────────────────────────
  // Fuente: types/admin.ts Category
  {
    collectionId: 'categories',
    name: 'Categories',
    attributes: [
      { key: 'name',                type: 'string',  size: 256,  required: true },
      { key: 'iconUrl',             type: 'string',  size: 2048, required: false },
      { key: 'order',               type: 'integer', required: false, min: 0 },
      { key: 'color',               type: 'string',  size: 50,   required: false },
      { key: 'BACKGROUND_IMAGE_URL', type: 'string', size: 2048, required: false },
    ],
  },

  // ── subcategories ──────────────────────────────────────
  // Fuente: types/admin.ts Subcategory + types/index.ts Subcategory
  {
    collectionId: 'subcategories',
    name: 'Subcategories',
    attributes: [
      { key: 'name',                     type: 'string', size: 256,  required: true },
      { key: 'categoryId',               type: 'string', size: 256,  required: true },
      { key: 'order',                    type: 'integer', required: false, min: 0 },
      { key: 'ORDER',                    type: 'integer', required: false, min: 0 },
      { key: 'ICON_URL',                 type: 'string', size: 2048, required: false },
      { key: 'BACKGROUND_IMAGE_URL',     type: 'string', size: 2048, required: false },
      { key: 'ZOOM_BACKGROUND_IMAGE_URL', type: 'string', size: 2048, required: false },
      { key: 'COLOR',                    type: 'string', size: 50,   required: false },
      { key: 'description',              type: 'string', size: 1024, required: false },
    ],
  },

  // ── banners ────────────────────────────────────────────
  // Fuente: types/admin.ts Banner + memory (UPPERCASE)
  {
    collectionId: 'banners',
    name: 'Banners',
    attributes: [
      { key: 'TITLE',        type: 'string',  size: 256,  required: false },
      { key: 'DESCRIPTION',  type: 'string',  size: 1024, required: false },
      { key: 'IMAGEURL',     type: 'string',  size: 2048, required: true },
      { key: 'LINKURL',      type: 'string',  size: 2048, required: false },
      { key: 'DURATION',     type: 'integer', required: false, min: 0 },
      { key: 'ISACTIVE',     type: 'boolean', required: false },
      { key: 'DISPLAYORDER', type: 'integer', required: false, min: 0 },
      { key: 'CLICKS',       type: 'integer', required: false, min: 0 },
      { key: 'VIEWS',        type: 'integer', required: false, min: 0 },
    ],
  },

  // ── orders ─────────────────────────────────────────────
  // Fuente: types/index.ts Order + types/admin.ts Order + checkout/page.tsx
  {
    collectionId: 'orders',
    name: 'Orders',
    attributes: [
      { key: 'USERID',           type: 'string',  size: 256,   required: false },
      { key: 'ORDERCODE',        type: 'string',  size: 50,    required: true },
      { key: 'ORDERINDEX',       type: 'integer', required: true, min: 0 },
      { key: 'CUSTOMERNAME',     type: 'string',  size: 256,   required: true },
      { key: 'CUSTOMEREMAIL',    type: 'string',  size: 256,   required: false },
      { key: 'CUSTOMERRUT',      type: 'string',  size: 50,    required: false },
      { key: 'CUSTOMERPHONE',    type: 'string',  size: 50,    required: false },
      { key: 'REGION',           type: 'string',  size: 100,   required: false },
      { key: 'COMUNA',           type: 'string',  size: 100,   required: false },
      { key: 'ADDRESS',          type: 'string',  size: 512,   required: false },
      { key: 'ADDITIONALINFO',   type: 'string',  size: 512,   required: false },
      { key: 'ADDRESSPHOTOURL',  type: 'string',  size: 2048,  required: false },
      { key: 'PAYMENTMETHOD',    type: 'string',  size: 50,    required: false },
      { key: 'SHIPPINGAGENCY',   type: 'string',  size: 100,   required: false },
      { key: 'SHIPPINGADDRESS',  type: 'string',  size: 2048,  required: false },
      { key: 'SUBTOTAL',         type: 'integer', required: true, min: 0 },
      { key: 'SHIPPINGCOST',     type: 'integer', required: false, min: 0 },
      { key: 'TOTAL',            type: 'integer', required: true, min: 0 },
      { key: 'STATUS',           type: 'string',  size: 50,    required: true },
      { key: 'ITEMS',            type: 'string',  size: 50000, required: false },
      { key: 'CREATEDAT',        type: 'integer', required: true, min: 0 },
      { key: 'UPDATEDAT',        type: 'integer', required: false, min: 0 },
      { key: 'EXPIRESAT',        type: 'integer', required: false, min: 0 },
      { key: 'AUTOCANCELENABLED', type: 'boolean', required: false },
      { key: 'PAYMENTPROOFURL',  type: 'string',  size: 2048,  required: false },
      { key: 'SHIPPINGPROOFURL', type: 'string',  size: 2048,  required: false },
      { key: 'ORDERTYPE',        type: 'string',  size: 50,    required: false },
      { key: 'EXTENSIONCOUNT',   type: 'integer', required: false, min: 0 },
      { key: 'PURCHASEDFROMLIVE', type: 'boolean', required: false },
      { key: 'COUPONCODE',       type: 'string',  size: 100,   required: false },
      { key: 'DISCOUNT',         type: 'integer', required: false, min: 0 },
      { key: 'DISCOUNTAMOUNT',   type: 'integer', required: false, min: 0 },
      { key: 'CUSTOMERNOTE',     type: 'string',  size: 2048,  required: false },
      { key: 'ISGIFT',           type: 'boolean', required: false },
      { key: 'adminNotes',       type: 'string',  size: 4096,  required: false },
    ],
  },

  // ── users ──────────────────────────────────────────────
  // Fuente: lib/users-db.ts UserProfileDoc
  {
    collectionId: 'users',
    name: 'Users',
    attributes: [
      { key: 'userId',    type: 'string',  size: 256,  required: true },
      { key: 'email',     type: 'string',  size: 256,  required: true },
      { key: 'name',      type: 'string',  size: 256,  required: false },
      { key: 'phone',     type: 'string',  size: 100,  required: false },
      { key: 'createdAt', type: 'string',  size: 100,  required: true },
    ],
  },

  // ── notifications ──────────────────────────────────────
  // Fuente: types/admin.ts AdminNotification
  {
    collectionId: 'notifications',
    name: 'Notifications',
    attributes: [
      { key: 'title',   type: 'string',  size: 256,  required: true },
      { key: 'message', type: 'string',  size: 4096, required: true },
      { key: 'type',    type: 'string',  size: 50,   required: false },
      { key: 'userId',  type: 'string',  size: 256,  required: false },
      { key: 'isRead',  type: 'boolean', required: false },
    ],
  },

  // ── timed_offers ───────────────────────────────────────
  // Fuente: types/admin.ts TimedOffer
  {
    collectionId: 'timed_offers',
    name: 'Timed Offers',
    attributes: [
      { key: 'title',              type: 'string',  size: 256,  required: true },
      { key: 'offerType',          type: 'string',  size: 50,   required: true },
      { key: 'targetId',           type: 'string',  size: 256,  required: true },
      { key: 'productName',        type: 'string',  size: 256,  required: false },
      { key: 'originalPrice',      type: 'integer', required: true, min: 0 },
      { key: 'discountPrice',       type: 'integer', required: true, min: 0 },
      { key: 'discountPercentage', type: 'integer', required: true, min: 0, max: 100 },
      { key: 'customImagePath',    type: 'string',  size: 2048, required: false },
      { key: 'timeType',           type: 'string',  size: 50,   required: true },
      { key: 'durationHours',      type: 'integer', required: false, min: 0 },
      { key: 'endDateTime',        type: 'string',  size: 100,  required: false },
      { key: 'status',             type: 'string',  size: 50,   required: true },
      { key: 'activatedAt',        type: 'string',  size: 100,  required: false },
      { key: 'isActive',           type: 'boolean', required: false },
      { key: 'createdAt',          type: 'string',  size: 100,  required: false },
      { key: 'updatedAt',          type: 'string',  size: 100,  required: false },
    ],
  },

  // ── live_streams ───────────────────────────────────────
  // Fuente: types/index.ts LiveStream
  {
    collectionId: 'live_streams',
    name: 'Live Streams',
    attributes: [
      { key: 'title',          type: 'string',  size: 256,  required: true },
      { key: 'description',    type: 'string',  size: 2048, required: false },
      { key: 'url',            type: 'string',  size: 2048, required: true },
      { key: 'platform',       type: 'string',  size: 50,   required: false },
      { key: 'status',         type: 'string',  size: 50,   required: true },
      { key: 'isActive',       type: 'boolean', required: false },
      { key: 'thumbnailUrl',   type: 'string',  size: 2048, required: false },
      { key: 'viewerCount',    type: 'integer', required: false, min: 0 },
      { key: 'scheduledAt',    type: 'string',  size: 100,  required: false },
      { key: 'startAt',        type: 'string',  size: 100,  required: false },
      { key: 'muted',          type: 'boolean', required: false },
      { key: 'showText',       type: 'boolean', required: false },
      { key: 'allowFullscreen', type: 'boolean', required: false },
    ],
  },

  // ── support_tickets ────────────────────────────────────
  // Fuente: types/admin.ts SupportTicket
  {
    collectionId: 'support_tickets',
    name: 'Support Tickets',
    attributes: [
      { key: 'userId',     type: 'string',  size: 256,  required: true },
      { key: 'subject',    type: 'string',  size: 256,  required: true },
      { key: 'message',    type: 'string',  size: 4096, required: true },
      { key: 'status',     type: 'string',  size: 50,   required: true },
      { key: 'priority',   type: 'string',  size: 50,   required: false },
      { key: 'adminNotes', type: 'string',  size: 4096, required: false },
    ],
  },

  // ── sequences ──────────────────────────────────────────
  // Fuente: lib/appwrite.ts getNextOrderIndex
  {
    collectionId: 'sequences',
    name: 'Sequences',
    attributes: [
      { key: 'key',   type: 'string',  size: 256, required: true },
      { key: 'value', type: 'integer', required: true, min: 0 },
    ],
  },

  // ── stock_movements ────────────────────────────────────
  // Fuente: types/admin.ts StockMovement
  {
    collectionId: 'stock_movements',
    name: 'Stock Movements',
    attributes: [
      { key: 'productId',   type: 'string',  size: 256,  required: true },
      { key: 'productName', type: 'string',  size: 256,  required: false },
      { key: 'type',        type: 'string',  size: 50,   required: true },
      { key: 'quantity',    type: 'integer', required: true },
      { key: 'reason',      type: 'string',  size: 512,  required: false },
    ],
  },

  // ── fcm_tokens ─────────────────────────────────────────
  {
    collectionId: 'fcm_tokens',
    name: 'FCM Tokens',
    attributes: [
      { key: 'userId',    type: 'string',  size: 256,  required: false },
      { key: 'token',     type: 'string',  size: 512,  required: true },
      { key: 'createdAt', type: 'integer', required: true, min: 0 },
    ],
  },

  // ── order_status_history ───────────────────────────────
  {
    collectionId: 'order_status_history',
    name: 'Order Status History',
    attributes: [
      { key: 'orderId',   type: 'string',  size: 256,  required: true },
      { key: 'status',    type: 'string',  size: 50,   required: true },
      { key: 'createdAt', type: 'integer', required: true, min: 0 },
      { key: 'notes',     type: 'string',  size: 2048, required: false },
    ],
  },

  // ── discount_coupons ───────────────────────────────────
  // Fuente: types/index.ts Coupon + admin coupons page
  {
    collectionId: 'discount_coupons',
    name: 'Discount Coupons',
    attributes: [
      { key: 'code',           type: 'string',  size: 100,  required: true },
      { key: 'type',           type: 'string',  size: 50,   required: true },
      { key: 'value',          type: 'integer', required: true, min: 0 },
      { key: 'isActive',       type: 'boolean', required: false },
      { key: 'maxUses',        type: 'integer', required: false, min: 0 },
      { key: 'usedCount',      type: 'integer', required: false, min: 0 },
      { key: 'minPurchase',    type: 'integer', required: false, min: 0 },
      { key: 'expiresAt',      type: 'integer', required: false, min: 0 },
    ],
  },

  // ── points_store_items ─────────────────────────────────
  {
    collectionId: 'points_store_items',
    name: 'Points Store Items',
    attributes: [
      { key: 'name',        type: 'string',  size: 256,  required: true },
      { key: 'description', type: 'string',  size: 2048, required: false },
      { key: 'pointsCost',  type: 'integer', required: true, min: 0 },
      { key: 'imageUrl',    type: 'string',  size: 2048, required: false },
      { key: 'isActive',    type: 'boolean', required: false },
    ],
  },

  // ── wholesale_requests ─────────────────────────────────
  {
    collectionId: 'wholesale_requests',
    name: 'Wholesale Requests',
    attributes: [
      { key: 'userId',      type: 'string',  size: 256,  required: false },
      { key: 'companyName', type: 'string',  size: 256,  required: true },
      { key: 'rut',         type: 'string',  size: 50,   required: true },
      { key: 'email',       type: 'string',  size: 256,  required: true },
      { key: 'phone',       type: 'string',  size: 100,  required: true },
      { key: 'status',      type: 'string',  size: 50,   required: true },
      { key: 'adminNotes',  type: 'string',  size: 4096, required: false },
      { key: 'rejectionReason', type: 'string', size: 1024, required: false },
      { key: 'createdAt',   type: 'integer', required: true, min: 0 },
    ],
  },

  // ── reviews ────────────────────────────────────────────
  // Fuente: types/index.ts Review
  {
    collectionId: 'reviews',
    name: 'Reviews',
    attributes: [
      { key: 'PRODUCTID',          type: 'string',  size: 256,  required: true },
      { key: 'USERID',             type: 'string',  size: 256,  required: true },
      { key: 'USERNAME',           type: 'string',  size: 256,  required: false },
      { key: 'USERPROFILEIMAGEURL', type: 'string', size: 2048, required: false },
      { key: 'RATING',             type: 'integer', required: true, min: 1, max: 5 },
      { key: 'COMMENT',            type: 'string',  size: 4096, required: false },
      { key: 'CREATEDAT',          type: 'integer', required: true, min: 0 },
      { key: 'REVIEWDATE',         type: 'integer', required: false, min: 0 },
      { key: 'ISEDITED',           type: 'boolean', required: false },
    ],
  },

  // ── favorites ──────────────────────────────────────────
  {
    collectionId: 'favorites',
    name: 'Favorites',
    attributes: [
      { key: 'userId',    type: 'string',  size: 256, required: true },
      { key: 'productId', type: 'string',  size: 256, required: true },
      { key: 'createdAt', type: 'integer', required: true, min: 0 },
    ],
  },

  // ── clips ──────────────────────────────────────────────
  // Fuente: types/index.ts Clip
  {
    collectionId: 'clips',
    name: 'Clips',
    attributes: [
      { key: 'TITLE',           type: 'string',  size: 256,  required: true },
      { key: 'DESCRIPTION',     type: 'string',  size: 2048, required: false },
      { key: 'VIDEOURL',        type: 'string',  size: 2048, required: true },
      { key: 'THUMBNAILURL',    type: 'string',  size: 2048, required: false },
      { key: 'PRODUCTID',       type: 'string',  size: 256,  required: false },
      { key: 'PRODUCTNAME',     type: 'string',  size: 256,  required: false },
      { key: 'PRODUCTPRICE',    type: 'integer', required: false, min: 0 },
      { key: 'PRODUCTIMAGEURL', type: 'string',  size: 2048, required: false },
      { key: 'USERID',          type: 'string',  size: 256,  required: false },
      { key: 'USERNAME',        type: 'string',  size: 256,  required: false },
      { key: 'LIKES',           type: 'integer', required: false, min: 0 },
      { key: 'VIEWS',           type: 'integer', required: false, min: 0 },
      { key: 'ISACTIVE',        type: 'boolean', required: false },
      { key: 'CREATEDAT',       type: 'integer', required: true, min: 0 },
    ],
  },

  // ── live_raffles ───────────────────────────────────────
  // Fuente: types/index.ts Raffle
  {
    collectionId: 'live_raffles',
    name: 'Live Raffles',
    attributes: [
      { key: 'TITLE',           type: 'string',  size: 256,  required: true },
      { key: 'DESCRIPTION',     type: 'string',  size: 2048, required: false },
      { key: 'PRIZE',           type: 'string',  size: 256,  required: true },
      { key: 'PRIZEIMAGEURL',   type: 'string',  size: 2048, required: false },
      { key: 'LIVESTREAMID',    type: 'string',  size: 256,  required: false },
      { key: 'STATUS',          type: 'string',  size: 50,   required: true },
      { key: 'PARTICIPANTS',    type: 'string',  size: 50000, required: false }, // JSON
      { key: 'WINNERID',        type: 'string',  size: 256,  required: false },
      { key: 'WINNERNAME',      type: 'string',  size: 256,  required: false },
      { key: 'MAXPARTICIPANTS', type: 'integer', required: false, min: 0 },
      { key: 'STARTSAT',        type: 'integer', required: false, min: 0 },
      { key: 'ENDSAT',          type: 'integer', required: false, min: 0 },
      { key: 'CREATEDAT',       type: 'integer', required: true, min: 0 },
    ],
  },

  // ── raffle_participants ────────────────────────────────
  {
    collectionId: 'raffle_participants',
    name: 'Raffle Participants',
    attributes: [
      { key: 'raffleId',      type: 'string',  size: 256, required: true },
      { key: 'userId',        type: 'string',  size: 256, required: true },
      { key: 'participatedAt', type: 'integer', required: true, min: 0 },
    ],
  },

  // ── stock_alerts ───────────────────────────────────────
  {
    collectionId: 'stock_alerts',
    name: 'Stock Alerts',
    attributes: [
      { key: 'productId', type: 'string',  size: 256, required: true },
      { key: 'userId',    type: 'string',  size: 256, required: true },
      { key: 'createdAt', type: 'integer', required: true, min: 0 },
    ],
  },

  // ── addresses ──────────────────────────────────────────
  // Fuente: lib/addresses.ts StoredAddress
  {
    collectionId: 'addresses',
    name: 'Addresses',
    attributes: [
      { key: 'userId',    type: 'string',  size: 256, required: true },
      { key: 'name',      type: 'string',  size: 256, required: true },
      { key: 'address',   type: 'string',  size: 512, required: true },
      { key: 'city',      type: 'string',  size: 256, required: true },
      { key: 'region',    type: 'string',  size: 256, required: true },
      { key: 'phone',     type: 'string',  size: 100, required: true },
      { key: 'isDefault', type: 'boolean', required: false },
    ],
  },

  // ── apertura_settings ─────────────────────────────────
  // Fuente: lib/apertura-promo.ts
  {
    collectionId: 'apertura_settings',
    name: 'Apertura Settings',
    attributes: [
      { key: 'isActive',       type: 'boolean', required: false },
      { key: 'discountPercent', type: 'integer', required: false, min: 0, max: 100 },
      { key: 'minPurchase',    type: 'integer', required: false, min: 0 },
      { key: 'createdAt',      type: 'string',  size: 100, required: false },
      { key: 'updatedAt',      type: 'string',  size: 100, required: false },
    ],
  },

  // ── product_votes ──────────────────────────────────────
  // Fuente: types/index.ts ProductVote + api/product-votes/route.ts
  {
    collectionId: 'product_votes',
    name: 'Product Votes',
    attributes: [
      { key: 'PRODUCTTITLE', type: 'string',  size: 256, required: true },
      { key: 'USERID',       type: 'string',  size: 256, required: false },
      { key: 'USERNAME',     type: 'string',  size: 256, required: false },
      { key: 'USEREMAIL',    type: 'string',  size: 256, required: false },
      { key: 'CREATEDAT',    type: 'integer', required: true, min: 0 },
      { key: 'IPADDRESS',    type: 'string',  size: 256, required: false },
    ],
  },

  // ── banner_overlay_positions ───────────────────────────
  // Fuente: types/index.ts BannerOverlayPosition + memory
  {
    collectionId: 'banner_overlay_positions',
    name: 'Banner Overlay Positions',
    attributes: [
      { key: 'BANNERID',       type: 'string',  size: 256, required: true },
      { key: 'PRODUCTID',      type: 'string',  size: 256, required: true },
      { key: 'POSITIONX',      type: 'double',  required: true },
      { key: 'POSITIONY',      type: 'double',  required: true },
      { key: 'SCALE',          type: 'double',  required: false, default: 1.0 },
      { key: 'CIRCLESCALE',    type: 'double',  required: false, default: 1.0 },
      { key: 'DISPLAYTYPE',    type: 'string',  size: 50, required: false, default: 'default' },
      { key: 'CUSTOMIMAGEURL', type: 'string',  size: 2048, required: false },
      { key: 'CIRCLECOLOR',    type: 'string',  size: 50, required: false, default: '#ffffff' },
      { key: 'ISACTIVE',       type: 'boolean', required: false, default: true },
      { key: 'DISPLAYORDER',   type: 'integer', required: false, min: 0, default: 0 },
      { key: 'CLICKS',         type: 'integer', required: false, min: 0, default: 0 },
    ],
  },

  // ── house_product_positions ────────────────────────────
  // Fuente: types/index.ts HouseProductPosition + memory
  {
    collectionId: 'house_product_positions',
    name: 'House Product Positions',
    attributes: [
      { key: 'PRODUCTID',      type: 'string',  size: 256, required: true },
      { key: 'CATEGORYID',     type: 'string',  size: 256, required: false, default: '' },
      { key: 'POSITIONX',      type: 'double',  required: true },
      { key: 'POSITIONY',      type: 'double',  required: true },
      { key: 'ISACTIVE',       type: 'boolean', required: false, default: true },
      { key: 'DISPLAYORDER',   type: 'integer', required: false, min: 0, default: 0 },
      { key: 'SCALE',          type: 'double',  required: false, default: 1.0 },
      { key: 'CIRCLESCALE',    type: 'double',  required: false, default: 1.0 },
      { key: 'CUSTOMIMAGEURL', type: 'string',  size: 2048, required: false },
      { key: 'DISPLAYTYPE',    type: 'string',  size: 50, required: false, default: 'default' },
      { key: 'CIRCLECOLOR',    type: 'string',  size: 50, required: false, default: '#3483fa' },
      { key: 'BACKGROUND',     type: 'string',  size: 50, required: false, default: 'house3' },
    ],
  },

  // ── hotspot_panels ─────────────────────────────────────
  // Fuente: types/index.ts HotspotPanel + memory
  {
    collectionId: 'hotspot_panels',
    name: 'Hotspot Panels',
    attributes: [
      { key: 'IMAGEURL',     type: 'string',  size: 2048, required: true },
      { key: 'TITLE',        type: 'string',  size: 256,  required: false },
      { key: 'LINKURL',      type: 'string',  size: 2048, required: false },
      { key: 'MOSAICGROUP',  type: 'string',  size: 50,   required: false, default: 'main' },
      { key: 'CELLINDEX',    type: 'integer', required: false, min: 0, default: 0 },
      { key: 'ISACTIVE',     type: 'boolean', required: false, default: true },
      { key: 'DISPLAYORDER', type: 'integer', required: false, min: 0, default: 0 },
    ],
  },

  // ── theme_config ───────────────────────────────────────
  // Fuente: lib/section-config.ts
  {
    collectionId: 'theme_config',
    name: 'Theme Config',
    attributes: [
      { key: 'config', type: 'string', size: 50000, required: false },
    ],
  },
];

// ============================================
// STORAGE BUCKETS
// ============================================
const BUCKETS: BucketDef[] = [
  // Un solo bucket para todos los archivos, organizados con prefijos
  // products/, banners/, categories/, comprobantes/, thumbnails/
  { bucketId: 'media', name: 'Media' },
];

// ============================================
// FUNCIONES DE CREACIÓN — API REST
// ============================================
async function apiCall(method: string, url: string, body?: any) {
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${method} ${url} → ${res.status}: ${text}`);
  }
  return res.json();
}

async function createCollection(coll: CollDef) {
  console.log(`\n📦 Creando colección: ${coll.name} (${coll.collectionId})`);

  // 1. Crear colección con permisos read/create/update/delete any
  try {
    await apiCall('POST', `${NEW_ENDPOINT}/databases/${NEW_DATABASE_ID}/collections`, {
      collectionId: coll.collectionId,
      name: coll.name,
      permissions: [
        'read("any")',
        'create("any")',
        'update("any")',
        'delete("any")',
      ],
    });
    console.log('   ✅ Colección creada');
  } catch (e: any) {
    if (e.message?.includes('already exists')) {
      console.log('   ⚠️  Colección ya existe, continuando con atributos');
    } else {
      console.log(`   ⚠️  Error creando colección: ${e.message?.slice(0, 100)}`);
      return; // No podemos crear atributos sin colección
    }
  }

  // Esperar a que la colección esté disponible
  await sleep(2000);

  // 2. Crear atributos uno por uno
  for (const attr of coll.attributes) {
    console.log(`   📝 Atributo: ${attr.key} (${attr.type})`);

    let url = '';
    let body: any = { key: attr.key, required: attr.required ?? false };

    if (attr.type === 'string') {
      url = `${NEW_ENDPOINT}/databases/${NEW_DATABASE_ID}/collections/${coll.collectionId}/attributes/string`;
      body.size = attr.size ?? 256;
      if (attr.default !== undefined) body.default = attr.default;
    } else if (attr.type === 'integer') {
      url = `${NEW_ENDPOINT}/databases/${NEW_DATABASE_ID}/collections/${coll.collectionId}/attributes/integer`;
      if (attr.min !== undefined) body.min = attr.min;
      if (attr.max !== undefined) body.max = attr.max;
      if (attr.default !== undefined) body.default = attr.default;
    } else if (attr.type === 'boolean') {
      url = `${NEW_ENDPOINT}/databases/${NEW_DATABASE_ID}/collections/${coll.collectionId}/attributes/boolean`;
      if (attr.default !== undefined) body.default = attr.default;
    } else if (attr.type === 'double') {
      url = `${NEW_ENDPOINT}/databases/${NEW_DATABASE_ID}/collections/${coll.collectionId}/attributes/float`;
      if (attr.min !== undefined) body.min = attr.min;
      if (attr.max !== undefined) body.max = attr.max;
      if (attr.default !== undefined) body.default = attr.default;
    }

    try {
      await apiCall('POST', url, body);
      console.log(`      ✅ Creado`);
    } catch (e: any) {
      if (e.message?.includes('already exists') || e.message?.includes('attribute already exists')) {
        console.log(`      ⚠️  Ya existe, saltando`);
      } else {
        console.log(`      ⚠️  Error: ${e.message?.slice(0, 120)}`);
      }
    }

    // Esperar entre atributos para no saturar
    await sleep(500);
  }

  console.log(`   ✨ ${coll.name} completada`);
}

async function createBucket(b: BucketDef) {
  console.log(`\n🗂️  Creando bucket: ${b.name} (${b.bucketId})`);
  try {
    await apiCall('POST', `${NEW_ENDPOINT}/storage/buckets`, {
      bucketId: b.bucketId,
      name: b.name,
      permissions: ['read("any")', 'create("any")', 'update("any")', 'delete("any")'],
      fileSecurity: false,
      enabled: true,
      maximumFileSize: 50000000, // 50MB (Appwrite max)
    });
    console.log('   ✅ Bucket creado');
  } catch (e: any) {
    if (e.message?.includes('already exists')) {
      console.log('   ⚠️  Ya existe, saltando');
    } else {
      console.log(`   ⚠️  No se pudo crear: ${e.message?.slice(0, 100)}`);
    }
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// MAIN
// ============================================
async function main() {
  console.log('🚀 Creando infraestructura Appwrite...');
  console.log(`📍 Endpoint: ${NEW_ENDPOINT}`);
  console.log(`🆔 Project: ${NEW_PROJECT_ID}`);
  console.log(`💾 Database: ${NEW_DATABASE_ID}`);
  console.log(`📦 Colecciones: ${COLLECTIONS.length}`);
  console.log(`🗂️  Buckets: ${BUCKETS.length}`);

  // Verificar conexión
  try {
    await fetch(`${NEW_ENDPOINT}/health`, { headers }).then(r => {
      if (!r.ok) throw new Error('Health check failed');
    });
    console.log('✅ Conexión OK');
  } catch (e) {
    console.error('❌ No se puede conectar a Appwrite. Verifica credenciales.');
    process.exit(1);
  }

  try {
    // Buckets
    console.log('\n📁 BUCKETS');
    for (const b of BUCKETS) await createBucket(b);

    // Colecciones
    console.log('\n📦 COLECCIONES');
    for (const c of COLLECTIONS) await createCollection(c);

    console.log('\n✅ Infraestructura creada exitosamente!');
    console.log('\n📝 Siguientes pasos:');
    console.log('1. Actualizar .env.local');
    console.log('2. Actualizar src/lib/appwrite-server.ts');
    console.log('3. Crear documento inicial en sequences: key="order_sequence", value=0');
  } catch (e: any) {
    console.error('\n❌ Error:', e.message);
    process.exit(1);
  }
}

main();
