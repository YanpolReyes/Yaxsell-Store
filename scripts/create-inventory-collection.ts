/**
 * Script para crear la colección `inventory_products` en Appwrite.
 * Esta colección almacena los productos importados desde Excel (Qianji)
 * que aún NO se han publicado al catálogo principal (`products`).
 *
 * Tiene los mismos campos que `products` + 2 extra:
 *   - sku (string, único lógico) — para detectar duplicados rápido
 *   - barcode (string, único lógico)
 *   - published_product_id (string, opcional) — id del producto en `products` cuando se publica
 *   - published_at (string, opcional) — fecha de publicación
 *
 * USO: npx tsx scripts/create-inventory-collection.ts
 */

const NEW_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const NEW_PROJECT_ID = '6a0a4e8d0032177f3f90';
const NEW_DATABASE_ID = '6a0a58ca001798410d86';
const NEW_API_KEY = 'standard_dea4a8654ed430bf3626a6cd6506a562cbfcebb7caeb417a1e83c8228ed1de0a84d60b11cc4776d023d0c5ac8d1dcb0ba59e43fef5fb8831a7252aaf5b2f13896769e2a5af222f9853d7f7abcada2d034e1d92e3b73d8de53d1c29adde00cd723aa5612189b2ee702e798acb0dffeb9ff154714a5f7af060c78567391d49923d';

const headers: Record<string, string> = {
  'Content-Type': 'application/json',
  'X-Appwrite-Project': NEW_PROJECT_ID,
  'X-Appwrite-Key': NEW_API_KEY,
};

const COLLECTION_ID = 'inventory_products';
const COLLECTION_NAME = 'Inventory Products';

type AttrDef = {
  key: string;
  type: 'string' | 'integer' | 'boolean' | 'double';
  size?: number;
  required?: boolean;
  min?: number;
  max?: number;
  default?: any;
};

