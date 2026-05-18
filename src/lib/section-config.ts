/**
 * Section Configuration System
 * Allows admin to toggle, reorder, and configure homepage sections.
 * Config is persisted in Appwrite (theme_config collection) with localStorage fallback.
 */

import { getServices, getAppwriteConfig, THEME_CONFIG_COLLECTION } from './appwrite';

export interface SectionSettings {
  // Content
  title?: string;
  subtitle?: string;
  itemsCount?: number;
  showViewAll?: boolean;
  autoplay?: boolean;
  autoplaySpeed?: number;
  customCSS?: string;
  // Design — Colors
  bgColor?: string;
  textColor?: string;
  accentColor?: string;
  headingColor?: string;
  cardBgColor?: string;
  cardTextColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  linkColor?: string;
  borderColor?: string;
  heroTitleColor?: string;
  heroSubtitleColor?: string;
  // Design — Flags
  _useOriginal?: boolean;
  // Design — Typography
  headingSize?: number;
  textSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  headingFontFamily?: string;
  // Design — Spacing & Layout
  columns?: number;
  padding?: number;
  gap?: number;
  borderRadius?: number;
  height?: number;
  cardRadius?: number;
  buttonRadius?: number;
  // Design — Shadows & Effects
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  // Category Layout Model
  catModel?: 'default' | 'carousel' | 'bubble' | 'list' | 'glass' | 'magazine';
  // Card Design System
  cardStyle?: 'classic' | 'elegant' | 'glassmorphism' | 'neon' | 'magazine' | 'floating' | 'luxury' | 'brutalist' | 'gradient' | 'minimal';
  cardImageHeight?: number;
  cardHoverTilt?: boolean;
  cardHoverZoom?: boolean;
  cardShimmer?: boolean;
  cardBadgePulse?: boolean;
  cardBtnShimmer?: boolean;
  cardBorderGlow?: boolean;
  cardImageFit?: 'cover' | 'contain';
  cardOverlayGradient?: boolean;
  cardBtnStyle?: 'default' | 'pill' | 'sharp' | 'outline' | 'soft' | 'gradient';
  // Favorite Button Design
  favStyle?: 'circle' | 'rounded' | 'minimal' | 'pill' | 'glassmorphism' | 'neon';
  favBgColor?: string;
  favBgColorActive?: string;
  favIconColor?: string;
  favIconColorActive?: string;
  favSize?: number;
  favAnimation?: 'pulse' | 'bounce' | 'pop' | 'ripple' | 'none';
  favShadow?: boolean;
  favBorder?: boolean;
  // Banner de Imagen
  imageUrl?: string;
  maskOpacity?: number;
  overlayText?: string;
  buttonText?: string;
  buttonLink?: string;
  productWidgetTitle?: string;
  productWidgetPrice?: string;
  productWidgetImageUrl?: string;
  productWidgetButtonText?: string;
  productWidgetLink?: string;
  productWidgetDuration?: number;
  productWidgetProductId?: string; // ID de producto vinculado desde Appwrite
  productWidgetPositionY?: number; // Posición vertical % (0=top, 50=center, 100=bottom)
  productWidgetPositionX?: number; // Posición horizontal % (0=left, 50=center, 100=right)
  productWidgetBgColor?: string; // Color de fondo glassmorphism
  productWidgetBorderColor?: string; // Color de borde
  productWidgetBlur?: number; // Blur del fondo en px
  productWidgetBorderRadius?: number; // Redondez de tarjeta en px
  productWidgetButtonColor?: string; // Color del botón
  productWidgetButtonTextColor?: string; // Color del texto del botón
  productWidgetButtonRadius?: number; // Redondez del botón en px
  productWidgetButtonPadding?: number; // Padding del botón en px
  productWidgetButtonFontSize?: number; // Tamaño de texto del botón en px
  productWidgetShadow?: 'none' | 'sm' | 'md' | 'lg'; // Sombra del botón
  productWidgetMode?: 'single' | 'category' | 'subcategory' | 'random'; // Modo de selección de productos
  productWidgetProductCount?: number; // Cantidad de productos a rotar (10, 20, 30)
  productWidgetCategoryId?: string; // ID de categoría para filtrar
  productWidgetSubcategoryId?: string; // ID de subcategoría para filtrar
  productWidgetSlideInterval?: number; // Segundos entre cada slide
  productWidgetButtonAction?: 'link' | 'add_to_cart'; // Acción del botón: link o añadir al carrito
  // Banner de Cupones
  couponTitle?: string;
  couponSubtitle?: string;
  couponMessage?: string;
  couponStampText?: string;
  couponCodeLabel?: string;
  couponCopyText?: string;
  couponCopiedText?: string;
  couponLayout?: 'classic' | 'yaxsell-split' | 'noir-premium' | 'mono-ticket' | 'mono-magazine' | 'mono-stamp';
  // Colecciones (tpl1)
  collectionTitle?: string;
  collectionSubtitle?: string;
  collectionDescription?: string;
  collectionItems?: CollectionItem[];
  // Colección destacada (tpl1)
  featuredCollectionSubtitle?: string;
  featuredCollectionTitle?: string;
  featuredCollectionDescription?: string;
  featuredCollectionItems?: CollectionItem[];
  mediaGalleryTitle?: string;
  mediaGalleryTitleHeight?: number; // Altura del título en % (0-50)
  mediaGalleryTitleColor?: string; // Color del texto
  mediaGalleryTitleGradientColor?: string; // Color degradado (opcional)
  mediaGalleryTitleAnimation?: 'none' | 'pulse' | 'fadeIn' | 'slideUp'; // Animación del título
  mediaGalleryCardOpacity?: number; // Opacidad de las tarjetas (0.5-1)
  mediaGalleryButtonColor?: string; // Color del botón
  mediaGalleryButtonTextColor?: string; // Color del texto del botón
  mediaGalleryContentPosition?: 'top' | 'bottom' | 'center'; // Posición del contenido
  mediaGalleryTopText?: string; // Texto superior (ej. "LLEGAN PRONTO A:")
  mediaGalleryItems?: MediaGalleryItem[];
  featuredProductSubtitle?: string;
  featuredProductTitle?: string;
  featuredProductDescription?: string;
  featuredProductVideoUrl?: string;
  featuredProductPosterImage?: string; // Imagen de espera mientras carga el video
  featuredProductProductId?: string;
  featuredProductFontFamily?: string; // familia de fuente
  featuredProductFontSize?: number; // tamaño en px
  featuredProductFontWeight?: number; // peso (100-900)
  featuredProductColor?: string; // color del texto
  // Countdown (tpl1) — vinculado a TimedOffer
  countdownOfferId?: string;
  countdownSlideText?: string;
  countdownTitle?: string;
  countdownSubtitle?: string;
  countdownButtonText?: string;
  countdownBackgroundImage?: string;
  countdownOverlayOpacity?: number;
  countdownHideOverlay?: boolean;
  // Productos con Filtro (tpl1)
  productsFilterSubtitle?: string;
  productsFilterTitle?: string;
  productsFilterDescription?: string;
  productsFilterCategoryIds?: string[];
  productsFilterPerCategory?: number;
  beforeAfterSubtitle?: string;
  beforeAfterTitle?: string;
  beforeAfterDescription?: string;
  beforeAfterBeforeImage?: string;
  beforeAfterAfterImage?: string;
  beforeAfterBeforeLabel?: string;
  beforeAfterAfterLabel?: string;
  // Marquee (tpl1)
  marqueeText1?: string;
  marqueeText2?: string;
  marqueeText3?: string;
  marqueeImage1?: string;
  marqueeImage2?: string;
  marqueeImage3?: string;
  marqueeSpeed?: number; // duración animación en segundos
  marqueeImageHeight?: number; // altura imagen en px
  marqueeFontFamily?: string; // familia de fuente
  marqueeFontSize?: number; // tamaño en px
  marqueeFontWeight?: number; // peso (100-900)
  marqueeColor?: string; // color del texto
  // Marquee 2 (tpl1)
  marquee2Text1?: string;
  marquee2Text2?: string;
  marquee2Text3?: string;
  marquee2Image1?: string;
  marquee2Image2?: string;
  marquee2Image3?: string;
  marquee2Speed?: number;
  marquee2ImageHeight?: number;
  marquee2FontFamily?: string;
  marquee2FontSize?: number;
  marquee2FontWeight?: number;
  marquee2Color?: string;
  // Shop The Look (tpl1)
  stlProductImage1?: string;
  stlProductImage2?: string;
  stlProductImage3?: string;
  stlProductImage4?: string;
  // Banner con Texto / Image Overlay (tpl1)
  overlayBgImage?: string;
  overlayBlurAmount?: number; // 0-20px
  overlayOverlayOpacity?: number; // 0-1
  overlayOverlayColor?: string;
  overlaySubheading?: string;
  overlayHeading?: string;
  overlayParagraph?: string;
  overlayBtnText?: string;
  overlayBtnLink?: string;
  overlayFontFamily?: string;
  overlayFontSize?: number;
  overlayFontWeight?: number;
  overlayTextColor?: string;
  overlaySubheadingColor?: string;
  overlayBorderRadius?: number;
  overlayParticlesEnabled?: boolean;
  overlayParticlesColor?: string;
  overlayParticlesSize?: number;
  overlayParticlesOpacity?: number;
  overlayParticlesCount?: number;
  overlayVideoUrl?: string;
  // Video con Texto (tpl1)
  vtVideoUrl?: string;
  vtPosterImage?: string;
  vtMediaPosition?: 'left' | 'right';
  vtBorderRadius?: number;
  vtHeading?: string;
  vtSubtitle?: string;
  vtDescription?: string;
  vtBtnText?: string;
  vtBtnLink?: string;
  vtHeadingColor?: string;
  vtTextColor?: string;
  vtBgColor?: string;
  // Video con Texto
  imagePosition?: 'left' | 'right';
  imageTextModel?: 'classic' | 'overlap' | 'fullbleed' | 'card' | 'split';
  description?: string;
  // Video
  videoUrl?: string;
  // Testimonios
  testimonials?: { name: string; text: string; avatar?: string; rating?: number; productId?: string; productImage?: string; productName?: string }[];
  // FAQ (common + tpl1)
  faqs?: Array<{ question: string; answer: string }>;
  faqContactEmail?: string;
  faqBackgroundImage?: string;
  faqEnableParticles?: boolean;
  faqAvatarLarge?: string;
  faqAvatar1?: string;
  faqAvatar2?: string;
  faqAvatar3?: string;
  faqAvatar4?: string;
  // Newsletter
  placeholder?: string;
  // Countdown
  targetDate?: string;
  ctaText?: string;
  ctaLink?: string;
  // Logo List
  logos?: { url: string; alt?: string; link?: string }[];
  // Service Icons
  items?: { icon: string; title: string; description: string }[]; // icon = lucide icon name: truck, shield-check, message-circle, badge-check, sparkles, heart-handshake, refresh-cw, gift, headset, lock
  // Rich Text
  htmlContent?: string;
  // Map
  mapEmbed?: string;
  showMap?: boolean;
  // Navbar
  navModel?: string;
  navLayout?: 'classic' | 'stacked' | 'centered' | 'minimal-fashion' | 'topbar' | 'split' | 'glass-float' | 'nebula-premium';
  logoUrl?: string;
  logoText?: string;
  logoSize?: number;
  navHeight?: number;
  searchRadius?: number;
  searchBgColor?: string;
  searchBtnColor?: string;
  searchBtnTextColor?: string;
  logoPosition?: 'left' | 'center';
  showAddress?: boolean;
  showCategories?: boolean;
  showOffers?: boolean;
  showFavorites?: boolean;
  showSearch?: boolean;
  sticky?: boolean;
  borderBottom?: boolean;
  borderBottomColor?: string;
  itemHoverBg?: string;
  cartBadgeColor?: string;
  searchPlaceholder?: string;
  catBarBg?: string;
  catBarText?: string;
  // Navbar Promo Image (replaces ENVÍO GRATIS hardcoded banner)
  promoImageUrl?: string;
  promoImageLink?: string;
  promoImageHeight?: number;
  // Navbar Promo Tag (text-based badge instead of image)
  promoTagText?: string;
  promoTagStyle?: string; // 'pill' | 'ribbon' | 'glass' | 'neon' | 'stamp' | 'wave'
  promoTagLink?: string;
  promoTagSecondary?: string;
  // Navbar floating particles
  navParticlesEnabled?: boolean;
  navParticlesText?: string; // e.g. "3B,💙,✨"
  // Footer
  companyName?: string;
  companyDescription?: string;
  address?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  footerLinks?: { title: string; url: string }[];
  newsletterTitle?: string;
  newsletterText?: string;
  copyrightText?: string;
  navParticlesColor?: string;
  navParticlesCount?: number;
  navParticlesSize?: number;
  navParticlesOpacity?: number; // 0.1 - 1.0
  // Live Banner
  bgColorIdle?: string;
  liveText?: string;
  idleText?: string;
  liveTitle?: string;
  idleTitle?: string;
  pulseAnimation?: boolean;
  showBadge?: boolean;
  // Gradient support (announcement_bar, live_banner, navbar)
  bgGradient?: string;
  bgGradientIdle?: string;
  gradientAnimated?: boolean;
  // Text gradient + effects (announcement_bar)
  textGradientStyle?: string;
  textGradientAnimated?: boolean;
  textHoverEffect?: string; // 'fall' | 'bounce' | 'wave' | 'none'
  // Chinamart Navbar
  cmNavModel?: string;
  cmNavBg?: string;
  cmNavScrolledBg?: string;
  cmNavRadius?: number;
  cmNavScrolledRadius?: number;
  cmNavLogoHeight?: number;
  cmNavScrolledLogoHeight?: number;
  cmNavLinkColor?: string;
  cmNavLinkActiveColor?: string;
  cmNavScrolledLinkColor?: string;
  cmNavBtnText?: string;
  cmNavBtnLink?: string;
  cmNavBtnBg?: string;
  cmNavBtnRadius?: number;
  cmNavShowSearch?: boolean;
  cmNavLogoPosition?: 'left' | 'center';
  cmNavShadow?: 'none' | 'sm' | 'md' | 'lg';
  cmNavFontSize?: number;
  cmNavPadding?: number;
  cmNavScrolledPadding?: number;
  cmNavBorderBottom?: boolean;
  cmNavBorderColor?: string;
  // Chinamart Hero
  cmHeroModel?: string;
  cmHeroBgColor?: string;
  cmHeroTextColor?: string;
  cmHeroOverlayOpacity?: number;
  cmHeroHeight?: number;
  cmHeroTitleSize?: number;
  cmHeroBtnBg?: string;
  cmHeroBtnText?: string;
  cmHeroBtnRadius?: number;
  cmHeroAlign?: 'left' | 'center' | 'right';
  // Chinamart Footer
  cmFooterBg?: string;
  cmFooterTextColor?: string;
  cmFooterAccentColor?: string;
  cmFooterColumns?: number;
  cmFooterLogoHeight?: number;
  cmFooterBorderTop?: boolean;
  cmFooterBorderColor?: string;
  // Hero Banner (tpl1)
  heroSlides?: HeroSlide[];
  heroAutoplay?: boolean;
  heroDelay?: number; // ms between slides
  heroTransitionSpeed?: number; // ms transition
  heroOverlayEnabled?: boolean; // Enable/disable overlay
  heroOverlayOpacity?: number; // 0-1, overlay on slide image
  heroStoreName?: string; // Título principal de la tienda
  heroStoreLogoUrl?: string; // URL de imagen del logo
  heroStoreLogoScrollUrl?: string; // URL de imagen del logo al hacer scroll
  heroStoreLogoMode?: 'text' | 'image'; // Mostrar texto o imagen
  heroStoreLogoHeight?: number; // Altura del logo en px
  heroStoreLogoMobileHeight?: number; // Altura del logo en móvil (px)
  heroStoreLogoPosX?: number; // Posición X del logo en px
  heroStoreLogoPosY?: number; // Posición Y del logo en px
  heroTitleOpacity?: number; // 0-1, opacidad del título
  heroSubtitleOpacity?: number; // 0-1, opacidad del subtítulo
  heroParticlesCount?: number; // Cantidad de partículas en el hero
  heroParticlesColor?: string; // Color base de las partículas (se generan variaciones)
  heroParticlesSize?: number; // Tamaño base de las partículas en px
  heroTitleAnimation?: 'typing' | 'fadeIn' | 'slideUp' | 'scaleIn' | 'blurIn' | 'splitChars' | 'glitch' | 'none'; // Animación de entrada del título
}

