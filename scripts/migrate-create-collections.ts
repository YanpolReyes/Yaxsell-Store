import { Client, Databases, ID, Storage } from 'node-appwrite';

// =============================================
// CONFIG — REEMPLAZAR CON VALORES DEL NUEVO PROYECTO
// =============================================
const ENDPOINT    = 'https://NUEVO_ENDPOINT/v1';
const PROJECT_ID  = 'NUEVO_PROJECT_ID';
const DATABASE_ID = 'NUEVO_DATABASE_ID';
const API_KEY     = 'NUEVO_API_KEY';

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const db = new Databases(client);
const storage = new Storage(client);

type Attr = { key: string; type: 'string'|'integer'|'double'|'boolean'; size?: number; required?: boolean };

interface CollDef {
  id: string;
  name: string;
  attrs: Attr[];
  permissions: string[];
}

const collections: CollDef[] = [
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
    permissions: ['read("any")','create("any")','update("any")','delete("any")'],
  },
  {
    id: 'inventory_products', name: 'Inventory Products',
    attrs: [
      { key: 'sku', type: 'string', size: 256 },
      { key: 'barcode', type: 'string', size: 256 },
      { key: 'NAME', type: 'string', size: 256, required: true },
      { key: 'PRICE', type: 'integer' },
      { key: 'STOCK', type: 'integer' },
      { key: 'CATEGORYID', type: 'string', size: 256 },
      { key: 'SUBCATEGORYID', type: 'string', size: 256 },
      { key: 'IMAGEURL', type: 'string', size: 2048 },
      { key: 'IMAGEURL2', type: 'string', size: 2048 },
      { key: 'IMAGEURL3', type: 'string', size: 2048 },
      { key: 'WHOLESALEPRICE', type: 'integer' },
      { key: 'WHOLESALEMINQUANTITY', type: 'integer' },
      { key: 'ISACTIVE', type: 'boolean' },
      { key: 'published_product_id', type: 'string', size: 256 },
      { key: 'published_at', type: 'string', size: 64 },
      { key: 'imported_at', type: 'string', size: 64 },
      { key: 'FEATURES', type: 'string', size: 2048 },
      { key: 'TAGS', type: 'string', size: 512 },
      { key: 'name_cn', type: 'string', size: 256 },
      { key: 'IMAGEURL4', type: 'string', size: 1024 },
      { key: 'IMAGEURL5', type: 'string', size: 1024 },
      { key: 'PACKQTY', type: 'integer' },
      { key: 'section', type: 'integer' },
      { key: 'COMING_SOON', type: 'boolean' },
      { key: 'DATE_ADDED', type: 'string', size: 256 },
    ],
    permissions: ['read("any")','create("any")','update("any")','delete("any")'],
  },
  {
    id: 'categories', name: 'Categories',
    attrs: [
      { key: 'name', type: 'string', size: 256, required: true },
      { key: 'iconUrl', type: 'string', size: 2048 },
      { key: 'order', type: 'integer' },
      { key: 'color', type: 'string', size: 50 },
      { key: 'BACKGROUND_IMAGE_URL', type: 'string', size: 2048 },
    ],
    permissions: ['read("any")','create("any")','update("any")','delete("any")'],
  },
  {
    id: 'subcategories', name: 'Subcategories',
    attrs: [
      { key: 'name', type: 'string', size: 256, required: true },
      { key: 'categoryId', type: 'string', size: 256, required: true },
      { key: 'order', type: 'integer' },
      { key: 'ICON_URL', type: 'string', size: 2048 },
      { key: 'BACKGROUND_IMAGE_URL', type: 'string', size: 2048 },
      { key: 'ZOOM_BACKGROUND_IMAGE_URL', type: 'string', size: 2048 },
      { key: 'COLOR', type: 'string', size: 50 },
    ],
    permissions: ['read("any")','create("any")','update("any")','delete("any")'],
  },
  {
    id: 'banners', name: 'Banners',
    attrs: [
      { key: 'TITLE', type: 'string', size: 256 },
      { key: 'DESCRIPTION', type: 'string', size: 1024 },
      { key: 'IMAGEURL', type: 'string', size: 2048, required: true },
      { key: 'LINKURL', type: 'string', size: 2048 },
      { key: 'DURATION', type: 'integer' },
      { key: 'ISACTIVE', type: 'boolean' },
      { key: 'DISPLAYORDER', type: 'integer' },
      { key: 'CLICKS', type: 'integer' },
      { key: 'VIEWS', type: 'integer' },
    ],
    permissions: ['read("any")','create("any")','update("any")','delete("any")'],
  },
  {
    id: 'orders', name: 'Orders',
    attrs: [
      { key: 'USERID', type: 'string', size: 256 },
      { key: 'ORDERCODE', type: 'string', size: 50, required: true },
      { key: 'ORDERINDEX', type: 'integer', required: true },
      { key: 'CUSTOMERNAME', type: 'string', size: 256, required: true },
      { key: 'CUSTOMEREMAIL', type: 'string', size: 256 },
      { key: 'CUSTOMERRUT', type: 'string', size: 50 },
      { key: 'CUSTOMERPHONE', type: 'string', size: 50 },
      { key: 'REGION', type: 'string', size: 100 },
      { key: 'COMUNA', type: 'string', size: 100 },
      { key: 'ADDRESS', type: 'string', size: 512 },
      { key: 'ADDITIONALINFO', type: 'string', size: 512 },
      { key: 'ADDRESSPHOTOURL', type: 'string', size: 2048 },
      { key: 'PAYMENTMETHOD', type: 'string', size: 50 },
      { key: 'SHIPPINGAGENCY', type: 'string', size: 100 },
      { key: 'SHIPPINGADDRESS', type: 'string', size: 2048 },
      { key: 'SUBTOTAL', type: 'integer', required: true },
      { key: 'SHIPPINGCOST', type: 'integer' },
      { key: 'TOTAL', type: 'integer', required: true },
      { key: 'STATUS', type: 'string', size: 50, required: true },
      { key: 'ITEMS', type: 'string', size: 50000 },
      { key: 'CREATEDAT', type: 'integer', required: true },
      { key: 'UPDATEDAT', type: 'integer' },
      { key: 'EXPIRESAT', type: 'integer' },
      { key: 'AUTOCANCELENABLED', type: 'boolean' },
      { key: 'PAYMENTPROOFURL', type: 'string', size: 2048 },
      { key: 'ISGIFT', type: 'boolean' },
      { key: 'CUSTOMERNOTE', type: 'string', size: 2048 },
      { key: 'PURCHASEDFROMLIVE', type: 'boolean' },
      { key: 'COUPONCODE', type: 'string', size: 100 },
    ],
    permissions: ['read("any")','create("any")','update("any")','delete("any")'],
  },
  {
    id: 'timed_offers', name: 'Timed Offers',
    attrs: [
      { key: 'title', type: 'string', size: 256, required: true },
      { key: 'offerType', type: 'string', size: 50, required: true },
      { key: 'targetId', type: 'string', size: 256, required: true },
      { key: 'productName', type: 'string', size: 256 },
      { key: 'originalPrice', type: 'integer', required: true },
      { key: 'discountPrice', type: 'integer', required: true },
      { key: 'discountPercentage', type: 'integer', required: true },
      { key: 'customImagePath', type: 'string', size: 2048 },
      { key: 'timeType', type: 'string', size: 50, required: true },
      { key: 'durationHours', type: 'integer' },
      { key: 'endDateTime', type: 'string', size: 100 },
      { key: 'status', type: 'string', size: 50, required: true },
      { key: 'activatedAt', type: 'string', size: 100 },
      { key: 'isActive', type: 'boolean' },
      { key: 'createdAt', type: 'string', size: 100 },
      { key: 'updatedAt', type: 'string', size: 100 },
    ],
    permissions: ['read("any")','create("any")','update("any")','delete("any")'],
  },
  {
    id: 'sequences', name: 'Sequences',
    attrs: [
      { key: 'key', type: 'string', size: 256, required: true },
      { key: 'value', type: 'integer', required: true },
    ],
    permissions: ['read("any")','create("any")','update("any")','delete("any")'],
  },
  {
    id: 'discount_coupons', name: 'Discount Coupons',
    attrs: [
      { key: 'code', type: 'string', size: 100, required: true },
      { key: 'type', type: 'string', size: 50, required: true },
      { key: 'value', type: 'integer', required: true },
      { key: 'isActive', type: 'boolean' },
      { key: 'maxUses', type: 'integer' },
      { key: 'usedCount', type: 'integer' },
      { key: 'minPurchase', type: 'integer' },
      { key: 'expiresAt', type: 'integer' },
    ],
    permissions: ['read("any")','create("any")','update("any")','delete("any")'],
  },
  {
    id: 'points_store_items', name: 'Points Store Items',
    attrs: [
      { key: 'name', type: 'string', size: 256, required: true },
      { key: 'description', type: 'string', size: 2048 },
      { key: 'pointsCost', type: 'integer', required: true },
      { key: 'imageUrl', type: 'string', size: 2048 },
      { key: 'isActive', type: 'boolean' },
    ],
    permissions: ['read("any")','create("any")','update("any")','delete("any")'],
  },
  {
    id: 'users', name: 'Users',
    attrs: [
      { key: 'userId', type: 'string', size: 256, required: true },
      { key: 'email', type: 'string', size: 256, required: true },
      { key: 'name', type: 'string', size: 256 },
      { key: 'phone', type: 'string', size: 100 },
      { key: 'createdAt', type: 'string', size: 100, required: true },
      { key: 'adminNotes', type: 'string', size: 4096 },
      { key: 'isWholesale', type: 'boolean' },
      { key: 'isBanned', type: 'boolean' },
      { key: 'lastAccessAt', type: 'string', size: 100 },
      { key: 'profileCreatedAt', type: 'string', size: 100 },
      { key: 'region', type: 'string', size: 100 },
    ],
    permissions: ['read("any")','create("any")','update("any")','delete("any")'],
  },
  {
    id: 'live_streams', name: 'Live Streams',
    attrs: [
      { key: 'title', type: 'string', size: 256, required: true },
      { key: 'description', type: 'string', size: 2048 },
      { key: 'url', type: 'string', size: 2048, required: true },
      { key: 'platform', type: 'string', size: 50 },
      { key: 'status', type: 'string', size: 50, required: true },
      { key: 'isActive', type: 'boolean' },
      { key: 'thumbnailUrl', type: 'string', size: 2048 },
      { key: 'viewerCount', type: 'integer' },
      { key: 'scheduledAt', type: 'string', size: 100 },
      { key: 'startAt', type: 'string', size: 100 },
      { key: 'muted', type: 'boolean' },
      { key: 'showText', type: 'boolean' },
      { key: 'allowFullscreen', type: 'boolean' },
    ],
    permissions: ['read("any")','create("any")','update("any")','delete("any")'],
  },
  {
    id: 'banner_overlay_positions', name: 'Banner Overlay Positions',
    attrs: [
      { key: 'BANNERID', type: 'string', size: 256, required: true },
      { key: 'PRODUCTID', type: 'string', size: 256, required: true },
      { key: 'POSITIONX', type: 'double', required: true },
      { key: 'POSITIONY', type: 'double', required: true },
      { key: 'SCALE', type: 'double' },
      { key: 'CIRCLESCALE', type: 'double' },
      { key: 'DISPLAYTYPE', type: 'string', size: 50 },
      { key: 'CUSTOMIMAGEURL', type: 'string', size: 2048 },
      { key: 'CIRCLECOLOR', type: 'string', size: 50 },
      { key: 'ISACTIVE', type: 'boolean' },
      { key: 'DISPLAYORDER', type: 'integer' },
      { key: 'CLICKS', type: 'integer' },
    ],
    permissions: ['read("any")','create("any")','update("any")','delete("any")'],
  },
  {
    id: 'house_product_positions', name: 'House Product Positions',
    attrs: [
      { key: 'PRODUCTID', type: 'string', size: 256, required: true },
      { key: 'CATEGORYID', type: 'string', size: 256 },
      { key: 'POSITIONX', type: 'double', required: true },
      { key: 'POSITIONY', type: 'double', required: true },
      { key: 'ISACTIVE', type: 'boolean' },
      { key: 'DISPLAYORDER', type: 'integer' },
      { key: 'SCALE', type: 'double' },
      { key: 'CIRCLESCALE', type: 'double' },
      { key: 'CUSTOMIMAGEURL', type: 'string', size: 2048 },
      { key: 'DISPLAYTYPE', type: 'string', size: 50 },
      { key: 'CIRCLECOLOR', type: 'string', size: 50 },
      { key: 'BACKGROUND', type: 'string', size: 50 },
    ],
    permissions: ['read("any")','create("any")','update("any")','delete("any")'],
  },
  {
    id: 'hotspot_panels', name: 'Hotspot Panels',
    attrs: [
      { key: 'IMAGEURL', type: 'string', size: 2048, required: true },
      { key: 'TITLE', type: 'string', size: 256 },
      { key: 'LINKURL', type: 'string', size: 2048 },
      { key: 'MOSAICGROUP', type: 'string', size: 50 },
      { key: 'CELLINDEX', type: 'integer' },
      { key: 'ISACTIVE', type: 'boolean' },
      { key: 'DISPLAYORDER', type: 'integer' },
    ],
    permissions: ['read("any")','create("any")','update("any")','delete("any")'],
  },
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
    permissions: ['read("any")','create("any")','update("any")','delete("any")'],
  },
  {
    id: 'reviews', name: 'Reviews',
    attrs: [
      { key: 'PRODUCTID', type: 'string', size: 256, required: true },
      { key: 'USERID', type: 'string', size: 256, required: true },
      { key: 'USERNAME', type: 'string', size: 256 },
      { key: 'USERPROFILEIMAGEURL', type: 'string', size: 2048 },
      { key: 'RATING', type: 'integer', required: true },
      { key: 'COMMENT', type: 'string', size: 4096 },
      { key: 'CREATEDAT', type: 'integer', required: true },
      { key: 'REVIEWDATE', type: 'integer' },
      { key: 'ISEDITED', type: 'boolean' },
    ],
    permissions: ['read("any")','create("any")','update("any")','delete("any")'],
  },
  {
    id: 'clips', name: 'Clips',
    attrs: [
      { key: 'TITLE', type: 'string', size: 256, required: true },
      { key: 'DESCRIPTION', type: 'string', size: 2048 },
      { key: 'VIDEOURL', type: 'string', size: 2048, required: true },
      { key: 'THUMBNAILURL', type: 'string', size: 2048 },
      { key: 'PRODUCTID', type: 'string', size: 256 },
      { key: 'PRODUCTNAME', type: 'string', size: 256 },
      { key: 'PRODUCTPRICE', type: 'integer' },
      { key: 'PRODUCTIMAGEURL', type: 'string', size: 2048 },
      { key: 'USERID', type: 'string', size: 256 },
      { key: 'USERNAME', type: 'string', size: 256 },
      { key: 'LIKES', type: 'integer' },
      { key: 'VIEWS', type: 'integer' },
      { key: 'ISACTIVE', type: 'boolean' },
      { key: 'CREATEDAT', type: 'integer', required: true },
    ],
    permissions: ['read("any")','create("any")','update("any")','delete("any")'],
  },
  {
    id: 'favorites', name: 'Favorites',
    attrs: [
      { key: 'userId', type: 'string', size: 256, required: true },
      { key: 'productId', type: 'string', size: 256, required: true },
      { key: 'createdAt', type: 'integer', required: true },
    ],
    permissions: ['read("any")','create("any")','update("any")','delete("any")'],
  },
  {
    id: 'live_raffles', name: 'Live Raffles',
    attrs: [
      { key: 'TITLE', type: 'string', size: 256, required: true },
      { key: 'DESCRIPTION', type: 'string', size: 2048 },
      { key: 'PRIZE', type: 'string', size: 256, required: true },
      { key: 'PRIZEIMAGEURL', type: 'string', size: 2048 },
      { key: 'LIVESTREAMID', type: 'string', size: 256 },
      { key: 'STATUS', type: 'string', size: 50, required: true },
      { key: 'PARTICIPANTS', type: 'string', size: 50000 },
      { key: 'WINNERID', type: 'string', size: 256 },
      { key: 'WINNERNAME', type: 'string', size: 256 },
      { key: 'MAXPARTICIPANTS', type: 'integer' },
      { key: 'STARTSAT', type: 'integer' },
      { key: 'ENDSAT', type: 'integer' },
      { key: 'CREATEDAT', type: 'integer', required: true },
    ],
    permissions: ['read("any")','create("any")','update("any")','delete("any")'],
  },
  {
    id: 'raffle_participants', name: 'Raffle Participants',
    attrs: [
      { key: 'raffleId', type: 'string', size: 256, required: true },
      { key: 'userId', type: 'string', size: 256, required: true },
      { key: 'participatedAt', type: 'integer', required: true },
    ],
    permissions: ['read("any")','create("any")','update("any")','delete("any")'],
  },
  {
    id: 'stock_alerts', name: 'Stock Alerts',
    attrs: [
      { key: 'productId', type: 'string', size: 256, required: true },
      { key: 'userId', type: 'string', size: 256, required: true },
      { key: 'createdAt', type: 'integer', required: true },
    ],
    permissions: ['read("any")','create("any")','update("any")','delete("any")'],
  },
  {
    id: 'notifications', name: 'Notifications',
    attrs: [
      { key: 'title', type: 'string', size: 256, required: true },
      { key: 'message', type: 'string', size: 4096, required: true },
      { key: 'type', type: 'string', size: 50 },
      { key: 'userId', type: 'string', size: 256 },
      { key: 'isRead', type: 'boolean' },
    ],
    permissions: ['read("any")','create("any")','update("any")','delete("any")'],
  },
  {
    id: 'theme_config', name: 'Theme Config',
    attrs: [
      { key: 'config', type: 'string', size: 50000 },
      { key: 'NAME', type: 'string', size: 256 },
      { key: 'SECTIONS', type: 'string', size: 50000 },
    ],
    permissions: ['read("any")','create("any")','update("any")','delete("any")'],
  },
  {
    id: 'apertura_settings', name: 'Apertura Settings',
    attrs: [
      { key: 'isActive', type: 'boolean' },
      { key: 'discountPercent', type: 'integer' },
      { key: 'minPurchase', type: 'integer' },
      { key: 'createdAt', type: 'string', size: 100 },
      { key: 'updatedAt', type: 'string', size: 100 },
    ],
    permissions: ['read("any")','create("any")','update("any")','delete("any")'],
  },
  {
    id: 'support_tickets', name: 'Support Tickets',
    attrs: [
      { key: 'userId', type: 'string', size: 256, required: true },
      { key: 'subject', type: 'string', size: 256, required: true },
      { key: 'message', type: 'string', size: 4096, required: true },
      { key: 'status', type: 'string', size: 50, required: true },
      { key: 'priority', type: 'string', size: 50 },
      { key: 'adminNotes', type: 'string', size: 4096 },
    ],
    permissions: ['read("any")','create("any")','update("any")','delete("any")'],
  },
  {
    id: 'stock_movements', name: 'Stock Movements',
    attrs: [
      { key: 'productId', type: 'string', size: 256, required: true },
      { key: 'productName', type: 'string', size: 256 },
      { key: 'type', type: 'string', size: 50, required: true },
      { key: 'quantity', type: 'integer', required: true },
      { key: 'reason', type: 'string', size: 512 },
    ],
    permissions: ['read("any")','create("any")','update("any")','delete("any")'],
  },
  {
    id: 'fcm_tokens', name: 'FCM Tokens',
    attrs: [
      { key: 'userId', type: 'string', size: 256 },
      { key: 'token', type: 'string', size: 512, required: true },
      { key: 'createdAt', type: 'integer', required: true },
    ],
    permissions: ['read("any")','create("any")','update("any")','delete("any")'],
  },
  {
    id: 'order_status_history', name: 'Order Status History',
    attrs: [
      { key: 'orderId', type: 'string', size: 256, required: true },
      { key: 'status', type: 'string', size: 50, required: true },
      { key: 'createdAt', type: 'integer', required: true },
      { key: 'notes', type: 'string', size: 2048 },
    ],
    permissions: ['read("any")','create("any")','update("any")','delete("any")'],
  },
  {
    id: 'wholesale_requests', name: 'Wholesale Requests',
    attrs: [
      { key: 'userId', type: 'string', size: 256 },
      { key: 'companyName', type: 'string', size: 256, required: true },
      { key: 'rut', type: 'string', size: 50, required: true },
      { key: 'email', type: 'string', size: 256, required: true },
      { key: 'phone', type: 'string', size: 100, required: true },
      { key: 'status', type: 'string', size: 50, required: true },
      { key: 'adminNotes', type: 'string', size: 4096 },
      { key: 'rejectionReason', type: 'string', size: 1024 },
      { key: 'createdAt', type: 'integer', required: true },
    ],
    permissions: ['read("any")','create("any")','update("any")','delete("any")'],
  },
  {
    id: 'addresses', name: 'Addresses',
    attrs: [
      { key: 'userId', type: 'string', size: 256, required: true },
      { key: 'name', type: 'string', size: 256, required: true },
      { key: 'address', type: 'string', size: 512, required: true },
      { key: 'city', type: 'string', size: 256, required: true },
      { key: 'region', type: 'string', size: 256, required: true },
      { key: 'phone', type: 'string', size: 100, required: true },
      { key: 'isDefault', type: 'boolean' },
    ],
    permissions: ['read("any")','create("any")','update("any")','delete("any")'],
  },
  {
    id: 'store_settings', name: 'Store Settings',
    attrs: [
      { key: 'STORENAME', type: 'string', size: 256 },
      { key: 'ADDRESS', type: 'string', size: 512 },
      { key: 'PHONE', type: 'string', size: 100 },
      { key: 'EMAIL', type: 'string', size: 256 },
      { key: 'WHATSAPP', type: 'string', size: 100 },
      { key: 'LOGOURL', type: 'string', size: 2048 },
      { key: 'CURRENCY', type: 'string', size: 10 },
    ],
    permissions: ['read("any")','create("any")','update("any")','delete("any")'],
  },
  {
    id: 'page_views', name: 'Page Views',
    attrs: [
      { key: 'PAGE', type: 'string', size: 256, required: true },
      { key: 'DATE', type: 'string', size: 20, required: true },
      { key: 'VIEWS', type: 'integer', required: true },
    ],
    permissions: ['read("any")','create("any")','update("any")','delete("any")'],
  },
];

