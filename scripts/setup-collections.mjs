import { Client, Databases, ID, Permission, Role } from 'node-appwrite';

const client = new Client();
client
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('6a0a4e8d0032177f3f90')
  .setKey('standard_dea4a8654ed430bf3626a6cd6506a562cbfcebb7caeb417a1e83c8228ed1de0a84d60b11cc4776d023d0c5ac8d1dcb0ba59e43fef5fb8831a7252aaf5b2f13896769e2a5af222f9853d7f7abcada2d034e1d92e3b73d8de53d1c29adde00cd723aa5612189b2ee702e798acb0dffeb9ff154714a5f7af060c78567391d49923d');

const db = new Databases(client);
const DB_ID = '6a0a58ca001798410d86';

const PERMS = [
  Permission.read(Role.any()),
  Permission.create(Role.any()),
  Permission.update(Role.any()),
  Permission.delete(Role.any()),
];

async function setup() {
  for (const [colId, name, attrs, indexes] of [
    ['admin_chat', 'Admin Chat',
      [
        { key: 'userId', type: 'string', size: 128, required: true },
        { key: 'senderRole', type: 'string', size: 20, required: true },
        { key: 'message', type: 'string', size: 2000, required: true },
        { key: 'readByUser', type: 'boolean', required: false, default: false },
        { key: 'readByAdmin', type: 'boolean', required: false, default: false },
      ],
      [{ key: 'idx_userId', type: 'key', attributes: ['userId'] }],
    ],
    ['cart_items', 'Cart Items',
      [
        { key: 'userId', type: 'string', size: 128, required: true },
        { key: 'productId', type: 'string', size: 128, required: true },
        { key: 'quantity', type: 'integer', required: false, min: 1, max: 999, default: 1 },
        { key: 'addedAt', type: 'integer', required: false },
      ],
      [{ key: 'idx_userId', type: 'key', attributes: ['userId'] }],
    ],
  ]) {
    try { await db.deleteCollection(DB_ID, colId); console.log(`Deleted ${colId}`); } catch {}

    try {
      await db.createCollection({
        databaseId: DB_ID,
        collectionId: colId,
        name,
        permissions: PERMS,
        documentSecurity: false,
        enabled: true,
      });
      console.log(`✓ Created collection: ${colId}`);
    } catch (e) { console.error(`✗ createCollection ${colId}:`, e.message); continue; }

    for (const a of attrs) {
      try {
        if (a.type === 'string') await db.createStringAttribute(DB_ID, colId, a.key, a.size, a.required, a.default ?? null, false);
        else if (a.type === 'integer') await db.createIntegerAttribute(DB_ID, colId, a.key, a.required, a.min ?? null, a.max ?? null, a.default ?? null, false);
        else if (a.type === 'boolean') await db.createBooleanAttribute(DB_ID, colId, a.key, a.required, a.default ?? null, false);
        console.log(`  ✓ attr: ${a.key}`);
      } catch (e) { console.log(`  ! attr ${a.key}: ${e.message}`); }
    }

    console.log('  Waiting 3s for attributes...');
    await new Promise(r => setTimeout(r, 3000));

    for (const idx of indexes) {
      try {
        await db.createIndex(DB_ID, colId, idx.key, idx.type, idx.attributes, ['ASC']);
        console.log(`  ✓ idx: ${idx.key}`);
      } catch (e) { console.log(`  ! idx ${idx.key}: ${e.message}`); }
    }
    console.log(`✓ Done: ${colId}\n`);
  }
}

setup().then(() => console.log('ALL DONE'));
