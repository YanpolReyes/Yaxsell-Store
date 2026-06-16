import { NextResponse } from 'next/server';
import { Client, Databases, Query } from 'node-appwrite';
import { unstable_cache } from 'next/cache';

const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const PROJECT_ID = '6a0a4e8d0032177f3f90';
const DATABASE_ID = '6a0a58ca001798410d86';
const COLLECTION_ID = 'store_settings';
const API_KEY = 'standard_c476eaadc21bbecc3b6949ee4d0a932613b7a3d4ee52c80cf2c1406750ff75267becfad617da0acd444d0b903b8faea19661d48b2f8b6dc09b678e0db164ddd4b472417c3477a091188554bdd2adfad944778a2927090744ae991c9dcf48c7cebc60e437f5c8a841ffb0736da27daf197bf5716065c2ea5dda65070b07d74642';

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