export interface CollectionItem {
  categoryId?: string; // Appwrite category ID
  name: string;
  imageUrl: string;
  link?: string;
  productCount?: number;
  overlayEnabled?: boolean; // Mostrar/ocultar overlay
  overlayOpacity?: number; // 0-1, opacidad de la máscara oscura
}

export interface MediaGalleryItem {
  title: string;
  mediaUrl: string;
  mediaType?: 'image' | 'video';
  posterUrl?: string;
  buttonText?: string;
  link?: string;
}

export interface HeroSlide {
  imageUrl: string;
  videoUrl?: string;
  mobileImageUrl?: string;
  mobileVideoUrl?: string;
  title: string;
  subtitle: string;
  description?: string;
  btnPrimaryText?: string;
  btnPrimaryLink?: string;
  btnSecondaryText?: string;
  btnSecondaryLink?: string;
  alignment?: 'center' | 'left' | 'right';
}

export interface SectionConfig {
  id: string;
  label: string;
  description: string;
  icon: string;
  enabled: boolean;
  order: number;
  settings: SectionSettings;
  locked?: boolean; // Cannot be disabled (e.g. hero)
}

export const SECTION_DEFAULTS: SectionConfig[] = [
  {
    id: 'navbar',
    label: 'Barra de Navegación',
    description: 'Header principal con logo, búsqueda, menú y carrito',
    icon: '🧭',
    enabled: true,
    order: -1,
    locked: true,
    settings: {
      navModel: 'mercadolibre',
      bgColor: '#ffe600', textColor: '#333', accentColor: '#3483fa',
      searchBgColor: '#fff', searchBtnColor: '#fff', searchBtnTextColor: '#333',
      itemHoverBg: '#ffffff', cartBadgeColor: '#3483fa', borderBottomColor: '#e6e6e6',
      logoPosition: 'left', navHeight: 64, searchRadius: 2,
      showAddress: true, showCategories: true, showOffers: true, showFavorites: true,
      sticky: true, borderBottom: false,
      searchPlaceholder: 'Buscar productos, marcas y más...',
      navParticlesEnabled: false,
      navParticlesText: '3B',
      navParticlesColor: '#3483fa',
      navParticlesCount: 24,
      navParticlesSize: 14,
      navParticlesOpacity: 0.35,
    },
  },
  {
    id: 'announcement_bar',
    label: 'Barra de Anuncios',
    description: 'Barra superior con mensaje promocional (ej: envío gratis)',
    icon: '🔥',
    enabled: false,
    order: 0,
    settings: { title: '', buttonLink: '/productos', bgColor: '#6366f1', textColor: '#fff' },
  },
  {
    id: 'live_banner',
    label: 'Banner En Vivo',
    description: 'Banner de transmisión en vivo o próximamente',
    icon: '📡',
    enabled: true,
    order: 1,
    settings: {
      bgColor: '#dc2626',
      bgColorIdle: '#374151',
      textColor: '#fff',
      accentColor: '#fbbf24',
      liveText: 'EN VIVO',
      idleText: 'PRÓXIMAMENTE',
      liveTitle: '¡Estamos en vivo ahora!',
      idleTitle: 'Stay tuned — Próxima transmisión pronto',
      ctaText: 'Ver transmisión',
      ctaLink: '',
      borderRadius: 0,
      padding: 10,
    },
    locked: false,
  },
  {
    id: 'hero_carousel',
    label: 'Hero Carousel',
    description: 'Carrusel principal de banners con navegación',
    icon: '🖼️',
    enabled: true,
    order: 1,
    settings: { autoplay: true, autoplaySpeed: 5000 },
    locked: true,
  },
  {
    id: 'tpl1_product_widget',
    label: 'Producto flotante Hero',
    description: 'Card flotante del hero Shopify: producto, foto, precio, botón y duración',
    icon: '🛒',
    enabled: true,
    order: 1.5,
    settings: {
      productWidgetTitle: 'Título del Producto',
      productWidgetPrice: '$20.00',
      productWidgetButtonText: 'Comprar Ahora',
      productWidgetLink: '/productos',
      productWidgetDuration: 5,
      productWidgetProductId: '',
      productWidgetPositionY: 70,
      productWidgetPositionX: 50,
      productWidgetSlideInterval: 5,
    },
  },
  {
    id: 'coupon_banner',
    label: 'Banner de Cupones',
    description: 'Muestra cupones activos disponibles',
    icon: '🎟️',
    enabled: true,
    order: 2,
    settings: {
      couponTitle: 'DESCUENTO',
      couponSubtitle: 'Código exclusivo por tiempo limitado',
      couponMessage: 'Oferta especial por tiempo limitado',
      couponStampText: 'EXCLUSIVO',
      couponCodeLabel: 'Tu código',
      couponCopyText: 'Copiar',
      couponCopiedText: '¡Copiado!',
    },
  },
  {
    id: 'feature_cards',
    label: 'Tarjetas de Beneficios',
    description: '6 tarjetas informativas: envío, pago, cuenta, etc.',
    icon: '💳',
    enabled: true,
    order: 3,
    settings: {},
  },
  {
    id: 'categories',
    label: 'Categorías',
    description: 'Grid de categorías con iconos y efectos 3D',
    icon: '📂',
    enabled: true,
    order: 4,
    settings: { title: 'Categorías', showViewAll: true },
  },
  {
    id: 'offers_featured',
    label: 'Ofertas + Destacados',
    description: 'Oferta del día con countdown + carrusel de destacados',
    icon: '⏰',
    enabled: true,
    order: 5,
    settings: { title: 'Oferta del día' },
  },
  {
    id: 'collage',
    label: 'Collage Interactivo',
    description: 'Grid estilo IKEA con hotspots de productos',
    icon: '🎨',
    enabled: true,
    order: 6,
    settings: { title: 'Explora nuestra colección', showViewAll: true },
  },
  {
    id: 'recommended',
    label: 'Recomendados para Ti',
    description: 'Carrusel horizontal de productos recomendados',
    icon: '🎯',
    enabled: true,
    order: 8,
    settings: { title: 'Recomendados para ti', subtitle: 'Sabemos lo que te gusta', itemsCount: 8, cardStyle: 'classic', cardHoverTilt: true, cardHoverZoom: true, cardShimmer: true, cardBadgePulse: true, cardBtnShimmer: true, cardImageHeight: 260, cardImageFit: 'cover', favStyle: 'circle', favBgColor: '#ffffff', favBgColorActive: '#fff5f5', favIconColor: '#999999', favIconColorActive: '#e53935', favSize: 18, favAnimation: 'pulse', favShadow: true, favBorder: true },
  },
  {
    id: 'products_grid',
    label: 'Productos Destacados',
    description: 'Grid completo de productos con efectos 3D',
    icon: '🛍️',
    enabled: true,
    order: 9,
    settings: { title: 'Productos destacados', showViewAll: true, cardStyle: 'classic', cardHoverTilt: true, cardHoverZoom: true, cardShimmer: true, cardBadgePulse: true, cardBtnShimmer: true, cardImageHeight: 260, cardImageFit: 'cover', columns: 4, favStyle: 'circle', favBgColor: '#ffffff', favBgColorActive: '#fff5f5', favIconColor: '#999999', favIconColorActive: '#e53935', favSize: 18, favAnimation: 'pulse', favShadow: true, favBorder: true },
  },
  {
    id: 'banner_image',
    label: 'Banner de Imagen',
    description: 'Banner grande con imagen de fondo y texto',
    icon: '🖼️',
    enabled: false,
    order: 20,
    settings: { bgColor: '#111827', textColor: '#fff', accentColor: '#3483fa', height: 400, borderRadius: 0, buttonColor: '#3483fa', buttonTextColor: '#fff', overlayText: '¡Gran promoción de temporada!', buttonText: 'Ver más', buttonLink: '/productos' },
  },
  {
    id: 'featured_collection',
    label: 'Colección Destacada',
    description: 'Grid de productos de una colección',
    icon: '⭐',
    enabled: false,
    order: 21,
    settings: { bgColor: '#ffffff', textColor: '#1a1a1a', headingColor: '#111', cardBgColor: '#fff', cardTextColor: '#333', accentColor: '#3483fa', title: 'Colección destacada', itemsCount: 8, columns: 4, gap: 16, borderRadius: 8, shadow: 'sm' },
  },
  {
    id: 'image_text',
    label: 'Imagen con Texto',
    description: 'Imagen a un lado y texto al otro',
    icon: '📝',
    enabled: false,
    order: 22,
    settings: { bgColor: '#ffffff', textColor: '#374151', headingColor: '#111', accentColor: '#3483fa', imagePosition: 'left', borderRadius: 12, buttonColor: '#3483fa', buttonTextColor: '#fff', title: 'Nuestra historia', description: 'Cuenta la historia de tu marca aquí.', buttonText: 'Saber más', buttonLink: '/nosotros' },
  },
  {
    id: 'collections_list',
    label: 'Lista de Colecciones',
    description: 'Muestra varias colecciones en cuadrícula',
    icon: '📂',
    enabled: false,
    order: 23,
    settings: { bgColor: '#ffffff', textColor: '#1a1a1a', headingColor: '#111', cardBgColor: '#f9fafb', cardTextColor: '#333', accentColor: '#3483fa', title: 'Nuestras colecciones', columns: 3, gap: 20, borderRadius: 12, shadow: 'sm' },
  },
  {
    id: 'testimonials',
    label: 'Testimonios',
    description: 'Carrusel de opiniones de clientes',
    icon: '💬',
    enabled: true,
    order: 24,
    settings: { bgColor: '#f9fafb', textColor: '#374151', headingColor: '#111', cardBgColor: '#ffffff', cardTextColor: '#374151', accentColor: '#7c3aed', title: 'LO QUE DICEN NUESTROS CLIENTES', borderRadius: 12, shadow: 'sm', padding: 40, testimonials: [
      { name: 'Carolina Muñoz', text: 'Yaxsell transformó mi negocio. En menos de una hora tenía mi tienda online lista y vendiendo. La plataforma es intuitiva y el soporte es increíble.', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', rating: 5 },
      { name: 'Roberto Silva', text: 'Excelente plataforma para emprendedores. La gestión de inventario y pedidos es muy fácil de usar. Mis ventas aumentaron un 40% desde que migramos a Yaxsell.', avatar: 'https://randomuser.me/api/portraits/men/68.jpg', rating: 5 },
      { name: 'Andrea López', text: 'Me encanta lo completo que es Yaxsell. Analytics, descuentos automáticos, envíos integrados... todo en un solo lugar. Ahorro tiempo y dinero cada día.', avatar: 'https://randomuser.me/api/portraits/women/33.jpg', rating: 5 },
      { name: 'Matías Rojas', text: 'El mejor e-commerce que he usado. La personalización del tema es muy flexible y mis clientes notan la diferencia. El panel de administración es potente y claro.', avatar: 'https://randomuser.me/api/portraits/men/17.jpg', rating: 5 },
      { name: 'Valentina Torres', text: 'Soporte técnico de primera. Siempre responden rápido y solucionan cualquier duda. Mi tienda se ve profesional y mis clientes confían en la plataforma.', avatar: 'https://randomuser.me/api/portraits/women/55.jpg', rating: 5 },
    ] },
  },
  {
    id: 'newsletter',
    label: 'Newsletter',
    description: 'Formulario de captura de email',
    icon: '📧',
    enabled: false,
    order: 25,
    settings: { bgColor: '#111827', textColor: '#f3f4f6', headingColor: '#fff', accentColor: '#3483fa', buttonColor: '#3483fa', buttonTextColor: '#fff', borderRadius: 0, padding: 48, title: '¿Quieres recibir ofertas exclusivas?', subtitle: 'Suscríbete a nuestro newsletter y no te pierdas nada.', placeholder: 'tu@email.com', buttonText: 'Suscribirme' },
  },
  {
    id: 'video',
    label: 'Video',
    description: 'Embed de video de YouTube o Vimeo',
    icon: '🎬',
    enabled: false,
    order: 26,
    settings: { bgColor: '#000000', textColor: '#fff', headingColor: '#fff', accentColor: '#ef4444', borderRadius: 12, padding: 40, title: 'Mira nuestro video' },
  },
  {
    id: 'rich_text',
    label: 'Texto Enriquecido',
    description: 'Bloque de texto libre con formato',
    icon: '📄',
    enabled: false,
    order: 27,
    settings: { bgColor: '#ffffff', textColor: '#374151', headingColor: '#111827', accentColor: '#3483fa', padding: 48, borderRadius: 0, title: 'Sobre nosotros', htmlContent: '<p>Escribe aquí el contenido de tu sección.</p>' },
  },
  {
    id: 'logo_list',
    label: 'Lista de Logos',
    description: 'Marcas o partners en fila horizontal',
    icon: '🏷️',
    enabled: false,
    order: 28,
    settings: { bgColor: '#ffffff', textColor: '#9ca3af', headingColor: '#6b7280', padding: 32, gap: 32, title: 'Marcas que confían en nosotros', logos: [] },
  },
  {
    id: 'countdown',
    label: 'Cuenta Regresiva',
    description: 'Timer con llamada a la acción',
    icon: '⏱️',
    enabled: false,
    order: 29,
    settings: { bgColor: '#dc2626', textColor: '#fff', headingColor: '#fff', accentColor: '#fbbf24', buttonColor: '#fbbf24', buttonTextColor: '#111', borderRadius: 0, padding: 48, title: '¡Oferta por tiempo limitado!', ctaText: 'Comprar ahora', ctaLink: '/productos' },
  },
  {
    id: 'faq',
    label: 'Preguntas Frecuentes',
    description: 'Acordeón de preguntas y respuestas',
    icon: '❓',
    enabled: false,
    order: 30,
    settings: { bgColor: '#ffffff', textColor: '#374151', headingColor: '#111827', accentColor: '#3483fa', padding: 48, borderRadius: 0, title: 'Preguntas frecuentes', faqs: [
      { question: '¿Cuánto tarda el envío?', answer: 'Santiago: 2-5 días hábiles. Regiones: 3-7 días hábiles. Zonas extremas: 5-10 días hábiles.' },
      { question: '¿Realizan envíos a todo Chile?', answer: 'Sí, realizamos envíos a todo Chile continental. Algunas zonas extremas pueden tener restricciones.' },
      { question: '¿Quién paga el costo de envío?', answer: 'El costo de envío es pagado por el destinatario. El costo varía según destino, peso y volumen.' },
      { question: '¿Qué formas de pago aceptan?', answer: 'Actualmente aceptamos transferencia bancaria como método principal. Los pedidos se procesan una vez confirmado el pago.' },
      { question: '¿Cuál es el tiempo de validación del pago?', answer: 'El tiempo de validación es de 24-48 horas hábiles. Debe enviar comprobante de transferencia para validación.' },
      { question: '¿Puedo devolver un producto?', answer: 'Sí, conforme a la Ley del Consumidor chilena, tiene derecho a retractarse dentro de 10 días corridos desde la recepción del producto.' },
      { question: '¿Qué garantía tienen los productos?', answer: 'Todos nuestros productos cuentan con garantía legal de 6 meses según la Ley del Consumidor chilena.' },
      { question: '¿Cómo contacto a soporte?', answer: 'Email: dexkonet@gmail.com. Teléfono: +56 9 9213 9185. Horario: L-V 9:00-18:00, Sábados 9:00-14:00.' },
      { question: '¿Qué productos venden?', answer: 'Artículos para el hogar, productos de decoración, electrónicos y electrodomésticos, accesorios y complementos.' },
      { question: '¿Los precios incluyen IVA?', answer: 'Sí, todos los precios están expresados en pesos chilenos (CLP) e incluyen IVA cuando corresponda.' }
    ] },
  },
  {
    id: 'map',
    label: 'Mapa',
    description: 'Google Maps embed con ubicación',
    icon: '📍',
    enabled: false,
    order: 31,
    settings: { bgColor: '#ffffff', textColor: '#374151', headingColor: '#111827', accentColor: '#3483fa', padding: 32, borderRadius: 0, height: 400, title: 'Encuéntranos', mapEmbed: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3329.7!2d-70.65!3d-33.44!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzPCsDI2JzI0LjAiUyA3MMKwMzknMDAuMCJX!5e0!3m2!1ses!2scl!4v1" width="100%" height="400" style="border:0" allowfullscreen loading="lazy"></iframe>' },
  },

  // ── PLANTILLA 1 (Shopify Venice) SECTIONS ──
  {
    id: 'tpl1_announcement_bar',
    label: 'Barra de Anuncio',
    description: 'Barra superior con texto promocional',
    icon: '📢',
    enabled: true,
    order: -3,
    locked: true,
    settings: {
      title: '¡Envío gratis en pedidos sobre $50!',
      bgColor: '',
      textColor: '#ffffff',
      bgGradient: 'linear-gradient(90deg,#111111,#ffffff)',
      gradientAnimated: true,
      textGradientStyle: '',
      textGradientAnimated: false,
      textHoverEffect: 'none',
      textSize: 13,
    },
  },
  {
    id: 'tpl1_hero',
    label: 'TPL1 — Hero Banner',
    description: 'Carrusel hero principal con banners y producto flotante',
    icon: '🖼️',
    enabled: true,
    order: -1,
    locked: true,
    settings: {
      heroAutoplay: false,
      heroDelay: 5000,
      heroTransitionSpeed: 1000,
      heroOverlayEnabled: true,
      heroOverlayOpacity: 0.3,
      heroStoreName: 'Yaxsell',
      heroStoreLogoMode: 'text',
      heroStoreLogoUrl: '',
      heroStoreLogoScrollUrl: '',
      heroStoreLogoHeight: 40,
      heroStoreLogoPosX: 0,
      heroStoreLogoPosY: 0,
      heroTitleOpacity: 0.92,
      heroSubtitleOpacity: 0.92,
      heroTitleColor: '',
      heroSubtitleColor: '',
      heroParticlesCount: 50,
      heroParticlesColor: '#ffffff',
      heroParticlesSize: 2,
      heroTitleAnimation: 'typing',
      heroSlides: [
        {
          imageUrl: '/shopify/assets/template.jpg',
          title: 'Yaxsell',
          subtitle: 'E-COMMERCE',
          alignment: 'center',
        },
        {
          imageUrl: '/shopify/assets/template.jpg',
          title: 'Yaxsell',
          subtitle: 'PLATAFORMA E-COMMERCE',
          description: 'Crea tu tienda online en minutos. Gestiona productos, pedidos e inventario desde un solo panel intuitivo y potente.',
          btnPrimaryText: 'MÁS INFO',
          btnSecondaryText: 'COMENZAR AHORA',
          alignment: 'left',
        },
        {
          imageUrl: '/shopify/assets/template.jpg',
          title: 'Yaxsell',
          subtitle: 'VENDE SIN LÍMITES',
          description: 'Herramientas profesionales para hacer crecer tu negocio: analytics en tiempo real, descuentos automáticos y envíos inteligentes.',
          btnPrimaryText: 'MÁS INFO',
          btnSecondaryText: 'COMENZAR AHORA',
          alignment: 'left',
        },
      ],
    },
  },
  {
    id: 'tpl1_coupon_banner',
    label: 'Cupones',
    description: 'Muestra cupones activos disponibles',
    icon: '🎟️',
    enabled: true,
    order: 9,
    settings: { couponLayout: 'yaxsell-split' },
  },
  {
    id: 'tpl1_collection_list',
    label: 'Colecciones',
    description: 'Carrusel de colecciones de la tienda',
    icon: '🏷️',
    enabled: true,
    order: 10,
    settings: {
      collectionTitle: 'NUESTRAS CATEGORÍAS',
      collectionSubtitle: 'TIENDA ONLINE',
      collectionDescription: 'Explora nuestras categorías de productos organizadas para que encuentres fácilmente lo que buscas.',
      collectionItems: [],
    },
  },
  {
    id: 'tpl1_marquee',
    label: 'Texto Animado',
    description: 'Banda de texto animado con imágenes (marquee)',
    icon: '📢',
    enabled: true,
    order: 11,
    settings: {
      marqueeText1: 'Yaxsell E-Commerce',
      marqueeText2: 'Vende Sin Límites',
      marqueeText3: 'Tu Tienda Online',
      marqueeImage1: '/shopify/assets/img/9jo523yvuya95av2-82653806840.shopifypreview.com/cdn/shop/t/3/assets/marquee-shape-m77pjx.png',
      marqueeImage2: '/shopify/assets/img/9jo523yvuya95av2-82653806840.shopifypreview.com/cdn/shop/t/3/assets/marquee-shape-m77pjx.png',
      marqueeImage3: '/shopify/assets/img/9jo523yvuya95av2-82653806840.shopifypreview.com/cdn/shop/t/3/assets/marquee-shape-m77pjx.png',
      marqueeSpeed: 18,
      marqueeImageHeight: 50,
    },
  },
  {
    id: 'tpl1_featured_collection',
    label: 'Colección Destacada',
    description: 'Grid de productos de una colección destacada',
    icon: '⭐',
    enabled: true,
    order: 12,
    settings: {
      featuredCollectionSubtitle: 'LO MÁS VENDIDO',
      featuredCollectionTitle: 'PRODUCTOS DESTACADOS',
      featuredCollectionDescription: 'Descubre los productos más populares de la tienda, seleccionados por nuestros clientes como los favoritos.',
      featuredCollectionItems: [],
    },
  },
  {
    id: 'tpl1_media_gallery',
    label: 'Galería de Medios',
    description: 'Grid de 2 columnas con imágenes y videos',
    icon: '🎨',
    enabled: true,
    order: 13,
    settings: {
      mediaGalleryTitle: 'Yaxsell',
      mediaGalleryItems: [
        {
          title: 'NUEVAS LLEGADAS',
          mediaUrl: '/shopify/assets/template.jpg',
          mediaType: 'image',
          buttonText: 'VER MÁS',
          link: '/productos',
        },
        {
          title: 'OFERTAS EXCLUSIVAS',
          mediaUrl: '/shopify/assets/template.jpg',
          mediaType: 'image',
          buttonText: 'VER MÁS',
          link: '/productos',
        },
      ],
    },
  },
  {
    id: 'tpl1_featured_product',
    label: 'Producto Destacado',
    description: 'Sección de producto individual con descripción',
    icon: '🛒',
    enabled: true,
    order: 14,
    settings: {
      featuredProductSubtitle: 'EL FAVORITO DE LA TIENDA',
      featuredProductTitle: 'PRODUCTO DESTACADO',
      featuredProductDescription: 'Conoce nuestro producto destacado, elegido por su calidad excepcional y la satisfacción de nuestros clientes.',
      featuredProductProductId: '',
    },
  },
  {
    id: 'tpl1_countdown',
    label: 'Cuenta Regresiva',
    description: 'Timer de cuenta regresiva para ofertas',
    icon: '⏱️',
    enabled: true,
    order: 15,
    settings: {
      countdownOfferId: '',
      countdownSlideText: 'OFERTA POR TIEMPO LIMITADO',
      countdownTitle: 'PROMOCIÓN ESPECIAL',
      countdownSubtitle: 'Aprovecha nuestras ofertas exclusivas antes de que se agoten. ¡No te quedes fuera!',
      countdownButtonText: 'COMPRAR AHORA',
    },
  },
  {
    id: 'tpl1_products_filter',
    label: 'Productos con Filtro',
    description: 'Grid de productos con pestañas por colección',
    icon: '🛍️',
    enabled: true,
    order: 16,
    settings: {
      productsFilterSubtitle: 'EXPLORA POR CATEGORÍA',
      productsFilterTitle: 'CATÁLOGO DE PRODUCTOS',
      productsFilterDescription: 'Navega por nuestras categorías cuidadosamente seleccionadas y encuentra exactamente lo que buscas.',
      productsFilterCategoryIds: [],
      productsFilterPerCategory: 8,
    },
  },
  {
    id: 'tpl1_before_after',
    label: 'Antes / Después',
    description: 'Comparador visual de imagen antes y después',
    icon: '🔀',
    enabled: true,
    order: 17,
    settings: {
      beforeAfterSubtitle: 'RESULTADOS REALES',
      beforeAfterTitle: 'ANTES Y DESPUÉS',
      beforeAfterDescription: 'Ve la diferencia con nuestros productos de calidad premium que entregan resultados visibles y comprobables.',
      beforeAfterBeforeImage: '',
      beforeAfterAfterImage: '',
      beforeAfterBeforeLabel: 'Antes',
      beforeAfterAfterLabel: 'Después',
    },
  },
  {
    id: 'tpl1_faq',
    label: 'Preguntas Frecuentes',
    description: 'Acordeón de preguntas y respuestas',
    icon: '❓',
    enabled: true,
    order: 18,
    settings: {},
  },
  {
    id: 'tpl1_shop_the_look',
    label: 'Shop The Look',
    description: 'Grid de looks con productos etiquetados',
    icon: '👗',
    enabled: true,
    order: 19,
    settings: {},
  },
  {
    id: 'tpl1_marquee_2',
    label: 'Texto Animado 2',
    description: 'Segunda banda de texto animado',
    icon: '📢',
    enabled: true,
    order: 20,
    settings: {
      marquee2Text1: 'Yaxsell E-Commerce',
      marquee2Text2: 'Gestión Integral',
      marquee2Text3: 'Crece Online',
      marquee2Image1: '/shopify/assets/img/9jo523yvuya95av2-82653806840.shopifypreview.com/cdn/shop/t/3/assets/marquee-shape-m77pjx.png',
      marquee2Image2: '/shopify/assets/img/9jo523yvuya95av2-82653806840.shopifypreview.com/cdn/shop/t/3/assets/marquee-shape-m77pjx.png',
      marquee2Image3: '',
      marquee2Speed: 18,
      marquee2ImageHeight: 32,
    },
  },
  {
    id: 'tpl1_image_overlay',
    label: 'Banner con Texto',
    description: 'Imagen de fondo con texto superpuesto',
    icon: '🖼️',
    enabled: true,
    order: 21,
    settings: {
      overlaySubheading: 'Plataforma E-Commerce',
      overlayHeading: 'Yaxsell',
      overlayParagraph: 'Crea tu tienda online profesional en minutos. Gestiona productos, pedidos e inventario desde un panel intuitivo. Herramientas de marketing, analytics y envíos integrados para hacer crecer tu negocio.',
      overlayBtnText: 'Comenzar Ahora',
      overlayBtnLink: '/productos',
      overlayBgImage: '/shopify/assets/template.jpg',
      overlayBlurAmount: 0,
      overlayOverlayOpacity: 0.4,
      overlayOverlayColor: '#000000',
      overlayTextColor: '#ffffff',
      overlaySubheadingColor: '#a78bfa',
      overlayFontFamily: 'inherit',
      overlayFontSize: 18,
      overlayFontWeight: 400,
      overlayBorderRadius: 0,
      overlayParticlesEnabled: true,
      overlayParticlesColor: '#ffffff',
      overlayParticlesSize: 3,
      overlayParticlesOpacity: 0.6,
      overlayParticlesCount: 50,
      padding: 80,
      height: 500,
    },
  },
  {
    id: 'tpl1_video_text',
    label: 'Video con Texto',
    description: 'Video o imagen a un lado con texto al otro',
    icon: '🎬',
    enabled: true,
    order: 22,
    settings: {
      vtHeading: 'Yaxsell',
      vtSubtitle: 'Plataforma E-Commerce',
      vtDescription: 'Todo lo que necesitas para vender online: gestión de productos, procesamiento de pedidos, control de inventario, analytics en tiempo real y herramientas de marketing automatizadas. Tu tienda profesional lista en minutos.',
      vtBtnText: 'Comenzar Ahora',
      vtBtnLink: '/productos',
      vtVideoUrl: '',
      vtPosterImage: '/shopify/assets/template.jpg',
      vtMediaPosition: 'left',
      vtBorderRadius: 20,
      vtHeadingColor: '#7c3aed',
      vtTextColor: '#374151',
      vtBgColor: '#f5f3ff',
      padding: 60,
      height: 450,
    },
  },
  {
    id: 'tpl1_testimonials',
    label: 'Testimonios',
    description: 'Carrusel de opiniones y valoraciones de clientes',
    icon: '💬',
    enabled: true,
    order: 23,
    settings: {},
  },
  {
    id: 'tpl1_brand_logos',
    label: 'Logos de Marcas',
    description: 'Fila de logos de marcas o partners',
    icon: '🏷️',
    enabled: true,
    order: 24,
    settings: {
      title: 'Marcas que confían en nosotros',
      logos: [
        { url: '', alt: 'Marca 1', link: '' },
        { url: '', alt: 'Marca 2', link: '' },
        { url: '', alt: 'Marca 3', link: '' },
        { url: '', alt: 'Marca 4', link: '' },
        { url: '', alt: 'Marca 5', link: '' },
      ],
    },
  },
  {
    id: 'tpl1_blog',
    label: 'Blog / Noticias',
    description: 'Carrusel de artículos del blog',
    icon: '📰',
    enabled: true,
    order: 25,
    settings: {},
  },
  {
    id: 'tpl1_service_icons',
    label: 'Iconos de Servicios',
    description: 'Fila de iconos con beneficios: envío, pago, soporte...',
    icon: '💳',
    enabled: true,
    order: 26,
    settings: {
      title: '¿Por qué elegir Yaxsell?',
      items: [
        { icon: 'truck', title: 'Envío Rápido', description: 'Despacho seguro y rápido a todo el país. Seguimiento en tiempo real.' },
        { icon: 'shield-check', title: 'Pago Seguro', description: 'Múltiples métodos de pago con encriptación y protección al comprador.' },
        { icon: 'message-circle', title: 'Soporte 24/7', description: 'Atención personalizada por chat y WhatsApp todos los días.' },
        { icon: 'sparkles', title: 'Productos de Calidad', description: 'Solo productos verificados y de calidad garantizada para tu satisfacción.' },
      ],
    },
  },
  {
    id: 'tpl1_subscribe_popup',
    label: 'Popup de Suscripción',
    description: 'Popup flotante de captura de email',
    icon: '✉️',
    enabled: true,
    order: 101,
    locked: true,
    settings: {},
  },
  {
    id: 'tpl1_footer',
    label: 'TPL1 — Footer',
    description: 'Pie de página con logo, links, contacto y newsletter',
    icon: '🦶',
    enabled: true,
    order: 100,
    locked: true,
    settings: {
      logoUrl: '',
      companyName: 'Yaxsell',
      companyDescription: 'Plataforma de e-commerce profesional. Crea tu tienda online, gestiona productos, pedidos e inventario desde un solo panel potente e intuitivo.',
      address: '',
      phone: '',
      email: 'info@yaxsell.com',
      whatsapp: '',
      instagram: '@yaxsell',
      facebook: 'yaxsell',
      tiktok: '@yaxsell',
      footerLinks: [
        { title: 'Inicio', url: '/' },
        { title: 'Productos', url: '/productos' },
        { title: 'Categorías', url: '/categorias' },
        { title: 'Contacto', url: '/contacto' },
      ],
      newsletterTitle: '¡Suscríbete!',
      newsletterText: 'Recibe ofertas exclusivas y novedades',
      copyrightText: 'DESARROLLADO POR DEZKONET - PROJECT YAXSELL',
      showMap: true,
      mapEmbed: '',
    },
  },
  {
    id: 'tpl1_whatsapp_button',
    label: 'Botón WhatsApp',
    description: 'Botón flotante de WhatsApp para contacto directo',
    icon: '💬',
    enabled: true,
    order: 101,
    locked: true,
    settings: {},
  },
  {
    id: 'tpl1_chatbot_button',
    label: 'Chatbot',
    description: 'Botón flotante de chatbot para atención al cliente',
    icon: '🤖',
    enabled: true,
    order: 102,
    locked: true,
    settings: {},
  },

  // ── CHINAMART / PLANTILLA 4 SECTIONS ──
  {
    id: 'cm_navbar',
    label: 'CM — Navbar',
    description: 'Barra de navegación de Chinamart',
    icon: '🧭',
    enabled: true,
    order: 0,
    settings: {},
  },
  {
    id: 'cm_hero',
    label: 'CM — Hero',
    description: 'Sección principal hero con fondo de imagen e info de empresa',
    icon: '🎬',
    enabled: true,
    order: 1,
    settings: {},
  },
  {
    id: 'cm_services',
    label: 'CM — Servicios',
    description: 'Tarjetas de servicios con imágenes',
    icon: '🛠️',
    enabled: true,
    order: 2,
    settings: { title: 'Nuestros Servicios' },
  },
  {
    id: 'cm_about',
    label: 'CM — Nosotros',
    description: 'Sección historia con imagen y texto',
    icon: '📖',
    enabled: true,
    order: 3,
    settings: { title: 'Nuestra Historia' },
  },
  {
    id: 'cm_products',
    label: 'CM — Productos',
    description: 'Grid de productos destacados',
    icon: '📦',
    enabled: true,
    order: 4,
    settings: { title: 'Nuestros Productos' },
  },
  {
    id: 'cm_testimonials',
    label: 'CM — Testimonios',
    description: 'Tarjetas de testimonios de clientes',
    icon: '⭐',
    enabled: true,
    order: 5,
    settings: { title: 'Lo que dicen nuestros clientes' },
  },
  {
    id: 'cm_contact',
    label: 'CM — Contacto',
    description: 'Formulario de contacto con información',
    icon: '📞',
    enabled: true,
    order: 6,
    settings: { title: 'Contáctanos' },
  },
  {
    id: 'cm_footer',
    label: 'CM — Footer',
    description: 'Pie de página de Chinamart con mapa, links y redes sociales',
    icon: '🦶',
    enabled: true,
    order: 7,
    settings: {},
  },
];

/* ═══════════════════════════════════════════════════════════════════
   FONT CONFIGURATION SYSTEM
   ═══════════════════════════════════════════════════════════════════ */
export interface FontConfig {
  globalFont: string;
  globalHeadingFont: string;
}

export const FONT_OPTIONS = [
  // ── Por defecto ──
  { value: '', label: '⚙️ Por defecto (System UI)' },

  // ── Sans-serif modernas (cuerpo) ──
  { value: 'Inter', label: 'Inter — Moderna, legible' },
  { value: 'DM Sans', label: 'DM Sans — Geométrica, elegante' },
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans — Suave, moderna' },
  { value: 'Outfit', label: 'Outfit — Limpia, versátil' },
  { value: 'Sora', label: 'Sora — Tech, futurista' },
  { value: 'Manrope', label: 'Manrope — Premium, redondeada' },
  { value: 'Space Grotesk', label: 'Space Grotesk — Tech, distintiva' },
  { value: 'Bricolage Grotesque', label: 'Bricolage Grotesque — Unica, editorial' },
  { value: 'Syne', label: 'Syne — Artística, bold' },
  { value: 'Work Sans', label: 'Work Sans — Editorial, limpia' },
  { value: 'Libre Franklin', label: 'Libre Franklin — Clásica americana' },
  { value: 'Fira Sans', label: 'Fira Sans — Mozilla, legible' },
  { value: 'IBM Plex Sans', label: 'IBM Plex Sans — Corporativa, técnica' },
  { value: 'Karla', label: 'Karla — Humanista, cálida' },
  { value: 'Rubik', label: 'Rubik — Amigable, redondeada' },
  { value: 'Chivo', label: 'Chivo — Argentina, moderna' },
  { value: 'PT Sans', label: 'PT Sans — Rusa, legible' },
  { value: 'Proza Libre', label: 'Proza Libre — Libre, original' },

  // ── Sans-serif populares ──
  { value: 'Poppins', label: 'Poppins — Geométrica, popular' },
  { value: 'Montserrat', label: 'Montserrat — Urbana, versátil' },
  { value: 'Raleway', label: 'Raleway — Elegante, delgada' },
  { value: 'Lato', label: 'Lato — Cálida, profesional' },
  { value: 'Roboto', label: 'Roboto — Android, neutra' },
  { value: 'Open Sans', label: 'Open Sans — Neutral, legible' },
  { value: 'Nunito', label: 'Nunito — Redondeada, amigable' },
  { value: 'Alegreya Sans', label: 'Alegreya Sans — Literaria, elegante' },

  // ── Serif elegantes (títulos, editorial) ──
  { value: 'Playfair Display', label: 'Playfair Display — Elegante, moda' },
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond — Clásica, refinada' },
  { value: 'Lora', label: 'Lora — Caligráfica, cálida' },
  { value: 'Merriweather', label: 'Merriweather — Lectura, pantalla' },
  { value: 'Source Serif 4', label: 'Source Serif 4 — Adobe, profesional' },
  { value: 'Spectral', label: 'Spectral — Producción, elegante' },
  { value: 'Libre Baskerville', label: 'Libre Baskerville — Clásica, timeless' },
  { value: 'Alegreya', label: 'Alegreya — Literaria, premiada' },
  { value: 'PT Serif', label: 'PT Serif — Rusa, legible' },
  { value: 'Cardo', label: 'Cardo — Académica, clásica' },
  { value: 'Inknut Antiqua', label: 'Inknut Antiqua — Antigua, distintiva' },
  { value: 'Eczar', label: 'Eczar — Display, carácter' },
  { value: 'BioRhyme', label: 'BioRhyme — Editorial, ancha' },
  { value: 'Fraunces', label: 'Fraunces — Display, curiosa' },
  { value: 'Neuton', label: 'Neuton — Minimal, serif' },

  // ── Display / Títulos impactantes ──
  { value: 'Bebas Neue', label: 'Bebas Neue — Impactante, todo mayúsculas' },
  { value: 'Oswald', label: 'Oswald — Condensada, bold' },
  { value: 'Archivo Narrow', label: 'Archivo Narrow — Condensada, moderna' },
  { value: 'Clash Display', label: 'Clash Display — Trendy, variable' },

  // ── Monospace / Tech ──
  { value: 'Space Mono', label: 'Space Mono — Tech, retro' },
  { value: 'Inconsolata', label: 'Inconsolata — Código, limpia' },
];

const FONT_STORAGE_KEY = 'theme_fonts';

export const FONT_DEFAULTS: FontConfig = {
  globalFont: 'Inter',
  globalHeadingFont: '',
};

export function getFontConfig(): FontConfig {
  try {
    const stored = localStorage.getItem(FONT_STORAGE_KEY);
    if (stored) return { ...FONT_DEFAULTS, ...JSON.parse(stored) };
  } catch {}
  return { ...FONT_DEFAULTS };
}

export function saveFontConfig(config: FontConfig): void {
  localStorage.setItem(FONT_STORAGE_KEY, JSON.stringify(config));
}

/** Build Google Fonts URL from active fonts */
export function buildGoogleFontsUrl(fontConfig: FontConfig, sections: SectionConfig[]): string {
  const families = new Set<string>();
  if (fontConfig.globalFont) families.add(fontConfig.globalFont);
  if (fontConfig.globalHeadingFont) families.add(fontConfig.globalHeadingFont);
  sections.forEach(s => {
    if (s.settings.fontFamily) families.add(s.settings.fontFamily);
    if (s.settings.headingFontFamily) families.add(s.settings.headingFontFamily);
  });
  if (families.size === 0) return '';
  const params = Array.from(families).map(f => `family=${f.replace(/ /g, '+')}:wght@300;400;500;600;700;800;900`).join('&');
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

const STORAGE_KEY = 'homepage_sections';
const API_ENDPOINT = '/api/theme-config';

// Cache en memoria para evitar llamadas repetidas
let cachedConfig: SectionConfig[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5000; // 5 segundos

/** Invalidate in-memory cache so next read fetches fresh data */
export function invalidateSectionCache(): void {
  cachedConfig = null;
  cacheTimestamp = 0;
}

export async function getSectionConfigAsync(): Promise<SectionConfig[]> {
  const now = Date.now();
  if (cachedConfig && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedConfig;
  }
  
  // Intentar leer del API server-side (que usa API key)
  try {
    const res = await fetch(API_ENDPOINT);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.sections) {
        const parsed: SectionConfig[] = typeof data.sections === 'string' ? JSON.parse(data.sections) : data.sections;
        // Accept any array, even empty, to avoid forced reset to defaults if user intentionally has few sections
        if (Array.isArray(parsed)) {
          const merged = mergeWithDefaults(parsed);
          cachedConfig = merged;
          cacheTimestamp = now;
          // Sincronizar localStorage como backup
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)); } catch {}
          return merged;
        }
      }
    }
  } catch (err) {
    console.log('[section-config] API no disponible, usando localStorage:', err);
  }
  
  // Fallback a localStorage
  return getSectionConfigSync();
}

