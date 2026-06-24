import { NextResponse } from 'next/server';
import { Client, Databases, Query } from 'node-appwrite';
import { unstable_cache } from 'next/cache';

const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const PROJECT_ID = '6a3c200f000d5437f6c4';
const DATABASE_ID = '6a3c237900227a52bcb2';
const COLLECTION_ID = 'apertura_settings';
const API_KEY = 'standard_2d173f58f38634c70435e2aa17c03320dc959192545a2e6ec9834b09d80c4f459b4e92b139ee85efba504c423f5bcb1443448799dc7d3b06e811dc0d910d058e7f1093442a87e957beaaaa09569a448ec9e6e8eb178e648e6c48a6451fdffe8716722a1162d89f96e7b243109f537eca0ee1480ef0b639f24ea32e5fdd886f9d';

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

// Module-level in-memory cache (secondary layer)
let memoryCacheApertura: any = null;
let memoryCacheAperturaTime = 0;
const MEMORY_CACHE_TTL = 86400000; // 24 hours

const DEFAULT_SETTINGS = {
  isActive: false,
  discountPercent: 20,
  minPurchase: 62500,
};

const getCachedAperturaSettings = unstable_cache(
  async () => {
    const now = Date.now();
    if (memoryCacheApertura && (now - memoryCacheAperturaTime < MEMORY_CACHE_TTL)) {
      return memoryCacheApertura;
    }

    const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [Query.limit(1)]);

    let result = { ...DEFAULT_SETTINGS };

    if (response.documents.length > 0) {
      const d = response.documents[0];
      result = {
        isActive: !!d.isActive,
        discountPercent: typeof d.discountPercent === 'number' ? d.discountPercent : 20,
        minPurchase: typeof d.minPurchase === 'number' ? d.minPurchase : 62500,
      };
    }

    memoryCacheApertura = result;
    memoryCacheAperturaTime = now;
    return result;
  },
  ['apertura-settings-cache-v1'],
  { revalidate: 86400, tags: ['apertura_settings'] }
);

export async function GET() {
  try {
    const data = await getCachedAperturaSettings();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=600'
      }
    });
  } catch (error: any) {
    console.error('[API apertura] Error fetching apertura settings:', error);
    return NextResponse.json(DEFAULT_SETTINGS, { status: 200 });
  }
}
