/**
 * Script de Migración — Nuevo Proyecto Appwrite
 * Crea todas las colecciones con sus atributos en el nuevo database.
 * Mantiene los nombres de atributos tal cual (UPPERCASE/camelCase mix) para no romper el código.
 * 
 * Uso: npx tsx scripts/migrate-to-new-project.ts
 */

import { Client, Databases, Storage, ID, Permission, Role, Query } from 'node-appwrite';

// ============================================
// CONFIG — Nuevo proyecto
// ============================================
const ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const PROJECT_ID = '6a0e374b0009138bc6fa';
const DATABASE_ID = '6a0e37ac0016762b9dc4';
const API_KEY = 'standard_4fc3847401fa354922245a979fdbb343bf0ba794d2b569f63fd8083bb493cd21ce2571d2c9f2d88747e7a79553faa4635eddf5500842d0ee132f9f0b853a12f678e88c4a3b2327f8dcc13ac9981f52e6cffd9efbbb2eab7a3e353f9ba18466821df3d08f7d40a5625388a3ce4bd2f6248b1ac12661045180dd2a031fec206641';

// Config — Proyecto ANTIGUO (para migrar datos)
const OLD_PROJECT_ID = '6a0a4e8d0032177f3f90';
const OLD_DATABASE_ID = '6a0a58ca001798410d86';
const OLD_API_KEY = 'standard_dea4a8654ed430bf3626a6cd6506a562cbfcebb7caeb417a1e83c8228ed1de0a84d60b11cc4776d023d0c5ac8d1dcb0ba59e43fef5fb8831a7252aaf5b2f13896769e2a5af222f9853d7f7abcada2d034e1d92e3b73d8de53d1c29adde00cd723aa5612189b2ee702e798acb0dffeb9ff154714a5f7af060c78567391d49923d';

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const db = new Databases(client);
const storage = new Storage(client);

// Cliente antiguo para leer datos
const oldClient = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(OLD_PROJECT_ID)
  .setKey(OLD_API_KEY);

const oldDb = new Databases(oldClient);

// ============================================
// DEFINICIÓN DE COLECCIONES Y ATRIBUTOS
// ============================================

interface AttrDef {
  type: 'string' | 'integer' | 'double' | 'boolean';
  size?: number;       // for string
  required: boolean;
  default?: any;
}

interface CollectionDef {
  id: string;
  name: string;
  attrs: Record<string, AttrDef>;
  anyPermissions?: boolean; // needs read/create/update/delete any
}

