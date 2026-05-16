import { NextResponse } from 'next/server';
import { Client, Databases, Query, Users } from 'node-appwrite';
import {
  dedupeUserDocuments,
  isRegisteredUserProfile,
  mergeAuthUsersWithProfiles,
  type UserProfileDoc,
} from '@/lib/users-db';

export const dynamic = 'force-dynamic';

function getServerDb() {
  const endpoint = (process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1').replace(/\/$/, '');
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
  const apiKey = process.env.APPWRITE_API_KEY || '';
  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  return {
    databases: new Databases(client),
    users: new Users(client),
    databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '',
  };
}

async function listAuthUsers(usersApi: Users): Promise<{ $id: string; email?: string; name?: string; $createdAt?: string }[]> {
  const all: { $id: string; email?: string; name?: string; $createdAt?: string }[] = [];
  let offset = 0;
  const limit = 100;
  while (true) {
    const res = await usersApi.list({
      queries: [Query.limit(limit), Query.offset(offset)],
    });
    const batch = res.users || [];
    all.push(...batch.map(u => ({
      $id: u.$id,
      email: u.email,
      name: u.name,
      $createdAt: u.$createdAt,
    })));
    if (batch.length < limit) break;
    offset += limit;
    if (offset > 5000) break;
  }
  return all;
}

async function listProfiles(databases: Databases, databaseId: string): Promise<UserProfileDoc[]> {
  const all: UserProfileDoc[] = [];
  let cursor: string | undefined;
  while (all.length < 2000) {
    const queries = [Query.orderDesc('$createdAt'), Query.limit(100)];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const resp = await databases.listDocuments(databaseId, 'users', queries);
    const docs = resp.documents as unknown as UserProfileDoc[];
    if (!docs.length) break;
    all.push(...docs);
    if (docs.length < 100) break;
    cursor = docs[docs.length - 1].$id;
  }
  return all;
}

/** Lista clientes: colección users + Auth (requiere APPWRITE_API_KEY en servidor). */
export async function GET() {
  if (!process.env.APPWRITE_API_KEY) {
    return NextResponse.json({
      users: [],
      error: 'Falta APPWRITE_API_KEY en Vercel (Settings → Environment Variables).',
    });
  }

  try {
    const { databases, users, databaseId } = getServerDb();
    if (!databaseId) {
      return NextResponse.json({ users: [], error: 'Falta NEXT_PUBLIC_APPWRITE_DATABASE_ID' });
    }

    const [profiles, authUsers] = await Promise.all([
      listProfiles(databases, databaseId),
      listAuthUsers(users),
    ]);

    const merged = mergeAuthUsersWithProfiles(profiles, authUsers);
    const registered = dedupeUserDocuments(merged).filter(isRegisteredUserProfile);

    return NextResponse.json({ users: registered, total: registered.length });
  } catch (e) {
    return NextResponse.json(
      { users: [], error: e instanceof Error ? e.message : 'Error al cargar clientes' },
      { status: 500 },
    );
  }
}
