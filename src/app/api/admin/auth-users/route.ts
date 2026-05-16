import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type AuthUser = {
  $id: string;
  email?: string;
  name?: string;
  $createdAt?: string;
};

/** Lista usuarios de Appwrite Auth (requiere APPWRITE_API_KEY en el servidor). */
export async function GET() {
  const endpoint = (process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1').replace(/\/$/, '');
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!projectId || !apiKey) {
    return NextResponse.json({ users: [], error: 'missing_api_key' });
  }

  try {
    const all: AuthUser[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const url = `${endpoint}/users?limit=${limit}&offset=${offset}`;
      const res = await fetch(url, {
        headers: {
          'X-Appwrite-Project': projectId,
          'X-Appwrite-Key': apiKey,
        },
        cache: 'no-store',
      });

      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json({ users: all, error: text }, { status: res.status });
      }

      const data = await res.json();
      const batch = (data.users || []) as AuthUser[];
      all.push(...batch);
      if (batch.length < limit) break;
      offset += limit;
      if (offset > 5000) break;
    }

    return NextResponse.json({ users: all });
  } catch (e) {
    return NextResponse.json(
      { users: [], error: e instanceof Error ? e.message : 'unknown' },
      { status: 500 },
    );
  }
}
