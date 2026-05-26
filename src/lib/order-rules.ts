/** Monto mínimo de compra (se evalúa sobre el precio original, antes de cupones y promos). */
export const MINIMUM_ORDER_CLP = 50_000;

/** Retorna true si el precio original (sin descuentos) está por debajo del mínimo. */
export function isBelowMinimumOrder(subtotalBeforeDiscounts: number): boolean {
  return subtotalBeforeDiscounts < MINIMUM_ORDER_CLP;
}

export function minimumOrderMessage(subtotalBeforeDiscounts: number, totalAfterDiscounts?: number): string {
  const base = `El monto mínimo de compra es $${MINIMUM_ORDER_CLP.toLocaleString('es-CL')}.`;
  if (totalAfterDiscounts !== undefined && totalAfterDiscounts < subtotalBeforeDiscounts) {
    return `${base} Tu carrito suma $${Math.round(subtotalBeforeDiscounts).toLocaleString('es-CL')} (antes de descuentos) → $${Math.round(totalAfterDiscounts).toLocaleString('es-CL')} a pagar.`;
  }
  return `${base} Tu total es $${Math.round(subtotalBeforeDiscounts).toLocaleString('es-CL')}.`;
}
