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

/** Solo clientes con cuenta real en Appwrite (email + userId o email válido). */
export function isRegisteredUserProfile(doc: UserProfileDoc): boolean {
  const email = normalizeUserEmail(doc.email);
  if (!email || !email.includes('@')) return false;
  return Boolean(doc.userId?.trim() || doc.name?.trim());
}

export async function listAllUserProfiles(limit = 500): Promise<UserProfileDoc[]> {
  const { databases } = getServices();
  const { databaseId } = getAppwriteConfig();
  const resp = await databases.listDocuments(databaseId, USERS_COLLECTION_ID, [
    Query.orderDesc('$createdAt'),
    Query.limit(limit),
  ]);
  return resp.documents as unknown as UserProfileDoc[];
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
