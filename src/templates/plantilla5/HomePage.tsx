'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Star, ArrowRight, Plus, ChevronDown,
  Instagram, Facebook, Twitter, Leaf, Droplets, Sun
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { getServices, getAppwriteConfig, formatPrice, PRODUCTS_COLLECTION } from '@/lib/appwrite';
import { resolveStorageImageUrl } from '@/lib/product-images';
import { resolveProductDisplayPrice } from '@/lib/apertura-promo';
import { useAperturaPromotion } from '@/hooks/useAperturaPromotion';
import type { Product } from '@/types';

/* GSAP + ScrollTrigger for scroll-driven animations */
let gsapPkg: any = null;
let scrollTriggerPkg: any = null;
async function loadGSAP() {
  if (gsapPkg) return;
  const g = await import('gsap');
  gsapPkg = g.gsap || g.default || g;
  const st = await import('gsap/ScrollTrigger');
  scrollTriggerPkg = st.ScrollTrigger || st.default;
  gsapPkg.registerPlugin(scrollTriggerPkg);
}

/* ═══════════════════════════════════════════
   YESBELLA — Plantilla 5 (Seoul/Agnes Theme)
   Full React rewrite from Shopify HTML export
   ═══════════════════════════════════════════ */

const ACCENT = '#b46174';
const YELLOW = '#dfe146';
const CREAM = '#fdfbf7';
const DARK = '#2a2120';
const FF = "'Montserrat', 'Nunito Sans', system-ui, sans-serif";
const FALLBACK_IMG = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRyh0wnR27x3AV3mz4OcADzUWXPPhvZZ0eRPg&s';

/* ── Data ── */
const SLIDES = [
  {
    title: 'The Glow Edit',
    highlight: 'Glow',
    subtitle: 'A refined collection of soft-focus beauty essentials made for a fresh, polished glow.',
    align: 'left' as const,
  },
  {
    title: 'Sunlit Beauty Essentials',
    highlight: 'Essentials',
    subtitle: 'Discover breathable creams, cooling serums, and daily SPF favorites made for luminous summer skin.',
    align: 'right' as const,
  },
];

