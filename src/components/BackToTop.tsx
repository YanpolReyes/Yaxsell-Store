'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronUp } from 'lucide-react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  // Ocultar en rutas admin
  if (pathname?.startsWith('/admin')) return null;

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Volver arriba"
      style={{
        position: 'fixed', bottom: 90, right: 20, zIndex: 40,
        width: 44, height: 44, borderRadius: '50%',
        background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        transition: 'opacity .2s, transform .2s',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.8)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.6)')}
    >
      <ChevronUp size={22} color="#fff" />
    </button>
  );
}
