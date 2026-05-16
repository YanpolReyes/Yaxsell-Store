import { ID, Query } from 'appwrite';
import { getServices, getAppwriteConfig, USERS_COLLECTION_ID } from '@/lib/appwrite-admin';

export interface UserProfileDoc {
  $id: string;
  userId?: string;
  email?: string;
  name?: string;
  phone?: string;
  region?: string;
  comuna?: string;
  address?: string;
  isWholesale?: boolean;
  isBanned?: boolean;
  adminNotes?: string;
  $createdAt: string;
}

export function normalizeUserEmail(email?: string | null): string {
  return (email || '').trim().toLowerCase();
}

/** Clave estable para deduplicar (mismo Auth user o mismo email). */
export function userDocKey(doc: UserProfileDoc): string {
  const uid = doc.userId?.trim();
  if (uid) return `uid:${uid}`;
  const email = normalizeUserEmail(doc.email);
  if (email) return `email:${email}`;
  return `doc:${doc.$id}`;
}

/** Un registro por persona; prioriza documento con userId de Appwrite Auth. */
export function dedupeUserDocuments(docs: UserProfileDoc[]): UserProfileDoc[] {
  const byKey = new Map<string, UserProfileDoc>();
  for (const doc of docs) {
    const key = userDocKey(doc);
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, doc);
      continue;
    }
    const score = (d: UserProfileDoc) =>
      (d.userId?.trim() ? 4 : 0) + (normalizeUserEmail(d.email).includes('@') ? 2 : 0);
    const prevScore = score(prev);
    const docScore = score(doc);
    if (docScore > prevScore) {
      byKey.set(key, doc);
      continue;
    }
    if (docScore === prevScore) {
      const prevT = new Date(prev.$createdAt || 0).getTime();
      const docT = new Date(doc.$createdAt || 0).getTime();
      if (docT >= prevT) byKey.set(key, doc);
    }
  }
  return Array.from(byKey.values()).sort(
    (a, b) => new Date(b.$createdAt || 0).getTime() - new Date(a.$createdAt || 0).getTime(),
  );
}

/** Cliente con email válido (colección users o sincronizado desde Auth). */
export function isRegisteredUserProfile(doc: UserProfileDoc): boolean {
  const email = normalizeUserEmail(doc.email);
  return !!email && email.includes('@');
}

export async function listAllUserProfiles(limit = 500): Promise<UserProfileDoc[]> {
  const { databases } = getServices();
  const { databaseId } = getAppwriteConfig();
  const all: UserProfileDoc[] = [];
  let cursor: string | undefined;
  const pageSize = Math.min(limit, 500);

  while (all.length < limit) {
    const queries: string[] = [Query.orderDesc('$createdAt'), Query.limit(pageSize)];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const resp = await databases.listDocuments(databaseId, USERS_COLLECTION_ID, queries);
    const docs = resp.documents as unknown as UserProfileDoc[];
    if (!docs.length) break;
    all.push(...docs);
    if (docs.length < pageSize) break;
    cursor = docs[docs.length - 1].$id;
    if (all.length >= limit) break;
  }

  return all.slice(0, limit);
}

export function mergeAuthUsersWithProfiles(
  profiles: UserProfileDoc[],
  authUsers: { $id: string; email?: string; name?: string; $createdAt?: string }[],
): UserProfileDoc[] {
  const byEmail = new Map<string, UserProfileDoc>();
  const byUid = new Map<string, UserProfileDoc>();

  for (const p of profiles) {
    const email = normalizeUserEmail(p.email);
    if (email) byEmail.set(email, p);
    if (p.userId?.trim()) byUid.set(p.userId.trim(), p);
  }

  const merged = [...profiles];

  for (const au of authUsers) {
    const email = normalizeUserEmail(au.email);
    if (!email || !email.includes('@')) continue;
    if (byUid.has(au.$id) || byEmail.has(email)) continue;

    merged.push({
      $id: `auth:${au.$id}`,
      userId: au.$id,
      email,
      name: au.name || email.split('@')[0],
      $createdAt: au.$createdAt || new Date().toISOString(),
    });
  }

  return dedupeUserDocuments(merged);
}

export async function upsertUserProfile(input: {
  userId: string;
  email: string;
  name?: string;
  phone?: string;
}): Promise<void> {
  const { databases } = getServices();
  const { databaseId } = getAppwriteConfig();
  const email = normalizeUserEmail(input.email);
  if (!email) return;

  const payload: Record<string, string> = {
    userId: input.userId,
    email,
    name: (input.name || 'Usuario').trim(),
    phone: input.phone || '',
    updatedAt: new Date().toISOString(),
  };

  let existingId: string | null = null;

  if (input.userId) {
    const byUid = await databases.listDocuments(databaseId, USERS_COLLECTION_ID, [
      Query.equal('userId', input.userId),
      Query.limit(10),
    ]);
    if (byUid.documents[0]) existingId = byUid.documents[0].$id;
  }

  if (!existingId) {
    const byEmail = await databases.listDocuments(databaseId, USERS_COLLECTION_ID, [
      Query.equal('email', email),
      Query.limit(10),
    ]);
    if (byEmail.documents[0]) existingId = byEmail.documents[0].$id;
  }

  if (existingId) {
    await databases.updateDocument(databaseId, USERS_COLLECTION_ID, existingId, payload);
  } else {
    await databases.createDocument(databaseId, USERS_COLLECTION_ID, ID.unique(), {
      ...payload,
      createdAt: new Date().toISOString(),
    });
  }
}
