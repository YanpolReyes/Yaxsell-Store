/**
 * Elimina atributos no esenciales y agrega los faltantes en inventory_products.
 *
 * El límite total de Appwrite Cloud por colección es ~16KB de strings.
 * Estimación actual (después de crear):
 *   - DESCRIPTION (8192) ← eliminar, demasiado grande para inventario
 *   - IMAGEURL/2/3 (2048 × 3 = 6144)
 *   - sku/barcode/CATEGORYID/SUBCATEGORYID (256 × 4 = 1024)
 *   - NAME (256) + published_product_id/published_at/imported_at (~400)
 *
 * Estrategia:
 *   1. Eliminar DESCRIPTION (libera 8192) y CURRENTPRICE/COST/PACKQTY (no usados en inventario)
 *   2. Esperar
 *   3. Agregar FEATURES (2048), TAGS (512), IMAGEURL4 (1024), IMAGEURL5 (1024), name_cn (256)
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

// Eliminar para liberar espacio
const TO_DELETE = ['DESCRIPTION', 'CURRENTPRICE', 'COST', 'PACKQTY'];

// Agregar (críticos para la lógica)
const TO_ADD = [
  { key: 'FEATURES',   size: 2048 },
  { key: 'TAGS',       size: 512 },
  { key: 'name_cn',    size: 256 },
  { key: 'IMAGEURL4',  size: 1024 },
  { key: 'IMAGEURL5',  size: 1024 },
];

async function apiCall(method: string, url: string, body?: any) {
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  return res.status === 204 ? {} : res.json();
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('🗑️  Eliminando atributos no esenciales...\n');

  for (const key of TO_DELETE) {
    console.log(`❌ ${key}`);
    try {
      await apiCall('DELETE',
        `${NEW_ENDPOINT}/databases/${NEW_DATABASE_ID}/collections/${COLLECTION_ID}/attributes/${key}`
      );
      console.log('   ✅ eliminado');
    } catch (e: any) {
      if (e.message?.includes('not found') || e.message?.includes('404')) {
        console.log('   ⚠️  no existía');
      } else {
        console.log(`   ⚠️  ${e.message?.slice(0, 150)}`);
      }
    }
    await sleep(1500);
  }

  console.log('\n⏳ Esperando 5s para que Appwrite procese eliminaciones...');
  await sleep(5000);

  console.log('\n➕ Agregando atributos faltantes...\n');

  for (const a of TO_ADD) {
    console.log(`📝 ${a.key} (size: ${a.size})`);
    try {
      await apiCall('POST',
        `${NEW_ENDPOINT}/databases/${NEW_DATABASE_ID}/collections/${COLLECTION_ID}/attributes/string`,
        { key: a.key, size: a.size, required: false }
      );
      console.log('   ✅');
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        console.log('   ⚠️  ya existe');
      } else {
        console.log(`   ❌ ${e.message?.slice(0, 200)}`);
      }
    }
    await sleep(1000);
  }

  console.log('\n✅ Listo');
}

main().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
