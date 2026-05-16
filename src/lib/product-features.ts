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

export function setSectionInFeatures(features: string, section: number | null): string {
  let base = (features || '')
    .replace(/\r\n/g, '\n')
    .replace(/\n?Section:\s*\d+/gi, '')
    .replace(/^Section:\s*\d+\n?/gi, '')
    .trim();
  if (section == null || !section) return base;
  return base ? `${base}\nSection: ${section}` : `Section: ${section}`;
}
