import { Query, ID } from 'appwrite';
import { getServices, getAppwriteConfig } from '@/lib/appwrite';
import { ADDRESSES_COLLECTION_ID } from '@/lib/appwrite-admin';

export interface StoredAddress {
  id: string;
  alias: string;
  name: string;
  phone: string;
  fullAddress: string;
  commune: string;
  region: string;
  lat: number;
  lng: number;
}

export function loadAddressesLocal(userId: string): StoredAddress[] {
  try {
    return JSON.parse(localStorage.getItem(`addr_${userId}`) || '[]');
  } catch {
    return [];
  }
}

export function saveAddressesLocal(userId: string, list: StoredAddress[]) {
  localStorage.setItem(`addr_${userId}`, JSON.stringify(list));
}

export async function loadAddressesFromDB(userId: string): Promise<StoredAddress[]> {
  try {
    const { databases } = getServices();
    const { databaseId } = getAppwriteConfig();
    const res = await databases.listDocuments(databaseId, ADDRESSES_COLLECTION_ID, [
      Query.equal('userId', userId),
      Query.limit(100),
    ]);
    return res.documents.map((doc: Record<string, unknown>) => ({
      id: doc.$id as string,
      alias: (doc.alias as string) || 'Otro',
      name: (doc.name as string) || '',
      phone: (doc.phone as string) || '',
      fullAddress: (doc.fullAddress as string) || '',
      commune: (doc.commune as string) || '',
      region: (doc.region as string) || '',
      lat: (doc.lat as number) || 0,
      lng: (doc.lng as number) || 0,
    }));
  } catch {
    return [];
  }
}

export async function syncAddressesForUser(userId: string): Promise<StoredAddress[]> {
  const fromDb = await loadAddressesFromDB(userId);
  if (fromDb.length > 0) {
    saveAddressesLocal(userId, fromDb);
    return fromDb;
  }
  return loadAddressesLocal(userId);
}

export function getPrimaryAddressLabel(addresses: StoredAddress[]): string | null {
  const primary = addresses[0];
  if (!primary) return null;
  return primary.commune || primary.fullAddress || null;
}

export const TPL1_ADDRESS_UPDATED = 'tpl1:address-updated';
export const TPL1_OPEN_NOTIFICATIONS = 'tpl1:open-notifications';
