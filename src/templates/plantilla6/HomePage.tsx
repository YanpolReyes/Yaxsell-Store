'use client';

import React, { useEffect, useState, useRef } from 'react';

export default function HomePage() {
  const [iframeHeight, setIframeHeight] = useState('100vh');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Sincronizar altura si el iframe envía mensajes
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'YRASER_HEIGHT_CHANGE') {
        setIframeHeight(event.data.height + 'px');
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Auto-ajustar altura periódicamente leyendo el scrollHeight del iframe
    const interval = setInterval(() => {
      try {
        if (iframeRef.current && iframeRef.current.contentWindow) {
          const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
          if (doc && doc.body) {
            const height = Math.max(
              doc.body.scrollHeight,
              doc.body.offsetHeight,
              doc.documentElement.clientHeight,
              doc.documentElement.scrollHeight,
              doc.documentElement.offsetHeight
            );
            if (height > 100) {
              setIframeHeight(height + 'px');
            }
          }
        }
      } catch (e) {
        // En caso de CORS (aunque al estar en la misma app no debería ocurrir)
      }
    }, 500);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(interval);
    };
  }, []);

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#fff', position: 'relative' }}>
      <iframe
        ref={iframeRef}
        src="/shopify/plantilla6/index.html"
        style={{
          width: '100%',
          height: iframeHeight,
          border: 'none',
          display: 'block',
          overflow: 'hidden'
        }}
        scrolling="no"
        title="Plantilla Premium 6"
      />
    </div>
  );
}