const COLLECTIONS: CollectionDef[] = [
  // 1. products (25 attrs)
  {
    id: 'products', name: 'Products',
    anyPermissions: true,
    attrs: {
      NAME: { type: 'string', size: 256, required: true },
      DESCRIPTION: { type: 'string', size: 8192, required: false },
      PRICE: { type: 'integer', required: true },
      CURRENTPRICE: { type: 'integer', required: false },
      COST: { type: 'integer', required: false },
      STOCK: { type: 'integer', required: true },
      SOLDQUANTITY: { type: 'integer', required: false },
      CATEGORYID: { type: 'string', size: 256, required: false },
      SUBCATEGORYID: { type: 'string', size: 256, required: false },
      IMAGEURL: { type: 'string', size: 2048, required: false },
      IMAGEURL2: { type: 'string', size: 2048, required: false },
      IMAGEURL3: { type: 'string', size: 2048, required: false },
      RATING: { type: 'double', required: false },
      NUMREVIEWS: { type: 'integer', required: false },
      WHOLESALEPRICE: { type: 'integer', required: false },
      WHOLESALEMINQUANTITY: { type: 'integer', required: false },
      ISFEATURED: { type: 'boolean', required: false },
      ISACTIVE: { type: 'boolean', required: false },
      PACKQTY: { type: 'integer', required: false },
      RESTOCKTHRESHOLD: { type: 'integer', required: false },
      jumpseller_id: { type: 'string', size: 256, required: false },
      section: { type: 'integer', required: false },
      barcode: { type: 'string', size: 64, required: false },
      sku: { type: 'string', size: 128, required: false },
      COMING_SOON: { type: 'boolean', required: false },
      DATE_ADDED: { type: 'string', size: 20, required: false },
    }
  },
  // 2. inventory_products (25 attrs)
  {
    id: 'inventory_products', name: 'Inventory Products',
    anyPermissions: true,
    attrs: {
      sku: { type: 'string', size: 256, required: false },
      barcode: { type: 'string', size: 256, required: false },
      NAME: { type: 'string', size: 256, required: true },
      PRICE: { type: 'integer', required: false, default: 0 },
      STOCK: { type: 'integer', required: false, default: 0 },
      CATEGORYID: { type: 'string', size: 256, required: false },
      SUBCATEGORYID: { type: 'string', size: 256, required: false },
      IMAGEURL: { type: 'string', size: 2048, required: false },
      IMAGEURL2: { type: 'string', size: 2048, required: false },
      IMAGEURL3: { type: 'string', size: 2048, required: false },
      WHOLESALEPRICE: { type: 'integer', required: false },
      WHOLESALEMINQUANTITY: { type: 'integer', required: false },
      ISACTIVE: { type: 'boolean', required: false, default: false },
      published_product_id: { type: 'string', size: 256, required: false },
      published_at: { type: 'string', size: 64, required: false },
      imported_at: { type: 'string', size: 64, required: false },
      FEATURES: { type: 'string', size: 2048, required: false },
      TAGS: { type: 'string', size: 512, required: false },
      name_cn: { type: 'string', size: 256, required: false },
      IMAGEURL4: { type: 'string', size: 1024, required: false },
      IMAGEURL5: { type: 'string', size: 1024, required: false },
      PACKQTY: { type: 'integer', required: false, default: 0 },
      section: { type: 'integer', required: false },
      COMING_SOON: { type: 'boolean', required: false },
      DATE_ADDED: { type: 'string', size: 256, required: false },
    }
  },
  // 3. categories
  {
    id: 'categories', name: 'Categories',
    anyPermissions: true,
    attrs: {
      name: { type: 'string', size: 256, required: true },
      iconUrl: { type: 'string', size: 2048, required: false },
      order: { type: 'integer', required: false },
      color: { type: 'string', size: 50, required: false },
      BACKGROUND_IMAGE_URL: { type: 'string', size: 2048, required: false },
    }
  },
  // 4. subcategories
  {
    id: 'subcategories', name: 'Subcategories',
    anyPermissions: true,
    attrs: {
      name: { type: 'string', size: 256, required: true },
      categoryId: { type: 'string', size: 256, required: true },
      order: { type: 'integer', required: false },
      ICON_URL: { type: 'string', size: 2048, required: false },
      BACKGROUND_IMAGE_URL: { type: 'string', size: 2048, required: false },
      ZOOM_BACKGROUND_IMAGE_URL: { type: 'string', size: 2048, required: false },
      COLOR: { type: 'string', size: 50, required: false },
    }
  },
  // 5. banners
  {
    id: 'banners', name: 'Banners',
    anyPermissions: true,
    attrs: {
      TITLE: { type: 'string', size: 256, required: false },
      DESCRIPTION: { type: 'string', size: 1024, required: false },
      IMAGEURL: { type: 'string', size: 2048, required: true },
      LINKURL: { type: 'string', size: 2048, required: false },
      DURATION: { type: 'integer', required: false },
      ISACTIVE: { type: 'boolean', required: false },
      DISPLAYORDER: { type: 'integer', required: false },
      CLICKS: { type: 'integer', required: false },
      VIEWS: { type: 'integer', required: false },
    }
  },
  // 6. orders
  {
    id: 'orders', name: 'Orders',
    anyPermissions: true,
    attrs: {
      USERID: { type: 'string', size: 256, required: false },
      ORDERCODE: { type: 'string', size: 50, required: true },
      ORDERINDEX: { type: 'integer', required: true },
      CUSTOMERNAME: { type: 'string', size: 256, required: true },
      CUSTOMEREMAIL: { type: 'string', size: 256, required: false },
      CUSTOMERRUT: { type: 'string', size: 50, required: false },
      CUSTOMERPHONE: { type: 'string', size: 50, required: false },
      REGION: { type: 'string', size: 100, required: false },
      COMUNA: { type: 'string', size: 100, required: false },
      ADDRESS: { type: 'string', size: 512, required: false },
      ADDITIONALINFO: { type: 'string', size: 512, required: false },
      ADDRESSPHOTOURL: { type: 'string', size: 2048, required: false },
      PAYMENTMETHOD: { type: 'string', size: 50, required: false },
      SHIPPINGAGENCY: { type: 'string', size: 100, required: false },
      SHIPPINGADDRESS: { type: 'string', size: 2048, required: false },
      SUBTOTAL: { type: 'integer', required: true },
      SHIPPINGCOST: { type: 'integer', required: false },
      TOTAL: { type: 'integer', required: true },
      STATUS: { type: 'string', size: 50, required: true },
      ITEMS: { type: 'string', size: 50000, required: false },
      CREATEDAT: { type: 'integer', required: true },
      UPDATEDAT: { type: 'integer', required: false },
      EXPIRESAT: { type: 'integer', required: false },
      AUTOCANCELENABLED: { type: 'boolean', required: false },
      PAYMENTPROOFURL: { type: 'string', size: 2048, required: false },
      ISGIFT: { type: 'boolean', required: false },
      CUSTOMERNOTE: { type: 'string', size: 2048, required: false },
      PURCHASEDFROMLIVE: { type: 'boolean', required: false },
      COUPONCODE: { type: 'string', size: 100, required: false },
    }
  },
  // 7. timed_offers
  {
    id: 'timed_offers', name: 'Timed Offers',
    anyPermissions: true,
    attrs: {
      title: { type: 'string', size: 256, required: true },
      offerType: { type: 'string', size: 50, required: true },
      targetId: { type: 'string', size: 256, required: true },
      productName: { type: 'string', size: 256, required: false },
      originalPrice: { type: 'integer', required: true },
      discountPrice: { type: 'integer', required: true },
      discountPercentage: { type: 'integer', required: true },
      customImagePath: { type: 'string', size: 2048, required: false },
      timeType: { type: 'string', size: 50, required: true },
      durationHours: { type: 'integer', required: false },
      endDateTime: { type: 'string', size: 100, required: false },
      status: { type: 'string', size: 50, required: true },
      activatedAt: { type: 'string', size: 100, required: false },
      isActive: { type: 'boolean', required: false },
      createdAt: { type: 'string', size: 100, required: false },
      updatedAt: { type: 'string', size: 100, required: false },
    }
  },
  // 8. sequences
  {
    id: 'sequences', name: 'Sequences',
    anyPermissions: true,
    attrs: {
      key: { type: 'string', size: 256, required: true },
      value: { type: 'integer', required: true },
    }
  },
  // 9. discount_coupons
  {
    id: 'discount_coupons', name: 'Discount Coupons',
    anyPermissions: true,
    attrs: {
      code: { type: 'string', size: 100, required: true },
      type: { type: 'string', size: 50, required: true },
      value: { type: 'integer', required: true },
      isActive: { type: 'boolean', required: false },
      maxUses: { type: 'integer', required: false },
      usedCount: { type: 'integer', required: false },
      minPurchase: { type: 'integer', required: false },
      expiresAt: { type: 'integer', required: false },
    }
  },
  // 10. points_store_items
  {
    id: 'points_store_items', name: 'Points Store Items',
    attrs: {
      name: { type: 'string', size: 256, required: true },
      description: { type: 'string', size: 2048, required: false },
      pointsCost: { type: 'integer', required: true },
      imageUrl: { type: 'string', size: 2048, required: false },
      isActive: { type: 'boolean', required: false },
    }
  },
  // 11. users
  {
    id: 'users', name: 'Users',
    anyPermissions: true,
    attrs: {
      userId: { type: 'string', size: 256, required: true },
      email: { type: 'string', size: 256, required: true },
      name: { type: 'string', size: 256, required: false },
      phone: { type: 'string', size: 100, required: false },
      createdAt: { type: 'string', size: 100, required: true },
      adminNotes: { type: 'string', size: 4096, required: false },
      isWholesale: { type: 'boolean', required: false, default: false },
      isBanned: { type: 'boolean', required: false, default: false },
      lastAccessAt: { type: 'string', size: 100, required: false },
      profileCreatedAt: { type: 'string', size: 100, required: false },
      region: { type: 'string', size: 100, required: false },
    }
  },
  // 12. live_streams
  {
    id: 'live_streams', name: 'Live Streams',
    attrs: {
      title: { type: 'string', size: 256, required: true },
      description: { type: 'string', size: 2048, required: false },
      url: { type: 'string', size: 2048, required: true },
      platform: { type: 'string', size: 50, required: false },
      status: { type: 'string', size: 50, required: true },
      isActive: { type: 'boolean', required: false },
      thumbnailUrl: { type: 'string', size: 2048, required: false },
      viewerCount: { type: 'integer', required: false },
      scheduledAt: { type: 'string', size: 100, required: false },
      startAt: { type: 'string', size: 100, required: false },
      muted: { type: 'boolean', required: false },
      showText: { type: 'boolean', required: false },
      allowFullscreen: { type: 'boolean', required: false },
    }
  },
  // 13. banner_overlay_positions
  {
    id: 'banner_overlay_positions', name: 'Banner Overlay Positions',
    attrs: {
      BANNERID: { type: 'string', size: 256, required: true },
      PRODUCTID: { type: 'string', size: 256, required: true },
      POSITIONX: { type: 'double', required: true },
      POSITIONY: { type: 'double', required: true },
      SCALE: { type: 'double', required: false, default: 1 },
      CIRCLESCALE: { type: 'double', required: false, default: 1 },
      DISPLAYTYPE: { type: 'string', size: 50, required: false },
      CUSTOMIMAGEURL: { type: 'string', size: 2048, required: false },
      CIRCLECOLOR: { type: 'string', size: 50, required: false },
      ISACTIVE: { type: 'boolean', required: false },
      DISPLAYORDER: { type: 'integer', required: false },
      CLICKS: { type: 'integer', required: false },
    }
  },
  // 14. house_product_positions
  {
    id: 'house_product_positions', name: 'House Product Positions',
    attrs: {
      PRODUCTID: { type: 'string', size: 256, required: true },
      CATEGORYID: { type: 'string', size: 256, required: false },
      POSITIONX: { type: 'double', required: true },
      POSITIONY: { type: 'double', required: true },
      ISACTIVE: { type: 'boolean', required: false },
      DISPLAYORDER: { type: 'integer', required: false },
      SCALE: { type: 'double', required: false, default: 1 },
      CIRCLESCALE: { type: 'double', required: false, default: 1 },
      CUSTOMIMAGEURL: { type: 'string', size: 2048, required: false },
      DISPLAYTYPE: { type: 'string', size: 50, required: false },
      CIRCLECOLOR: { type: 'string', size: 50, required: false },
      BACKGROUND: { type: 'string', size: 50, required: false },
    }
  },
  // 15. hotspot_panels
  {
    id: 'hotspot_panels', name: 'Hotspot Panels',
    attrs: {
      IMAGEURL: { type: 'string', size: 2048, required: true },
      TITLE: { type: 'string', size: 256, required: false },
      LINKURL: { type: 'string', size: 2048, required: false },
      MOSAICGROUP: { type: 'string', size: 50, required: false },
      CELLINDEX: { type: 'integer', required: false },
      ISACTIVE: { type: 'boolean', required: false },
      DISPLAYORDER: { type: 'integer', required: false },
    }
  },
  // 16. product_votes
  {
    id: 'product_votes', name: 'Product Votes',
    attrs: {
      PRODUCTTITLE: { type: 'string', size: 256, required: true },
      USERID: { type: 'string', size: 256, required: false },
      USERNAME: { type: 'string', size: 256, required: false },
      USEREMAIL: { type: 'string', size: 256, required: false },
      CREATEDAT: { type: 'integer', required: true },
      IPADDRESS: { type: 'string', size: 256, required: false },
    }
  },
  // 17. reviews
  {
    id: 'reviews', name: 'Reviews',
    attrs: {
      PRODUCTID: { type: 'string', size: 256, required: true },
      USERID: { type: 'string', size: 256, required: true },
      USERNAME: { type: 'string', size: 256, required: false },
      USERPROFILEIMAGEURL: { type: 'string', size: 2048, required: false },
      RATING: { type: 'integer', required: true },
      COMMENT: { type: 'string', size: 4096, required: false },
      CREATEDAT: { type: 'integer', required: true },
      REVIEWDATE: { type: 'integer', required: false },
      ISEDITED: { type: 'boolean', required: false },
    }
  },
  // 18. clips
  {
    id: 'clips', name: 'Clips',
    attrs: {
      TITLE: { type: 'string', size: 256, required: true },
      DESCRIPTION: { type: 'string', size: 2048, required: false },
      VIDEOURL: { type: 'string', size: 2048, required: true },
      THUMBNAILURL: { type: 'string', size: 2048, required: false },
      PRODUCTID: { type: 'string', size: 256, required: false },
      PRODUCTNAME: { type: 'string', size: 256, required: false },
      PRODUCTPRICE: { type: 'integer', required: false },
      PRODUCTIMAGEURL: { type: 'string', size: 2048, required: false },
      USERID: { type: 'string', size: 256, required: false },
      USERNAME: { type: 'string', size: 256, required: false },
      LIKES: { type: 'integer', required: false },
      VIEWS: { type: 'integer', required: false },
      ISACTIVE: { type: 'boolean', required: false },
      CREATEDAT: { type: 'integer', required: true },
    }
  },
  // 19. favorites
  {
    id: 'favorites', name: 'Favorites',
    anyPermissions: true,
    attrs: {
      userId: { type: 'string', size: 256, required: true },
      productId: { type: 'string', size: 256, required: true },
      createdAt: { type: 'integer', required: true },
    }
  },
  // 20. live_raffles
  {
    id: 'live_raffles', name: 'Live Raffles',
    attrs: {
      TITLE: { type: 'string', size: 256, required: true },
      DESCRIPTION: { type: 'string', size: 2048, required: false },
      PRIZE: { type: 'string', size: 256, required: true },
      PRIZEIMAGEURL: { type: 'string', size: 2048, required: false },
      LIVESTREAMID: { type: 'string', size: 256, required: false },
      STATUS: { type: 'string', size: 50, required: true },
      PARTICIPANTS: { type: 'string', size: 50000, required: false },
      WINNERID: { type: 'string', size: 256, required: false },
      WINNERNAME: { type: 'string', size: 256, required: false },
      MAXPARTICIPANTS: { type: 'integer', required: false },
      STARTSAT: { type: 'integer', required: false },
      ENDSAT: { type: 'integer', required: false },
      CREATEDAT: { type: 'integer', required: true },
    }
  },
  // 21. raffle_participants
  {
    id: 'raffle_participants', name: 'Raffle Participants',
    attrs: {
      raffleId: { type: 'string', size: 256, required: true },
      userId: { type: 'string', size: 256, required: true },
      participatedAt: { type: 'integer', required: true },
    }
  },
  // 22. stock_alerts
  {
    id: 'stock_alerts', name: 'Stock Alerts',
    attrs: {
      productId: { type: 'string', size: 256, required: true },
      userId: { type: 'string', size: 256, required: true },
      createdAt: { type: 'integer', required: true },
    }
  },
  // 23. notifications
  {
    id: 'notifications', name: 'Notifications',
    anyPermissions: true,
    attrs: {
      title: { type: 'string', size: 256, required: true },
      message: { type: 'string', size: 4096, required: true },
      type: { type: 'string', size: 50, required: false },
      userId: { type: 'string', size: 256, required: false },
      isRead: { type: 'boolean', required: false },
    }
  },
  // 24. theme_config
  {
    id: 'theme_config', name: 'Theme Config',
    anyPermissions: true,
    attrs: {
      config: { type: 'string', size: 50000, required: false },
      NAME: { type: 'string', size: 256, required: false },
      SECTIONS: { type: 'string', size: 50000, required: false },
    }
  },
  // 25. apertura_settings
  {
    id: 'apertura_settings', name: 'Apertura Settings',
    anyPermissions: true,
    attrs: {
      isActive: { type: 'boolean', required: false },
      discountPercent: { type: 'integer', required: false },
      minPurchase: { type: 'integer', required: false },
      createdAt: { type: 'string', size: 100, required: false },
      updatedAt: { type: 'string', size: 100, required: false },
    }
  },
  // 26. support_tickets
  {
    id: 'support_tickets', name: 'Support Tickets',
    attrs: {
      userId: { type: 'string', size: 256, required: true },
      subject: { type: 'string', size: 256, required: true },
      message: { type: 'string', size: 4096, required: true },
      status: { type: 'string', size: 50, required: true },
      priority: { type: 'string', size: 50, required: false },
      adminNotes: { type: 'string', size: 4096, required: false },
    }
  },
  // 27. stock_movements
  {
    id: 'stock_movements', name: 'Stock Movements',
    attrs: {
      productId: { type: 'string', size: 256, required: true },
      productName: { type: 'string', size: 256, required: false },
      type: { type: 'string', size: 50, required: true },
      quantity: { type: 'integer', required: true },
      reason: { type: 'string', size: 512, required: false },
    }
  },
  // 28. fcm_tokens
  {
    id: 'fcm_tokens', name: 'FCM Tokens',
    attrs: {
      userId: { type: 'string', size: 256, required: false },
      token: { type: 'string', size: 512, required: true },
      createdAt: { type: 'integer', required: true },
    }
  },
  // 29. order_status_history
  {
    id: 'order_status_history', name: 'Order Status History',
    attrs: {
      orderId: { type: 'string', size: 256, required: true },
      status: { type: 'string', size: 50, required: true },
      createdAt: { type: 'integer', required: true },
      notes: { type: 'string', size: 2048, required: false },
    }
  },
  // 30. wholesale_requests
  {
    id: 'wholesale_requests', name: 'Wholesale Requests',
    attrs: {
      userId: { type: 'string', size: 256, required: false },
      companyName: { type: 'string', size: 256, required: true },
      rut: { type: 'string', size: 50, required: true },
      email: { type: 'string', size: 256, required: true },
      phone: { type: 'string', size: 100, required: true },
      status: { type: 'string', size: 50, required: true },
      adminNotes: { type: 'string', size: 4096, required: false },
      rejectionReason: { type: 'string', size: 1024, required: false },
      createdAt: { type: 'integer', required: true },
    }
  },
  // 31. addresses
  {
    id: 'addresses', name: 'Addresses',
    anyPermissions: true,
    attrs: {
      userId: { type: 'string', size: 256, required: true },
      name: { type: 'string', size: 256, required: true },
      address: { type: 'string', size: 512, required: true },
      city: { type: 'string', size: 256, required: true },
      region: { type: 'string', size: 256, required: true },
      phone: { type: 'string', size: 100, required: true },
      isDefault: { type: 'boolean', required: false },
    }
  },
  // 32. page_views (from GUIA_PARA_IAS)
  {
    id: 'page_views', name: 'Page Views',
    anyPermissions: true,
    attrs: {
      PAGE: { type: 'string', size: 256, required: true },
      DATE: { type: 'string', size: 20, required: true },
      VIEWS: { type: 'integer', required: true },
    }
  },
  // 33. store_settings (from GUIA_PARA_IAS)
  {
    id: 'store_settings', name: 'Store Settings',
    anyPermissions: true,
    attrs: {
      STORENAME: { type: 'string', size: 256, required: false },
      ADDRESS: { type: 'string', size: 512, required: false },
      PHONE: { type: 'string', size: 50, required: false },
      EMAIL: { type: 'string', size: 256, required: false },
      LOGOURL: { type: 'string', size: 2048, required: false },
      WHATSAPP: { type: 'string', size: 50, required: false },
      INSTAGRAM: { type: 'string', size: 256, required: false },
      MAPADDRESS: { type: 'string', size: 512, required: false },
      MAPEMBED: { type: 'string', size: 4096, required: false },
    }
  },
];

