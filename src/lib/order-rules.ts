/** Monto mínimo a pagar (después de cupones y promos). */
export const MINIMUM_ORDER_CLP = 50_000;

export function isBelowMinimumOrder(totalToPay: number): boolean {
  return totalToPay < MINIMUM_ORDER_CLP;
}

export function minimumOrderMessage(totalToPay: number): string {
  return `El monto mínimo de compra es $${MINIMUM_ORDER_CLP.toLocaleString('es-CL')}. Tu total a pagar es $${Math.round(totalToPay).toLocaleString('es-CL')} (con descuentos aplicados).`;
}
