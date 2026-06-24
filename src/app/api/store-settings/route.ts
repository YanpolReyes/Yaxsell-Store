import { NextResponse } from 'next/server';
import { Client, Databases, Query } from 'node-appwrite';
import { unstable_cache } from 'next/cache';

const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const PROJECT_ID = '6a3c200f000d5437f6c4';
const DATABASE_ID = '6a3c237900227a52bcb2';
const COLLECTION_ID = 'store_settings';
const API_KEY = 'standard_2d173f58f38634c70435e2aa17c03320dc959192545a2e6ec9834b09d80c4f459b4e92b139ee85efba504c423f5bcb1443448799dc7d3b06e811dc0d910d058e7f1093442a87e957beaaaa09569a448ec9e6e8eb178e648e6c48a6451fdffe8716722a1162d89f96e7b243109f537eca0ee1480ef0b639f24ea32e5fdd886f9d';

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

// Module-level in-memory cache as secondary layer
let memoryCacheSettings: any = null;
let memoryCacheSettingsTime = 0;
const MEMORY_CACHE_TTL = 300000; // 5 minutes

const getCachedStoreSettings = unstable_cache(
  async () => {
    const now = Date.now();
    if (memoryCacheSettings && (now - memoryCacheSettingsTime < MEMORY_CACHE_TTL)) {
      return memoryCacheSettings;
    }

    const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [Query.limit(1)]);
    let result: any = {
      storeName: '', phone: '', email: '', address: '', website: '', description: '',
      showInAnnouncementBar: false, unlimitedStock: false,
    };

    if (response.documents.length > 0) {
      const doc = response.documents[0];
      result = {
        $id: doc.$id,
        storeName: doc.STORENAME || '',
        phone: doc.PHONE || '',
        email: doc.EMAIL || '',
        address: doc.ADDRESS || '',
        website: doc.WEBSITE || '',
        description: doc.DESCRIPTION || '',
        showInAnnouncementBar: doc.SHOWINANNOUNCEMENTBAR ?? false,
        unlimitedStock: doc.UNLIMITEDSTOCK ?? false,
      };
    }

    memoryCacheSettings = result;
    memoryCacheSettingsTime = now;
    return result;
  },
  ['store-settings-cache-v2'],
  { revalidate: 3600, tags: ['store_settings'] }
);

export async function GET() {
  try {
    const data = await getCachedStoreSettings();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600'
      }
    });
  } catch (error: any) {
    console.error('[API store-settings] Error fetching store settings:', error);
    return NextResponse.json({
      storeName: '', phone: '', email: '', address: '', website: '', description: '',
      showInAnnouncementBar: false, unlimitedStock: false,
      error: error.message
    }, { status: 200 });
  }
}
