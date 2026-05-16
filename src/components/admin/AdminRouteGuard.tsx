'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { isAdminEmail } from '@/lib/admin-access';

/** Protege rutas /admin/* (excepto login) y puede reutilizarse en /inventario */
export default function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoggedIn, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginRoute = pathname === '/admin/login' || pathname?.startsWith('/admin/login/');

  useEffect(() => {
    if (isLoginRoute || isLoading) return;
    if (!isLoggedIn) {
      router.replace('/admin/login');
      return;
    }
    if (!isAdminEmail(user?.email)) {
      logout().finally(() => router.replace('/admin/login'));
    }
  }, [isLoginRoute, isLoading, isLoggedIn, user?.email, router, logout]);

  if (isLoginRoute) return <>{children}</>;
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isLoggedIn || !isAdminEmail(user?.email)) return null;

  return <>{children}</>;
}