function mergeWithDefaults(parsed: SectionConfig[]): SectionConfig[] {
  const merged = SECTION_DEFAULTS.map(def => {
    const saved = parsed.find(s => s.id === def.id);
    if (saved) {
      return { ...def, enabled: saved.enabled, order: saved.order, locked: saved.locked ?? def.locked, settings: { ...def.settings, ...saved.settings } };
    }
    return { ...def, order: def.order + 100 };
  });
  // Also include any saved sections not in defaults (e.g. dynamically added)
  const extra = parsed.filter(s => !SECTION_DEFAULTS.find(d => d.id === s.id));
  return [...merged, ...extra].sort((a, b) => a.order - b.order);
}

function getSectionConfigSync(): SectionConfig[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: SectionConfig[] = JSON.parse(stored);
      return mergeWithDefaults(parsed);
    }
  } catch {}
  return [...SECTION_DEFAULTS].sort((a, b) => a.order - b.order);
}

// Versión síncrona para compatibilidad (usa cache o localStorage)
export function getSectionConfig(): SectionConfig[] {
  if (cachedConfig) return cachedConfig;
  return getSectionConfigSync();
}

export async function saveSectionConfigAsync(sections: SectionConfig[]): Promise<void> {
  const reordered = sections.map((s, i) => ({ ...s, order: i }));
  const jsonStr = JSON.stringify(reordered);
  
  // Guardar en localStorage inmediatamente como backup
  try { localStorage.setItem(STORAGE_KEY, jsonStr); } catch {}
  
  // Actualizar cache
  cachedConfig = reordered;
  cacheTimestamp = Date.now();
  
  // Guardar via API server-side
  try {
    await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sections: jsonStr }),
    });
  } catch (err) {
    console.error('[section-config] Error guardando via API:', err);
  }
}

