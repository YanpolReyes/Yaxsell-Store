import { getAppwriteConfig } from '@/lib/appwrite';

export const PRODUCTS_BUCKET_ID = '67f41e05000d0adb6f12';

/** Convierte fileId o rutas parciales de Appwrite en URL pública de vista. */
export function resolveStorageImageUrl(
  value?: string | null,
  bucketId: string = PRODUCTS_BUCKET_ID,
): string {
  if (!value || typeof value !== 'string') return '';
  const v = value.trim();
  if (!v) return '';

  if (v.startsWith('http://') || v.startsWith('https://') || v.startsWith('data:') || v.startsWith('blob:')) {
    return v;
  }

  const { endpoint, projectId } = getAppwriteConfig();

  if (v.startsWith('/storage/buckets/')) {
    return `${endpoint.replace(/\/$/, '')}${v}${v.includes('?') ? '' : `?project=${projectId}`}`;
  }

  // File ID de Appwrite (sin slashes ni espacios)
  if (/^[a-zA-Z0-9]{10,}$/.test(v) && !v.includes('/') && !v.includes('.')) {
    return `${endpoint}/storage/buckets/${bucketId}/files/${v}/view?project=${projectId}`;
  }

  return v;
}

const IMAGE_KEYS = ['IMAGEURL', 'IMAGEURL2', 'IMAGEURL3', 'IMAGEURL4', 'IMAGEURL5'] as const;

export function getProductImageUrl(product: Partial<Record<(typeof IMAGE_KEYS)[number], string | undefined>>): string {
  for (const key of IMAGE_KEYS) {
    const url = resolveStorageImageUrl(product[key]);
    if (url) return url;
  }
  return '';
}

export function normalizeProductImages<T extends { IMAGEURL?: string; IMAGEURL2?: string; IMAGEURL3?: string; IMAGEURL4?: string; IMAGEURL5?: string }>(product: T): T {
  const out = { ...product };
  for (const key of IMAGE_KEYS) {
    const val = out[key];
    if (val) (out as Record<string, string>)[key] = resolveStorageImageUrl(val);
  }
  return out;
}
