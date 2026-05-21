// Create missing collections needed by APP/ADMIN that weren't in the web-store
import { Client, Databases, ID, Permission, Role } from 'node-appwrite';

const ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const PROJECT_ID = '6a0e374b0009138bc6fa';
const DATABASE_ID = '6a0e37ac0016762b9dc4';
const API_KEY = 'standard_4fc3847401fa354922245a979fdbb343bf0ba794d2b569f63fd8083bb493cd21ce2571d2c9f2d88747e7a79553faa4635eddf5500842d0ee132f9f0b853a12f678e88c4a3b2327f8dcc13ac9981f52e6cffd9efbbb2eab7a3e353f9ba18466821df3d08f7d40a5625388a3ce4bd2f6248b1ac12661045180dd2a031fec206641';

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const db = new Databases(client);

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const ANY_PERMS = [
  Permission.read(Role.any()),
  Permission.create(Role.any()),
  Permission.update(Role.any()),
  Permission.delete(Role.any()),
];

const MISSING_COLLECTIONS: { id: string; name: string; attrs: Record<string, any> }[] = [
  {
    id: 'portada_banners', name: 'Portada Banners',
    attrs: {
      IMAGEURL: { type: 'string', size: 2048, required: true },
      LINKURL: { type: 'string', size: 2048, required: false },
      TITLE: { type: 'string', size: 256, required: false },
      ISACTIVE: { type: 'boolean', required: false },
      DISPLAYORDER: { type: 'integer', required: false },
      TIMEOFDAY: { type: 'string', size: 50, required: false },
    }
  },
  {
    id: 'portada_banners_tarde', name: 'Portada Banners Tarde',
    attrs: {
      IMAGEURL: { type: 'string', size: 2048, required: true },
      LINKURL: { type: 'string', size: 2048, required: false },
      TITLE: { type: 'string', size: 256, required: false },
      ISACTIVE: { type: 'boolean', required: false },
      DISPLAYORDER: { type: 'integer', required: false },
    }
  },
  {
    id: 'portada_banners_noche', name: 'Portada Banners Noche',
    attrs: {
      IMAGEURL: { type: 'string', size: 2048, required: true },
      LINKURL: { type: 'string', size: 2048, required: false },
      TITLE: { type: 'string', size: 256, required: false },
      ISACTIVE: { type: 'boolean', required: false },
      DISPLAYORDER: { type: 'integer', required: false },
    }
  },
  {
    id: 'live_comments', name: 'Live Comments',
    attrs: {
      userId: { type: 'string', size: 256, required: true },
      userName: { type: 'string', size: 256, required: true },
      userAvatar: { type: 'string', size: 2048, required: false },
      message: { type: 'string', size: 2048, required: true },
      liveStreamId: { type: 'string', size: 256, required: true },
      createdAt: { type: 'integer', required: true },
    }
  },
  {
    id: 'live_reactions', name: 'Live Reactions',
    attrs: {
      userId: { type: 'string', size: 256, required: true },
      liveStreamId: { type: 'string', size: 256, required: true },
      reaction: { type: 'string', size: 50, required: true },
      createdAt: { type: 'integer', required: true },
    }
  },
  {
    id: 'live_presence', name: 'Live Presence',
    attrs: {
      userId: { type: 'string', size: 256, required: true },
      userName: { type: 'string', size: 256, required: false },
      liveStreamId: { type: 'string', size: 256, required: true },
      status: { type: 'string', size: 50, required: true },
      lastSeen: { type: 'integer', required: true },
    }
  },
  {
    id: 'conversations', name: 'Conversations',
    attrs: {
      userId: { type: 'string', size: 256, required: true },
      adminId: { type: 'string', size: 256, required: false },
      subject: { type: 'string', size: 256, required: false },
      status: { type: 'string', size: 50, required: true },
      lastMessageAt: { type: 'integer', required: false },
      lastMessage: { type: 'string', size: 2048, required: false },
    }
  },
  {
    id: 'messages', name: 'Messages',
    attrs: {
      conversationId: { type: 'string', size: 256, required: true },
      senderId: { type: 'string', size: 256, required: true },
      content: { type: 'string', size: 8192, required: true },
      type: { type: 'string', size: 50, required: false },
      createdAt: { type: 'integer', required: true },
    }
  },
  {
    id: 'recibos_pago', name: 'Recibos Pago',
    attrs: {
      orderId: { type: 'string', size: 256, required: true },
      userId: { type: 'string', size: 256, required: true },
      amount: { type: 'integer', required: true },
      method: { type: 'string', size: 50, required: false },
      receiptUrl: { type: 'string', size: 2048, required: false },
      status: { type: 'string', size: 50, required: true },
      createdAt: { type: 'integer', required: true },
    }
  },
  {
    id: 'damaged_claims', name: 'Damaged Claims',
    attrs: {
      orderId: { type: 'string', size: 256, required: true },
      userId: { type: 'string', size: 256, required: true },
      productId: { type: 'string', size: 256, required: true },
      reason: { type: 'string', size: 2048, required: true },
      imageUrl: { type: 'string', size: 2048, required: false },
      status: { type: 'string', size: 50, required: true },
      createdAt: { type: 'integer', required: true },
    }
  },
  {
    id: 'banner_product_positions', name: 'Banner Product Positions',
    attrs: {
      BANNERID: { type: 'string', size: 256, required: true },
      PRODUCTID: { type: 'string', size: 256, required: true },
      POSITIONX: { type: 'double', required: true },
      POSITIONY: { type: 'double', required: true },
      SCALE: { type: 'double', required: false },
      ISACTIVE: { type: 'boolean', required: false },
      DISPLAYORDER: { type: 'integer', required: false },
    }
  },
  {
    id: 'cart', name: 'Cart',
    attrs: {
      userId: { type: 'string', size: 256, required: true },
      productId: { type: 'string', size: 256, required: true },
      quantity: { type: 'integer', required: true },
      addedAt: { type: 'integer', required: true },
    }
  },
];

async function createMissing() {
  console.log('📦 Creando colecciones faltantes para APP/ADMIN\n');

  for (const coll of MISSING_COLLECTIONS) {
    console.log(`\n📦 ${coll.id} (${coll.name})`);
    try {
      await db.createCollection(DATABASE_ID, coll.id, coll.name, ANY_PERMS);
      console.log('  ✅ Colección creada');
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        console.log('  ⏭️ Ya existe');
      } else {
        console.error(`  ❌ Error: ${e.message}`);
        continue;
      }
    }

    for (const [key, attr] of Object.entries(coll.attrs)) {
      try {
        if (attr.type === 'string') {
          await db.createStringAttribute(DATABASE_ID, coll.id, key, attr.size || 256, attr.required, null);
        } else if (attr.type === 'integer') {
          await db.createIntegerAttribute(DATABASE_ID, coll.id, key, attr.required, null);
        } else if (attr.type === 'double') {
          await db.createFloatAttribute(DATABASE_ID, coll.id, key, attr.required, null);
        } else if (attr.type === 'boolean') {
          await db.createBooleanAttribute(DATABASE_ID, coll.id, key, attr.required, null);
        }
        console.log(`  ✅ ${key}`);
      } catch (e: any) {
        if (e.message?.includes('already exists')) {
          console.log(`  ⏭️ ${key} ya existe`);
        } else {
          console.error(`  ❌ ${key}: ${e.message}`);
        }
      }
      await sleep(100);
    }
    await sleep(500);
  }

  console.log('\n✅ Colecciones faltantes creadas');
}

createMissing().catch(console.error);