// ============================================
// FUNCIONES DE CREACIÓN
// ============================================

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function createCollectionWithAttrs(coll: CollectionDef) {
  console.log(`\n📦 Creando colección: ${coll.id} (${coll.name})`);

  // 1. Crear colección
  try {
    const permissions = coll.anyPermissions
      ? [
          Permission.read(Role.any()),
          Permission.create(Role.any()),
          Permission.update(Role.any()),
          Permission.delete(Role.any()),
        ]
      : [];

    await db.createCollection(
      DATABASE_ID,
      coll.id,
      coll.name,
      permissions.length > 0 ? permissions : undefined
    );
    console.log(`  ✅ Colección creada`);
  } catch (e: any) {
    if (e.message?.includes('already exists')) {
      console.log(`  ⏭️ Colección ya existe`);
    } else {
      console.error(`  ❌ Error creando colección: ${e.message}`);
      return;
    }
  }

  // 2. Crear atributos
  for (const [key, attr] of Object.entries(coll.attrs)) {
    try {
      if (attr.type === 'string') {
        await db.createStringAttribute(
          DATABASE_ID, coll.id, key,
          attr.size || 256,
          attr.required,
          attr.default !== undefined ? attr.default : undefined
        );
      } else if (attr.type === 'integer') {
        await db.createIntegerAttribute(
          DATABASE_ID, coll.id, key,
          attr.required,
          undefined, // min
          undefined, // max
          attr.default !== undefined ? attr.default : undefined
        );
      } else if (attr.type === 'double') {
        await db.createFloatAttribute(
          DATABASE_ID, coll.id, key,
          attr.required,
          undefined, // min
          undefined, // max
          attr.default !== undefined ? attr.default : undefined
        );
      } else if (attr.type === 'boolean') {
        await db.createBooleanAttribute(
          DATABASE_ID, coll.id, key,
          attr.required,
          attr.default !== undefined ? attr.default : undefined
        );
      }
      console.log(`  ✅ ${key} (${attr.type})`);
    } catch (e: any) {
      if (e.message?.includes('already exists') || e.message?.includes('Attribute already exists')) {
        console.log(`  ⏭️ ${key} ya existe`);
      } else {
        console.error(`  ❌ ${key}: ${e.message}`);
      }
    }
    // Rate limit: small delay between attribute creation
    await sleep(100);
  }
}

