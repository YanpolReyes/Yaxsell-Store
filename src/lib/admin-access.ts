/** Correo con acceso al panel /admin y a /inventario */
export const ADMIN_EMAIL = 'dezkonet@gmail.com';

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}
