/** Helpers para SKU, código de barras y sección en FEATURES (Appwrite). */

export function getBarcodeFromFeatures(features?: string | null): string {
  const m = (features || '').match(/Barcode:\s*(.+)/i);
  return m ? m[1].trim().split('\n')[0] : '';
}

export function getSkuFromFeatures(
  features?: string | null,
  tags?: string | null,
  jumpsellerId?: string | null,
): string {
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

export function getWarehouseLocationFromFeatures(features?: string | null): ProductWarehouseLocation {
  const m = (features || '').match(/Section:\s*(\d+)/i);
  const section = m ? parseInt(m[1], 10) : null;
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