const CATEGORIES = [
  { name: 'Cleansers', image: 'https://images.unsplash.com/photo-1556228524-1e76c5f8b6c0?q=80&w=400&auto=format&fit=crop', link: '/productos?categoria=cleansers' },
  { name: 'Toners', image: 'https://images.unsplash.com/photo-1598440947671-68966991a8b0?q=80&w=400&auto=format&fit=crop', link: '/productos?categoria=toners' },
  { name: 'Serums', image: 'https://images.unsplash.com/photo-1620916567418-af62211ba726?q=80&w=400&auto=format&fit=crop', link: '/productos?categoria=serums' },
  { name: 'Moisturizers', image: 'https://images.unsplash.com/photo-1570194065650-d99fb4b38b17?q=80&w=400&auto=format&fit=crop', link: '/productos?categoria=moisturizers' },
  { name: 'Masks', image: 'https://images.unsplash.com/photo-1596755094514-fc8036281e7e?q=80&w=400&auto=format&fit=crop', link: '/productos?categoria=masks' },
  { name: 'SPF', image: 'https://images.unsplash.com/photo-1617897154700-1be9b20e7e18?q=80&w=400&auto=format&fit=crop', link: '/productos?categoria=spf' },
  { name: 'Eye Care', image: 'https://images.unsplash.com/photo-1612817288484-2269c97f2240?q=80&w=400&auto=format&fit=crop', link: '/productos?categoria=eye-care' },
  { name: 'Lip Care', image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=400&auto=format&fit=crop', link: '/productos?categoria=lip-care' },
];

const TESTIMONIALS = [
  {
    quote: "The Overnight Recovery Sleeping Mask is unreal. I put it on as my last step and by morning my skin is soft, bouncy, and so hydrated. My boyfriend actually asked if I changed my routine. Yes, I did — and I'm not going back.",
    author: 'Sophia K.',
    rating: 5,
  },
  {
    quote: "The Hyaluronic Glass Toner is genuinely the missing layer in my routine — I wake up plump and glowy now. Worth every penny.",
    author: 'Jasmine L.',
    rating: 5,
  },
  {
    quote: "I've tried so many K-beauty brands, but this one actually delivers. The Glow Serum transformed my dull skin in just two weeks. Absolutely obsessed.",
    author: 'Mia R.',
    rating: 5,
  },
];

const FAQ_ITEMS = [
  {
    q: 'How do I build a K-beauty routine if I\'m just starting out?',
    a: 'Start with the basics: cleanser, toner, moisturizer, and SPF. Once your skin adjusts, add serums and treatments. We recommend our starter kits for beginners.',
  },
  {
    q: 'Are your products suitable for sensitive skin?',
    a: 'Yes! All our formulations are dermatologist-tested and free from harsh chemicals. We use gentle, effective ingredients sourced from trusted Korean labs.',
  },
  {
    q: 'What\'s your return policy?',
    a: 'We offer a 30-day satisfaction guarantee. If you\'re not happy with your purchase, return it for a full refund — no questions asked.',
  },
  {
    q: 'How long does shipping take?',
    a: 'Standard shipping takes 3-5 business days. Express options are available at checkout for 1-2 day delivery.',
  },
  {
    q: 'Do you test on animals?',
    a: 'Never. All our products are cruelty-free and Leaping Bunny certified. We believe beauty should be kind.',
  },
  {
    q: 'Can I layer multiple serums?',
    a: 'Absolutely! Layer from thinnest to thickest consistency. Wait 30 seconds between each layer for best absorption.',
  },
];

const MARQUEE_ITEMS = [
  'K-Beauty Essentials', '✦', 'Seoul Formulated', '✦', 'Cruelty Free', '✦',
  'Clean Beauty', '✦', 'Dermatologist Tested', '✦', 'Free Shipping $50+', '✦',
  'K-Beauty Essentials', '✦', 'Seoul Formulated', '✦', 'Cruelty Free', '✦',
  'Clean Beauty', '✦', 'Dermatologist Tested', '✦', 'Free Shipping $50+', '✦',
];

const FOOTER_LINKS = {
  shop: [
    { name: 'All Products', href: '/productos' },
    { name: 'Skincare', href: '/productos?categoria=skincare' },
    { name: 'Makeup', href: '/productos?categoria=maquillaje' },
    { name: 'New Arrivals', href: '/productos?tag=new' },
  ],
  help: [
    { name: 'Contact Us', href: '/contacto' },
    { name: 'Shipping & Returns', href: '/envios' },
    { name: 'FAQ', href: '#faq' },
    { name: 'My Account', href: '/cuenta' },
  ],
  about: [
    { name: 'Our Story', href: '/about' },
    { name: 'Ingredients', href: '/ingredientes' },
    { name: 'Sustainability', href: '/sostenibilidad' },
  ],
};

/* ── Component ── */
export default function HomePage5() {
  const { addItem } = useCart();
  const { settings: apertura } = useAperturaPromotion();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [testimIdx, setTestimIdx] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const splitRef = useRef<HTMLElement>(null);
  const mwtRef = useRef<HTMLElement>(null);

  /* GSAP scroll animations: morph clip-path + parallax + fade-in */
  useEffect(() => {
    let ctx: any;
    loadGSAP().then(() => {
      if (!gsapPkg || !scrollTriggerPkg) return;
      const gsap = gsapPkg;
      const ScrollTrigger = scrollTriggerPkg;

      ctx = gsap.context(() => {
        /* ── Split Hero: morph clip-path from rect → scoop-right on scroll ── */
        const splitPath = document.querySelector('#clip-split-hero-scoop path');
        if (splitPath && splitRef.current) {
          // Start as rectangle
          const rectD = 'M1 0 L1 1 L0 1 L0 0 Z';
          const scoopD = 'M0.78 0 C0.88 0.1286 0.88 0.2571 0.78 0.3714 C0.68 0.4857 0.68 0.6143 0.78 0.7429 C0.88 0.8714 0.88 0.9286 0.78 1 L0 1 L0 0 Z';
          splitPath.setAttribute('d', rectD);

          gsap.fromTo(splitPath, { attr: { d: rectD } }, {
            attr: { d: scoopD },
            ease: 'power2.inOut',
            scrollTrigger: {
              trigger: splitRef.current,
              start: 'top 80%',
              end: 'center center',
              scrub: 1,
            },
          });

          // Parallax: content slides up
          const splitContent = splitRef.current.querySelector('.tpl5-split-content');
          if (splitContent) {
            gsap.from(splitContent, {
              y: 60,
              opacity: 0,
              duration: 1,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: splitRef.current,
                start: 'top 75%',
                toggleActions: 'play none none reverse',
              },
            });
          }
        }

        /* ── Media with Text: morph clip-path with sunburst mask ── */
        const mwtPath = document.querySelector('#clip-mwt-sunburst path');
        if (mwtPath && mwtRef.current) {
          const circleD = 'M0.5 0 C0.776 0 1 0.224 1 0.5 C1 0.776 0.776 1 0.5 1 C0.224 1 0 0.776 0 0.5 C0 0.224 0.224 0 0.5 0 Z';
          const sunburstD = 'M0.499 0 L0.451 0.041 L0.394 0.011 L0.356 0.06 L0.296 0.043 L0.268 0.103 L0.205 0.096 L0.189 0.156 L0.126 0.166 L0.124 0.229 L0.065 0.25 L0.076 0.314 L0.021 0.349 L0.045 0.407 L0 0.45 L0.035 0.498 L0 0.548 L0.045 0.591 L0.021 0.651 L0.076 0.688 L0.065 0.752 L0.124 0.774 L0.127 0.835 L0.189 0.843 L0.205 0.904 L0.268 0.899 L0.296 0.96 L0.356 0.942 L0.394 0.992 L0.451 0.962 L0.5 1 L0.548 0.962 L0.605 0.992 L0.644 0.942 L0.704 0.96 L0.732 0.899 L0.794 0.904 L0.811 0.843 L0.873 0.833 L0.875 0.774 L0.935 0.752 L0.923 0.688 L0.978 0.655 L0.954 0.591 L1 0.548 L0.963 0.498 L1 0.45 L0.954 0.407 L0.978 0.349 L0.923 0.314 L0.935 0.25 L0.875 0.229 L0.872 0.165 L0.811 0.156 L0.794 0.096 L0.732 0.103 L0.704 0.043 L0.644 0.06 L0.605 0.011 L0.548 0.041 Z';
          mwtPath.setAttribute('d', circleD);

          gsap.fromTo(mwtPath, { attr: { d: circleD } }, {
            attr: { d: sunburstD },
            ease: 'power2.inOut',
            scrollTrigger: {
              trigger: mwtRef.current,
              start: 'top 80%',
              end: 'center center',
              scrub: 1,
            },
          });
        }

        /* ── Fade-in on scroll for all .tpl5-anim elements ── */
        gsap.utils.toArray('.tpl5-anim').forEach((el: any) => {
          gsap.from(el, {
            y: 30,
            opacity: 0,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          });
        });
      });
    });
    return () => { if (ctx) ctx.revert(); };
  }, []);

  /* Fetch products */
  useEffect(() => {
    (async () => {
      try {
        const { databases } = getServices();
        const { databaseId } = getAppwriteConfig();
        const res = await databases.listDocuments(databaseId, PRODUCTS_COLLECTION, []);
        setProducts(res.documents as unknown as Product[]);
      } catch (e) {
        console.warn('Failed to fetch products:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* Auto-advance slideshow */
  useEffect(() => {
    const t = setInterval(() => setActiveSlide(i => (i + 1) % SLIDES.length), 7000);
    return () => clearInterval(t);
  }, []);

  const handleAddToCart = useCallback((p: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(p, 1);
    window.dispatchEvent(new CustomEvent('yaxsel:open-navbar-cart'));
  }, [addItem]);

  const featured = products.slice(0, 8);
  const moreProducts = products.slice(8, 16);

  return (
    <>
      <style>{`
        .tpl5 * { box-sizing: border-box; }
        .tpl5 { color: ${DARK}; font-family: ${FF}; background: ${CREAM}; }
        
        /* ── Slideshow Hero ── */
        .tpl5-hero { position: relative; height: min(55vw, calc(100vh - 120px)); min-height: 500px; overflow: hidden; background: #111; }
        @media(max-width:768px) { .tpl5-hero { height: max(120vw, 400px); min-height: 400px; } }
        .tpl5-slide { position: absolute; inset: 0; opacity: 0; transition: opacity 1.2s ease-in-out; }
        .tpl5-slide.active { opacity: 1; }
        .tpl5-slide-bg { position: absolute; inset: 0; background-size: cover; background-position: center; }
        .tpl5-slide-overlay { position: absolute; inset: 0; background: linear-gradient(to right, rgba(0,0,0,0.55) 30%, rgba(0,0,0,0.15)); z-index: 1; }
        .tpl5-slide-content { position: relative; z-index: 2; height: 100%; display: flex; align-items: center; max-width: 1400px; margin: 0 auto; padding: 0 5%; }
        .tpl5-hero-title { font-size: clamp(3rem, 8vw, 7rem); font-weight: 800; line-height: 1; color: #fff; text-shadow: 0 4px 20px rgba(0,0,0,0.3); margin-bottom: 16px; }
        .tpl5-hero-highlight { color: ${YELLOW}; }
        .tpl5-hero-sub { font-size: clamp(1rem, 1.8vw, 1.4rem); color: #fff; opacity: .92; font-weight: 450; max-width: 520px; text-shadow: 0 2px 10px rgba(0,0,0,0.3); margin-bottom: 28px; line-height: 1.5; }
        .tpl5-hero-btn { display: inline-flex; align-items: center; gap: 8px; padding: 14px 32px; background: ${ACCENT}; color: #fff; border: none; border-radius: 50px; font-weight: 700; font-size: 15px; cursor: pointer; text-decoration: none; transition: all .25s; }
        .tpl5-hero-btn:hover { background: #9a4e60; transform: translateY(-2px); box-shadow: 0 8px 25px rgba(180,97,116,.35); }
        .tpl5-pagination { position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); z-index: 10; display: flex; gap: 8px; }
        .tpl5-dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,.4); cursor: pointer; transition: all .3s; border: none; }
        .tpl5-dot.active { background: #fff; transform: scale(1.3); }

        /* ── Section Titles ── */
        .tpl5-sec-title { font-size: clamp(1.6rem, 3vw, 2.2rem); font-weight: 700; text-align: center; margin-bottom: 8px; color: ${DARK}; }
        .tpl5-sec-sub { font-size: clamp(.9rem, 1.2vw, 1.1rem); text-align: center; color: #6b5e5c; max-width: 600px; margin: 0 auto 40px; line-height: 1.6; }

        /* ── Categories Slider ── */
        .tpl5-cats { padding: 50px 0 20px; overflow: hidden; }
        .tpl5-cats-track { display: flex; gap: 0; overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding: 0 5%; }
        .tpl5-cats-track::-webkit-scrollbar { display: none; }
        .tpl5-cat-card { flex: 0 0 calc(100%/8); min-width: 120px; scroll-snap-align: start; text-align: center; padding: 10px; text-decoration: none; color: ${DARK}; transition: transform .3s; }
        @media(max-width:768px) { .tpl5-cat-card { flex: 0 0 calc(100%/3); min-width: 100px; } }
        .tpl5-cat-card:hover { transform: scale(1.05); }
        .tpl5-cat-img { width: 100%; aspect-ratio: 1; border-radius: 50%; object-fit: cover; border: 3px solid transparent; transition: border-color .3s; }
        .tpl5-cat-card:hover .tpl5-cat-img { border-color: ${ACCENT}; }
        .tpl5-cat-name { margin-top: 10px; font-weight: 600; font-size: 13px; letter-spacing: .02em; }

        /* ── Multimedia Collage ── */
        .tpl5-collage { padding: 50px 5%; }
        .tpl5-collage-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        @media(max-width:768px) { .tpl5-collage-grid { grid-template-columns: 1fr; } }
        .tpl5-collage-item { position: relative; overflow: hidden; border-radius: 16px; aspect-ratio: 4/5; }
        .tpl5-collage-item.wide { grid-column: span 2; aspect-ratio: 8/5; }
        @media(max-width:768px) { .tpl5-collage-item.wide { grid-column: span 1; aspect-ratio: 4/3; } }
        .tpl5-collage-item img { width: 100%; height: 100%; object-fit: cover; transition: transform .6s ease; }
        .tpl5-collage-item:hover img { transform: scale(1.06); }
        .tpl5-collage-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,.5) 0%, transparent 50%); display: flex; flex-direction: column; justify-content: flex-end; padding: 24px; color: #fff; }
        .tpl5-collage-title { font-size: clamp(1.2rem, 2vw, 1.6rem); font-weight: 700; margin-bottom: 4px; }
        .tpl5-collage-desc { font-size: 14px; opacity: .85; }

        /* ── Featured Collection ── */
        .tpl5-products { padding: 60px 5%; }
        .tpl5-products-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        @media(max-width:1024px) { .tpl5-products-grid { grid-template-columns: repeat(3, 1fr); } }
        @media(max-width:768px) { .tpl5-products-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; } }
        .tpl5-product-card { background: #fff; border-radius: 16px; overflow: hidden; transition: all .3s; border: 1px solid #f3e8ea; position: relative; }
        .tpl5-product-card:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(180,97,116,.12); }
        .tpl5-product-img { position: relative; aspect-ratio: 3/4; overflow: hidden; background: #fdf2f8; }
        .tpl5-product-img img { width: 100%; height: 100%; object-fit: cover; transition: transform .4s; }
        .tpl5-product-card:hover .tpl5-product-img img { transform: scale(1.05); }
        .tpl5-product-add { position: absolute; bottom: 12px; right: 12px; width: 40px; height: 40px; border-radius: 50%; background: ${ACCENT}; color: #fff; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transform: translateY(8px); transition: all .3s; box-shadow: 0 4px 12px rgba(180,97,116,.3); }
        .tpl5-product-card:hover .tpl5-product-add { opacity: 1; transform: translateY(0); }
        .tpl5-product-info { padding: 14px 16px; }
        .tpl5-product-name { font-weight: 600; font-size: 14px; margin-bottom: 4px; color: ${DARK}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tpl5-product-price { font-weight: 700; font-size: 15px; color: ${ACCENT}; }

        /* ── Split Hero ── */
        .tpl5-split { display: flex; min-height: 100vh; overflow: hidden; }
        @media(max-width:768px) { .tpl5-split { flex-direction: column; min-height: auto; } }
        .tpl5-split-media { flex: 1; position: relative; overflow: hidden; }
        .tpl5-split-media img { width: 100%; height: 100%; object-fit: cover; }
        .tpl5-split-content { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 60px; background: ${CREAM}; }
        @media(max-width:768px) { .tpl5-split-content { padding: 40px 24px; } }
        .tpl5-split-title { font-size: clamp(2rem, 4vw, 3rem); font-weight: 800; margin-bottom: 16px; color: ${DARK}; text-align: center; }
        .tpl5-split-text { font-size: clamp(1rem, 1.3vw, 1.15rem); color: #6b5e5c; text-align: center; max-width: 480px; line-height: 1.7; margin-bottom: 24px; }
        .tpl5-split-btn { display: inline-flex; align-items: center; gap: 8px; padding: 14px 32px; background: transparent; color: ${DARK}; border: 2px solid ${DARK}; border-radius: 50px; font-weight: 700; font-size: 14px; cursor: pointer; text-decoration: none; transition: all .25s; }
        .tpl5-split-btn:hover { background: ${DARK}; color: #fff; }

        /* ── Media with Text ── */
        .tpl5-mwt { display: flex; align-items: center; padding: 0; overflow: hidden; }
        @media(max-width:768px) { .tpl5-mwt { flex-direction: column; } }
        .tpl5-mwt-media { flex: 1; position: relative; overflow: hidden; }
        .tpl5-mwt-media img { width: 100%; height: 100%; object-fit: cover; min-height: 400px; }
        .tpl5-mwt-content { flex: 1; padding: 60px; }
        @media(max-width:768px) { .tpl5-mwt-content { padding: 40px 24px; } }

        /* ── Testimonials ── */
        .tpl5-testimonials { padding: 60px 5%; background: #fff; }
        .tpl5-testim-track { display: flex; gap: 20px; overflow: hidden; }
        .tpl5-testim-card { flex: 0 0 calc(50% - 10px); padding: 40px; background: ${CREAM}; border-radius: 20px; position: relative; }
        @media(max-width:768px) { .tpl5-testim-card { flex: 0 0 100%; } }
        .tpl5-testim-quote { font-size: 16px; font-style: italic; line-height: 1.7; color: ${DARK}; margin-bottom: 16px; }
        .tpl5-testim-author { font-weight: 700; font-size: 14px; color: ${ACCENT}; }
        .tpl5-testim-stars { display: flex; gap: 2px; margin-bottom: 12px; }

        /* ── Marquee ── */
        .tpl5-marquee { padding: 40px 0; overflow: hidden; background: ${DARK}; color: #fff; }
        .tpl5-marquee-track { display: flex; gap: 50px; animation: tpl5scroll 20s linear infinite; white-space: nowrap; }
        .tpl5-marquee-item { font-size: clamp(1.5rem, 3vw, 2.5rem); font-weight: 800; letter-spacing: .02em; flex-shrink: 0; }
        @keyframes tpl5scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

        /* ── FAQ ── */
        .tpl5-faq { padding: 80px 5%; }
        .tpl5-faq-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; max-width: 1200px; margin: 0 auto; }
        @media(max-width:768px) { .tpl5-faq-grid { grid-template-columns: 1fr; } }
        .tpl5-faq-item { background: #fff; border-radius: 14px; border: 1px solid #f3e8ea; padding: 20px; cursor: pointer; transition: all .3s; }
        .tpl5-faq-item:hover { border-color: ${ACCENT}; }
        .tpl5-faq-q { font-weight: 700; font-size: 14px; color: ${DARK}; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
        .tpl5-faq-a { font-size: 14px; color: #6b5e5c; line-height: 1.6; margin-top: 12px; padding-top: 12px; border-top: 1px solid #f3e8ea; }

        /* ── Footer ── */
        .tpl5-footer { background: ${DARK}; color: #e8d5d0; padding: 60px 5% 30px; }
        .tpl5-footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 40px; }
        @media(max-width:768px) { .tpl5-footer-grid { grid-template-columns: 1fr 1fr; } }
        .tpl5-footer-title { font-weight: 700; font-size: 14px; color: #fff; margin-bottom: 16px; text-transform: uppercase; letter-spacing: .06em; }
        .tpl5-footer-link { display: block; color: #c4a8a3; font-size: 14px; margin-bottom: 8px; text-decoration: none; transition: color .2s; }
        .tpl5-footer-link:hover { color: ${ACCENT}; }
        .tpl5-footer-bottom { border-top: 1px solid rgba(255,255,255,.1); padding-top: 20px; display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: #9a8580; flex-wrap: wrap; gap: 12px; }

        /* ── Utility ── */
        .tpl5-container { max-width: 1400px; margin: 0 auto; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .tpl5-anim { } /* GSAP controls animation */
      `}</style>

      <div className="tpl5">

        {/* ═══════════════════════════════════
            1. SLIDESHOW HERO
        ═══════════════════════════════════ */}
        <section className="tpl5-hero">
          {SLIDES.map((s, i) => (
            <div key={i} className={`tpl5-slide ${i === activeSlide ? 'active' : ''}`}>
              <div className="tpl5-slide-bg" style={{
                backgroundImage: `url(${FALLBACK_IMG})`,
              }} />
              <div className="tpl5-slide-overlay" style={{
                ...(s.align === 'right' ? { background: 'linear-gradient(to left, rgba(0,0,0,0.55) 30%, rgba(0,0,0,0.15))' } : {}),
              }} />
              <div className="tpl5-slide-content" style={{
                ...(s.align === 'right' ? { justifyContent: 'flex-end', textAlign: 'right' } : {}),
              }}>
                <div>
                  <h1 className="tpl5-hero-title">
                    {s.title.split(s.highlight)[0]}<span className="tpl5-hero-highlight">{s.highlight}</span>{s.title.split(s.highlight)[1]}
                  </h1>
                  <p className="tpl5-hero-sub" style={{ ...(s.align === 'right' ? { marginLeft: 'auto' } : {}) }}>{s.subtitle}</p>
                  <Link href="/productos" className="tpl5-hero-btn">
                    Ver Colección <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
          <div className="tpl5-pagination">
            {SLIDES.map((_, i) => (
              <button key={i} className={`tpl5-dot ${i === activeSlide ? 'active' : ''}`}
                onClick={() => setActiveSlide(i)} />
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════
            2. COLLECTION LIST SLIDER (Categories)
        ═══════════════════════════════════ */}
        <section className="tpl5-cats">
          <div className="tpl5-container">
            <h2 className="tpl5-sec-title tpl5-anim">Shop by Category</h2>
            <p className="tpl5-sec-sub tpl5-anim">Find your perfect routine — from gentle cleansers to powerful serums.</p>
          </div>
          <div className="tpl5-cats-track">
            {CATEGORIES.map((c, i) => (
              <Link key={i} href={c.link} className="tpl5-cat-card">
                <img src={c.image} alt={c.name} className="tpl5-cat-img" loading="lazy" />
                <div className="tpl5-cat-name">{c.name}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════
            3. MULTIMEDIA COLLAGE
        ═══════════════════════════════════ */}
        <section className="tpl5-collage">
          <h2 className="tpl5-sec-title tpl5-anim">The Edit</h2>
          <p className="tpl5-sec-sub tpl5-anim">Curated moments of beauty — from morning rituals to evening repair.</p>
          <div className="tpl5-collage-grid">
            <div className="tpl5-collage-item wide">
              <img src="https://images.unsplash.com/photo-1596755094514-fc8036281e7e?q=80&w=900&auto=format&fit=crop" alt="Skincare routine" loading="lazy" />
              <div className="tpl5-collage-overlay">
                <div className="tpl5-collage-title">Morning Glow</div>
                <div className="tpl5-collage-desc">Start fresh with our AM essentials</div>
              </div>
            </div>
            <div className="tpl5-collage-item">
              <img src="https://images.unsplash.com/photo-1617897154700-1be9b20e7e18?q=80&w=500&auto=format&fit=crop" alt="SPF protection" loading="lazy" />
              <div className="tpl5-collage-overlay">
                <div className="tpl5-collage-title">SPF Daily</div>
                <div className="tpl5-collage-desc">Shield & glow</div>
              </div>
            </div>
            <div className="tpl5-collage-item">
              <img src="https://images.unsplash.com/photo-1570194065650-d99fb4b38b17?q=80&w=500&auto=format&fit=crop" alt="Moisturizers" loading="lazy" />
              <div className="tpl5-collage-overlay">
                <div className="tpl5-collage-title">Deep Hydration</div>
                <div className="tpl5-collage-desc">Lock in moisture</div>
              </div>
            </div>
            <div className="tpl5-collage-item wide">
              <img src="https://images.unsplash.com/photo-1620916567418-af62211ba726?q=80&w=900&auto=format&fit=crop" alt="Serums" loading="lazy" />
              <div className="tpl5-collage-overlay">
                <div className="tpl5-collage-title">Serum Layering</div>
                <div className="tpl5-collage-desc">The art of K-beauty layering</div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════
            4. FEATURED COLLECTION
        ═══════════════════════════════════ */}
        <section className="tpl5-products">
          <h2 className="tpl5-sec-title tpl5-anim">Best Sellers</h2>
          <p className="tpl5-sec-sub tpl5-anim">Customer favorites that deliver real results — tried, tested, and loved.</p>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ background: '#fdf2f8', borderRadius: 16, aspectRatio: '3/5', animation: 'fadeInUp .6s ease both', animationDelay: `${i * .1}s` }} />
              ))}
            </div>
          ) : (
            <div className="tpl5-products-grid">
              {featured.map((p, i) => {
                const pricing = resolveProductDisplayPrice(p, apertura);
                const img = resolveStorageImageUrl(p.IMAGEURL || '');
                return (
                  <Link href={`/producto/${p.$id}`} key={p.$id} className="tpl5-product-card" style={{ animationDelay: `${i * .08}s` }}>
                    <div className="tpl5-product-img">
                      <img src={img || FALLBACK_IMG} alt={p.NAME} loading="lazy" />
                      <button className="tpl5-product-add" onClick={(e) => handleAddToCart(p, e)}>
                        <Plus size={18} />
                      </button>
                    </div>
                    <div className="tpl5-product-info">
                      <div className="tpl5-product-name">{p.NAME}</div>
                      <div className="tpl5-product-price">{formatPrice(pricing.displayPrice)}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link href="/productos" className="tpl5-split-btn">
              Ver todos los productos <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* ═══════════════════════════════════
            5. SPLIT HERO (with SVG scoop-right mask)
        ═══════════════════════════════════ */}
        {/* SVG clipPath definition — scoop-right mask from original index.html */}
        <svg style={{ position: 'fixed', top: 0, left: 0, width: 1, height: 1, pointerEvents: 'none', opacity: 0.001, overflow: 'hidden' }}>
          <defs>
            <clipPath id="clip-split-hero-scoop" clipPathUnits="objectBoundingBox">
              <path fillRule="evenodd" clipRule="evenodd" d="M0.78 0 C0.88 0.1286 0.88 0.2571 0.78 0.3714 C0.68 0.4857 0.68 0.6143 0.78 0.7429 C0.88 0.8714 0.88 0.9286 0.78 1 L0 1 L0 0 Z" />
            </clipPath>
            <clipPath id="clip-mwt-sunburst" clipPathUnits="objectBoundingBox">
              <path fillRule="evenodd" clipRule="evenodd" d="M0.5 0 C0.776 0 1 0.224 1 0.5 C1 0.776 0.776 1 0.5 1 C0.224 1 0 0.776 0 0.5 C0 0.224 0.224 0 0.5 0 Z" />
            </clipPath>
          </defs>
        </svg>
        <section className="tpl5-split" ref={splitRef}>
          <div className="tpl5-split-media" style={{ clipPath: 'url(#clip-split-hero-scoop)' }}>
            <img src="https://images.unsplash.com/photo-1556228524-1e76c5f8b6c0?q=80&w=800&auto=format&fit=crop" alt="In Focus" loading="lazy" />
          </div>
          <div className="tpl5-split-content">
            <h2 className="tpl5-split-title">In Focus: Hanwool</h2>
            <p className="tpl5-split-text">
              <em>Quiet formulations for skin that speaks for itself.</em>
              <br /><br />
              Discover Hanwool — Korean skincare made to layer, soothe, and nourish your daily ritual.
            </p>
            <Link href="/productos?tag=hanwool" className="tpl5-split-btn">
              Explorar Colección <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* ═══════════════════════════════════
            6. MEDIA WITH TEXT
        ═══════════════════════════════════ */}
        <section className="tpl5-mwt" ref={mwtRef}>
          <div className="tpl5-mwt-content" style={{ background: '#f5ebe4' }}>
            <h2 className="tpl5-split-title tpl5-anim" style={{ textAlign: 'left' }}>Crafted for Every Glow.</h2>
            <p className="tpl5-split-text tpl5-anim" style={{ textAlign: 'left', marginLeft: 0 }}>
              Our formulations blend time-honored Korean botanicals with modern dermatological science. Each product is designed to work in harmony — layer by layer, step by step.
            </p>
            <div style={{ display: 'flex', gap: 24, marginTop: 20, flexWrap: 'wrap' }}>
              {[
                { icon: <Leaf size={20} color={ACCENT} />, label: 'Natural Ingredients' },
                { icon: <Droplets size={20} color={ACCENT} />, label: 'Deep Hydration' },
                { icon: <Sun size={20} color={ACCENT} />, label: 'SPF Protection' },
              ].map((f, i) => (
                <div key={i} className="tpl5-anim" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: DARK }}>
                  {f.icon} {f.label}
                </div>
              ))}
            </div>
          </div>
          <div className="tpl5-mwt-media" style={{ clipPath: 'url(#clip-mwt-sunburst)' }}>
            <img src="https://images.unsplash.com/photo-1598440947671-68966991a8b0?q=80&w=800&auto=format&fit=crop" alt="Ingredients" loading="lazy" />
          </div>
        </section>

        {/* ═══════════════════════════════════
            7. MORE PRODUCTS (Product Columns)
        ═══════════════════════════════════ */}
        {moreProducts.length > 0 && (
          <section className="tpl5-products" style={{ background: '#fff' }}>
            <h2 className="tpl5-sec-title tpl5-anim">You Might Also Love</h2>
            <p className="tpl5-sec-sub tpl5-anim">Hand-picked recommendations based on what our community can't stop buying.</p>
            <div className="tpl5-products-grid">
              {moreProducts.map((p, i) => {
                const pricing = resolveProductDisplayPrice(p, apertura);
                const img = resolveStorageImageUrl(p.IMAGEURL || '');
                return (
                  <Link href={`/producto/${p.$id}`} key={p.$id} className="tpl5-product-card">
                    <div className="tpl5-product-img">
                      <img src={img || FALLBACK_IMG} alt={p.NAME} loading="lazy" />
                      <button className="tpl5-product-add" onClick={(e) => handleAddToCart(p, e)}>
                        <Plus size={18} />
                      </button>
                    </div>
                    <div className="tpl5-product-info">
                      <div className="tpl5-product-name">{p.NAME}</div>
                      <div className="tpl5-product-price">{formatPrice(pricing.displayPrice)}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════
            8. MARQUEE
        ═══════════════════════════════════ */}
        <section className="tpl5-marquee">
          <div className="tpl5-marquee-track">
            {MARQUEE_ITEMS.map((item, i) => (
              <span key={i} className="tpl5-marquee-item" style={{ color: item === '✦' ? YELLOW : 'inherit' }}>{item}</span>
            ))}
            {MARQUEE_ITEMS.map((item, i) => (
              <span key={`d-${i}`} className="tpl5-marquee-item" style={{ color: item === '✦' ? YELLOW : 'inherit' }}>{item}</span>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════
            9. TESTIMONIALS
        ═══════════════════════════════════ */}
        <section className="tpl5-testimonials">
          <h2 className="tpl5-sec-title tpl5-anim">Real Routines, Real Results</h2>
          <p className="tpl5-sec-sub tpl5-anim">Honest words from customers who discovered new favorites, built better routines, and found products their skin truly enjoys.</p>
          <div className="tpl5-testim-track" style={{ transform: `translateX(-${testimIdx * (window.innerWidth < 768 ? 100 : 50)}%)`, transition: 'transform .5s ease' }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="tpl5-testim-card">
                <div className="tpl5-testim-stars">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} size={18} fill="#ecbd7c" color="#ecbd7c" />
                  ))}
                </div>
                <div className="tpl5-testim-quote">"{t.quote}"</div>
                <div className="tpl5-testim-author">— {t.author}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
            {TESTIMONIALS.map((_, i) => (
              <button key={i} onClick={() => setTestimIdx(i)}
                style={{ width: 10, height: 10, borderRadius: '50%', border: 'none', cursor: 'pointer',
                  background: i === testimIdx ? ACCENT : '#e8d5d0', transition: 'all .3s' }} />
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════
            10. FAQ
        ═══════════════════════════════════ */}
        <section className="tpl5-faq" id="faq">
          <h2 className="tpl5-sec-title tpl5-anim">Questions? We've Got Answers</h2>
          <p className="tpl5-sec-sub tpl5-anim">Everything you need to know about our products, shipping, and skincare routines.</p>
          <div className="tpl5-faq-grid">
            {FAQ_ITEMS.map((f, i) => (
              <div key={i} className="tpl5-faq-item" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div className="tpl5-faq-q">
                  {f.q}
                  <ChevronDown size={18} style={{ transition: 'transform .3s', transform: openFaq === i ? 'rotate(180deg)' : 'none', flexShrink: 0 }} />
                </div>
                {openFaq === i && <div className="tpl5-faq-a">{f.a}</div>}
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════
            11. FOOTER
        ═══════════════════════════════════ */}
        <footer className="tpl5-footer">
          <div className="tpl5-footer-grid">
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 12 }}>YESBELLA</div>
              <p style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 320, color: '#c4a8a3' }}>
                K-beauty formulated in Seoul, sourced direct from trusted makers. Clean, cruelty-free, and made for every glow.
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                {[Instagram, Facebook, Twitter].map((Icon, i) => (
                  <a key={i} href="#" style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c4a8a3', transition: 'all .2s' }}>
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <div className="tpl5-footer-title">Shop</div>
              {FOOTER_LINKS.shop.map((l, i) => <Link key={i} href={l.href} className="tpl5-footer-link">{l.name}</Link>)}
            </div>
            <div>
              <div className="tpl5-footer-title">Help</div>
              {FOOTER_LINKS.help.map((l, i) => <Link key={i} href={l.href} className="tpl5-footer-link">{l.name}</Link>)}
            </div>
            <div>
              <div className="tpl5-footer-title">About</div>
              {FOOTER_LINKS.about.map((l, i) => <Link key={i} href={l.href} className="tpl5-footer-link">{l.name}</Link>)}
            </div>
          </div>
          <div className="tpl5-footer-bottom">
            <span>© {new Date().getFullYear()} YESBELLA. All rights reserved.</span>
            <span style={{ display: 'flex', gap: 16 }}>
              <a href="#" className="tpl5-footer-link" style={{ display: 'inline' }}>Privacy</a>
              <a href="#" className="tpl5-footer-link" style={{ display: 'inline' }}>Terms</a>
            </span>
          </div>
        </footer>
      </div>
    </>
  );
}
