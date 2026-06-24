/**
 * FIX — Arregla buckets, attributes con defaults fallidos, y sequences
 * Ejecutar DESPUÉS de clone-backend.ts
 * 
 * Uso: npx tsx scripts/clone-fix.ts
 */

import { Client, Databases, Storage } from 'node-appwrite';

const ENDPOINT    = 'https://nyc.cloud.appwrite.io/v1';
const PROJECT_ID  = '6a3c200f000d5437f6c4';
const DATABASE_ID = '6a3c237900227a52bcb2';
const API_KEY     = 'standard_2d173f58f38634c70435e2aa17c03320dc959192545a2e6ec9834b09d80c4f459b4e92b139ee85efba504c423f5bcb1443448799dc7d3b06e811dc0d910d058e7f1093442a87e957beaaaa09569a448ec9e6e8eb178e648e6c48a6451fdffe8716722a1162d89f96e7b243109f537eca0ee1480ef0b639f24ea32e5fdd886f9d';

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const db = new Databases(client);
const storage = new Storage(client);

const ANY_PERMS = ['read("any")', 'create("any")', 'update("any")', 'delete("any")'];

// Attributes que fallaron por default string -> necesitan default numérico
const FIX_ATTRS: { coll: string; key: string; type: 'integer' | 'boolean'; default: number | boolean; required?: boolean }[] = [
  { coll: 'inventory_products', key: 'PRICE', type: 'integer', default: 0 },
  { coll: 'inventory_products', key: 'STOCK', type: 'integer', default: 0 },
  { coll: 'inventory_products', key: 'PACKQTY', type: 'integer', default: 0 },
  { coll: 'banners', key: 'DISPLAYORDER', type: 'integer', default: 0 },
  { coll: 'orders', key: 'SHIPPINGCOST', type: 'integer', default: 0 },
  { coll: 'orders', key: 'DISCOUNT', type: 'integer', default: 0 },
  { coll: 'sequences', key: 'value', type: 'integer', default: 0, required: true },
  { coll: 'discount_coupons', key: 'MAXUSES', type: 'integer', default: 0 },
  { coll: 'discount_coupons', key: 'USEDCOUNT', type: 'integer', default: 0 },
  { coll: 'discount_coupons', key: 'MINORDERAMOUNT', type: 'integer', default: 0 },
  { coll: 'stock_alerts', key: 'quantity', type: 'integer', default: 1 },
  { coll: 'hotspot_panels', key: 'CELLINDEX', type: 'integer', default: 0 },
  { coll: 'hotspot_panels', key: 'DISPLAYORDER', type: 'integer', default: 0 },
  { coll: 'page_views', key: 'VIEWS', type: 'integer', default: 0, required: true },
];

async function fixAll() {
  console.log('🔧 Arreglando atributos con defaults fallidos...\n');

  for (const attr of FIX_ATTRS) {
    try {
      // Intentar crear (si no existe)
      if (attr.type === 'integer') {
        await db.createIntegerAttribute(
          DATABASE_ID, attr.coll, attr.key, attr.required || false,
          undefined, undefined, attr.default as number, false
        );
      } else {
        await db.createBooleanAttribute(
          DATABASE_ID, attr.coll, attr.key, attr.required || false,
          attr.default as boolean, false
        );
      }
      console.log(`  ✅ ${attr.coll}.${attr.key} creado con default=${attr.default}`);
    } catch (e: any) {
      if (e.message?.includes('already') || e.message?.includes('already in use')) {
        // Ya existe pero sin default correcto — actualizar
        try {
          if (attr.type === 'integer') {
            await db.updateIntegerAttribute(
              DATABASE_ID, attr.coll, attr.key,
              attr.required || false,
              undefined, undefined, attr.default as number, false
            );
          } else {
            await db.updateBooleanAttribute(
              DATABASE_ID, attr.coll, attr.key,
              attr.required || false,
              attr.default as boolean, false
            );
          }
          console.log(`  ✅ ${attr.coll}.${attr.key} actualizado con default=${attr.default}`);
        } catch (e2: any) {
          console.error(`  ❌ ${attr.coll}.${attr.key}: ${e2.message?.substring(0, 80)}`);
        }
      } else {
        console.error(`  ❌ ${attr.coll}.${attr.key}: ${e.message?.substring(0, 80)}`);
      }
    }
    await new Promise(r => setTimeout(r, 200));
  }

  // Buckets — usar REST API directamente (createBucket tiene bug con param enabled)
  console.log('\n🪣 Arreglando buckets...\n');
  const buckets = [
    { id: 'products', name: 'Products', maxSize: 50000000 },
    { id: 'ia', name: 'IA Assets', maxSize: 5000000000 },
    { id: 'despachos', name: 'Despachos', maxSize: 5000000000 },
  ];

  for (const bucket of buckets) {
    try {
      await storage.createBucket(bucket.id, bucket.name, ANY_PERMS, true, bucket.maxSize);
      console.log(`  ✅ Bucket: ${bucket.id}`);
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        console.log(`  ⏭️  Bucket ya existe: ${bucket.id}`);
      } else {
        // Intentar con REST API como fallback
        try {
          const body = JSON.stringify({
            bucketId: bucket.id,
            name: bucket.name,
            permissions: ANY_PERMS,
            fileSecurity: false,
            enabled: true,
            maximumFileSize: bucket.maxSize,
            allowedFileExtensions: [],
            compression: 'gzip',
            encryption: false,
            antivirus: false,
          });
          const headers = {
            'Content-Type': 'application/json',
            'X-Appwrite-Project': PROJECT_ID,
            'X-Appwrite-Key': API_KEY,
          };
          // PowerShell REST call
          const resp = await fetch(`${ENDPOINT}/storage/buckets`, {
            method: 'POST',
            headers,
            body,
          });
          if (resp.ok) {
            console.log(`  ✅ Bucket: ${bucket.id} (via REST)`);
          } else {
            const txt = await resp.text();
            if (txt.includes('already')) {
              console.log(`  ⏭️  Bucket ya existe: ${bucket.id}`);
            } else {
              console.error(`  ❌ Bucket ${bucket.id}: ${txt.substring(0, 80)}`);
            }
          }
        } catch (e2: any) {
          console.error(`  ❌ Bucket ${bucket.id}: ${e2.message?.substring(0, 80)}`);
        }
      }
    }
  }

  // Re-crear documentos semilla de sequences
  console.log('\n🌱 Re-creando sequences...\n');
  for (const seq of [
    { id: 'store_template', key: 'store_template', value: 1 },
    { id: 'order_sequence', key: 'order_sequence', value: 0 },
  ]) {
    try {
      await db.createDocument(DATABASE_ID, 'sequences', seq.id, {
        key: seq.key,
        value: seq.value,
      });
      console.log(`  ✅ sequences/${seq.id}`);
    } catch (e: any) {
      if (e.message?.includes('already')) console.log(`  ⏭️  sequences/${seq.id} ya existe`);
      else console.error(`  ❌ sequences/${seq.id}: ${e.message?.substring(0, 80)}`);
    }
  }

  console.log('\n🎉 Fix completado!');
}

fixAll().catch(console.error);
