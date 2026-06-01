'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getServices, getAppwriteConfig, PRODUCTS_COLLECTION, CATEGORIES_COLLECTION, SUBCATEGORIES_COLLECTION } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { useAuth } from '@/hooks/useAuth';
import { usePrimaryAddress } from '@/hooks/usePrimaryAddress';
import { useCart } from '@/context/CartContext';


// Ayudante para resolver el directorio local en public para cada subruta
function getFolderForRoute(routeParts: string[]): string {
  if (!routeParts || routeParts.length === 0) {
    return '/shopify/plantilla3';
  }
  
  let relativePath = routeParts.join('/');
  
  // Limpiar barras finales
  if (relativePath.endsWith('/')) {
    relativePath = relativePath.slice(0, -1);
  }
  
  return `/shopify/plantilla3/${relativePath}`;
}

export default function MultiPagePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const rawRoute = params?.route;

  // Sincronización dinámica de sesión, dirección y carrito
  const { primaryAddress } = usePrimaryAddress();
  const { user, isLoggedIn } = useAuth();
  const { totalItems } = useCart();
  
  // Normalizar los segmentos de ruta
  const routeParts = Array.isArray(rawRoute) 
    ? rawRoute 
    : rawRoute 
      ? [rawRoute] 
      : [];
      
  const containerRef = useRef<HTMLDivElement>(null);
  const [bodyHtml, setBodyHtml] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados para datos dinámicos del menú
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [menuProducts, setMenuProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        const { databases } = getServices();
        const cfg = getAppwriteConfig();
        
        const [catRes, subRes, prodRes] = await Promise.all([
          databases.listDocuments(cfg.databaseId, CATEGORIES_COLLECTION, [Query.limit(50)]),
          databases.listDocuments(cfg.databaseId, SUBCATEGORIES_COLLECTION, [Query.limit(200)]),
          databases.listDocuments(cfg.databaseId, PRODUCTS_COLLECTION, [Query.limit(2)]),
        ]);
        
        setCategories(catRes.documents);
        setSubcategories(subRes.documents);
        setMenuProducts(prodRes.documents);
      } catch (err) {
        console.warn('[Plantilla 3] Error cargando datos de Appwrite para menú:', err);
      }
    };
    fetchMenuData();
  }, []);

  // Inicializar clases del documento/body y stubs globales
  useEffect(() => {
    document.documentElement.dataset.template = '3';
    document.documentElement.classList.add('js');
    const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    document.documentElement.classList.add(isTouch ? 'touch' : 'no-touch');

    document.body.classList.add('template-index');
    document.body.setAttribute('data-rounded-button', 'round');
    document.body.setAttribute('data-rounded-input', 'round-slight');
    document.body.setAttribute('data-rounded-block', 'round');
    document.body.setAttribute('data-rounded-card', 'round');

    // Inyectar stubs críticos en el Head de forma programática para que se ejecuten con prioridad absoluta
    const idStubs = 'tpl3-stubs-head';
    if (!document.getElementById(idStubs)) {
      const script = document.createElement('script');
      script.id = idStubs;
      script.textContent = `
        window.theme = window.theme || {};
        window.theme.strings = {
          addToCart: "Add to cart",
          soldOut: "Sold out",
          unavailable: "Unavailable",
        };
        window.theme.moneyFormat = "\${{amount}}";
        var theme = window.theme;
        
        window.jdgmSettings = window.jdgmSettings || {};
        var jdgmSettings = window.jdgmSettings;
        
        window.__sections__ = window.__sections__ || {
          "featured-products": true,
          "footer": true,
          "main-product": true,
          "promotional-bar": true,
          "text-with-icon": true,
          "video": true
        };
      `;
      document.head.appendChild(script);
    }

    const idSectionsScript = 'sections-script';
    if (!document.getElementById(idSectionsScript)) {
      const script = document.createElement('script');
      script.id = idSectionsScript;
      script.setAttribute('data-sections', 'promotional-bar,text-with-icon,countdown,footer');
      script.defer = true;
      document.head.appendChild(script);
    }

    // Inyectar estilos personalizados para iconos nuevos en el Head
    const idCustomStyles = 'tpl3-custom-styles';
    if (!document.getElementById(idCustomStyles)) {
      const style = document.createElement('style');
      style.id = idCustomStyles;
      style.textContent = `
        .location-pill {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .location-pill:hover {
          background: rgba(249, 99, 2, 0.08) !important;
          border-color: #f96302 !important;
          color: #f96302 !important;
          transform: translateY(-1px);
        }
        .header--icon-item.favorites a svg {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .header--icon-item.favorites a:hover svg {
          color: #e11d48 !important;
          fill: #e11d48 !important;
          transform: scale(1.1) translateY(-1px);
        }
        
        /* PURE CSS HOVER STABLE MENU OVERRIDES */
        .header--menu-item:hover .header--menu-submenu {
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: all !important;
        }
        .header--menu-item:hover .header--menu-submenu-list,
        .header--menu-item:hover .header--menu-megamenu {
          clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%) !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
        .header--menu-item:hover .navmenu-option,
        .header--menu-item:hover .images-option,
        .header--menu-item:hover .header--menu-submenu-link,
        .header--menu-item:hover .header--menu-submenu-item {
          transform: translateY(0) !important;
          opacity: 1 !important;
        }
        /* DARK OVERLAY FIX */
        .header--menu-submenu::before {
          content: "";
          position: absolute;
          top: 0;
          left: -100vw;
          width: 300vw;
          height: 200vh;
          background: rgba(0, 0, 0, 0.4) !important;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: opacity 0.35s ease, visibility 0.35s ease;
          z-index: -1 !important;
        }
        .header--menu-item:hover .header--menu-submenu::before {
          opacity: 1 !important;
          visibility: visible !important;
        }
        .section-header {
          position: relative !important;
          z-index: 9999 !important;
        }
        .header {
          z-index: 9999 !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Set variables globas de Shopify para evitar caídas del theme
    if (!(window as any).Shopify) {
      (window as any).Shopify = {
        shop: 'theking-castle.myshopify.com',
        country: 'US',
        currency: 'USD',
        locale: 'es',
        theme: { name: 'The King Castle Captured', id: '3' },
        routes: { root_url: '/', cart_url: '/cart', search_url: '/search' },
      };
    }

    // Interceptar llamadas de red de Shopify
    const origFetch = window.fetch.bind(window);
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
      const isShopify = url.includes('/products/') || url.includes('/cart') || url.includes('/search') || url.includes('/recommendations/');
      if (isShopify && !url.includes('/shopify/')) {
        return Promise.resolve(new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
      return origFetch(input, init);
    };

    return () => {
      delete document.documentElement.dataset.template;
      document.documentElement.classList.remove('js', 'touch', 'no-touch');
      document.body.classList.remove('template-index');
      window.fetch = origFetch;
      document.getElementById(idStubs)?.remove();
      document.getElementById(idSectionsScript)?.remove();
      document.getElementById(idCustomStyles)?.remove();
    };
  }, []);

  // Carga y procesamiento de body-clean.html y manifest.json en paralelo
  useEffect(() => {
    let aborted = false;
    setLoading(true);
    setLoadError(null);
    
    const folderPath = getFolderForRoute(routeParts);
    const htmlPath = `${folderPath}/body-clean.html?v=${Date.now()}`;
    const manifestPath = `${folderPath}/manifest.json?v=${Date.now()}`;
    
    Promise.all([
      fetch(htmlPath, { cache: 'no-cache' }).then(r => {
        if (!r.ok) throw new Error(`HTML ${r.status}`);
        return r.text();
      }),
      fetch(manifestPath, { cache: 'no-cache' }).then(r => {
        if (!r.ok) throw new Error(`Manifest ${r.status}`);
        return r.json();
      })
    ])
    .then(([htmlText, manifest]) => {
      if (aborted) return;

      // 1. Reescribir enlaces locales dinámicos en caliente para redirección SPA
      let processedHtml = htmlText;
      
      // Inyectar stubs críticos globales de Shopify al inicio de la página para evitar Uncaught ReferenceError
      const stubsJs = `
        <script id="tpl3-stubs-critical">
          window.theme = window.theme || {};
          window.theme.strings = {
            addToCart: "Add to cart",
            soldOut: "Sold out",
            unavailable: "Unavailable",
          };
          window.theme.moneyFormat = "\${{amount}}";
          var theme = window.theme;
          
          window.jdgmSettings = window.jdgmSettings || {};
          var jdgmSettings = window.jdgmSettings;
          
          window.__sections__ = window.__sections__ || {
            "featured-products": true,
            "footer": true,
            "main-product": true,
            "promotional-bar": true,
            "text-with-icon": true,
            "video": true
          };
        </script>
        <script id="sections-script" data-sections="promotional-bar,text-with-icon,countdown,footer" defer="defer"></script>
        <div data-show-accordion="false" style="display:none;"></div>
      `;
      processedHtml = stubsJs + processedHtml;
      
      // Reemplazar hashes de producto (#product-slug) o links de producto (/products/slug)
      processedHtml = processedHtml.replace(/href="#product-([^"\s]+)"/gi, 'href="/preview/plantilla/3/products/$1"');
      processedHtml = processedHtml.replace(/href="\/products\/([^"\s]+)"/gi, 'href="/preview/plantilla/3/products/$1"');
      
      // Reemplazar colecciones (/collections/all o /collections)
      processedHtml = processedHtml.replace(/href="\/collections\/all"/gi, 'href="/preview/plantilla/3/collections/all"');
      processedHtml = processedHtml.replace(/href="\/collections"/gi, 'href="/preview/plantilla/3/collections"');
      
      // Reemplazar Carrito
      processedHtml = processedHtml.replace(/href="\/cart"/gi, 'href="/preview/plantilla/3/cart"');
      
      // Reemplazar Login / Registro / Cuenta
      processedHtml = processedHtml.replace(/href="\/account\/login"/gi, 'href="/preview/plantilla/3/account/login"');
      processedHtml = processedHtml.replace(/href="\/account\/register"/gi, 'href="/preview/plantilla/3/account/register"');
      processedHtml = processedHtml.replace(/href="\/account"/gi, 'href="/preview/plantilla/3/account/login"');
      
      // Reemplazar About / Soporte
      processedHtml = processedHtml.replace(/href="\/pages\/about"/gi, 'href="/preview/plantilla/3/pages/about"');
      processedHtml = processedHtml.replace(/href="\/pages\/contact"/gi, 'href="/preview/plantilla/3/pages/about"');

      // Extraer y ejecutar scripts en línea (Next.js no ejecuta <script> inyectados con dangerouslySetInnerHTML)
      const parser = new DOMParser();
      const doc = parser.parseFromString(processedHtml, 'text/html');
      const inlineScripts = Array.from(doc.querySelectorAll('script')).filter(s => 
        !s.src && 
        s.textContent &&
        (!s.type || s.type.toLowerCase().includes('javascript') || s.type.toLowerCase() === 'module')
      );
      
      doc.querySelectorAll('script').forEach(s => s.remove());
      processedHtml = doc.body.innerHTML;

      setBodyHtml(processedHtml);

      // Ejecutar scripts en línea secuencialmente en el scope global
      setTimeout(() => {
        inlineScripts.forEach((s) => {
          try {
            window.eval(s.textContent!);
          } catch (e) {
            console.error("Inline script error:", e);
          }
        });
      }, 100);

      // 2. Cargar Hojas de Estilo CSS dinámicamente desde el manifest de la página
      const cssPaths = manifest.css || [];
      cssPaths.forEach((href: string) => {
        const id = `css-${href.replace(/[^a-zA-Z0-9]/g, '-')}`;
        if (document.getElementById(id)) return;
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = `${href}?v=${Date.now()}`;
        document.head.appendChild(link);
      });

      // 3. Cargar Archivos JS dinámicamente en orden secuencial
      const jsPaths = manifest.js || [];
      const loadJsSequentially = async () => {
        for (const src of jsPaths) {
          await new Promise<void>((resolve) => {
            const id = `js-${src.replace(/[^a-zA-Z0-9]/g, '-')}`;
            if (document.getElementById(id)) {
              resolve();
              return;
            }
            const script = document.createElement('script');
            script.id = id;
            script.src = `${src}?v=${Date.now()}`;
            // Módulos específicos de Shopify
            if (src.includes('localization-form') || src.includes('cart-drawer')) {
              script.type = 'module';
            } else {
              script.async = false;
            }
            script.onload = () => resolve();
            script.onerror = () => resolve();
            document.body.appendChild(script);
          });
        }

        // 4. Forzar inicialización de animaciones,ScrollTrigger, Swiper, etc.
        setTimeout(() => {
          try {
            // Forzar animaciones .in-view
            document.querySelectorAll('.animation-element, .animation-wrapper, .reveal-element, [data-animate-delay]').forEach(el => {
              el.classList.add('in-view');
            });
            
            // Autoplay videos
            document.querySelectorAll('video').forEach(video => {
              video.muted = true;
              video.play().catch(() => {});
            });

            window.dispatchEvent(new Event('resize'));
            window.dispatchEvent(new Event('scroll'));
          } catch (e) {}
        }, 500);
      };

      loadJsSequentially();
      setLoading(false);
    })
    .catch(err => {
      if (aborted) return;
      console.error('[Plantilla 3] Error cargando página:', err);
      setLoadError(err.message || 'Página no encontrada');
      setLoading(false);
    });

    return () => {
      aborted = true;
    };
  }, [rawRoute]);

  // Inyección reactiva y anidamiento dinámico del menú de categorías (Navbar y Mobile)
  useEffect(() => {
    if (!bodyHtml || categories.length === 0 || !containerRef.current) return;

    // --- 1. Mapeo en el Menú de Escritorio (ul.header--navigation-list) ---
    const navList = containerRef.current.querySelector('ul.header--navigation-list');
    if (navList) {
      // Banners dinámicos a la derecha del Mega Menú con imágenes de productos reales
      const img1 = menuProducts[0]?.IMAGEURL || 'https://theking-castle.myshopify.com/cdn/shop/files/Testimonial_2.jpg';
      const name1 = menuProducts[0]?.NAME || 'Gym Wear Premium';
      const link1 = menuProducts[0] ? `/preview/plantilla/3/products/${menuProducts[0].$id}` : '/preview/plantilla/3/collections/all';
      
      const img2 = menuProducts[1]?.IMAGEURL || 'https://theking-castle.myshopify.com/cdn/shop/files/banner-2-img-text_be4ffe33-e573-4a61-a180-94e59b5aaabe.jpg';
      const name2 = menuProducts[1]?.NAME || 'Nueva Colección';
      const link2 = menuProducts[1] ? `/preview/plantilla/3/products/${menuProducts[1].$id}` : '/preview/plantilla/3/collections/all';

      const menuHtml = `
        <!-- Item 1: Home -->
        <li class="header--menu-item">
          <a class="header--menu-link heading-font text" href="/preview/plantilla/3">Home</a>
        </li>
        
        <!-- Item 2: Shop (Dropdown Tradicional Vertical) -->
        <li class="header--menu-item has-children dropdown">
          <header-menu class="d-block header-dropdown" data-menu-type="dropdown">
            <a href="/preview/plantilla/3/collections/all" class="header--menu-link heading-font text">
              Shop
              <svg width="8" height="6" viewBox="0 0 8 6"><path d="m1 1.5 3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.5"></path></svg>
            </a>
            <div class="header--menu-submenu" header-menu-inner>
              <ul class="header--menu-submenu-list" data-child-list>
                ${categories.map(cat => `
                  <li class="header--menu-submenu-item" data-child>
                    <a href="/preview/plantilla/3/collections/${cat.$id}" class="header--menu-submenu-link heading-font text-medium">
                      <span>${cat.name || cat.NAME}</span>
                    </a>
                  </li>
                `).join('')}
              </ul>
            </div>
          </header-menu>
        </li>

        <!-- Item 3: Collections (Mega Menú Cortina Ancho) -->
        <li class="header--menu-item has-children megamenu fullwidth-megamenu">
          <header-menu class="d-block header-megamenu" data-menu-type="dropdown">
            <a href="/preview/plantilla/3/collections" class="header--menu-link heading-font text">
              Collections
              <svg width="8" height="6" viewBox="0 0 8 6"><path d="m1 1.5 3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.5"></path></svg>
            </a>
            <div class="header--menu-submenu megamenu-container" header-menu-inner>
              <div class="header--menu-megamenu" data-header-menu-megamenu>
                <div class="container-fullwidth">
                  <div class="header--menu-megamenu-columns megamenu_style1" style="--menu_column_count:${Math.min(4, categories.length + 2)}">
                    
                    <!-- Columnas de Categorías + Subcategorías anidadas -->
                    ${categories.map(cat => {
                      const subs = subcategories.filter(s => s.categoryId === cat.$id || s.CATEGORYID === cat.$id);
                      return `
                        <div class="navmenu-option">
                          <a href="/preview/plantilla/3/collections/${cat.$id}" class="megamenu-main-heading text-medium heading-font">
                            ${cat.name || cat.NAME}
                          </a>
                          <ul class="header--menu-megamenu-inner">
                            ${subs.map(sub => `
                              <li>
                                <a href="/preview/plantilla/3/collections/${cat.$id}?sub=${sub.$id}" class="">
                                  ${sub.name || sub.NAME}
                                </a>
                              </li>
                            `).join('')}
                          </ul>
                        </div>
                      `;
                    }).join('')}

                    <!-- Banner 1 a la derecha -->
                    <div class="images-option" style="--image_overlay_opacity:0.25">
                      <a href="${link1}" class="header--menu-megamenu-image focus-inside pos-relative width-100">
                        <div class="header--menu-megamenu-img media-wrapper width-100 height-100 media-overlay">
                          <div class="media pos-absolute height-100 width-100 media-wrapper media-fit-cover">
                            <img src="${img1}" alt="theking-castle" loading="lazy" style="object-position:50% 50%; width:100%; height:100%; object-fit:cover;">
                          </div>
                        </div>
                        <div class="header--menu-megamenu-image-content">
                          <p class="header--menu-megamenu-image-title image-overlay-heading h6 heading-font">
                            50% OFF - ${name1}
                          </p>
                        </div>
                      </a>
                    </div>

                    <!-- Banner 2 a la derecha -->
                    <div class="images-option" style="--image_overlay_opacity:0.25">
                      <a href="${link2}" class="header--menu-megamenu-image focus-inside pos-relative width-100">
                        <div class="header--menu-megamenu-img media-wrapper width-100 height-100 media-overlay">
                          <div class="media pos-absolute height-100 width-100 media-wrapper media-fit-cover">
                            <img src="${img2}" alt="theking-castle" loading="lazy" style="object-position:50% 50%; width:100%; height:100%; object-fit:cover;">
                          </div>
                        </div>
                        <div class="header--menu-megamenu-image-content">
                          <p class="header--menu-megamenu-image-title image-overlay-heading h6 heading-font">
                            OFERTA ESPECIAL - ${name2}
                          </p>
                        </div>
                      </a>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </header-menu>
        </li>

        <!-- Item 4: About -->
        <li class="header--menu-item">
          <a class="header--menu-link heading-font text" href="/preview/plantilla/3/pages/about">About</a>
        </li>
      `;
      navList.innerHTML = menuHtml;
    }

    // --- 2. Mapeo en el Menú Móvil (ul.mobile-menu--list) ---
    const mobileMenu = containerRef.current.querySelector('ul.mobile-menu--list');
    if (mobileMenu) {
      const mobileHtml = `
        <li>
          <a class="mobile-menu--link text-medium heading-font" href="/preview/plantilla/3">Home</a>
        </li>
        
        <!-- Categorías desplegables en Móvil -->
        ${categories.map((cat, idx) => {
          const subs = subcategories.filter(s => s.categoryId === cat.$id || s.CATEGORYID === cat.$id);
          if (subs.length > 0) {
            return `
              <li class="mobile-menu--item has-submenu">
                <details id="Details-menu-drawer-menu-item-${idx}">
                  <summary class="mobile-menu--link text-medium heading-font">
                    <span>${cat.name || cat.NAME}</span>
                    <svg class="icon icon-arrow-down" width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </summary>
                  <ul class="mobile-menu--submenu-list">
                    ${subs.map(sub => `
                      <li>
                        <a href="/preview/plantilla/3/collections/${cat.$id}?sub=${sub.$id}" class="mobile-menu--submenu-link">
                          ${sub.name || sub.NAME}
                        </a>
                      </li>
                    `).join('')}
                  </ul>
                </details>
              </li>
            `;
          }
          return `
            <li>
              <a href="/preview/plantilla/3/collections/${cat.$id}" class="mobile-menu--link text-medium heading-font">${cat.name || cat.NAME}</a>
            </li>
          `;
        }).join('')}
        
        <li>
          <a class="mobile-menu--link text-medium heading-font" href="/preview/plantilla/3/pages/about">About</a>
        </li>
      `;
      mobileMenu.innerHTML = mobileHtml;
    }
  }, [bodyHtml, categories, subcategories, menuProducts]);

  // Inyección reactiva de la lista de iconos en el Header (Búsqueda, Ubicación, Favoritos, Login, Carrito)
  useEffect(() => {
    if (!bodyHtml || !containerRef.current) return;

    const iconsList = containerRef.current.querySelector('ul.header--icons-list');
    if (iconsList) {
      iconsList.innerHTML = `
        <!-- Búsqueda (Boton Buscar) -->
        <li class="header--icon-item search">
          <list-set
            class="header--icon-link"
            data-header-view="logo-left-menu-center"
            data-behaviour="drawer"
            data-source="search-drawer"
            is="hover-icons"
          >
            <a href="/preview/plantilla/3/search" class="header--icon-link-text cursor-pointer" title="Buscar">
              <svg width="18" height="19" viewBox="0 0 18 19" fill="none">
                <path d="M7.96875 15.6875C11.9556 15.6875 15.1875 12.4556 15.1875 8.4688C15.1875 4.48194 11.9556 1.25 7.96875 1.25C3.98194 1.25 0.75 4.48194 0.75 8.4688C0.75 12.4556 3.98194 15.6875 7.96875 15.6875Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M13.0732 13.5742L17.2497 17.7508" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </a>
          </list-set>
        </li>

        <!-- Ingresar Ubicación Pill -->
        <li class="header--icon-item location" style="display: flex; align-items: center;">
          <a href="/preview/plantilla/3/cuenta/direcciones" class="location-pill header--icon-link-text cursor-pointer" title="Ubicación" style="text-decoration: none; padding: 6px 14px; background: rgba(0,0,0,0.04); border: 1.5px solid rgba(0,0,0,0.1); border-radius: 999px; font-size: 13px; font-weight: 500; color: currentColor; display: flex; align-items: center; gap: 6px; transition: all 0.2s ease;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span style="max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${primaryAddress || 'Ingresa ubicación'}</span>
          </a>
        </li>

        <!-- Favoritos Corazón -->
        <li class="header--icon-item favorites">
          <a href="/preview/plantilla/3/cuenta/favoritos" class="header--icon-link-text cursor-pointer" title="Favoritos">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
            </svg>
          </a>
        </li>

        <!-- Cuenta / Inicio de Sesión -->
        <li class="header--icon-item account" data-vvip="false">
          <list-set
            class="header--icon-link"
            ata-header-view="logo-left-menu-center"
            data-behaviour="page"
            data-source="account-drawer"
            is="hover-icons"
          >
            <a href="${isLoggedIn ? '/preview/plantilla/3/cuenta' : '/preview/plantilla/3/account/login'}" class="header--icon-link-text cursor-pointer" title="Cuenta">
              <svg width="17" height="18" viewBox="0 0 17 18" fill="none">
                <path d="M8.5 9.15625C10.7954 9.15625 12.6563 7.29543 12.6563 5C12.6563 2.70457 10.7954 0.84375 8.5 0.84375C6.20457 0.84375 4.34375 2.70457 4.34375 5C4.34375 7.29543 6.20457 9.15625 8.5 9.15625Z" stroke="currentColor" stroke-width="1.5" />
                <path d="M15.5 16.375C15.5 12.509 12.366 9.375 8.5 9.375C4.634 9.375 1.5 12.509 1.5 16.375" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </a>
          </list-set>
        </li>

        <!-- Carrito -->
        <li class="header--icon-item cart">
          <list-set
            class="header--icon-link"
            data-header-view="logo-left-menu-center"
            data-behaviour="drawer"
            id="cart-count-icon"
            data-source="cart-drawer"
            is="hover-icons"
          >
            <a href="/preview/plantilla/3/cart" class="header--icon-link-text cursor-pointer" aria-label="Cart with ${totalItems} items">
              <svg width="17" height="19" viewBox="0 0 17 19" fill="none" class="cart--icon">
                <path d="M13.8624 5.125H3.13686C2.21555 5.125 1.45202 5.83932 1.39074 6.75859L0.749072 16.3836C0.681732 17.3936 1.48288 18.25 2.49519 18.25H14.5041C15.5164 18.25 16.3176 17.3936 16.2502 16.3836L15.6086 6.75859C15.5472 5.83932 14.7837 5.125 13.8624 5.125Z" stroke="currentColor" stroke-width="1.5" />
                <path d="M12 7.75V4.25C12 2.317 10.433 0.75 8.5 0.75C6.567 0.75 5 2.317 5 4.25V7.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" />
              </svg>
              <span class="cart--count ${totalItems > 0 ? '' : 'hidden'}" data-cart-count="">${totalItems}</span>
            </a>
          </list-set>
        </li>
      `;
    }
  }, [bodyHtml, primaryAddress, isLoggedIn, totalItems]);

  // Interceptar clics para realizar navegación SPA instantánea Next.js
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !bodyHtml) return;

    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href) return;

      // Si el enlace tiene un ancestro con comportamiento de drawer o list-set, no lo interceptamos para que actúe el JS nativo
      if (target.closest('[data-behaviour="drawer"]') || target.closest('list-set') || target.closest('[data-drawer-trigger]')) {
        return;
      }

      // Interceptar sólo links locales de plantilla 3
      if (href.startsWith('/preview/plantilla/3')) {
        e.preventDefault();
        router.push(href);
      }
    };

    container.addEventListener('click', handleLinkClick);
    return () => {
      container.removeEventListener('click', handleLinkClick);
    };
  }, [bodyHtml, router]);

  // Pantalla de carga premium con estética del Castillo
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0b0f19',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{
          width: 44,
          height: 44,
          border: '3px solid rgba(255,255,255,0.08)',
          borderTopColor: '#f96302',
          borderRadius: '50%',
          animation: 'spin 0.9s cubic-bezier(0.4, 0, 0.2, 1) infinite',
          marginBottom: 16
        }} />
        <p style={{ fontSize: 13, color: '#94a3b8', letterSpacing: '0.05em', fontWeight: 500 }}>Cargando portal del castillo...</p>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes spin { to { transform: rotate(360deg); } }
        `}} />
      </div>
    );
  }

  // Pantalla de error / página no capturada
  if (loadError) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0b0f19',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
        padding: 24
      }}>
        <div style={{ textAlign: 'center', maxWidth: 460, background: '#111827', padding: '36px 28px', borderRadius: 20, border: '1px solid #1f2937' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🏰</div>
          <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 8, color: '#f3f4f6' }}>Página no disponible en Demo</h2>
          <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.6, marginBottom: 24 }}>
            Esta sección no está capturada en el demo local de la plantilla. Explora los departamentos y colecciones principales desde la portada.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => router.push('/preview/plantilla/3')}
              style={{
                background: '#f96302',
                color: '#fff',
                border: 'none',
                padding: '11px 22px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              Ir a la Portada
            </button>
            <a
              href="/admin/engagement/plantillas"
              style={{
                background: '#1f2937',
                color: '#d1d5db',
                textDecoration: 'none',
                padding: '11px 22px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <ArrowLeft size={14} /> Volver
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      {/* Elementos invisibles para evitar caídas de scripts de Shopify */}
      <div data-show-accordion="false" style={{ display: 'none' }} />
      {/* Contenedor dinámico */}
      <div 
        ref={containerRef}
        dangerouslySetInnerHTML={{ __html: bodyHtml || '' }}
      />
    </div>
  );
}
