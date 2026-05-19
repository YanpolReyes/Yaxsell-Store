import { NextResponse } from 'next/server';
import { Client, Query, Users } from 'node-appwrite';

export const dynamic = 'force-dynamic';

function getUsersApi() {
  const endpoint = (process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1').replace(/\/$/, '');
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
  const apiKey = process.env.APPWRITE_API_KEY || '';
  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  return { users: new Users(client), projectId, apiKey };
}

async function listAllAuthUserIds(usersApi: Users): Promise<string[]> {
  const ids: string[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const res = await usersApi.list({ queries: [Query.limit(limit), Query.offset(offset)] });
    const batch = res.users || [];
    for (const u of batch) ids.push(u.$id);
    if (batch.length < limit) break;
    offset += limit;
    if (offset > 5000) break;
  }

  return ids;
}

/** Elimina welcomeCouponCode y autoApplyCoupon de prefs de todos los usuarios Auth. */
export async function POST() {
  const { users, apiKey, projectId } = getUsersApi();

  if (!projectId || !apiKey) {
    return NextResponse.json(
      { ok: false, error: 'missing_api_key', message: 'Falta APPWRITE_API_KEY en el servidor.' },
      { status: 503 },
    );
  }

  try {
    const userIds = await listAllAuthUserIds(users);
    let removedCount = 0;
    let errors = 0;

    for (const id of userIds) {
      try {
        const u = await users.get(id);
        const prefs = (u.prefs && typeof u.prefs === 'object' ? u.prefs : {}) as Record<string, unknown>;
        if (!prefs.welcomeCouponCode && !prefs.autoApplyCoupon) continue;

        await users.updatePrefs(id, {
          ...prefs,
          welcomeCouponCode: null,
          autoApplyCoupon: null,
        });
        removedCount++;
      } catch {
        errors++;
      }
    }

    return NextResponse.json({ ok: true, removedCount, totalUsers: userIds.length, errors });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error desconocido';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
