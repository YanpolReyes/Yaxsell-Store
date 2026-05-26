'use client';

import { useEffect, useState } from 'react';

interface Props {
  src: string;
  alt: string;
  onClose: () => void;
}

export default function ImageZoomModal({ src, alt, onClose }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setOpen(true));
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  function close() {
    setOpen(false);
    setTimeout(onClose, 300);
  }

  return (
    <div
      onClick={close}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: open ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.3s ease',
        cursor: 'zoom-out',
      }}
    >
      <img
        src={src}
        alt={alt}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain',
          borderRadius: 12,
          transform: open ? 'scale(1)' : 'scale(0.8)',
          opacity: open ? 1 : 0,
          transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease',
        }}
      />
      <button
        onClick={close}
        style={{
          position: 'absolute', top: 16, right: 16,
          width: 40, height: 40, borderRadius: '50%', border: 'none',
          background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 20,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)',
        }}
      >
        ✕
      </button>
    </div>
  );
}
