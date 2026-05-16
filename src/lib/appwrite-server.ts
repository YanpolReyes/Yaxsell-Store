/**
 * Appwrite server-side (API key) — para crear notificaciones y operaciones privilegiadas.
 */
const APPWRITE_ENDPOINT =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const PROJECT_ID =
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '698f6de50012f9df7ebd';
const DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '67f1dc940037b3d367bb';
const API_KEY =
  process.env.APPWRITE_API_KEY ||
  'standard_ea10b9d7d4414fec61778bdc7f569b0de82bb3aca157f5949bbb8c7320b379f12e15649cae18dc0512f75fd8d575dd5f59058125598e0a0491fa9ea9760ff67b2f792df372b838bf5bd1a9acfef29f201ccb20105285ee2787343eebf89234a4b0a6977ae7447cc5d9c0742d0f9d364d03730c97261748a019bf592ce7cd2025';

const headers = () => ({
  'Content-Type': 'application/json',
  'X-Appwrite-Project': PROJECT_ID,
  'X-Appwrite-Key': API_KEY,
});

export function getServerConfig() {
  return { endpoint: APPWRITE_ENDPOINT, projectId: PROJECT_ID, databaseId: DATABASE_ID };
}

export async function serverListDocuments(
  collectionId: string,
  queries: string[] = []
): Promise<{ documents: Record<string, unknown>[]; total: number }> {
  const q = queries.length ? `?${queries.map((x) => `queries[]=${encodeURIComponent(x)}`).join('&')}` : '';
  const res = await fetch(
    `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${collectionId}/documents${q}`,
    { headers: headers() }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || `listDocuments failed: ${res.status}`);
  }
  return res.json();
}

export async function serverCreateDocument(
  collectionId: string,
  documentId: string,
  data: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const res = await fetch(
    `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${collectionId}/documents`,
    {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ documentId, data }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || `createDocument failed: ${res.status}`);
  }
  return res.json();
}

export async function serverUpdateDocument(
  collectionId: string,
  documentId: string,
  data: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const res = await fetch(
    `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${collectionId}/documents/${documentId}`,
    {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ data }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || `updateDocument failed: ${res.status}`);
  }
  return res.json();
}
