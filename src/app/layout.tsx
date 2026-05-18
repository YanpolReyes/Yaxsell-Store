import type { Metadata } from 'next';
import './globals.css';

// Force Vercel to never cache any page — theme config and product data change frequently
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { CartProvider } from '@/context/CartContext';
import { TemplateProvider } from '@/context/TemplateContext';
import { AuthProvider } from '@/hooks/useAuth';
import { FavoritesProvider } from '@/context/FavoritesContext';
import StoreShell from '@/components/StoreShell';
import ChatBot from '@/components/ChatBot';
import BackToTop from '@/components/BackToTop';
import { ToastProvider } from '@/components/Toast';
import { NotificationProvider } from '@/context/NotificationContext';
import CookieConsent from '@/components/CookieConsent';
import WhatsAppButton from '@/components/WhatsAppButton';
import ScrollToTop from '@/components/ScrollToTop';
import HomeOnlyWidgets from '@/components/HomeOnlyWidgets';
import PageViewTracker from '@/components/PageViewTracker';

export const metadata: Metadata = {
  title: 'Tienda',
  description: 'Compra online fácil y rápido',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <ToastProvider>
            <NotificationProvider>
              <FavoritesProvider>
                <CartProvider>
                  <TemplateProvider>
                    <StoreShell>{children}</StoreShell>
                    <HomeOnlyWidgets />
                    <BackToTop />
                    <CookieConsent />
                    <ScrollToTop />
                    <PageViewTracker />
                  </TemplateProvider>
                </CartProvider>
              </FavoritesProvider>
            </NotificationProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
