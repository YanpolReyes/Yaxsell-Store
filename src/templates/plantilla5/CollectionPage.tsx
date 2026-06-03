'use client';
import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

const SHOPIFY_BASE = '/shopify/plantilla5/assets';

/* ── CSS files ── */
const CSS_FILES = [
  `/shopify/plantilla5/assets/css/inline/index-inline-1.css`,
  `/shopify/plantilla5/assets/css/pebble-little.myshopify.com/cdn/shop/t/22/assets/theme.css`,
  `/shopify/plantilla5/assets/css/pebble-little.myshopify.com/cdn/shop/t/22/assets/photoswipe.css`,
  `/shopify/plantilla5/assets/css/pebble-little.myshopify.com/cdn/shop/t/22/assets/component-non-critical.css`,
  `/shopify/plantilla5/assets/css/pebble-little.myshopify.com/cdn/shop/t/22/assets/menu-drawer.css`,
  `/shopify/plantilla5/assets/css/pebble-little.myshopify.com/cdn/shop/t/22/assets/header-menu.css`,
  `/shopify/plantilla5/assets/css/pebble-little.myshopify.com/cdn/shop/t/22/assets/component-localization-dropdown.css`,
  `/shopify/plantilla5/assets/css/pebble-little.myshopify.com/cdn/shop/t/22/assets/cart-drawer.css`,
  `/shopify/plantilla5/assets/css/pebble-little.myshopify.com/cdn/shop/t/22/assets/cart-modules.css`,
  `/shopify/plantilla5/assets/css/pebble-little.myshopify.com/cdn/shop/t/22/assets/quick-view.css`,
  `/shopify/plantilla5/assets/css/pebble-little.myshopify.com/cdn/shop/t/22/assets/section-popup.css`
];

/* ── JS files ── */
type JsFile = { src: string; module?: boolean };
const JS_FILES: JsFile[] = [
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/motion-component.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/custom-elements.js` },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/carousel.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/modules.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/theme.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/dialog.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/variant-picker.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/media-gallery.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/product-card.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/product-price.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/product-badge.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/product-inventory.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/quantity-selector.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/product-form.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/cart-count.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/quick-add.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/cart-drawer.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/cart-items.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/cart-shipping.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/product-recommendations.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/popup.js`, module: true }
];

/* ── Font faces ── */
const FONT_FACE_CSS = `
@font-face {
  font-family: "Bricolage Grotesque";
  font-weight: 500;
  font-style: normal;
  font-display: swap;
  src: url("/shopify/plantilla5/assets/fonts/pebble-little.myshopify.com/cdn/fonts/bricolage_grotesque/bricolagegrotesque_n5.8c091e52a78b3e58ef96221ce55140a80a8253ff.woff2") format("woff2"),
       url("/shopify/plantilla5/assets/fonts/pebble-little.myshopify.com/cdn/fonts/bricolage_grotesque/bricolagegrotesque_n5.fd299922888265641eb4cdf8883119ce0130018b.woff") format("woff");
}
@font-face {
  font-family: "Bricolage Grotesque";
  font-weight: 700;
  font-style: normal;
  font-display: swap;
  src: url("/shopify/plantilla5/assets/fonts/pebble-little.myshopify.com/cdn/fonts/bricolage_grotesque/bricolagegrotesque_n7.de5675dd7a8e145fdc4cb2cfe67a16cb085528d0.woff2") format("woff2"),
       url("/shopify/plantilla5/assets/fonts/pebble-little.myshopify.com/cdn/fonts/bricolage_grotesque/bricolagegrotesque_n7.d701b766b46c76aceb10c78473f491dff9b09e5e.woff") format("woff");
}
`;