// Versión síncrona para compatibilidad - guarda en localStorage y dispara async
export function saveSectionConfig(sections: SectionConfig[]): void {
  const reordered = sections.map((s, i) => ({ ...s, order: i }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reordered));
  cachedConfig = reordered;
  cacheTimestamp = Date.now();
  
  // Disparar guardado async en background
  saveSectionConfigAsync(sections).catch(() => {});
}

export async function resetSectionConfigAsync(): Promise<void> {
  cachedConfig = null;
  cacheTimestamp = 0;
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  
  try {
    await fetch(API_ENDPOINT, { method: 'DELETE' });
  } catch (err) {
    console.error('[section-config] Error reseteando via API:', err);
  }
}

export function resetSectionConfig(): void {
  cachedConfig = null;
  cacheTimestamp = 0;
  localStorage.removeItem(STORAGE_KEY);
  resetSectionConfigAsync().catch(() => {});
}

export function isSectionEnabled(sections: SectionConfig[], id: string): boolean {
  const s = sections.find(s => s.id === id);
  return s ? s.enabled : true;
}

/** Aplica visibilidad en DOM (clase con !important; no la pisan otros effects con style.display) */
export function applyTpl1SectionsVisibility(
  sections: SectionConfig[],
  htmlMap: Record<string, string>,
): void {
  if (typeof document === 'undefined') return;
  sections.filter(s => s.id.startsWith('tpl1_')).forEach(sec => {
    const htmlId = htmlMap[sec.id];
    if (!htmlId) return;

    const hidden = !sec.enabled;
    const seen = new Set<HTMLElement>();

    const mark = (el: HTMLElement) => {
      if (seen.has(el)) return;
      seen.add(el);
      el.dataset.sectionId = sec.id;
      el.classList.toggle('tpl1-section-hidden', hidden);
    };

    const byId = document.getElementById(htmlId);
    if (byId) mark(byId);

    const shopifyKey = htmlId.startsWith('shopify-section-')
      ? htmlId.slice('shopify-section-'.length)
      : null;
    if (shopifyKey) {
      document
        .querySelectorAll<HTMLElement>(
          `#shopify-section-${shopifyKey}, [data-section-id="${shopifyKey}"]`,
        )
        .forEach(mark);
    }
  });
}

export function getSectionSettings(sections: SectionConfig[], id: string): SectionSettings {
  const s = sections.find(s => s.id === id);
  return s?.settings || {};
}
