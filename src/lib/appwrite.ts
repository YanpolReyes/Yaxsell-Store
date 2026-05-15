import { Client, Databases, Account, Storage, ID, Query } from 'appwrite';

export { ID, Query };

function getConfig() {
  if (typeof window !== 'undefined') {
    // Check both keys: admin uses 'yaxsel_appwrite_config', store uses 'appwrite_config'
    for (const key of ['yaxsel_appwrite_config', 'appwrite_config']) {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed?.endpoint && parsed?.projectId && parsed?.databaseId) {
            return parsed;
          }
        } catch {}
      }
    }
  }
  return {
    endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
    projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '',
    databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '',
  };
}

export function getAppwriteConfig() {
  return getConfig();
}

let _client: Client | null = null;

export function getServices() {
  const { endpoint, projectId } = getConfig();
  if (!_client) {
    _client = new Client().setEndpoint(endpoint).setProject(projectId);
  }
  return {
    client: _client,
    databases: new Databases(_client),
    account: new Account(_client),
    storage: new Storage(_client),
  };
}

export const PRODUCTS_COLLECTION    = 'products';
export const CATEGORIES_COLLECTION  = 'categories';
export const BANNERS_COLLECTION     = 'banners';
export const ORDERS_COLLECTION      = 'orders';
export const TIMED_OFFERS_COLLECTION = 'timed_offers';
export const SEQUENCES_COLLECTION   = 'sequences';
export const COUPONS_COLLECTION                  = 'discount_coupons';
export const USERS_COLLECTION                    = 'users';
export const LIVE_STREAMS_COLLECTION             = 'live_streams';
export const BANNER_OVERLAY_POSITIONS_COLLECTION = 'banner_overlay_positions';
export const HOUSE_PRODUCT_POSITIONS_COLLECTION  = 'house_product_positions';
export const HOTSPOT_PANELS_COLLECTION           = 'hotspot_panels';
export const PRODUCT_VOTES_COLLECTION            = 'product_votes';
export const SUBCATEGORIES_COLLECTION            = 'subcategories';
export const REVIEWS_COLLECTION                  = 'reviews';
export const CLIPS_COLLECTION                    = 'clips';
export const FAVORITES_COLLECTION                = 'favorites';
export const RAFFLES_COLLECTION                  = 'live_raffles';
export const RAFFLE_PARTICIPANTS_COLLECTION      = 'raffle_participants';
export const STOCK_ALERTS_COLLECTION             = 'stock_alerts';
export const NOTIFICATIONS_COLLECTION            = 'notifications';
export const THEME_CONFIG_COLLECTION             = 'theme_config';
export const COMPROBANTES_BUCKET                 = 'comprobantes';
export const USER_PHOTOS_BUCKET     = '67f41e05000d0adb6f12';  // live-thumbnails bucket (reutilizado para fotos de perfil)

export async function getNextOrderIndex(): Promise<number> {
  const { databases } = getServices();
  const { databaseId } = getAppwriteConfig();
  try {
    const doc = await databases.getDocument(databaseId, SEQUENCES_COLLECTION, 'order_sequence');
    const current = (doc.value as number) || 0;
    await databases.updateDocument(databaseId, SEQUENCES_COLLECTION, 'order_sequence', { value: current + 1 });
    return current + 1;
  } catch {
    try {
      await databases.createDocument(databaseId, SEQUENCES_COLLECTION, 'order_sequence', { value: 1 });
    } catch {}
    return 1;
  }
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(price);
}