async function createMediaBucket() {
  console.log(`\n🪣 Creando storage bucket: media`);
  try {
    await storage.createBucket(
      PROJECT_ID, // bucket ID = 'media' but we use a custom ID
      'media',
      'Media',
      [
        Permission.read(Role.any()),
        Permission.create(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any()),
      ],
      false, // not encrypted
      false, // not antivirus
      52428800 // 50MB max file size
    );
    console.log('  ✅ Bucket creado');
  } catch (e: any) {
    if (e.message?.includes('already exists')) {
      console.log('  ⏭️ Bucket ya existe');
    } else {
      console.error(`  ❌ Error: ${e.message}`);
    }
  }
}

// ============================================
// MIGRACIÓN DE DATOS
// ============================================

async function migrateData(collectionId: string) {
  console.log(`\n🔄 Migrando datos de: ${collectionId}`);

  let allDocs: any[] = [];
  let offset = 0;
  const limit = 100;

  // Leer todos los documentos del proyecto antiguo
  while (true) {
    try {
      const result = await oldDb.listDocuments(
        OLD_DATABASE_ID,
        collectionId,
        [Query.limit(limit), Query.offset(offset)]
      );
      allDocs = allDocs.concat(result.documents);
      console.log(`  📖 Leídos ${result.documents.length} docs (total: ${allDocs.length}/${result.total})`);
      if (allDocs.length >= result.total) break;
      offset += limit;
      await sleep(200);
    } catch (e: any) {
      console.error(`  ❌ Error leyendo datos antiguos: ${e.message}`);
      return;
    }
  }

  if (allDocs.length === 0) {
    console.log('  ℹ️ Sin datos para migrar');
    return;
  }

  // Crear documentos en el nuevo proyecto
  let created = 0;
  let errors = 0;
  for (const doc of allDocs) {
    try {
      // Extraer solo los datos (sin $id, $permissions, etc.)
      const data: Record<string, any> = {};
      for (const [k, v] of Object.entries(doc)) {
        if (k.startsWith('$')) continue;
        data[k] = v;
      }

      await db.createDocument(
        DATABASE_ID,
        collectionId,
        ID.unique(),
        data,
        [
          Permission.read(Role.any()),
          Permission.update(Role.any()),
        ]
      );
      created++;
      await sleep(200); // rate limit
    } catch (e: any) {
      errors++;
      console.error(`  ❌ Error creando doc: ${e.message?.substring(0, 100)}`);
    }
  }

  console.log(`  ✅ Migrados: ${created}, Errores: ${errors}`);
}

