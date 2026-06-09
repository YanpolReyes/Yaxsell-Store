/** Helpers para SKU, código de barras y sección en FEATURES (Appwrite). */

export function getBarcodeFromFeatures(features?: string | null, directBarcode?: string | null): string {
  if (directBarcode && String(directBarcode).trim()) return String(directBarcode).trim();
  const m = (features || '').match(/Barcode:\s*(.+)/i);
  return m ? m[1].trim().split('\n')[0] : '';
}

export function getSkuFromFeatures(
  features?: string | null,
  tags?: string | null,
  jumpsellerId?: string | null,
  directSku?: string | null,
): string {
  if (directSku && String(directSku).trim()) return String(directSku).trim();
  const m = (features || '').match(/SKU:\s*(.+)/i);
  if (m) return m[1].trim().split('\n')[0];
  const tagParts = (tags || '').split(',').map(t => t.trim());
  const skuTag = tagParts.find(t => /^[A-Z0-9]{4,}$/i.test(t));
  return jumpsellerId || skuTag || '';
}

export function setBarcodeInFeatures(features: string, barcode: string): string {
  const code = barcode.trim();
  let base = (features || '')
    .replace(/\r\n/g, '\n')
    .replace(/\n?Barcode:\s*[^\n]*/gi, '')
    .replace(/^Barcode:\s*[^\n]*\n?/gi, '')
    .trim();
  if (!code) return base;
  return base ? `${base}\nBarcode: ${code}` : `Barcode: ${code}`;
}

export function setSkuInFeatures(features: string, sku: string): string {
  const value = sku.trim();
  let base = (features || '')
    .replace(/\r\n/g, '\n')
    .replace(/\n?SKU:\s*[^\n]*/gi, '')
    .replace(/^SKU:\s*[^\n]*\n?/gi, '')
    .trim();
  if (!value) return base;
  return base ? `${base}\nSKU: ${value}` : `SKU: ${value}`;
}

export interface ProductWarehouseLocation {
  section: number | null;
  gondola: string | null;
  /** Ej: G-A · S5 */
  label: string | null;
}

export function getWarehouseLocationFromFeatures(features?: string | null, directSection?: number | null): ProductWarehouseLocation {
  const section = directSection != null ? directSection : (() => {
    const m = (features || '').match(/Section:\s*(\d+)/i);
    return m ? parseInt(m[1], 10) : null;
  })();
  let gondola: string | null = null;
  if (section !== null && !Number.isNaN(section)) {
    if (section >= 1 && section <= 9) gondola = 'A';
    else if (section >= 10 && section <= 18) gondola = 'B';
    else if (section >= 19 && section <= 27) gondola = 'C';
    else if (section >= 28 && section <= 36) gondola = 'D';
  }
  const label = section !== null && gondola ? `G${gondola} · S${section}` : null;
  return { section, gondola, label };
}

export function setSectionInFeatures(features: string, section: number | null): string {
  let base = (features || '')
    .replace(/\r\n/g, '\n')
    .replace(/\n?Section:\s*\d+/gi, '')
    .replace(/^Section:\s*\d+\n?/gi, '')
    .trim();
  if (section == null || !section) return base;
  return base ? `${base}\nSection: ${section}` : `Section: ${section}`;
}

// ─── Live Shopping Logic ───────────────────────────────────────────────────────

export type LiveLogicMinQty = {
  /** Minimum quantity to trigger the offer price */
  qty: number;
  /** Special price when qty >= minQty */
  offerPrice: number;
};

export type LiveLogicLimitedTime = {
  /** ISO date string when the offer expires */
  expiresAt: string;
  /** Offer price during the limited time period */
  offerPrice: number;
};

export type LiveLogicConfig = {
  /** If true, the apertura -20% global discount is suppressed for this product */
  disableApertura?: boolean;
  /** Minimum quantity logic */
  minQty?: LiveLogicMinQty;
  /** Limited time offer logic */
  limitedTime?: LiveLogicLimitedTime;
};

export function getLiveLogicFromFeatures(features?: string | null): LiveLogicConfig | null {
  const m = (features || '').match(/LiveLogic:\s*(\{.*\})/i);
  if (!m) return null;
  try {
    return JSON.parse(m[1]) as LiveLogicConfig;
  } catch {
    return null;
  }
}

export function setLiveLogicInFeatures(features: string, config: LiveLogicConfig | null): string {
  let base = (features || '')
    .replace(/\r\n/g, '\n')
    .replace(/\n?LiveLogic:\s*\{[^\n]*\}/gi, '')
    .replace(/^LiveLogic:\s*\{[^\n]*\}\n?/gi, '')
    .trim();
  if (!config) return base;
  const json = JSON.stringify(config);
  return base ? `${base}\nLiveLogic: ${json}` : `LiveLogic: ${json}`;
}

/** Returns whether the limited-time offer is currently active (not yet expired). */
export function isLiveLogicLimitedTimeActive(logic: LiveLogicConfig): boolean {
  if (!logic.limitedTime) return false;
  return new Date(logic.limitedTime.expiresAt).getTime() > Date.now();
}

