/**
 * Appwrite server-side (API key) — para crear notificaciones y operaciones privilegiadas.
 */
const APPWRITE_ENDPOINT =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const PROJECT_ID =
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6a0e374b0009138bc6fa';
const DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '6a0e37ac0016762b9dc4';
const API_KEY =
  process.env.APPWRITE_API_KEY ||
  'standard_4fc3847401fa354922245a979fdbb343bf0ba794d2b569f63fd8083bb493cd21ce2571d2c9f2d88747e7a79553faa4635eddf5500842d0ee132f9f0b853a12f678e88c4a3b2327f8dcc13ac9981f52e6cffd9efbbb2eab7a3e353f9ba18466821df3d08f7d40a5625388a3ce4bd2f6248b1ac12661045180dd2a031fec206641';

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

export async function serverDeleteDocument(
  collectionId: string,
  documentId: string
): Promise<void> {
  const res = await fetch(
    `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${collectionId}/documents/${documentId}`,
    {
      method: 'DELETE',
      headers: headers(),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || `deleteDocument failed: ${res.status}`);
  }
}

export async function serverUploadFile(
  bucketId: string,
  file: File | Blob | ArrayBuffer,
  fileName: string = 'upload.jpg'
): Promise<{ $id: string }> {
  const formData = new FormData();
  const blob = file instanceof ArrayBuffer ? new Blob([file]) : file;
  formData.append('file', blob, fileName);
  formData.append('fileId', 'unique()');
  const res = await fetch(
    `${APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files`,
    {
      method: 'POST',
      headers: {
        'X-Appwrite-Project': PROJECT_ID,
        'X-Appwrite-Key': API_KEY,
      },
      body: formData,
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || `uploadFile failed: ${res.status}`);
  }
  return res.json();
}

export function getServerFileUrl(bucketId: string, fileId: string): string {
  return `${APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${fileId}/view?project=${PROJECT_ID}`;
}
