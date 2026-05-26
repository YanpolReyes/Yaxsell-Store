import { NextResponse } from 'next/server';

const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const PROJECT_ID = '6a0a4e8d0032177f3f90';
const DATABASE_ID = '6a0a58ca001798410d86';
const COLLECTION_ID = 'theme_config';
const DOC_ID = 'homepage_sections';
const API_KEY = 'standard_c476eaadc21bbecc3b6949ee4d0a932613b7a3d4ee52c80cf2c1406750ff75267becfad617da0acd444d0b903b8faea19661d48b2f8b6dc09b678e0db164ddd4b472417c3477a091188554bdd2adfad944778a2927090744ae991c9dcf48c7cebc60e437f5c8a841ffb0736da27daf197bf5716065c2ea5dda65070b07d74642';

// GET - Returns the last updated timestamp of the theme config
// Clients poll this to detect when admin has made changes
export async function GET() {
  try {
    const res = await fetch(
      `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents/${DOC_ID}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': PROJECT_ID,
          'X-Appwrite-Key': API_KEY,
        },
      }
    );

    if (res.ok) {
      const doc = await res.json();
      // $updatedAt is Appwrite's automatic ISO timestamp — convert to ms for comparison
      const raw = doc.$updatedAt || doc.UPDATEDAT;
      const updatedAt = raw ? new Date(raw).getTime() : 0;
      return NextResponse.json(
        { updatedAt },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    return NextResponse.json(
      { updatedAt: 0 },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch {
    return NextResponse.json(
      { updatedAt: 0 },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  }
}