export default function CollectionPage5() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bodyHtml, setBodyHtml] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  /* ── CSS scoping ── */
  useEffect(() => {
    document.documentElement.dataset.template = '5';
    return () => { delete document.documentElement.dataset.template; };
  }, []);

  /* ── Load CSS and Fonts ── */
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.id = 'tpl5-fontfaces';
    styleEl.textContent = FONT_FACE_CSS;
    document.head.appendChild(styleEl);

    CSS_FILES.forEach(href => {
      if (document.querySelector(`link[data-tpl5="${href}"]`)) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.setAttribute('data-tpl5', href);
      document.head.appendChild(link);
    });

    return () => { styleEl.remove(); };
  }, []);

  /* ── Fetch the HTML (trying collection-clean.html first, fallback to body-clean.html) ── */
  useEffect(() => {
    let aborted = false;
    // Intentar primero con collection-clean.html (por si el usuario ya lo subió)
    fetch('/shopify/plantilla5/collection-clean.html', { cache: 'no-cache' })
      .then(r => {
        if (!r.ok) {
          // Si falla, usar el body-clean.html del home como estructura (header/footer)
          return fetch('/shopify/plantilla5/body-clean.html', { cache: 'no-cache' }).then(r2 => {
            if (!r2.ok) throw new Error(`HTTP ${r2.status}`);
            return r2.text();
          });
        }
        return r.text();
      })
      .then(html => {
        if (aborted) return;
        setBodyHtml(html);
      })
      .catch(err => {
        if (aborted) return;
        console.error('[Plantilla5] Error loading HTML for collection', err);
        setLoadError(err.message || 'Error de carga');
      });
    return () => { aborted = true; };
  }, []);

  /* ── Process HTML and mount React components ── */
  useEffect(() => {
    if (!bodyHtml || !containerRef.current) return;
    if (containerRef.current.dataset.htmlSet) return;
    
    containerRef.current.innerHTML = bodyHtml;
    containerRef.current.dataset.htmlSet = '1';

    const root = containerRef.current;

    // Si cargamos el body-clean.html del home, vaciamos el MainContent y montamos nuestro <ProductosInner>
    const isHomeFallback = !!root.querySelector('.shopify-section--split-hero');
    const mainContent = root.querySelector('#MainContent');
    
    if (mainContent) {
      if (isHomeFallback) {
        // Limpiar secciones del home
        mainContent.innerHTML = '';
        
        // Crear contenedor para inyectar React
        const reactContainer = document.createElement('div');
        reactContainer.style.background = 'var(--gradient-background)';
        reactContainer.style.minHeight = '100vh';
        mainContent.appendChild(reactContainer);

        // Montar ProductosInner (evitando el wrapper dinámico circular)
        // Ya que ProductosInner renderiza <DynamicCollectionPage>, y este componente ES el resultado
        // Importar directamente el contenido es problemático debido al ciclo.
        // Solución: Usar un iframe o inyectar el componente en un div aislado.
        
        // Renderizar el catálogo genérico temporalmente hasta que suban collection-clean.html
        const reactRoot = createRoot(reactContainer);
        // Deshabilitar temporizadores que interfieran con el ciclo de vida, o montar un placeholder
        reactRoot.render(
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'var(--font-heading-family)', fontSize: '3rem', color: 'var(--color-foreground)' }}>Colecciones</h1>
            <p style={{ fontFamily: 'var(--font-body-family)', fontSize: '1.2rem', marginTop: 20 }}>
              Sube el archivo <code>collection-clean.html</code> a <code>public/shopify/plantilla5/</code> para habilitar el diseño nativo de Shopify.
            </p>
            <div style={{ marginTop: 40, border: '2px dashed rgba(0,0,0,0.1)', padding: 40, borderRadius: 20 }}>
              <p>Placeholder de Catálogo</p>
            </div>
          </div>
        );
      }
    }

    // Remove overlays
    root.querySelectorAll('.fusion-overlay-custom, .fusion-scroll-top, .quickView-popup').forEach(el => el.remove());
  }, [bodyHtml]);

  /* ── Window Scripts / Intercepts ── */
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      const msg = event.message || '';
      if (msg.includes("matchAll") || msg.includes('AppwriteException') || msg.includes('recommendations')) event.preventDefault();
    };
    window.addEventListener('error', handleGlobalError);
    document.body.classList.remove('page-loading');

    if (!(window as any).Shopify) {
      (window as any).Shopify = {
        shop: 'pebble-little.myshopify.com',
        country: 'US',
        currency: 'USD',
        locale: 'es',
        theme: { name: 'Captured Theme', id: '22' },
        routes: { root_url: '/', cart_url: '/cart', search_url: '/search' },
        customerAccountsEnabled: false,
      };
    }

    const origFetch = window.fetch.bind(window);
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
      if (url.includes('/recommendations/products')) {
        return Promise.resolve(new Response('<product-recommendations></product-recommendations>', { status: 200, headers: { 'Content-Type': 'text/html' } }));
      }
      if ((url.startsWith('/products/') || url.includes('/products/')) && !url.includes('/shopify/') && !url.includes('appwrite')) {
        return Promise.resolve(new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
      return origFetch(input, init);
    };

    return () => {
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);

  /* ── Load JS ── */
  useEffect(() => {
    if (!bodyHtml) return;
    if ((window as any).__tpl5ColScriptsLoaded) return;
    (window as any).__tpl5ColScriptsLoaded = true;

    const loadOne = (file: JsFile) => new Promise<void>((resolve) => {
      if (document.querySelector(`script[data-tpl5="${file.src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = file.src;
      if (file.module) s.type = 'module';
      else s.async = false;
      s.setAttribute('data-tpl5', file.src);
      const done = () => resolve();
      s.onload = done;
      s.onerror = done;
      document.body.appendChild(s);
    });

    (async () => {
      for (const f of JS_FILES) await loadOne(f);
      setTimeout(() => {
        document.querySelectorAll('.animation-element, .animation-wrapper').forEach(el => el.classList.add('in-view'));
        try {
          document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true, cancelable: false }));
          window.dispatchEvent(new Event('load'));
        } catch (e) {}
      }, 500);
    })();

    return () => { (window as any).__tpl5ColScriptsLoaded = false; };
  }, [bodyHtml]);

  if (loadError) {
    return (
      <div style={{ padding: 32, textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <h2 style={{ color: '#dc2626', marginBottom: 8 }}>Error cargando la plantilla</h2>
        <p style={{ color: '#666' }}>No se pudo cargar <code>collection-clean.html</code> ni <code>body-clean.html</code>.</p>
        <p style={{ color: '#999', fontSize: 13, marginTop: 12 }}>Detalle: {loadError}</p>
      </div>
    );
  }

  if (!bodyHtml) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: 'system-ui, sans-serif', color: '#888' }}>
        Cargando Colecciones...
      </div>
    );
  }

  return (
    <div className="tpl5-page-wrapper" style={{ background: '#fff' }}>
      <style>{`
        #shopify-section-sections--20816632447114__header { display: none !important; }
        .scroll-trigger, .scroll-trigger--in-view, .animate--slide-in, .animate--fade-in,
        .shopify-section, #MainContent, .product-grid {
          opacity: 1 !important; visibility: visible !important; transform: none !important; transition: none !important;
        }
        page-transition, .page-transition, #page-transition { display: none !important; opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; }
      `}</style>
      <div ref={containerRef} className="tpl5-shopify-root template-collection" />
    </div>
  );
}