const ATTRIBUTES: AttrDef[] = [
  // Identificadores únicos (lógicos, no índice estricto para evitar fallos en bulk)
  { key: 'sku',               type: 'string', size: 256,  required: false },
  { key: 'barcode',           type: 'string', size: 256,  required: false },

  // Campos espejo de products
  { key: 'NAME',              type: 'string', size: 256,  required: true },
  { key: 'DESCRIPTION',       type: 'string', size: 8192, required: false },
  { key: 'PRICE',             type: 'integer', required: false, min: 0, default: 0 },
  { key: 'CURRENTPRICE',      type: 'integer', required: false, min: 0 },
  { key: 'COST',              type: 'integer', required: false, min: 0 },
  { key: 'STOCK',             type: 'integer', required: false, min: 0, default: 0 },
  { key: 'CATEGORYID',        type: 'string', size: 256,  required: false },
  { key: 'SUBCATEGORYID',     type: 'string', size: 256,  required: false },
  { key: 'IMAGEURL',          type: 'string', size: 2048, required: false },
  { key: 'IMAGEURL2',         type: 'string', size: 2048, required: false },
  { key: 'IMAGEURL3',         type: 'string', size: 2048, required: false },
  { key: 'IMAGEURL4',         type: 'string', size: 2048, required: false },
  { key: 'IMAGEURL5',         type: 'string', size: 2048, required: false },
  { key: 'WHOLESALEPRICE',    type: 'integer', required: false, min: 0 },
  { key: 'WHOLESALEMINQUANTITY', type: 'integer', required: false, min: 0 },
  { key: 'TAGS',              type: 'string', size: 2048, required: false },
  { key: 'FEATURES',          type: 'string', size: 8192, required: false },
  { key: 'ISACTIVE',          type: 'boolean', required: false, default: false },
  { key: 'PACKQTY',           type: 'integer', required: false, min: 0 },

  // Nombre original chino (para referencia)
  { key: 'name_cn',           type: 'string', size: 512,  required: false },

  // Tracking de publicación
  { key: 'published_product_id', type: 'string', size: 256, required: false },
  { key: 'published_at',         type: 'string', size: 64,  required: false },
  { key: 'imported_at',          type: 'string', size: 64,  required: false },
];

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

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createCollection() {
  console.log(`📦 Creando colección: ${COLLECTION_NAME} (${COLLECTION_ID})`);

  try {
    await apiCall('POST', `${NEW_ENDPOINT}/databases/${NEW_DATABASE_ID}/collections`, {
      collectionId: COLLECTION_ID,
      name: COLLECTION_NAME,
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
      console.log('   ⚠️  Ya existe, continuando con atributos');
    } else {
      console.log(`   ❌ Error: ${e.message?.slice(0, 200)}`);
      throw e;
    }
  }

  await sleep(2000);

  for (const attr of ATTRIBUTES) {
    console.log(`   📝 ${attr.key} (${attr.type})`);

    let url = '';
    const body: any = { key: attr.key, required: attr.required ?? false };

    if (attr.type === 'string') {
      url = `${NEW_ENDPOINT}/databases/${NEW_DATABASE_ID}/collections/${COLLECTION_ID}/attributes/string`;
      body.size = attr.size ?? 256;
      if (attr.default !== undefined) body.default = attr.default;
    } else if (attr.type === 'integer') {
      url = `${NEW_ENDPOINT}/databases/${NEW_DATABASE_ID}/collections/${COLLECTION_ID}/attributes/integer`;
      if (attr.min !== undefined) body.min = attr.min;
      if (attr.max !== undefined) body.max = attr.max;
      if (attr.default !== undefined) body.default = attr.default;
    } else if (attr.type === 'boolean') {
      url = `${NEW_ENDPOINT}/databases/${NEW_DATABASE_ID}/collections/${COLLECTION_ID}/attributes/boolean`;
      if (attr.default !== undefined) body.default = attr.default;
    } else if (attr.type === 'double') {
      url = `${NEW_ENDPOINT}/databases/${NEW_DATABASE_ID}/collections/${COLLECTION_ID}/attributes/float`;
      if (attr.min !== undefined) body.min = attr.min;
      if (attr.max !== undefined) body.max = attr.max;
      if (attr.default !== undefined) body.default = attr.default;
    }

    try {
      await apiCall('POST', url, body);
      console.log(`      ✅`);
    } catch (e: any) {
      if (e.message?.includes('already exists') || e.message?.includes('attribute already exists')) {
        console.log(`      ⚠️  ya existe`);
      } else {
        console.log(`      ❌ ${e.message?.slice(0, 200)}`);
      }
    }

    await sleep(500);
  }

  // Crear índices para búsqueda rápida de SKU y barcode
  console.log('\n🔍 Creando índices...');
  await sleep(3000); // esperar a que atributos estén disponibles

  const indexes = [
    { key: 'idx_sku', attribute: 'sku' },
    { key: 'idx_barcode', attribute: 'barcode' },
    { key: 'idx_category', attribute: 'CATEGORYID' },
    { key: 'idx_stock', attribute: 'STOCK' },
    { key: 'idx_published', attribute: 'published_product_id' },
  ];

  for (const idx of indexes) {
    try {
      await apiCall('POST', `${NEW_ENDPOINT}/databases/${NEW_DATABASE_ID}/collections/${COLLECTION_ID}/indexes`, {
        key: idx.key,
        type: 'key',
        attributes: [idx.attribute],
      });
      console.log(`   ✅ ${idx.key}`);
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        console.log(`   ⚠️  ${idx.key} ya existe`);
      } else {
        console.log(`   ❌ ${idx.key}: ${e.message?.slice(0, 150)}`);
      }
    }
    await sleep(500);
  }

  console.log(`\n✨ ${COLLECTION_NAME} completada`);
}

async function main() {
  console.log('🚀 Creando colección inventory_products...');
  console.log(`📍 ${NEW_ENDPOINT}`);
  console.log(`🆔 ${NEW_PROJECT_ID}`);
  console.log(`💾 ${NEW_DATABASE_ID}\n`);

  try {
    await fetch(`${NEW_ENDPOINT}/health`, { headers }).then(r => {
      if (!r.ok) throw new Error('Health check failed');
    });
    console.log('✅ Conexión OK\n');
  } catch {
    console.error('❌ No se puede conectar a Appwrite');
    process.exit(1);
  }

  await createCollection();

  console.log('\n✅ Listo!');
  console.log('\n📝 Siguientes pasos:');
  console.log('   1. Actualizar src/lib/appwrite-admin.ts con INVENTORY_PRODUCTS_COLLECTION_ID');
  console.log('   2. Modificar src/app/inventario/page.tsx para usar la nueva colección');
}

main().then(() => process.exit(0)).catch(e => {
  console.error('❌', e.message);
  process.exit(1);
});