// ============================================
// SEED DATA
// ============================================

async function seedSequences() {
  console.log('\n🌱 Creando documento sequences (order_sequence)');
  try {
    await db.createDocument(
      DATABASE_ID,
      'sequences',
      ID.unique(),
      { key: 'order_sequence', value: 0 },
      [Permission.read(Role.any()), Permission.update(Role.any())]
    );
    console.log('  ✅ order_sequence creado');
  } catch (e: any) {
    console.error(`  ❌ Error: ${e.message}`);
  }

  console.log('🌱 Creando documento sequences (store_template)');
  try {
    await db.createDocument(
      DATABASE_ID,
      'sequences',
      ID.unique(),
      { key: 'store_template', value: 1 },
      [Permission.read(Role.any()), Permission.update(Role.any())]
    );
    console.log('  ✅ store_template creado');
  } catch (e: any) {
    console.error(`  ❌ Error: ${e.message}`);
  }
}

// ============================================
// MAIN
// ============================================

async function main() {
  const mode = process.argv[2] || 'full'; // full | schema | data | seed

  console.log('🚀 MIGRACIÓN APPWRITE — Nuevo Proyecto');
  console.log(`   Endpoint: ${ENDPOINT}`);
  console.log(`   Project:  ${PROJECT_ID}`);
  console.log(`   Database: ${DATABASE_ID}`);
  console.log(`   Mode:     ${mode}`);
  console.log('='.repeat(60));

  if (mode === 'full' || mode === 'schema') {
    console.log('\n📋 FASE 1: Crear colecciones y atributos');
    for (const coll of COLLECTIONS) {
      await createCollectionWithAttrs(coll);
      await sleep(500); // delay between collections
    }

    // Crear storage bucket
    await createMediaBucket();

    console.log('\n⏳ Esperando 30s para que los atributos pasen a estado "available"...');
    await sleep(30000);
  }

  if (mode === 'full' || mode === 'data') {
    // 🛑 FASE 2 DESACTIVADA POR DEFECTO PARA CLONACIÓN LIMPIA
    // Si necesitas migrar datos antiguos, agrega los IDs aquí.
    console.log('\n📋 FASE 2: Migrar datos del proyecto antiguo (Omitido para clonación limpia)');
    const collectionsWithData: string[] = []; // Vacío para no traer productos del cliente anterior
    for (const collId of collectionsWithData) {
      await migrateData(collId);
    }
  }

  if (mode === 'full' || mode === 'seed') {
    console.log('\n📋 FASE 3: Seed data (sequences)');
    await seedSequences();
  }

  console.log('\n✅ MIGRACIÓN COMPLETADA');
}

main().catch(console.error);
