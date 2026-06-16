import { NextRequest, NextResponse } from 'next/server';
import { Client, Databases, Query } from 'node-appwrite';

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

export const revalidate = 120;

export async function GET(req: NextRequest) {
  try {
    const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [Query.limit(1)]);
    if (response.documents.length > 0) {
      const doc = response.documents[0];
      return NextResponse.json({
        $id: doc.$id,
        storeName: doc.STORENAME || '',
        phone: doc.PHONE || '',
        email: doc.EMAIL || '',
        address: doc.ADDRESS || '',
        website: doc.WEBSITE || '',
        description: doc.DESCRIPTION || '',
        showInAnnouncementBar: doc.SHOWINANNOUNCEMENTBAR ?? false,
        unlimitedStock: doc.UNLIMITEDSTOCK ?? false,
      });
    }
    return NextResponse.json({
      storeName: '', phone: '', email: '', address: '', website: '', description: '',
      showInAnnouncementBar: false, unlimitedStock: false,
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
