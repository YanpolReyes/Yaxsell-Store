'use client';

import AdminRouteGuard from '@/components/admin/AdminRouteGuard';

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <AdminRouteGuard>{children}</AdminRouteGuard>;
}
