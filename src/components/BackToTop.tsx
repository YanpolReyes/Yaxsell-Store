'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronUp } from 'lucide-react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Ocultar en rutas admin
  if (pathname?.startsWith('/admin')) return null;

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Volver arriba"
      style={{
        position: 'fixed', bottom: 90, right: 20, zIndex: 40,
        width: 44, height: 44, borderRadius: '50%',
        background: 'rgba(255,255,255,0.92)', border: '2px solid rgba(241,142,4,0.25)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(241,142,4,0.2)',
        transition: 'opacity .2s, transform .2s, box-shadow .2s',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        backdropFilter: 'blur(12px)',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(241,142,4,0.35)'; e.currentTarget.style.borderColor = '#f18e04'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(241,142,4,0.2)'; e.currentTarget.style.borderColor = 'rgba(241,142,4,0.25)'; }}
    >
      <ChevronUp size={22} color="#f18e04" />
    </button>
  );
}