async function createAll() {
  console.log('🚀 Creando colecciones en nuevo proyecto...\n');
  console.log(`📊 ${collections.length} colecciones para crear\n`);

  for (const coll of collections) {
    try {
      await db.createCollection(DATABASE_ID, coll.id, coll.name, coll.permissions);
      console.log(`✅ Colección: ${coll.id}`);
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        console.log(`⏭️  Ya existe: ${coll.id}`);
      } else {
        console.error(`❌ Error creando ${coll.id}:`, e.message);
        continue;
      }
    }

    for (const attr of coll.attrs) {
      try {
        if (attr.type === 'string') {
          await db.createStringAttribute(DATABASE_ID, coll.id, attr.key, attr.size || 256, attr.required || false);
        } else if (attr.type === 'integer') {
          await db.createIntegerAttribute(DATABASE_ID, coll.id, attr.key, attr.required || false);
        } else if (attr.type === 'double') {
          await db.createFloatAttribute(DATABASE_ID, coll.id, attr.key, attr.required || false);
        } else if (attr.type === 'boolean') {
          await db.createBooleanAttribute(DATABASE_ID, coll.id, attr.key, attr.required || false);
        }
        console.log(`  ✅ ${attr.key} (${attr.type})`);
      } catch (e: any) {
        if (e.message?.includes('already exists')) {
          console.log(`  ⏭️  ${attr.key}`);
        } else {
          console.error(`  ❌ ${attr.key}:`, e.message?.substring(0, 80));
        }
      }
    }
    await new Promise(r => setTimeout(r, 200));
  }

  // Storage buckets
  console.log('\n📦 Creando storage buckets...');
  const buckets = [
    { id: 'products', name: 'Products', maxFileSize: 50_000_000 },
    { id: 'comprobantes', name: 'Comprobantes', maxFileSize: 10_000_000 },
  ];
  for (const b of buckets) {
    try {
      await storage.createBucket(b.id, b.name, ['read("any")','create("any")','update("any")','delete("any")'], undefined, false, undefined, b.maxFileSize);
      console.log(`✅ Bucket: ${b.id}`);
    } catch (e: any) {
      if (e.message?.includes('already exists')) console.log(`⏭️  Bucket: ${b.id}`);
      else console.error(`❌ Bucket ${b.id}:`, e.message);
    }
  }

  console.log('\n🎉 Esquemas creados!');
  console.log('⚠️  Esperar 30+ segundos antes de crear documentos (atributos en processing → available)');
}

createAll().catch(console.error);
