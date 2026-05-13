import type { Metadata } from 'next';
import './globals.css';
import '@/templates/plantilla1/theme.css';
import '@/templates/plantilla2/theme.css';
import '@/templates/plantilla3/theme.css';
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
                    <ChatBot />
                    <BackToTop />
                    <WhatsAppButton />
                    <CookieConsent />
                    <ScrollToTop />
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
