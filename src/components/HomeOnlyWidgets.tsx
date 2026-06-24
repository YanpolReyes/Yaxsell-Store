'use client';

import { usePathname } from 'next/navigation';
import ChatBot from './ChatBot';
import WhatsAppButton from './WhatsAppButton';

export default function HomeOnlyWidgets() {
  const pathname = usePathname();
  if (pathname !== '/') return null;
  return (
    <>
      <ChatBot />
      <WhatsAppButton />
    </>
  );
}
