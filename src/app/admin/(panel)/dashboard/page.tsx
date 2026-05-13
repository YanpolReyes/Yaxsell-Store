'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Query } from 'appwrite';
import { getServices, getAppwriteConfig, PRODUCTS_COLLECTION_ID, ORDERS_COLLECTION_ID, WHOLESALE_REQUESTS_COLLECTION_ID, SUPPORT_TICKETS_COLLECTION_ID, NOTIFICATIONS_COLLECTION_ID, USERS_COLLECTION_ID } from '@/lib/appwrite-admin';
import { Order, Product, DashboardStats } from '@/types/admin';
import { Package, ShoppingCart, Clock, DollarSign, TrendingUp, TrendingDown, AlertTriangle, RefreshCw, ArrowRight, Plus, ChevronRight, Users, Megaphone, BarChart3, Zap, Globe, Search, MapPin, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger);

/* ─── SVG Line / Area Chart ─── */
function AreaChart({ data, color = '#6366f1', height = 120 }: { data: number[]; color?: string; height?: number }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = 0;
  const w = 560; const h = height;
  const pad = 4;
  const points = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (w - pad * 2),
    y: h - pad - ((v - min) / (max - min)) * (h - pad * 2),
  }));
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${points[points.length - 1].x.toFixed(1)},${h} L${points[0].x.toFixed(1)},${h} Z`;
  const gradId = `grad-${color.replace('#', '')}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height, display: 'block' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => data[i] > 0 && (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />
      ))}
    </svg>
  );
}

/* ─── Donut chart ─── */
function DonutChart({ segments, size = 100 }: { segments: { value: number; color: string; label: string }[]; size?: number }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0) return <div style={{ width: size, height: size, borderRadius: '50%', background: '#f3f4f6' }} />;
  const r = 34; const cx = 50; const cy = 50;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth="12" />
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dash = pct * circumference;
        const gap = circumference - dash;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={seg.color} strokeWidth="12"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset * circumference}
            strokeLinecap="butt"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dasharray .6s' }}
          />
        );
        offset += pct;
        return el;
      })}
      <text x="50" y="47" textAnchor="middle" style={{ fontSize: 14, fontWeight: 700, fill: '#111827' }}>{total}</text>
      <text x="50" y="61" textAnchor="middle" style={{ fontSize: 8, fill: '#9ca3af' }}>pedidos</text>
    </svg>
  );
}

/* ─── Mini sparkline ─── */
function Sparkline({ data, color = '#6366f1', up }: { data: number[]; color?: string; up?: boolean }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1); const h = 30; const w = 70;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
    </svg>
  );
}

/* ─── KPI Card ─── */
function KpiCard({ label, value, sub, trend, sparkData, color, icon, iconBg }: {
  label: string; value: string | number; sub?: string; trend?: number;
  sparkData?: number[]; color: string; icon: React.ReactNode; iconBg: string;
}) {
  const trendUp = (trend ?? 0) >= 0;
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '18px 20px',
      border: '1px solid #e5e7eb', position: 'relative', overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderRadius: '0 16px 0 80px', background: iconBg, opacity: 0.12 }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
        {sparkData && sparkData.length > 1 && <Sparkline data={sparkData} color={color} />}
      </div>
      <p style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, margin: '0 0 3px' }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0, lineHeight: 1.1 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>{sub}</p>}
      {trend !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 6 }}>
          {trendUp ? <TrendingUp size={13} color="#059669" /> : <TrendingDown size={13} color="#dc2626" />}
          <span style={{ fontSize: 12, fontWeight: 600, color: trendUp ? '#059669' : '#dc2626' }}>
            {trendUp ? '+' : ''}{Math.abs(trend).toFixed(1)}%
          </span>
          <span style={{ fontSize: 11, color: '#d1d5db' }}>vs período ant.</span>
        </div>
      )}
    </div>
  );
}

/* ─── Chile SVG Regions ─── */
const CHILE_REGIONS:{key:string;paths:string[];lx:number;ly:number;roman:string}[] = [
  {key:'Arica y Parinacota',roman:'XV',paths:['M141,24.1L140.2,24.4L139.6,24.5L139.8,24.7L139.1,25.3L138.2,25.5L137.4,26L136.6,26.1L135.6,26.1L134.2,26.3L133.8,26.5L132.9,26L132.1,25.6L130.9,25.2L129.4,25.2L128,25.2L127.7,25.2L126.7,25.3L124.2,25.4L122.3,25.4L120.4,25.7L118.9,26.2L118.2,26.4L117.1,26.9L114.3,27.6L114.6,26.7L114.1,25.9L113.7,25.1L113.6,24.2L113.4,23.4L113,22.7L113.2,21.9L113.3,21.1L113.2,20.2L113.7,18.8L113.8,18.2L113.5,17.6L112.9,16.5L114.5,16.3L119,15.8L121.9,15L124.9,12.3L124,10.7L123.6,9.2L126.7,8.2L130.6,6.2L133.3,9.1L133.7,9.8L134,10.7L134.1,11.8L135,12.2L136.6,12.3L138.1,12.7L138.9,13.2L138,13.7L137.2,14.2L137.5,14.7L138.7,15.3L138.8,16.3L139,17L139,17.7L139.9,18.4L139.4,19.9L140.3,20.9L140.4,21.6L141.5,23.8Z'],lx:128.4,ly:20},
  {key:'Tarapacá',roman:'I',paths:['M117.2,39.9L117.3,37.1L117,34.1L115.5,32.4L115.5,30L114.3,27.8L118.9,26.2L124.1,25.5L127.7,25.2L130.9,25.2L133.7,26.2L135.9,26.3L138.2,25.5L139.6,24.5L141.6,24.6L147.4,28.1L148.6,32.5L146.7,34.4L148.7,38.1L145.9,39.2L146,40.6L145.2,43.3L149.7,45.1L148.9,46.7L149.8,49.3L137.8,54.6L128.9,58.1L127.4,56.8L123.4,55.8L118.8,55.6L118.1,54.4L117.8,52.4L116.8,49.9L115.9,47.7L116,45.4L116.8,43.1L117.4,41.1Z'],lx:126.6,ly:46},
  {key:'Antofagasta',roman:'II',paths:['M149.1,105.5L146.3,106.5L141.5,106.6L139.5,108.3L138.4,111.4L136.4,112.4L131.2,113.1L125.4,113.7L119.5,113.7L116.5,114L113.5,113.8L110.4,114.3L108.7,114.8L107.5,114.8L105.9,111.8L107,108.7L111.1,106.1L110.2,102.7L108.8,98.3L108.9,95L109.6,91.1L109.7,87.7L111.8,84.4L109.7,82L108.2,81.2L108.7,77.9L110,76.6L114,73.8L114.7,69.9L115.3,66.8L116,63L117.1,59.3L118.8,55.6L128,57.3L131.9,56.3L156.4,54L160.5,63.5L161.3,66.3L162.7,69.7L162.5,71.8L180.2,75.7L152,95.4L149.1,98.1L151.5,101.1L151.2,103.3Z'],lx:125.6,ly:80},
  {key:'Atacama',roman:'III',paths:['M149.1,105.5L148.7,108.3L149.8,110.4L151.3,124L153.7,128L150.7,129.2L147.6,130.2L143.8,129.9L142.6,132.2L140.4,134.2L139,136.2L137.6,140L134.7,142L132.1,144.4L128.4,146.1L126.8,147.3L125.9,149.7L125.5,152.7L124.3,155.2L121.1,157.6L119.8,159.9L121,161.6L116.8,161.9L112.4,159.9L110.3,157.9L109.3,155.6L105.4,155.8L101.9,156.6L99.6,159.4L96.6,158.7L93,156.8L89.9,156.8L89.7,154.4L92.7,151.4L94.9,148.2L96.7,145.9L96.3,142.7L98.2,139L101.1,136.9L102.3,134.7L101,131.3L102.9,129.6L104.1,127.7L104.3,125.1L105.7,123.2L106,120.3L106.9,118.3L106.8,115.9L108.7,114.8L110.2,114.4L112.1,113.8L114.3,113.5L116.8,114L121.8,113.4L125.4,113.7L130.6,113.4L135.1,112.9L138,112.1L138.1,111.1L140,107.7L141.5,106.6L145.5,106.7L147.8,105.5Z'],lx:120.2,ly:133.8},
  {key:'Coquimbo',roman:'IV',paths:['M86.8,183.3L86.4,181.2L85.8,178.5L86.1,175.9L86.4,173.6L87.6,171.9L90.8,171.1L92.5,169.9L92,168.3L94.5,167.3L93.2,164.9L93.8,162.8L93.6,160.5L90.7,157.9L92.5,156.9L95.9,157.4L98.3,159.5L100.2,158.5L101.9,156.6L105.7,156L108,155.5L109.2,156.2L110.4,158.8L112.7,159.9L116.6,162L119.1,161.9L121.2,163.6L122.1,165.3L121.9,167.3L120.7,169.7L123.8,170.6L121.8,172.8L118.7,173.9L117.3,174L116.2,176L115,177.7L114.5,179.6L114,182.5L112.7,184.1L110.3,183.8L109.5,185.7L109,187.9L108.7,190.3L110.5,191.8L112.2,194.4L115.8,195.5L113.1,196.7L113.9,198L112.7,199.7L109.9,198.5L106.9,198L105.2,196.4L101.8,197L99.4,197.1L96.2,198.2L93.2,198.9L89.2,198.6L89.6,196.8L89.6,195L89.6,193.4L88.6,190.3L87.6,187.7L86.7,184.6Z'],lx:103.6,ly:177.6},
  {key:'Valparaíso',roman:'V',paths:['M89.2,198.6L91.5,198.7L94.4,198.6L96.7,198.4L99.2,196.6L102.5,197L105.2,196.4L107,197.6L109.4,198.2L111.2,199.9L114.1,200L115.7,201.4L117,202.6L116.8,204.4L117.7,206.9L119.9,208.5L119.6,210.2L116,211.7L114.7,212.5L111.9,211.1L109.6,211.3L108.1,209.4L105.6,209.5L102,209.2L99.6,209.9L99.6,211.7L100.1,212.7L97.8,213.3L95.6,213.8L94,216L93,217.6L92,219.6L92.2,220.6L92.1,221L91.8,221.2L88.9,221.1L85.7,223.6L85.6,223.7L85.1,223.5L84.8,223.2L84.6,223.4L84.3,223.4L84.3,223.2L84.1,223.2L83.8,223L83.5,223.1L83.2,223.2L83.3,223.1L83.4,222.4L86.3,220.5L87.9,217.9L86,216L86.9,214.2L86.2,212.8L86.4,211.6L88.9,210.3L89.8,208.4L90.3,206.8L91.4,205.1L90.6,203.2L91.5,201.2L89.5,199Z'],lx:96.5,ly:207.6},
  {key:'Metropolitana de Santiago',roman:'RM',paths:['M106.8,209.5L108.4,209.8L110.4,211.3L112.5,211.6L114.7,212.5L115.9,211.9L118.7,211.6L118.7,213.1L119.8,214.6L122.8,214.1L124.3,215.7L123.4,216.9L122.4,218.9L122,220.9L122.9,222.8L122.9,223.8L122.9,225.1L122.5,226.3L122.6,228.2L120.3,228.1L118.9,228L117.1,226.9L116.6,225L114.2,225.2L113,223.9L111.2,222.2L108.8,222.7L106.7,223.5L104.6,223.6L104.1,224.3L102,225.5L101.7,226.4L101.5,226.5L97.8,226.7L97.2,226.7L94.6,225.1L92.9,225.3L92.4,225.3L92.2,225.4L91.4,224.8L90.8,224.6L90.6,224.5L88.9,224.3L88.7,224.2L88.5,224.5L88.3,224.8L88,224.6L87.3,224.4L86.8,224.3L86.4,224L86,223.9L85.8,223.7L85.7,223.6L88.9,222.5L90.5,221.3L92,221.1L92.2,221L92,220.3L92,219.6L93.4,217.7L93.1,216L95.9,214.8L96.2,213.3L98.5,213.4L100.1,212.6L99.6,211.7L99.5,210.2L100.9,209.7L104.7,209.2L106.5,209.6Z'],lx:103.3,ly:220.5},
  {key:"Libertador Gral. B. O'Higgins",roman:'VI',paths:['M80,226.8L83.3,223L83.5,223.1L84.1,223.2L84.3,223.4L84.9,223.4L85.6,223.7L85.8,223.9L86.7,224.3L88.1,224.7L88.6,224.2L90.7,224.5L92.2,225.4L93,225.3L97.6,226.7L101.5,226.3L104.1,223.4L109.7,222.7L113.5,225.2L117.7,227.2L118.7,230.9L114.1,235L112.1,238.6L109.2,237.9L108.6,237.9L108.2,238.2L106.7,238.1L106.3,237.7L105,237.1L104.3,236.7L103.1,236.7L102,236.6L101.4,236.7L100.8,236.9L100.5,236.6L100,236.3L99.6,236.1L99.2,235.8L98,236.2L96.6,235.9L95.7,236.3L92.6,237.3L92,237.2L91.7,237.3L91.5,237.2L90.9,237.2L90.2,237.2L89.9,237L88.4,236.8L87.5,236.8L86.4,237.1L86.4,237.2L86.7,237.4L84.8,237L83.1,236.3L81.9,236.1L81.1,235.7L80.9,235.3L80.4,235.1L80,234.8L79.9,234.5L79.3,234.3L79,234.2L79.5,230Z'],lx:94,ly:232.6},
  {key:'Maule',roman:'VII',paths:['M79.3,234.2L79.8,234.4L80.1,234.7L80.1,235L80.8,235.2L81.1,235.5L81.8,236.1L82.6,236.1L84.6,236.7L86.6,237.5L86.4,237.2L86.2,237.2L87.5,236.7L88,237L89.6,236.9L90.1,237.2L90.9,237.2L91.5,237.1L91.7,237.3L92,237.2L92.7,237.4L94.8,236.2L96.6,235.9L97.6,235.8L99.2,235.8L99.5,236.1L99.8,236.2L100.5,236.6L100.6,236.8L101.4,236.7L101.9,236.7L103.1,236.7L103.8,236.6L105,237L106.3,237.6L106.7,238.1L108.1,238.1L108.6,238.1L109.2,237.9L111.8,238.5L110.8,241.6L111.2,244.7L112.5,248.9L112.5,252.2L109.3,255.4L105.8,258.3L102.3,259.7L98,258.7L93.4,261.2L85.2,258L79.8,256.2L77.3,256.6L75.2,256.3L74.5,257.1L72.3,256.4L70,255.4L66.2,253.5L67.7,250.8L70.3,245.1L76.2,239.7L78.9,234.2L79.3,234.2Z'],lx:91.9,ly:242},
  {key:'Ñuble',roman:'XVI',paths:['M73,267.2L73,267.2L70.8,266.9L69,267L66.9,266.4L68.5,266L68.1,265L67.1,263.3L64.5,262.5L64,261.5L63.7,260.4L63.6,260L62.4,260L63,258.5L63.8,255.7L64.4,253.9L66.2,253.5L67.8,254.1L69.6,254.5L70,255.4L72.2,255.9L72.5,256.4L72.3,256.4L71.8,256.3L73.3,256.7L74.5,257.1L74.7,256.9L74.9,256.7L75.2,256.3L76.4,256.6L76.7,256.7L77.3,256.6L78,255.1L78,255.2L79.8,256.2L80.7,257L83.1,256.9L85.2,258L88.6,259.2L91.3,259.9L93.4,261.2L94.7,259.7L96.1,259.4L98,258.7L98.6,259.9L99.2,261.4L99.4,262.9L98.9,263.7L97.8,264L96.6,265.4L97.2,266.5L98.2,267.1L95.9,267.6L97.2,269L96.9,269.7L94.3,269.5L92.1,269L90.4,268.3L89.1,268.9L87.8,270L85,269.7L82.2,270.7L80.2,270.9L77.3,270.7L74.5,270.9L75.7,269.1L74.9,268Z'],lx:80,ly:261.9},
  {key:'Biobío',roman:'VIII',paths:['M54.5,287.4L54,289.3L53.5,290L50.5,290.1L49.4,288.8L50.8,286.2L47.2,279.1L46.4,277.4L48.2,274.9L46.7,272.2L47.9,270.4L51.4,271.6L56.6,269.9L56.4,268.4L56.1,264.8L57.5,262.9L59.8,264.1L60.5,262.1L61.5,260.8L63.6,260L64,260.6L64.7,262.2L67.9,263.9L68.5,266L67.5,266.8L71.9,267L73,267.2L76.4,268.7L75.9,270.8L80.2,270.9L83.1,269.9L88.4,269.9L89.8,268.1L92.9,269.1L96.9,269.7L97.7,271.1L96,273.5L97.5,275.4L96,277.7L96.6,279.7L97.5,281.1L99.1,283.8L98.3,284.3L97.5,284.5L96.4,284.5L94.6,284.5L91.8,284.8L88.4,286.4L85.8,286.9L86,284.3L82.1,284.1L79.5,283L75.1,281.1L71.1,279.7L69.9,277.6L66.9,277.4L62.7,277L59.8,277.4L57.7,278.7L59.2,279.5L57.8,281.5L56.3,283.9L58.5,285.5L54.7,287.2Z'],lx:71.4,ly:275.8},
  {key:'La Araucanía',roman:'IX',paths:['M64.5,276.9L67.2,277.6L69.2,277.9L70.4,278.7L72.3,280.7L75.3,281.3L79,283.2L81.4,283.5L83.7,283.6L85.8,285L86.2,286.7L87.3,287.1L89.4,286L91.8,284.8L94.1,284.6L95.4,284.5L97.4,284.5L97.6,284.5L97.7,284.4L100,286.1L100,287.3L100.3,289.4L102.5,290.7L103.3,292.2L102.3,293.5L99.6,294.4L97,295L94.6,295.5L92.5,296.7L92,298.7L92.1,300.8L92.5,302.4L91.6,303.7L91,305L89.8,306.5L89.9,307.8L87.3,307.1L85,305.8L81.6,304.5L78.2,305.7L74.6,305.9L72.4,305.8L67.6,304.9L64.7,304.7L62.3,304.4L63.3,303L60.9,302.9L58.3,304L55.4,304.1L55.4,302.8L54.3,299.4L50.2,292.9L49.7,290.2L51.7,289.3L53.6,290.2L54.3,289.4L53.5,288L54.7,287.2L57.4,285.7L58.1,284.4L55.9,283.4L57.8,281.5L59.4,280.1L59.2,278.6L57.9,278.1L59.8,277.4L61.4,277.2Z'],lx:76.6,ly:291.6},
  {key:'Los Ríos',roman:'XIV',paths:['M77.7,305.9L79.8,304.9L83.2,305.3L85.6,305.6L86,307.8L86.6,308.5L86.3,310L86.6,311.3L88.2,312.1L87.2,313L86.7,314.6L84.3,314.8L83.5,316.1L84.3,317.6L86.3,318L86.1,319.2L83.8,319.8L82.9,321.3L82.3,322.5L79.5,323.2L77.2,323.7L74.8,323.6L73.3,323.9L72.9,323.7L70.2,323.7L66.6,323.1L64.1,322.5L62.7,321.5L61.8,320.3L59.4,319.4L56.8,319L53.1,318.6L51,318.1L49.9,317.9L46.9,317.9L45.7,316.9L46.9,315.5L45.9,313.5L47.5,312.8L50.2,311.9L52,312.2L52.5,311.8L54.6,312.2L56.7,311.9L55.9,311.8L55,310.5L55.9,309.3L55.6,309.1L54.5,310.2L53.6,311.1L52.2,311.2L52.2,309.8L52.9,308.4L54.4,307.1L55.1,305.7L55.1,304.1L57.3,304.1L59.5,302.7L61.6,302.7L62.8,303.2L62.3,304.4L64.2,304.7L66.5,305L69.7,305.4L74.3,305.6L75.7,306.2Z'],lx:66.4,ly:313},
  {key:'Los Lagos',roman:'X',paths:['M63,336.8L58.8,337.9L56.8,341.5L50.2,341.6L48.5,338.8L49.9,337.6L46.4,338.2L43,333.7L41.1,328.8L44,324.5L45.2,321.2L46.4,317.6L52.3,318.6L60.8,319.8L64.6,322.8L72.9,323.7L76.7,323.7L83.3,322.7L81.8,326.7L82.6,332.1L82.7,335.3L83.3,339.2L84.2,342.8L84.5,346.9L77.9,347.2L77.7,351.2L78,355.1L77.1,358.5L81.3,361.8L84.9,364.7L82.1,367.1L84.5,369.7L86.9,372.3L86.7,375.6L83.4,377L78.8,376.3L77.7,375.3L76.1,374.9L74.9,373.9L74.1,373L73.3,371.9L70.3,373.3L67.8,373.2L64,373L64.2,371.4L62.9,373L61.6,372.4L60.5,372.2L58.2,368.4L62.1,363.5L64.5,361L63.9,358.5L64.9,353.1L68.5,353.4L63.9,349.4L69.8,350L70.6,349.7L72.2,347.4L68,345.4L62.5,343.5L69.8,340.4L74.3,335.4L72.7,339.1L66.7,338.9Z'],lx:68.4,ly:349.9},
  {key:'Aysén',roman:'XI',paths:['M31.4,440.6L32.7,439L36.2,439.1L36.3,437.8L32.4,435.5L36.2,431.3L36.3,429.7L31.3,424.2L21.4,419.5L8.8,424.2L14.7,426.1L9.1,420.9L16.6,417.5L22.5,413.7L19.7,412.7L24.4,408.5L32.4,410.4L37.7,409.1L39.3,411.8L34.9,415.1L41,413.2L45.5,419.1L49.9,413.8L52.5,408.9L49.1,407L59.1,400.9L54.5,398L54.6,395.1L65.7,389.8L67.1,384.8L56.4,380.6L59.1,375L61.6,372.3L64.2,371.4L68.3,373.4L74,372.5L74.4,374.5L77.9,376L83.1,379.1L91.8,383.7L95.1,390.5L79.7,389.9L89.2,393.9L90.2,401.8L86.1,408.5L85.3,416.3L80.9,429.3L75,435.2L70.2,444.8L71.9,452.9L64.2,462.7L38.1,457.9L41.8,455.5L40.6,451.1L27.9,446.3L39.3,445.1L50.3,449.8L55,447.8L52.3,444.9L46.3,439.5L45.3,440.7L30.3,441.1Z'],lx:51.4,ly:415.4},
  {key:'Magallanes',roman:'XII',paths:['M82.5,552.3L71.6,545.1L79.1,544.4L83.6,549.1L94.8,538.9L87.2,530.5L68.7,531L61.3,532.9L61.1,536.9L52.3,539.7L48.6,535.2L53,531.6L46.1,534.1L47.3,527.1L47.9,521.6L59.7,521.1L63.4,522L65,518.6L61.8,528.4L69.7,524.5L70.3,514.8L58.2,508.8L62.8,511.2L63.2,514.7L56.7,513.9L56,517.3L54.6,518.4L49.6,520L48.1,514.4L42.9,511.3L48.1,511.8L44.7,502.3L38.4,500.3L43.5,499.3L44.6,494.1L45.5,491.1L42,496.6L34.3,490.7L38.3,489.3L30.8,488.3L32.7,482.6L35.9,484.6L39.9,481.7L33.5,479.5L34.3,474.7L43.9,475.1L42.5,469.5L36.9,472.9L31.6,464.5L39.1,458.5L50.3,478.6L51.2,488L56.6,496.5L70.9,493.1L73,504.1L74.9,513.6L145.8,524.8L130.8,524.4L112.8,532.1L104,534.5L101,543.8L95.1,556.4Z'],lx:60.1,ly:510.8},
];

function normalizeRegion(raw: string): string {
  if (!raw) return '';
  const r = raw.toLowerCase().trim();
  if (r.includes('arica') || r.includes('parinacota'))                          return 'Arica y Parinacota';
  if (r.includes('tarapac') || r.includes('iquique'))                           return 'Tarapacá';
  if (r.includes('antofagasta') || r.includes('calama'))                        return 'Antofagasta';
  if (r.includes('atacama') || r.includes('copiap'))                            return 'Atacama';
  if (r.includes('coquimbo') || r.includes('la serena') || r.includes('ovalle'))return 'Coquimbo';
  if (r.includes('valpara') || r.includes('viña del mar') || r.includes('viña'))return 'Valparaíso';
  if (r.includes('metropolitana') || r.includes('santiago') || r === 'rm')      return 'Metropolitana de Santiago';
  if (r.includes("o'higgins") || r.includes('ohiggins') || r.includes('libertador') || r.includes('rancagua')) return "Libertador Gral. B. O'Higgins";
  if (r.includes('maule') || r.includes('talca') || r.includes('curic'))        return 'Maule';
  if (r.includes('ñuble') || r.includes('nuble') || r.includes('chillán') || r.includes('chillan')) return 'Ñuble';
  if (r.includes('biob') || r.includes('concepci') || r.includes('coronel'))    return 'Biobío';
  if (r.includes('araucan') || r.includes('temuco'))                            return 'La Araucanía';
  if (r.includes('los ríos') || r.includes('los rios') || r.includes('valdivia'))return 'Los Ríos';
  if (r.includes('los lagos') || r.includes('puerto montt') || r.includes('osorno') || r.includes('chiloe') || r.includes('chiloé')) return 'Los Lagos';
  if (r.includes('ays') || r.includes('coihaique') || r.includes('coyhaique'))  return 'Aysén';
  if (r.includes('magallanes') || r.includes('punta arenas'))                   return 'Magallanes';
  return raw;
}

// Regiones visibles (sin Aysén ni Magallanes que se ven feas al sur)
const VISIBLE_REGIONS = CHILE_REGIONS.filter(r => r.key !== 'Aysén' && r.key !== 'Magallanes');

function ChileMap({ regionCounts }: { regionCounts: Record<string, number> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef(regionCounts);
  dataRef.current = regionCounts;
  const panRef = useRef({ offsetY: 0, dragging: false, startY: 0 });
  const hoverRef = useRef<string | null>(null);
  const liftRef = useRef<Record<string, number>>({});
  const mouseRef = useRef({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const W = 320, H = 640;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = '100%'; canvas.style.height = '100%';
    canvas.style.minHeight = '640px';
    canvas.style.objectFit = 'contain';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const zoom = 1.8;
    const centerX = 95, centerY = 200;
    const rotRad = (-14 * Math.PI) / 180; // -14 degrees left tilt to stand vertically upright
    const cosR = Math.cos(rotRad), sinR = Math.sin(rotRad);

    const tx = (x: number, y: number) => {
      const dx = x - centerX, dy = y - centerY;
      return W / 2 + 15 + (dx * cosR - dy * sinR) * 2.1;
    };
    const ty = (x: number, y: number) => {
      const dx = x - centerX, dy = y - centerY;
      return H / 2 - 30 + (dx * sinR + dy * cosR) * 2.1 + panRef.current.offsetY;
    };

    function parsePath(d: string): [number, number][] {
      const pts: [number, number][] = [];
      const re = /([ML])([\d.\-]+),([\d.\-]+)/g;
      let m;
      while ((m = re.exec(d)) !== null) pts.push([parseFloat(m[2]), parseFloat(m[3])]);
      return pts;
    }
    function drawPath(pts: [number, number][]) {
      ctx!.beginPath();
      pts.forEach(([x, y], i) => i === 0 ? ctx!.moveTo(tx(x, y), ty(x, y)) : ctx!.lineTo(tx(x, y), ty(x, y)));
      ctx!.closePath();
    }

    function pointInPoly(px: number, py: number, pts: [number, number][]): boolean {
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const xi = tx(pts[i][0], pts[i][1]), yi = ty(pts[i][0], pts[i][1]);
        const xj = tx(pts[j][0], pts[j][1]), yj = ty(pts[j][0], pts[j][1]);
        if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside;
      }
      return inside;
    }

    // Rounded rect helper
    function roundRect(x: number, y: number, w: number, h: number, r: number) {
      ctx!.beginPath();
      ctx!.moveTo(x + r, y); ctx!.lineTo(x + w - r, y);
      ctx!.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx!.lineTo(x + w, y + h - r);
      ctx!.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx!.lineTo(x + r, y + h);
      ctx!.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx!.lineTo(x, y + r);
      ctx!.quadraticCurveTo(x, y, x + r, y);
      ctx!.closePath();
    }

    const regionPolys = VISIBLE_REGIONS.map(r => ({
      key: r.key, roman: r.roman, lx: r.lx, ly: r.ly,
      polys: r.paths.map(p => parsePath(p)),
    }));

    let frame = 0, animId: number;
    function draw() {
      frame++;
      const counts = dataRef.current;
      const maxC = Math.max(...Object.values(counts), 1);
      const hov = hoverRef.current;

      // Animate lift values smoothly
      for (const r of VISIBLE_REGIONS) {
        const key = r.key;
        const target = hov === key ? 1 : 0;
        const cur = liftRef.current[key] || 0;
        liftRef.current[key] = cur + (target - cur) * 0.12; // ease factor
      }

      // 1. Unified Background Gradient (Celeste to White)
      const bgG = ctx!.createLinearGradient(0, 0, W, 0);
      bgG.addColorStop(0, '#0ea5e9');      // Celeste vibrante
      bgG.addColorStop(0.55, '#e0f2fe');   // Soft white/cyan blend
      bgG.addColorStop(0.70, '#f9f8f4');   // Argentina Ivory
      bgG.addColorStop(1, '#f9f8f4');
      ctx!.fillStyle = bgG;
      ctx!.fillRect(0, 0, W, H);

      // --- Animated REAL WATER effects (Soft clean shimmers) ---
      ctx!.save();
      ctx!.beginPath(); ctx!.rect(0, 0, W * 0.55, H); ctx!.clip(); 
      const t = frame * 0.003;
      for (let i = 0; i < 5; i++) {
        const cx = W * 0.15 + Math.sin(t + i * 1.3) * W * 0.12;
        const cy = H * (0.15 + i * 0.14) + Math.cos(t * 0.6 + i) * 60;
        const r = 120 + i * 30;
        const g = ctx!.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, `rgba(255, 255, 255, ${0.15 + (i % 3) * 0.05})`);
        g.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx!.fillStyle = g;
        ctx!.fillRect(0, 0, W * 0.6, H);
      }
      ctx!.restore();

      // ═══ 3D RELIEF REGIONS (Vibrant Distinct Hover Colors) ═══
      const palette = [
        '#6366f1', '#ec4899', '#10b981', '#f59e0b', 
        '#8b5cf6', '#ef4444', '#14b8a6', '#eab308', 
        '#a855f7', '#f43f5e', '#06b6d4', '#84cc16', 
        '#d946ef', '#f97316', '#0ea5e9', '#22c55e'
      ];
      const emptyFill = '#cbd5e1';

      // Pass 1: Conditional Drop shadow (animated with lift)
      ctx!.save();
      for (let i = 0; i < regionPolys.length; i++) {
        const reg = regionPolys[i];
        const lift = liftRef.current[reg.key] || 0;
        if (lift < 0.01) continue; // No shadow if barely lifted

        for (const pts of reg.polys) {
          ctx!.beginPath();
          pts.forEach(([rx, ry], idx) => {
            const x = tx(rx, ry) + 8 * lift, y = ty(rx, ry) + 10 * lift;
            idx === 0 ? ctx!.moveTo(x, y) : ctx!.lineTo(x, y);
          });
          ctx!.closePath();
          ctx!.globalAlpha = lift * 0.35;
          ctx!.fillStyle = 'rgba(0, 5, 20, 1)'; ctx!.fill();
        }
      }
      ctx!.restore();

      // Pass 2: Main region fill + 3D categorical bevel
      for (let i = 0; i < regionPolys.length; i++) {
        const reg = regionPolys[i];
        const isHov = hov === reg.key;
        const lift = liftRef.current[reg.key] || 0;
        const off = -lift * 4; // Animated lift offset (0 to -4)
        // Minimalist Pure White base, pop with Grayscale only on hover
        const baseFill = isHov ? palette[i % palette.length] : '#ffffff';

        for (const pts of reg.polys) {
          const bounds = pts.reduce((b, [x, y]) => ({
            minX: Math.min(b.minX, tx(x, y)), maxX: Math.max(b.maxX, tx(x, y)),
            minY: Math.min(b.minY, ty(x, y)), maxY: Math.max(b.maxY, ty(x, y)),
          }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });

          // Main region drawing with lift offset
          ctx!.save();
          ctx!.translate(off, off);

          drawPath(pts);
          ctx!.fillStyle = baseFill;
          ctx!.fill();

          // --- Sparkles/Brillitos Layer (Inside Regions) ---
          ctx!.save(); drawPath(pts); ctx!.clip();
          for (let pi = 0; pi < 15; pi++) {
            const px = ((pi * 79.5) % (bounds.maxX - bounds.minX) + bounds.minX + Math.sin(frame * 0.02 + pi) * 10);
            const py = ((pi * 113.2) % (bounds.maxY - bounds.minY) + bounds.minY + frame * 0.06) % (bounds.maxY - bounds.minY) + bounds.minY;
            const op = 0.05 + Math.sin(frame * 0.04 + pi) * 0.12;
            ctx!.fillStyle = `rgba(167, 139, 250, ${op})`; // Semi-transparent purple sparkle
            ctx!.beginPath(); ctx!.arc(px, py, 0.7, 0, Math.PI * 2); ctx!.fill();
            ctx!.fillStyle = `rgba(255, 255, 255, ${op * 0.6})`; // White core
            ctx!.beginPath(); ctx!.arc(px, py, 0.4, 0, Math.PI * 2); ctx!.fill();
          }
          ctx!.restore();

          // 3D bevel: top-left highlight
          ctx!.save(); drawPath(pts); ctx!.clip();
          const hlG = ctx!.createLinearGradient(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
          hlG.addColorStop(0, isHov ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.28)');
          hlG.addColorStop(0.3, 'rgba(255,255,255,0.08)');
          hlG.addColorStop(0.55, 'rgba(0,0,0,0)');
          hlG.addColorStop(1, isHov ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.22)');
          drawPath(pts); ctx!.fillStyle = hlG; ctx!.fill();
          ctx!.restore();

          // Ridge border (Chrome White/Gray)
          drawPath(pts);
          ctx!.strokeStyle = isHov ? '#ffffff' : 'rgba(0, 0, 0, 0.2)';
          ctx!.lineWidth = isHov ? 2.5 : 1.2;
          ctx!.stroke();

          // Sublte Inner glow edge
          if (!isHov) {
            ctx!.save(); drawPath(pts); ctx!.clip();
            ctx!.beginPath();
            pts.forEach(([x, y], i) => {
              const px = tx(x, y) + 1, py = ty(x, y) + 1;
              i === 0 ? ctx!.moveTo(px, py) : ctx!.lineTo(px, py);
            });
            ctx!.closePath();
            ctx!.strokeStyle = 'rgba(255,255,255,0.08)'; ctx!.lineWidth = 1.5; ctx!.stroke();
            ctx!.restore();
          }
          ctx!.restore(); // End context translation (off, off)
        }

        // Hover: elevated color-coded glow
        if (isHov) {
          ctx!.save(); ctx!.globalAlpha = 0.12;
          for (const pts of reg.polys) {
            drawPath(pts);
            ctx!.shadowColor = baseFill; ctx!.shadowBlur = 15;
            ctx!.fillStyle = baseFill; ctx!.fill();
          }
          ctx!.restore();
        }
      }

      // ═══ REGION LABELS (with pill background) ═══
      for (const reg of regionPolys) {
        const c = counts[reg.key] || 0;
        const isHov = hov === reg.key;
        const t = c / maxC;
        ctx!.save();
        const fontSize = isHov ? 11 : Math.max(7, 7 + t * 2.5);
        ctx!.font = `800 ${fontSize}px system-ui, -apple-system, sans-serif`;
        ctx!.textAlign = 'center'; ctx!.textBaseline = 'middle';
        
        const lx = tx(reg.lx, reg.ly), ly = ty(reg.lx, reg.ly);
        
        // Small pill background behind the label
        const tw = ctx!.measureText(reg.roman).width + 8;
        const th = fontSize + 4;
        ctx!.fillStyle = isHov ? 'rgba(30,41,59,0.7)' : 'rgba(0,0,0,0.25)';
        ctx!.beginPath();
        ctx!.roundRect(lx - tw/2, ly - th/2, tw, th, 3);
        ctx!.fill();
        
        ctx!.fillStyle = '#ffffff';
        ctx!.fillText(reg.roman, lx, ly);
        ctx!.restore();
      }

      // ═══ SANTIAGO PIN (Chrome Gray) ═══
      const sX = tx(85, 240), sY = ty(85, 240);
      const pulseA = 0.08 + Math.sin(frame * 0.03) * 0.04;
      ctx!.save(); ctx!.globalAlpha = pulseA;
      ctx!.beginPath(); ctx!.arc(sX, sY, 12, 0, Math.PI * 2);
      ctx!.fillStyle = '#475569'; ctx!.fill(); ctx!.restore(); // Gray pulse
      // Pin body with shadow
      ctx!.save();
      ctx!.shadowColor = 'rgba(0,0,0,0.2)'; ctx!.shadowBlur = 4; ctx!.shadowOffsetY = 2;
      ctx!.beginPath(); ctx!.arc(sX, sY, 5, 0, Math.PI * 2);
      ctx!.fillStyle = '#334155'; ctx!.fill(); // Slate Gray pin
      ctx!.restore();
      ctx!.beginPath(); ctx!.arc(sX, sY, 2, 0, Math.PI * 2);
      ctx!.fillStyle = '#cbd5e1'; ctx!.fill(); // Silver core
      // Label with dark background pill
      ctx!.save();
      ctx!.font = '700 9px system-ui';
      const stw = ctx!.measureText('Santiago').width + 10;
      ctx!.fillStyle = 'rgba(30,41,59,0.75)';
      ctx!.beginPath();
      ctx!.roundRect(sX + 8, sY - 7, stw, 14, 3);
      ctx!.fill();
      ctx!.fillStyle = '#ffffff';
      ctx!.textAlign = 'left'; ctx!.textBaseline = 'middle';
      ctx!.fillText('Santiago', sX + 13, sY + 1);
      ctx!.restore();

      // ═══ GEOGRAPHIC LABELS ═══
      ctx!.save(); ctx!.textAlign = 'center';
      ctx!.font = 'italic 600 12px Georgia, serif';
      ctx!.fillStyle = 'rgba(255, 255, 255, 0.45)'; // White for the teal ocean
      ctx!.fillText('O C É A N O', W * 0.3, H * 0.38);
      ctx!.fillText('P A C Í F I C O', W * 0.3, H * 0.38 + 16);
      ctx!.font = 'italic 600 10px Georgia, serif';
      ctx!.fillStyle = 'rgba(71, 85, 105, 0.4)';
      ctx!.save(); ctx!.translate(W * 0.85 + 10, H * 0.35); ctx!.rotate(Math.PI / 2);
      ctx!.fillText('A R G E N T I N A', 0, 0); ctx!.restore();
      ctx!.restore();

      // Tooltip is rendered as HTML overlay (see tooltipRef)

      animId = requestAnimationFrame(draw);
    }
    draw();

    // ── HOVER detection ──
    const onHover = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width, scaleY = H / rect.height;
      const mx = (e.clientX - rect.left) * scaleX, my = (e.clientY - rect.top) * scaleY;
      mouseRef.current = { x: mx, y: my };
      let found: string | null = null;
      for (const reg of regionPolys) {
        for (const pts of reg.polys) {
          if (pointInPoly(mx, my, pts)) { found = reg.key; break; }
        }
        if (found) break;
      }
      hoverRef.current = found;
      canvas.style.cursor = found ? 'pointer' : (panRef.current.dragging ? 'grabbing' : 'grab');
      // Update HTML tooltip
      const tip = tooltipRef.current;
      if (tip) {
        if (found) {
          const c = dataRef.current[found] || 0;
          const line2 = c > 0 ? `${c} pedido${c > 1 ? 's' : ''}` : 'Sin pedidos';
          tip.innerHTML = `<div style="font-weight:700;font-size:12px;color:#0f172a">${found}</div><div style="font-size:11px;font-weight:600;color:${c > 0 ? '#4f46e5' : '#94a3b8'}">${line2}</div>`;
          tip.style.display = 'block';
          const cssX = e.clientX - rect.left;
          const cssY = e.clientY - rect.top;
          // flip left if near right edge
          const tipW = tip.offsetWidth || 140;
          const left = cssX + tipW + 20 > rect.width ? cssX - tipW - 8 : cssX + 14;
          tip.style.left = left + 'px';
          tip.style.top = (cssY - 50) + 'px';
        } else {
          tip.style.display = 'none';
        }
      }
    };

    const down = (e: MouseEvent) => { panRef.current.dragging = true; panRef.current.startY = e.clientY; canvas.style.cursor = 'grabbing'; };
    const move = (e: MouseEvent) => {
      onHover(e);
      if (!panRef.current.dragging) return;
      panRef.current.offsetY += (e.clientY - panRef.current.startY); panRef.current.startY = e.clientY;
    };
    const up = () => { panRef.current.dragging = false; };
    const tdown = (e: TouchEvent) => { panRef.current.dragging = true; panRef.current.startY = e.touches[0].clientY; };
    const tmove = (e: TouchEvent) => { if (!panRef.current.dragging) return; panRef.current.offsetY += (e.touches[0].clientY - panRef.current.startY); panRef.current.startY = e.touches[0].clientY; };
    canvas.addEventListener('mousedown', down); window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
    canvas.addEventListener('touchstart', tdown, { passive: true }); window.addEventListener('touchmove', tmove, { passive: true }); window.addEventListener('touchend', up);
    return () => { cancelAnimationFrame(animId);
      canvas.removeEventListener('mousedown', down); window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up);
      canvas.removeEventListener('touchstart', tdown); window.removeEventListener('touchmove', tmove); window.removeEventListener('touchend', up);
    };
  }, []);

  return (
    <div style={{ borderRadius: 14, background: '#f9f8f4', position: 'relative', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', cursor: 'grab', borderRadius: 14 }} />
      <div ref={tooltipRef} style={{ display: 'none', position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 20, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderRadius: 10, padding: '8px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.06)', whiteSpace: 'nowrap', minWidth: 80 }} />
      <div style={{ position: 'absolute', top: 8, left: 10, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.92)', borderRadius: 8, padding: '4px 10px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.04)' }}>
        <span style={{ fontSize: 11 }}>☰</span>
        <span style={{ fontSize: 9, color: '#64748b', fontWeight: 600, letterSpacing: '0.02em' }}>Arrastra para mover</span>
      </div>
    </div>
  );
}

const STATUS_CONF: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:    { label: 'Pendiente',  color: '#d97706', bg: '#fffbeb', dot: '#fbbf24' },
  paid:       { label: 'Pagado',     color: '#059669', bg: '#ecfdf5', dot: '#34d399' },
  processing: { label: 'Procesando', color: '#2563eb', bg: '#eff6ff', dot: '#60a5fa' },
  shipped:    { label: 'Enviado',    color: '#7c3aed', bg: '#f5f3ff', dot: '#a78bfa' },
  delivered:  { label: 'Entregado',  color: '#0891b2', bg: '#ecfeff', dot: '#22d3ee' },
  cancelled:  { label: 'Cancelado',  color: '#dc2626', bg: '#fef2f2', dot: '#f87171' },
};

type DateRange = '7d' | '30d' | '90d' | 'all';
const RANGE_LABELS: Record<DateRange, string> = { '7d': '7d', '30d': '30d', '90d': '90d', 'all': 'Todo' };

// --- Shopify-like Live Globe Component ---
function AnimatedGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<{x: number, y: number, z: number}[]>([]);
  const zoomRef = useRef(1.25);
  const [liveVisitors, setLiveVisitors] = useState(1);
  // Puntos fijos en Chile (ciudades principales)
  const chilePings = useRef([
    { lat: -33.45, lon: -70.65 },  // Santiago
    { lat: -36.82, lon: -73.05 },  // Concepción
    { lat: -23.65, lon: -70.40 },  // Antofagasta
    { lat: -38.74, lon: -72.60 },  // Temuco
    { lat: -29.97, lon: -71.34 },  // La Serena
    { lat: -41.47, lon: -72.94 },  // Puerto Montt
    { lat: -33.05, lon: -71.61 },  // Valparaíso
    { lat: -20.21, lon: -70.15 },  // Iquique
  ]);
  
  // Rotation and Interaction State
  const rotationRef = useRef({ y: 0, x: 0 });
  const autoRotationEnabled = useRef(true); 
  const lastInteractTime = useRef(Date.now());

  // Presencia en tiempo real (tabs/ventanas activas)
  useEffect(() => {
    const storagePrefix = 'yaxsel-admin-live-presence';
    const instanceId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const storageKey = `${storagePrefix}:${instanceId}`;
    const ttlMs = 16000;
    const heartbeatMs = 5000;

    const computePresence = () => {
      const now = Date.now();
      let count = 0;

      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith(`${storagePrefix}:`)) continue;

        const raw = localStorage.getItem(key);
        const ts = raw ? Number(raw) : 0;
        if (!ts || now - ts > ttlMs) {
          localStorage.removeItem(key);
          continue;
        }
        count++;
      }

      setLiveVisitors(Math.max(1, count));
    };

    const channel = typeof BroadcastChannel !== 'undefined'
      ? new BroadcastChannel('yaxsel-admin-live-presence')
      : null;

    const heartbeat = () => {
      localStorage.setItem(storageKey, Date.now().toString());
      computePresence();
      channel?.postMessage('presence-update');
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith(`${storagePrefix}:`)) computePresence();
    };

    const onChannelMessage = () => computePresence();

    window.addEventListener('storage', onStorage);
    channel?.addEventListener('message', onChannelMessage);

    heartbeat();
    const intervalId = window.setInterval(heartbeat, heartbeatMs);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('storage', onStorage);
      channel?.removeEventListener('message', onChannelMessage);
      localStorage.removeItem(storageKey);
      channel?.postMessage('presence-update');
      channel?.close();
    };
  }, []);

  // 1. Fetch geographic data
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
      .then(res => res.json())
      .then(data => {
        const pW = 512, pH = 256; 
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = pW; tmpCanvas.height = pH;
        const tctx = tmpCanvas.getContext('2d');
        if (!tctx) return;
        tctx.fillStyle = '#fff';
        // Filtrar islas pequeñas que aparecen como puntos sueltos en el océano
        const skipNames = [
          'Falkland Islands',
          'Falkland Is.',
          'Fr. S. Antarctic Lands',
          'Heard I. and McDonald Is.',
          'S. Geo. and S. Sandw. Is.',
          'Br. Indian Ocean Ter.',
        ];
        data.features.filter((f: any) => !skipNames.includes(f.properties?.name)).forEach((f: any) => {
          const geoms = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : (f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : []);
          geoms.forEach((poly: any) => {
            tctx.beginPath();
            poly[0].forEach((pt: [number, number], i: number) => {
               const x = (pt[0] + 180) / 360 * pW;
               const y = (90 - pt[1]) / 180 * pH;
               if (i === 0) tctx.moveTo(x, y); else tctx.lineTo(x, y);
            });
            tctx.fill();
          });
        });
        // Structured Hex-like grid
        const pixels = tctx.getImageData(0, 0, pW, pH).data;
        const pts: {x: number, y: number, z: number}[] = [];
        const latsCount = 85; 
        for (let i = 0; i <= latsCount; i++) {
            const lat = 90 - (i * 180 / latsCount);
            const ry = Math.sin(lat * Math.PI / 180);
            const ringRadius = Math.cos(lat * Math.PI / 180); 
            const lonsCount = Math.max(1, Math.floor(180 * ringRadius)); 
            for (let j = 0; j < lonsCount; j++) {
                 const lon = -180 + (j * 360 / lonsCount);
                 // Apply slight hex-offset for organic grid
                 const offsetLon = (i % 2 === 0) ? lon : lon + (180/lonsCount);
                 const px = Math.floor(((offsetLon + 180) % 360) / 360 * pW);
                 const py = Math.floor((90 - lat) / 180 * pH);
                 if (pixels[(py * pW + px) * 4 + 3] > 100) {
                     pts.push({ 
                         x: ringRadius * Math.cos(offsetLon * Math.PI / 180), 
                         y: ry, 
                         z: ringRadius * Math.sin(offsetLon * Math.PI / 180) 
                     });
                 }
            }
        }
        // Agregar punto de refuerzo directamente al array (evita spread cada frame)
        const patchLat = -43;
        const patchLon = -74;
        const patchPhi = (90 - patchLat) * (Math.PI / 180);
        const patchTheta = patchLon * (Math.PI / 180);
        pts.push({
          x: Math.sin(patchPhi) * Math.cos(patchTheta),
          y: Math.cos(patchPhi),
          z: Math.sin(patchPhi) * Math.sin(patchTheta),
        });
        pointsRef.current = pts;
      });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // UI high-res setup
    const dpr = window.devicePixelRatio || 1;
    const W = 500, H = 500; 
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = '100%'; 
    canvas.style.height = '100%';
    ctx.scale(dpr, dpr);

    const baseRadius = 185; 
    const cx = W / 2;
    const cy = H / 2;
    
    const mouse = { x: -1000, y: -1000 };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      mouse.x = (e.clientX - rect.left) * scaleX;
      mouse.y = (e.clientY - rect.top) * scaleY;
    };
    
    window.addEventListener('mousemove', onMouseMove);

    const autoPhase = -3.8;
    let frame = 0;
    let animId: number;

    // Pre-compute hex vertex unit offsets
    const hexCos = new Float64Array(6);
    const hexSin = new Float64Array(6);
    for (let i = 0; i < 6; i++) {
      const ang = (i * Math.PI) / 3;
      hexCos[i] = Math.cos(ang);
      hexSin[i] = Math.sin(ang);
    }

    const drawHexOn = (c: CanvasRenderingContext2D, x: number, y: number, r: number) => {
      c.beginPath();
      c.moveTo(x + r * hexCos[0], y + r * hexSin[0]);
      c.lineTo(x + r * hexCos[1], y + r * hexSin[1]);
      c.lineTo(x + r * hexCos[2], y + r * hexSin[2]);
      c.lineTo(x + r * hexCos[3], y + r * hexSin[3]);
      c.lineTo(x + r * hexCos[4], y + r * hexSin[4]);
      c.lineTo(x + r * hexCos[5], y + r * hexSin[5]);
      c.closePath();
      c.fill();
    };

    // ── Offscreen canvas: pre-render static globe ONCE ──
    const offscreen = document.createElement('canvas');
    offscreen.width = W * dpr; offscreen.height = H * dpr;
    const oCtx = offscreen.getContext('2d')!;
    oCtx.scale(dpr, dpr);
    let offscreenReady = false;
    // Cached sorted dot positions for hover detection
    let cachedDots: {x: number, y: number, z: number, scale: number}[] = [];

    // Pre-compute ping spherical coords (they never change)
    const z = zoomRef.current;
    const radius = baseRadius * z;
    const R = radius * 0.98;
    const ry0 = rotationRef.current.y + autoPhase;
    const rx0 = rotationRef.current.x + 0.15;
    const cosRx = Math.cos(rx0), sinRx = Math.sin(rx0);
    const cosRy = Math.cos(ry0), sinRy = Math.sin(ry0);

    const pingPositions: {pX: number, pY: number}[] = [];
    const cPings = chilePings.current;
    for (let pi = 0; pi < cPings.length; pi++) {
      const b = cPings[pi];
      const phi = (90 - b.lat) * (Math.PI / 180);
      const theta = b.lon * (Math.PI / 180);
      const ppx = Math.sin(phi) * Math.cos(theta);
      const ppy = Math.cos(phi);
      const ppz = Math.sin(phi) * Math.sin(theta);
      const y1 = ppy * cosRx - ppz * sinRx;
      const z1 = ppy * sinRx + ppz * cosRx;
      const x2 = ppx * cosRy - z1 * sinRy;
      const z2 = ppx * sinRy + z1 * cosRy;
      if (z2 > 0) {
        pingPositions.push({ pX: cx - x2 * R + 120, pY: cy - y1 * R });
      }
    }

    function renderOffscreen() {
      if (offscreenReady) return;
      const pts = pointsRef.current;
      if (pts.length === 0) return;

      oCtx.clearRect(0, 0, W, H);

      // Globe background
      const grad = oCtx.createRadialGradient(cx - radius * 0.2, cy - radius * 0.2, 0, cx, cy, radius * 1.1);
      grad.addColorStop(0, '#f0f9ff');
      grad.addColorStop(0.3, '#e0f2fe');
      grad.addColorStop(1, '#bae6fd');
      oCtx.beginPath();
      oCtx.arc(cx, cy, radius, 0, Math.PI * 2);
      oCtx.fillStyle = grad;
      oCtx.fill();

      // Project & sort dots
      const dots: {x: number, y: number, z: number, scale: number}[] = [];
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const y1 = p.y * cosRx - p.z * sinRx;
        const z1 = p.y * sinRx + p.z * cosRx;
        const x2 = p.x * cosRy - z1 * sinRy;
        const z2 = p.x * sinRy + z1 * cosRy;
        if (z2 > -0.1) {
          dots.push({ x: cx + x2 * R, y: cy - y1 * R, z: z2, scale: 0.4 + z2 * 0.6 });
        }
      }
      dots.sort((a, b) => a.z - b.z);
      cachedDots = dots;

      // Draw ALL dots with shadows (done only ONCE)
      oCtx.shadowBlur = 2 * z;
      oCtx.shadowColor = 'rgba(0,0,0,0.1)';
      oCtx.fillStyle = 'rgba(14, 165, 233, 0.55)';
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        drawHexOn(oCtx, d.x, d.y, 2.1 * d.scale * z);
      }
      oCtx.shadowBlur = 0;

      offscreenReady = true;
    }

    function draw() {
      frame++;
      // Try to build offscreen if not ready (waiting for geojson)
      renderOffscreen();

      ctx!.clearRect(0, 0, W, H);

      if (offscreenReady) {
        // 1 drawImage instead of ~3000 shadowed hex draws
        ctx!.setTransform(1, 0, 0, 1, 0, 0);
        ctx!.drawImage(offscreen, 0, 0);
        ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Hover effects (only draw the ~5 dots near mouse)
        const hoverDist = 20 * z;
        const hoverDist2 = hoverDist * hoverDist;
        for (let i = cachedDots.length - 1; i >= 0; i--) {
          const d = cachedDots[i];
          const dx = d.x - mouse.x;
          const dy = d.y - mouse.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < hoverDist2) {
            const dist = Math.sqrt(dist2);
            const intensity = 1 - (dist / hoverDist);
            const lift = intensity * 0.14 * z;
            const hx = d.x + (d.x - cx) * lift;
            const hy = d.y + (d.y - cy) * lift;
            const hexR = 2.1 * d.scale * z + intensity * 1.4 * d.scale * z;
            ctx!.fillStyle = 'rgba(125, 211, 252, 1.0)';
            drawHexOn(ctx!, hx, hy, hexR);
          }
        }
      }

      // Pings verdes (solo pulso animado, posiciones pre-calculadas)
      const activeCount = Math.max(1, liveVisitors);
      const pingR = 1.8 * z;
      const pingLw = 1.5 * z;
      ctx!.shadowBlur = 10 * z;
      ctx!.shadowColor = 'rgba(34, 197, 94, 0.6)';
      ctx!.fillStyle = '#22c55e';
      for (let pi = 0; pi < activeCount; pi++) {
        const pos = pingPositions[pi % pingPositions.length];
        if (!pos) continue;
        // Sensor pattern: linear 0→1 sawtooth, ring expands + fades, then snaps back
        const t = (frame * 0.007 + pi * 0.5) % 1;
        const eased = Math.pow(t, 0.55); // slight ease-out for natural ring expansion

        ctx!.beginPath();
        ctx!.arc(pos.pX, pos.pY, pingR, 0, Math.PI * 2);
        ctx!.fill();

        // Second smaller inner ring for depth
        ctx!.shadowBlur = 0;
        ctx!.beginPath();
        ctx!.strokeStyle = `rgba(34, 197, 94, ${(1 - eased) * 0.65})`;
        ctx!.lineWidth = pingLw * 1.2;
        ctx!.arc(pos.pX, pos.pY, eased * 18 * z, 0, Math.PI * 2);
        ctx!.stroke();
        // Thin outer trailing ring
        if (eased > 0.35) {
          const t2 = eased - 0.35;
          ctx!.beginPath();
          ctx!.strokeStyle = `rgba(34, 197, 94, ${(1 - eased) * 0.3})`;
          ctx!.lineWidth = 0.8 * z;
          ctx!.arc(pos.pX, pos.pY, t2 * 28 * z, 0, Math.PI * 2);
          ctx!.stroke();
        }
        ctx!.shadowBlur = 10 * z;
      }
      ctx!.shadowBlur = 0;

      animId = requestAnimationFrame(draw);
    }
    draw();
    return () => {
       cancelAnimationFrame(animId);
       window.removeEventListener('mousemove', onMouseMove);
    };
  }, [liveVisitors]);

  return (
    <div style={{ width: '100%', maxWidth: '100%', aspectRatio: '1/1', position: 'relative', overflow: 'visible', userSelect: 'none' }}>
      <canvas ref={canvasRef} style={{ display: 'block', touchAction: 'none', width: '100%', height: '100%' }} />
      <div style={{ pointerEvents: 'none', position: 'absolute', bottom: 12, right: 12, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.85)', padding: '4px 10px', borderRadius: 20, boxShadow: '0 2px 4px rgba(0,0,0,0.04)', zIndex: 10 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0ea5e9', display: 'inline-block', boxShadow: '0 0 4px #0ea5e9', animation: 'db-fade-up 1s infinite alternate' }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: '#0284c7' }}>{liveVisitors} visitante{liveVisitors === 1 ? '' : 's'} ahora</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ totalProducts: 0, totalOrders: 0, pendingOrders: 0, totalRevenue: 0, lowStockCount: 0, todayOrders: 0, avgTicket: 0, avgDailyRevenue: 0 });
  const [recentOrders, setRecentOrders]       = useState<Order[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [allOrders, setAllOrders]             = useState<Order[]>([]);
  const [rangeOrders, setRangeOrders]         = useState<Order[]>([]);
  const [topProducts, setTopProducts]         = useState<Product[]>([]);
  const [isLoading, setIsLoading]             = useState(true);
  const [error, setError]                     = useState('');
  const [lastRefresh, setLastRefresh]         = useState<Date>(new Date());
  const [dateRange, setDateRange]             = useState<DateRange>('30d');
  const [pendingWholesale, setPendingWholesale] = useState(0);
  const [openSupport, setOpenSupport]         = useState(0);
  const [unreadNotifs, setUnreadNotifs]       = useState(0);
  const [newUsers, setNewUsers]               = useState(0);
  const [prevRevenue, setPrevRevenue]         = useState(0);
  const [prevOrders, setPrevOrders]           = useState(0);

  const loadData = useCallback(async () => {
    setIsLoading(true); setError('');
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const cutoff30d = new Date(Date.now() - 30 * 86400000).toISOString();
      const [productsResp, ordersResp, wholesaleResp, supportResp, notifsResp, newUsersResp] = await Promise.all([
        databases.listDocuments(databaseId, PRODUCTS_COLLECTION_ID, [Query.limit(500)]),
        databases.listDocuments(databaseId, ORDERS_COLLECTION_ID, [Query.orderDesc('CREATEDAT'), Query.limit(500)]),
        databases.listDocuments(databaseId, WHOLESALE_REQUESTS_COLLECTION_ID, [Query.equal('status', 'pending'), Query.limit(50)]),
        databases.listDocuments(databaseId, SUPPORT_TICKETS_COLLECTION_ID, [Query.notEqual('STATUS', 'closed'), Query.limit(50)]),
        databases.listDocuments(databaseId, NOTIFICATIONS_COLLECTION_ID, [Query.equal('isRead', false), Query.limit(1)]),
        databases.listDocuments(databaseId, USERS_COLLECTION_ID, [Query.greaterThanEqual('$createdAt', cutoff30d), Query.limit(1)]),
      ]);
      setPendingWholesale(wholesaleResp.total);
      setOpenSupport(supportResp.total);
      setUnreadNotifs(notifsResp.total);
      setNewUsers(newUsersResp.total);
      const products = productsResp.documents as unknown as Product[];
      const orders   = ordersResp.documents as unknown as Order[];
      setAllOrders(orders);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      let todayOrders = 0;
      for (const o of orders) { if (o.CREATEDAT >= today.getTime()) todayOrders++; }
      const lowStock = products.filter(p => (p.STOCK ?? 0) <= 5);
      const top = [...products].sort((a, b) => (b.SOLDQUANTITY ?? 0) - (a.SOLDQUANTITY ?? 0)).slice(0, 6);
      setStats(s => ({ ...s, totalProducts: products.length, lowStockCount: lowStock.length, todayOrders }));
      setLowStockProducts(lowStock.slice(0, 5));
      setTopProducts(top);
      setLastRefresh(new Date());
    } catch (e: any) { setError(e.message || 'Error cargando datos'); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { loadData(); const id = setInterval(loadData, 60_000); return () => clearInterval(id); }, [loadData]);

  useEffect(() => {
    if (allOrders.length === 0 && !isLoading) return;
    const now = Date.now();
    const days = dateRange === 'all' ? 0 : { '7d': 7, '30d': 30, '90d': 90 }[dateRange as '7d' | '30d' | '90d'];
    const cutoff     = dateRange === 'all' ? 0 : now - days * 86400000;
    const prevCutoff = dateRange === 'all' ? 0 : cutoff - days * 86400000;
    const rOrders  = dateRange === 'all' ? allOrders : allOrders.filter(o => (o.CREATEDAT || 0) >= cutoff);
    const prevPeriod = dateRange === 'all' ? [] : allOrders.filter(o => { const t = o.CREATEDAT || 0; return t >= prevCutoff && t < cutoff; });
    let totalRevenue = 0, pendingOrders = 0, paidCount = 0;
    for (const o of rOrders) {
      if (o.STATUS === 'pending') pendingOrders++;
      if (o.STATUS === 'paid' || o.STATUS === 'delivered') { totalRevenue += o.TOTAL; paidCount++; }
    }
    const avgTicket = paidCount > 0 ? Math.round(totalRevenue / paidCount) : 0;
    const effectiveDays = dateRange === 'all' ? 0 : Number({ '7d': 7, '30d': 30, '90d': 90 }[dateRange as '7d' | '30d' | '90d']);
    const avgDailyRevenue = effectiveDays > 0 ? Math.round(totalRevenue / effectiveDays) : 0;
    let pRev = 0;
    for (const o of prevPeriod) { if (o.STATUS === 'paid' || o.STATUS === 'delivered') pRev += o.TOTAL; }
    setPrevRevenue(pRev); setPrevOrders(prevPeriod.length);
    setRangeOrders(rOrders);
    setStats(s => ({ ...s, totalOrders: rOrders.length, pendingOrders, totalRevenue, avgTicket, avgDailyRevenue }));
    setRecentOrders(rOrders.slice(0, 8));
  }, [allOrders, dateRange, isLoading]);

  const fmt = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

  /* ── GSAP Dashboard Animations ── */
  useEffect(() => {
    if (typeof window === 'undefined' || isLoading) return;
    const t = setTimeout(() => {
      const ctx = gsap.context(() => {
        /* KPI cards — stagger slide up with counter animation */
        gsap.from('.db-kpi-item', {
          y: 25, opacity: 0, duration: 0.5, stagger: 0.06, ease: 'power3.out', clearProps: 'transform,opacity',
        });

        /* KPI value numbers — counter from 0 */
        document.querySelectorAll('.db-kpi-value').forEach(el => {
          const text = el.textContent || '';
          const numMatch = text.replace(/[^0-9]/g, '');
          const target = parseInt(numMatch) || 0;
          if (target === 0) return;
          const prefix = text.match(/^[^0-9]*/)?.[0] || '';
          const suffix = text.match(/[^0-9]*$/)?.[0] || '';
          const isPrice = text.includes('$');
          const obj = { val: 0 };
          gsap.to(obj, {
            val: target, duration: 1.2, ease: 'power2.out',
            onUpdate: () => {
              if (isPrice) {
                (el as HTMLElement).textContent = fmt(Math.round(obj.val));
              } else {
                (el as HTMLElement).textContent = `${prefix}${Math.round(obj.val)}${suffix}`;
              }
            },
          });
        });

        /* Stats panel — scale entrance */
        gsap.from('.db-stats-panel', {
          y: 30, opacity: 0, scale: 0.98, duration: 0.6, ease: 'power3.out', clearProps: 'transform,opacity',
        });

        /* Chart SVG lines — draw stroke animation */
        document.querySelectorAll('.db-chart-line').forEach(path => {
          const len = (path as SVGPathElement).getTotalLength?.() || 500;
          gsap.fromTo(path,
            { strokeDasharray: len, strokeDashoffset: len },
            { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut', delay: 0.3 }
          );
        });

        /* Chart area fill — fade in */
        gsap.from('.db-chart-area', {
          opacity: 0, duration: 0.8, delay: 0.8, ease: 'power2.out',
        });

        /* Chart dots — scale pop stagger */
        gsap.from('.db-chart-dot', {
          scale: 0, opacity: 0, duration: 0.3, stagger: 0.04, ease: 'back.out(2)', delay: 1.0, clearProps: 'transform,opacity',
        });

        /* KPI sparklines — draw */
        document.querySelectorAll('.db-kpi-spark polyline').forEach(poly => {
          const len = (poly as SVGGeometryElement).getTotalLength?.() || 100;
          gsap.fromTo(poly,
            { strokeDasharray: len, strokeDashoffset: len },
            { strokeDashoffset: 0, duration: 1.0, ease: 'power2.out', delay: 0.5 }
          );
        });

        /* Donut chart segments — draw stroke */
        document.querySelectorAll('.db-donut-seg').forEach((seg, i) => {
          const len = (seg as SVGCircleElement).getTotalLength?.() || 200;
          gsap.fromTo(seg,
            { strokeDashoffset: len },
            { strokeDashoffset: -(parseFloat((seg as SVGCircleElement).style.strokeDashoffset || '0')), duration: 1.0, ease: 'power3.out', delay: 0.3 + i * 0.1 }
          );
        });

        /* Recent orders table rows — stagger */
        gsap.from('.db-order-row', {
          x: -20, opacity: 0, duration: 0.35, stagger: 0.04, ease: 'power2.out', delay: 0.2, clearProps: 'transform,opacity',
        });

        /* Side panels (globe, map, top products) — stagger entrance */
        gsap.from('.db-side-panel', {
          y: 40, opacity: 0, duration: 0.6, stagger: 0.12, ease: 'power3.out', delay: 0.15, clearProps: 'transform,opacity',
        });

        /* Quick action cards — scale pop */
        gsap.from('.db-quick-action', {
          scale: 0.9, opacity: 0, duration: 0.4, stagger: 0.06, ease: 'back.out(1.5)', delay: 0.3, clearProps: 'transform,opacity',
        });

        /* Top products progress bars — width animation */
        document.querySelectorAll('.db-progress-bar').forEach(bar => {
          const targetW = (bar as HTMLElement).style.width;
          gsap.fromTo(bar, { width: '0%' }, { width: targetW, duration: 0.8, ease: 'power2.out', delay: 0.5 });
        });
      });
      return () => ctx.revert();
    }, 80);
    return () => clearTimeout(t);
  }, [isLoading]);

  const greeting = (() => { const h = new Date().getHours(); if (h < 12) return 'Buenos días'; if (h < 18) return 'Buenas tardes'; return 'Buenas noches'; })();
  const userName = user?.name?.split(' ')[0] || 'Admin';

  /* ─── Revenue chart buckets ─── */
  const chartBuckets = (() => {
    const days = 14;
    const result: { label: string; revenue: number; orders: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const dayOrders = rangeOrders.filter(o => { const ts = o.CREATEDAT || new Date(o.$createdAt).getTime(); return ts >= d.getTime() && ts < next.getTime(); });
      const rev = dayOrders.filter(o => o.STATUS === 'paid' || o.STATUS === 'delivered').reduce((s, o) => s + o.TOTAL, 0);
      result.push({ label: d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }), revenue: rev, orders: dayOrders.length });
    }
    return result;
  })();

  /* ─── Sparkline data for KPI cards (7 points = last 7 days) ─── */
  const revenueSparkData = (() => {
    const pts: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const rev = rangeOrders.filter(o => { const ts = o.CREATEDAT || 0; return ts >= d.getTime() && ts < next.getTime() && (o.STATUS === 'paid' || o.STATUS === 'delivered'); }).reduce((s, o) => s + o.TOTAL, 0);
      pts.push(rev);
    }
    return pts;
  })();

  const ordersSparkData = (() => {
    const pts: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      pts.push(rangeOrders.filter(o => { const ts = o.CREATEDAT || 0; return ts >= d.getTime() && ts < next.getTime(); }).length);
    }
    return pts;
  })();

  /* ─── Order status donut segments ─── */
  const donutSegments = Object.entries(STATUS_CONF).map(([status, conf]) => ({
    value: rangeOrders.filter(o => o.STATUS === status).length,
    color: conf.dot, label: conf.label,
  })).filter(s => s.value > 0);

  const maxRevDay = Math.max(...chartBuckets.map(b => b.revenue), 1);

  /* ─── Dashboard status semaphore ─── */
  const todayStart = (() => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); })();
  const todayRevenue = allOrders.filter(o => (o.CREATEDAT||0) >= todayStart && (o.STATUS==='paid'||o.STATUS==='delivered')).reduce((s,o) => s+o.TOTAL, 0);
  const topRegions = (() => {
    const map: Record<string, number> = {};
    for (const o of allOrders) { const r = (o.REGION || 'Sin región') as string; map[r] = (map[r]||0)+1; }
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5);
  })();

  const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;
  const stalePendingOrders = allOrders.filter(o =>
    o.STATUS === 'pending' && (o.CREATEDAT || 0) > 0 && (o.CREATEDAT || 0) < threeHoursAgo
  ).length;
  const dashStatus: 'ok' | 'warning' | 'critical' =
    stalePendingOrders > 0 ? 'critical' :
    (stats.pendingOrders > 0 || stats.lowStockCount > 0 || pendingWholesale > 0 || openSupport > 0) ? 'warning' :
    'ok';
  const svgCol = {
    ok:       { bg: '#f0fdf4', border: '#bbf7d0', star: '#22c55e', d1: '#86efac', d2: '#4ade80' },
    warning:  { bg: '#fffbeb', border: '#fde68a', star: '#f59e0b', d1: '#fcd34d', d2: '#fbbf24' },
    critical: { bg: '#fef2f2', border: '#fecaca', star: '#ef4444', d1: '#fca5a5', d2: '#f87171' },
  }[dashStatus];

  return (
    <div style={{ width: '100%', background: '#ffffff' }}>
      <style>{`
        @keyframes db-fade-up { from{opacity:0;transform:translateY(12px);} to{opacity:1;transform:translateY(0);} }
        @keyframes db-header-drop { from{opacity:0;transform:translateY(-18px);} to{opacity:1;transform:translateY(0);} }
        @keyframes db-header-sub { from{opacity:0;transform:translateY(-8px);} to{opacity:1;transform:translateY(0);} }
        @keyframes db-panel-in { from{opacity:0;transform:translateY(20px) scale(0.985);} to{opacity:1;transform:translateY(0) scale(1);} }
        @keyframes db-icon-in { from{opacity:0;transform:scale(0.5) rotate(-20deg);} to{opacity:1;transform:scale(1) rotate(0deg);} }
        @keyframes db-icon-glow { 0%,100%{filter:drop-shadow(0 0 2px rgba(34,197,94,0.4));} 50%{filter:drop-shadow(0 0 8px rgba(34,197,94,0.7));} }
        @keyframes db-icon-pulse { 0%,100%{transform:scale(1);filter:drop-shadow(0 0 0 rgba(239,68,68,0));} 50%{transform:scale(1.12);filter:drop-shadow(0 0 12px rgba(239,68,68,0.8));} }
        @keyframes db-icon-warn { 0%,100%{filter:drop-shadow(0 0 2px rgba(245,158,11,0.3));} 50%{filter:drop-shadow(0 0 6px rgba(245,158,11,0.6));} }
        @keyframes db-dot-bounce { 0%,80%,100%{transform:translateY(0);opacity:0.4} 40%{transform:translateY(-4px);opacity:1} }
        @keyframes db-bubble-in { from{opacity:0;transform:translateX(-8px) scale(0.95);} to{opacity:1;transform:translateX(0) scale(1);} }
        .db-icon { animation: db-icon-in 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both; }
        .db-icon-ok { animation: db-icon-in 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both, db-icon-glow 2.5s ease-in-out infinite; }
        .db-icon-warning { animation: db-icon-in 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both, db-icon-warn 2s ease-in-out infinite; }
        .db-icon-critical { animation: db-icon-in 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both, db-icon-pulse 1.2s ease-in-out infinite; }
        .db-typing-dot { display:inline-block; width:5px; height:5px; border-radius:50%; background:#ef4444; animation:db-dot-bounce 1.2s ease-in-out infinite; }
        .db-typing-dot:nth-child(2){animation-delay:.2s} .db-typing-dot:nth-child(3){animation-delay:.4s}
        .db-alert-bubble { animation: db-bubble-in 0.4s cubic-bezier(0.16,1,0.3,1) 0.3s both; }
        .db-greeting { animation: db-header-drop 0.55s cubic-bezier(0.16,1,0.3,1) both; }
        .db-greeting-sub { animation: db-header-sub 0.55s cubic-bezier(0.16,1,0.3,1) 0.12s both; }
        .db-stats-panel { animation: db-panel-in 0.6s cubic-bezier(0.16,1,0.3,1) 0.18s both; }
        .db-card { animation: db-fade-up 0.4s cubic-bezier(0.16,1,0.3,1) both; }
        .db-card:nth-child(1){animation-delay:.04s} .db-card:nth-child(2){animation-delay:.08s}
        .db-card:nth-child(3){animation-delay:.12s} .db-card:nth-child(4){animation-delay:.16s}
        .db-card:nth-child(5){animation-delay:.20s} .db-card:nth-child(6){animation-delay:.24s}
        .db-row-link:hover { background:#f9fafb !important; }
        .db-range-btn { border:none; cursor:pointer; transition:all .15s; }
        .db-range-btn:hover { color:#a5b4fc !important; font-weight: 600 !important; }
        .db-bar-col:hover .db-bar-tip { display:flex !important; }
        .db-kpi-grid > div { animation: db-fade-up 0.45s cubic-bezier(0.16,1,0.3,1) both; }
        .db-kpi-grid > div:nth-child(1){animation-delay:.05s} .db-kpi-grid > div:nth-child(2){animation-delay:.10s}
        .db-kpi-grid > div:nth-child(3){animation-delay:.15s} .db-kpi-grid > div:nth-child(4){animation-delay:.20s}
        .db-kpi-grid > div:nth-child(5){animation-delay:.25s} .db-kpi-grid > div:nth-child(6){animation-delay:.30s}
      `}</style>

      {/* ═══ Header ═══ */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="db-greeting" style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {greeting}, {userName}
            <svg
              width="30" height="30" viewBox="0 0 30 30" fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ flexShrink: 0, transition: 'all 0.5s ease' }}
              className={`db-icon db-icon-${dashStatus}`}
            >
              <circle cx="15" cy="15" r="14" fill={svgCol.bg} stroke={svgCol.border} strokeWidth="1.2"/>
              <path d="M15 6 L16.8 12.2 L23 15 L16.8 17.8 L15 24 L13.2 17.8 L7 15 L13.2 12.2 Z" fill={svgCol.star}/>
              <circle cx="22" cy="9" r="2" fill={svgCol.d1} opacity="0.8"/>
              <circle cx="9" cy="8" r="1.3" fill={svgCol.d2} opacity="0.6"/>
            </svg>
            {/* Alert bubble crítico */}
            {dashStatus === 'critical' && (
              <span className="db-alert-bubble" style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: 20, padding: '4px 12px 4px 10px',
                fontSize: 13, fontWeight: 500, color: '#b91c1c',
                boxShadow: '0 1px 4px rgba(239,68,68,0.12)',
              }}>
                <span style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  <span className="db-typing-dot" />
                  <span className="db-typing-dot" />
                  <span className="db-typing-dot" />
                </span>
                Hay {stalePendingOrders} pedido{stalePendingOrders !== 1 ? 's' : ''} sin procesar hace más de 3h. ¿Los revisamos?
              </span>
            )}
            {/* Warning badge suave */}
            {dashStatus === 'warning' && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: '#fffbeb', border: '1px solid #fde68a',
                borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600, color: '#b45309',
              }}>
                ⚠ Hay cosas que revisar
              </span>
            )}
          </h1>
          <p className="db-greeting-sub" style={{ fontSize: 13, color: '#9ca3af', margin: '4px 0 0' }}>
            {lastRefresh.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })} · Actualizado {lastRefresh.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
          </p>
          {/* Quick stats pills */}
          <div className="db-greeting-sub" style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600, color: '#15803d' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              {stats.todayOrders} pedido{stats.todayOrders !== 1 ? 's' : ''} hoy
            </span>
            {stats.pendingOrders > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600, color: '#b45309' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                {stats.pendingOrders} pendiente{stats.pendingOrders !== 1 ? 's' : ''}
              </span>
            )}
            {stats.lowStockCount > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600, color: '#b91c1c' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                {stats.lowStockCount} stock bajo
              </span>
            )}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600, color: '#4338ca' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', display: 'inline-block' }} />
              {stats.totalProducts} productos
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            {(Object.keys(RANGE_LABELS) as DateRange[]).map(r => (
              <button key={r} onClick={() => setDateRange(r)} className="db-range-btn" style={{
                padding: '7px 14px', fontSize: 13, fontWeight: dateRange === r ? 700 : 500,
                background: dateRange === r ? '#111827' : 'transparent',
                color: dateRange === r ? '#fff' : '#6b7280',
              }}>{RANGE_LABELS[r]}</button>
            ))}
          </div>
          <button onClick={loadData} disabled={isLoading} style={{
            width: 38, height: 38, borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, marginBottom: 20, display: 'flex', gap: 8, fontSize: 14, color: '#b91c1c' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
        </div>
      )}

      {/* ═══ Panel Estadístico Empresarial ═══ */}
      <div className="db-card db-stats-panel" style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', marginBottom: 24 }}>
        {/* KPIs compactos en fila */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${newUsers > 0 ? 6 : 5}, 1fr)`, gap: 0, marginBottom: 20, borderBottom: '1px solid #f1f5f9', paddingBottom: 20 }}>
          {[
            { label: 'Ingresos totales', value: fmt(stats.totalRevenue), icon: <DollarSign size={14} color="#6366f1" />, color: '#6366f1', bg: '#eef2ff', trend: dateRange !== 'all' && prevRevenue > 0 ? ((stats.totalRevenue - prevRevenue) / prevRevenue) * 100 : undefined },
            { label: 'Pedidos', value: String(stats.totalOrders), icon: <ShoppingCart size={14} color="#0891b2" />, color: '#0891b2', bg: '#ecfeff', trend: dateRange !== 'all' && prevOrders > 0 ? ((stats.totalOrders - prevOrders) / prevOrders) * 100 : undefined },
            { label: 'Hoy', value: String(stats.todayOrders), icon: <Zap size={14} color="#059669" />, color: '#059669', bg: '#ecfdf5' },
            { label: 'Ticket promedio', value: fmt(stats.avgTicket), icon: <TrendingUp size={14} color="#d97706" />, color: '#d97706', bg: '#fffbeb' },
            { label: 'Productos', value: String(stats.totalProducts), icon: <Package size={14} color="#7c3aed" />, color: '#7c3aed', bg: '#f5f3ff' },
            ...(newUsers > 0 ? [{ label: 'Nuevos usuarios', value: String(newUsers), icon: <Users size={14} color="#ec4899" />, color: '#ec4899', bg: '#fdf2f8' }] : []),
          ].map((kpi, i, arr) => (
            <div key={i} className="db-kpi-item" style={{ textAlign: 'center', borderRight: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none', padding: '0 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 6 }}>
                <span style={{ width: 24, height: 24, borderRadius: 6, background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{kpi.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{kpi.label}</span>
              </div>
              <p className="db-kpi-value" style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 2px', lineHeight: 1.1 }}>{kpi.value}</p>
              {kpi.trend !== undefined && (
                <span style={{ fontSize: 11, fontWeight: 700, color: kpi.trend >= 0 ? '#059669' : '#dc2626' }}>
                  {kpi.trend >= 0 ? '▲' : '▼'} {Math.abs(kpi.trend).toFixed(1)}%
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Gráfica de líneas/puntos empresarial */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: 0 }}>Rendimiento — últimos 14 días</h3>
          <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 3, borderRadius: 2, background: '#6366f1', display: 'inline-block' }} /> Ingresos</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 3, borderRadius: 2, background: '#0891b2', display: 'inline-block' }} /> Pedidos</span>
          </div>
        </div>
        <svg viewBox="0 0 700 220" style={{ width: '100%', height: 220, overflow: 'visible' }}>
          {/* Grid horizontal */}
          {[0, 1, 2, 3, 4].map(i => {
            const y = 20 + i * 45;
            return <g key={`grid-${i}`}>
              <line x1="50" y1={y} x2="680" y2={y} stroke="#f1f5f9" strokeWidth="1" />
              <text x="44" y={y + 4} textAnchor="end" style={{ fontSize: 9, fill: '#9ca3af' }}>
                {maxRevDay > 0 ? (maxRevDay > 999 ? `$${Math.round((maxRevDay * (4 - i) / 4) / 1000)}k` : `$${Math.round(maxRevDay * (4 - i) / 4)}`) : '0'}
              </text>
            </g>;
          })}
          {/* Eje X - fechas */}
          {chartBuckets.map((b, i) => {
            const x = 50 + (i / 13) * 630;
            return <text key={`xl-${i}`} x={x} y={210} textAnchor="middle" style={{ fontSize: 8, fill: '#9ca3af' }}>{i % 2 === 0 ? b.label : ''}</text>;
          })}
          {/* Línea de ingresos (púrpura) con relleno */}
          {(() => {
            const maxR = Math.max(...chartBuckets.map(b => b.revenue), 1);
            const pts = chartBuckets.map((b, i) => ({
              x: 50 + (i / 13) * 630,
              y: 20 + (1 - b.revenue / maxR) * 180,
            }));
            const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
            const area = `${line} L${pts[pts.length - 1].x},200 L${pts[0].x},200 Z`;
            return <>
              <defs><linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" /><stop offset="100%" stopColor="#6366f1" stopOpacity="0.01" /></linearGradient></defs>
              <path className="db-chart-area" d={area} fill="url(#revGrad)" />
              <path className="db-chart-line" d={line} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
              {pts.map((p, i) => <circle className="db-chart-dot" key={`rd-${i}`} cx={p.x} cy={p.y} r={3.5} fill="#fff" stroke="#6366f1" strokeWidth="2" />)}
            </>;
          })()}
          {/* Línea de pedidos (cyan) */}
          {(() => {
            const maxO = Math.max(...chartBuckets.map(b => b.orders), 1);
            const pts = chartBuckets.map((b, i) => ({
              x: 50 + (i / 13) * 630,
              y: 20 + (1 - b.orders / maxO) * 180,
            }));
            const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
            return <>
              <path className="db-chart-line" d={line} fill="none" stroke="#0891b2" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="6 3" />
              {pts.map((p, i) => <circle className="db-chart-dot" key={`od-${i}`} cx={p.x} cy={p.y} r={3} fill="#fff" stroke="#0891b2" strokeWidth="1.5" />)}
            </>;
          })()}
          {/* Eje Y derecho - escala de pedidos */}
          {[0, 1, 2, 3, 4].map(i => {
            const maxO = Math.max(...chartBuckets.map(b => b.orders), 1);
            const y = 20 + i * 45;
            return <text key={`yr-${i}`} x="690" y={y + 4} textAnchor="start" style={{ fontSize: 9, fill: '#0891b2' }}>
              {Math.round(maxO * (4 - i) / 4)}
            </text>;
          })}
        </svg>
      </div>

      {/* ═══ Alerts ═══ */}
      {!isLoading && (stats.pendingOrders > 0 || stats.lowStockCount > 0 || pendingWholesale > 0 || openSupport > 0) && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 14, padding: '14px 16px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <AlertTriangle size={15} color="#d97706" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>Requiere atención</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {stats.pendingOrders > 0 && (
              <Link href="/admin/orders?status=pending" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px', borderRadius: 8, background: '#fff', border: '1px solid #fde68a', textDecoration: 'none', fontSize: 13, color: '#92400e', fontWeight: 500, transition: 'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fef9c3'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}>
                <Clock size={13} /> {stats.pendingOrders} pedido{stats.pendingOrders !== 1 ? 's' : ''} pendiente{stats.pendingOrders !== 1 ? 's' : ''}
              </Link>
            )}
            {stats.lowStockCount > 0 && (
              <Link href="/admin/inventory" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px', borderRadius: 8, background: '#fff', border: '1px solid #fecaca', textDecoration: 'none', fontSize: 13, color: '#dc2626', fontWeight: 500, transition: 'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}>
                <Package size={13} /> {stats.lowStockCount} producto{stats.lowStockCount !== 1 ? 's' : ''} stock bajo
              </Link>
            )}
            {pendingWholesale > 0 && (
              <Link href="/admin/wholesale" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px', borderRadius: 8, background: '#fff', border: '1px solid #ddd6fe', textDecoration: 'none', fontSize: 13, color: '#7c3aed', fontWeight: 500, transition: 'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f5f3ff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}>
                <Users size={13} /> {pendingWholesale} solicitud{pendingWholesale !== 1 ? 'es' : ''} mayorista
              </Link>
            )}
            {openSupport > 0 && (
              <Link href="/admin/support" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px', borderRadius: 8, background: '#fff', border: '1px solid #bfdbfe', textDecoration: 'none', fontSize: 13, color: '#2563eb', fontWeight: 500, transition: 'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}>
                <Megaphone size={13} /> {openSupport} ticket{openSupport !== 1 ? 's' : ''} soporte
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ═══ Vista en tiempo real ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
        
        {/* Vista en Tiempo Real - Estadísticas */}
        <div className="db-card db-side-panel" style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                 <Globe size={18} color="#0891b2" /> Vista en tiempo real
              </h2>
              <p style={{ fontSize: 11, color: '#0ea5e9', fontWeight: 600, margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                 <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0ea5e9', display: 'inline-block', animation: 'db-pulse 2s infinite' }} /> Ahora mismo
              </p>
            </div>
            <div style={{ position: 'relative' }}>
               <input type="text" placeholder="Buscar ubicación" style={{ fontSize: 12, padding: '8px 12px 8px 32px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 20, width: 140, outline: 'none' }} />
               <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>
          
          {/* KPIs hoy */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '12px 14px' }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#64748b', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ingresos hoy</p>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>{fmt(todayRevenue)}</div>
              <p style={{ fontSize: 10, color: '#94a3b8', margin: '2px 0 0' }}>pedidos pagados</p>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '12px 14px' }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#64748b', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pedidos hoy</p>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>{stats.todayOrders}</div>
              <p style={{ fontSize: 10, color: '#94a3b8', margin: '2px 0 0' }}>en el rango activo</p>
            </div>
            <div style={{ background: '#fffbeb', borderRadius: 12, padding: '12px 14px' }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#92400e', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pendientes</p>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#b45309' }}>{stats.pendingOrders}</div>
              <p style={{ fontSize: 10, color: '#d97706', margin: '2px 0 0' }}>sin procesar</p>
            </div>
            <div style={{ background: '#fef2f2', borderRadius: 12, padding: '12px 14px' }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#991b1b', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stock bajo</p>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#ef4444' }}>{stats.lowStockCount}</div>
              <p style={{ fontSize: 10, color: '#f87171', margin: '2px 0 0' }}>productos críticos</p>
            </div>
          </div>

          {/* Top regiones */}
          {topRegions.length > 0 && (
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16, marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#334155', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={13} color="#64748b" /> Top regiones
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {topRegions.map(([region, count], i) => {
                  const pct = Math.round((count / allOrders.length) * 100);
                  return (
                    <div key={region} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', width: 14 }}>{i + 1}</span>
                      <span style={{ fontSize: 12, color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{region}</span>
                      <div style={{ width: 60, height: 4, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#6366f1', borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', width: 26, textAlign: 'right' }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Últimos pedidos mini-lista */}
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#334155', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShoppingBag size={13} color="#64748b" /> Actividad reciente
            </p>
            {recentOrders.slice(0, 4).length === 0 ? (
              <p style={{ fontSize: 12, color: '#94a3b8' }}>Sin pedidos recientes</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recentOrders.slice(0, 4).map(o => {
                  const sc = STATUS_CONF[o.STATUS] || STATUS_CONF['pending'];
                  const ts = o.CREATEDAT ? new Date(o.CREATEDAT).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '';
                  return (
                    <div key={o.$id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #f8fafc' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: sc.dot, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#374151', flex: 1 }}>{o.ORDERCODE || o.$id.slice(-6)}</span>
                      <span style={{ fontSize: 11, color: '#64748b' }}>{o.REGION || '—'}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#111827' }}>{fmt(o.TOTAL)}</span>
                      <span style={{ fontSize: 10, color: '#94a3b8' }}>{ts}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Globo 3D */}
        <div className="db-card db-side-panel" style={{ background: '#f8fafc', borderRadius: 16, border: '1px solid #e5e7eb', padding: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: 380, overflow: 'hidden' }}>
          <AnimatedGlobe />
          <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', gap: 8 }}>
             <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', background: '#fff', padding: '4px 10px', borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                📍 Pedidos
             </span>
             <span style={{ fontSize: 10, fontWeight: 700, color: '#0ea5e9', background: '#fff', padding: '4px 10px', borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                🔵 Visitantes ahora
             </span>
          </div>
        </div>
      </div>

      {/* ═══ Revenue chart + Order status ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, marginBottom: 24 }}>

        {/* Revenue area chart */}
        <div className="db-card" style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Ingresos — últimos 14 días</h2>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: '3px 0 0' }}>Solo pedidos pagados y entregados</p>
            </div>
            <Link href="/admin/analytics" style={{ fontSize: 12, fontWeight: 600, color: '#6366f1', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
              Ver analytics <ArrowRight size={13} />
            </Link>
          </div>

          {/* Y-axis labels */}
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: 20, paddingTop: 4 }}>
              {[maxRevDay, Math.round(maxRevDay * 0.5), 0].map((v, i) => (
                <span key={i} style={{ fontSize: 10, color: '#d1d5db', textAlign: 'right', lineHeight: 1 }}>
                  {v > 999 ? `$${Math.round(v / 1000)}k` : `$${v}`}
                </span>
              ))}
            </div>
            <div style={{ flex: 1 }}>
              <AreaChart data={chartBuckets.map(b => b.revenue)} color="#6366f1" height={130} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                {chartBuckets.filter((_, i) => i === 0 || i === 6 || i === 13).map((b, i) => (
                  <span key={i} style={{ fontSize: 10, color: '#9ca3af' }}>{b.label}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Bar chart below (order volume) */}
          <div style={{ marginTop: 12, borderTop: '1px solid #f3f4f6', paddingTop: 12 }}>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 8px' }}>Volumen de pedidos</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 40 }}>
              {chartBuckets.map((b, i) => {
                const maxOrd = Math.max(...chartBuckets.map(x => x.orders), 1);
                const pct = (b.orders / maxOrd) * 100;
                return (
                  <div key={i} className="db-bar-col" style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div className="db-bar-tip" style={{
                      display: 'none', position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                      background: '#1f2937', color: '#fff', fontSize: 10, borderRadius: 6, padding: '3px 7px', whiteSpace: 'nowrap', zIndex: 10, marginBottom: 4,
                    }}>
                      {b.orders} ped · {b.label}
                    </div>
                    <div style={{
                      width: '100%', borderRadius: '3px 3px 0 0',
                      background: b.orders > 0 ? '#818cf8' : '#f3f4f6',
                      height: `${Math.max(pct, b.orders > 0 ? 8 : 3)}%`,
                      transition: 'height .4s cubic-bezier(0.16,1,0.3,1)',
                    }} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order status donut */}
        <div className="db-card" style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Estado pedidos</h2>
            <Link href="/admin/orders" style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
              Ver <ArrowRight size={12} />
            </Link>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <DonutChart segments={donutSegments} size={110} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries(STATUS_CONF).map(([status, conf]) => {
              const count = rangeOrders.filter(o => o.STATUS === status).length;
              const pct = rangeOrders.length > 0 ? Math.round((count / rangeOrders.length) * 100) : 0;
              return (
                <Link key={status} href={`/admin/orders?status=${status}`} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', padding: '3px 0', borderRadius: 6, transition: 'background .1s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: conf.dot, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12, color: '#374151', fontWeight: 500 }}>{conf.label}</span>
                  <div style={{ height: 4, width: 60, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: conf.dot, borderRadius: 4, transition: 'width .5s' }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: conf.color, minWidth: 24, textAlign: 'right' }}>{count}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ Recent orders + Top products ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, marginBottom: 24 }}>

        {/* Recent Orders */}
        <div className="db-card" style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingCart size={15} color="#2563eb" />
              </div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Pedidos recientes</h2>
            </div>
            <Link href="/admin/orders" style={{ fontSize: 12, fontWeight: 600, color: '#6366f1', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
              Ver todos <ChevronRight size={13} />
            </Link>
          </div>
          {isLoading ? (
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 55, height: 12, background: '#f3f4f6', borderRadius: 6, flexShrink: 0 }} />
                  <div style={{ flex: 1, height: 12, background: '#f3f4f6', borderRadius: 6 }} />
                  <div style={{ width: 65, height: 20, background: '#f3f4f6', borderRadius: 10, flexShrink: 0 }} />
                </div>
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>Sin pedidos aún</div>
          ) : (
            <div>
              {recentOrders.slice(0, 7).map((order, i) => {
                const st = STATUS_CONF[order.STATUS] || { label: order.STATUS, color: '#6b7280', bg: '#f9fafb', dot: '#d1d5db' };
                return (
                  <Link key={order.$id} href={`/admin/orders/${order.$id}`} className="db-row-link db-order-row" style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px',
                    textDecoration: 'none', borderBottom: i < 6 ? '1px solid #f9fafb' : 'none',
                    background: 'transparent', transition: 'background .1s',
                  }}>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 600, color: '#9ca3af', flexShrink: 0, width: 56 }}>{order.ORDERCODE}</span>
                    <span style={{ flex: 1, fontSize: 13, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.CUSTOMERNAME}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', flexShrink: 0 }}>{fmt(order.TOTAL)}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, flexShrink: 0, background: st.bg, color: st.color }}>{st.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Top products */}
        <div className="db-card" style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart3 size={15} color="#7c3aed" />
              </div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Top productos</h2>
            </div>
            <Link href="/admin/products" style={{ fontSize: 12, fontWeight: 600, color: '#6366f1', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
              Ver todos <ChevronRight size={13} />
            </Link>
          </div>
          {topProducts.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>Sin datos de ventas</div>
          ) : (
            <div style={{ padding: '8px 0' }}>
              {topProducts.map((p, i) => {
                const maxSold = Math.max(...topProducts.map(x => x.SOLDQUANTITY ?? 0), 1);
                const pct = Math.round(((p.SOLDQUANTITY ?? 0) / maxSold) * 100);
                const colors = ['#6366f1','#0891b2','#059669','#d97706','#ec4899','#7c3aed'];
                return (
                  <div key={p.$id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 20px' }}>
                    <span style={{
                      fontSize: 12, fontWeight: 800, color: '#fff', width: 22, height: 22,
                      borderRadius: '50%', background: colors[i] || '#6b7280',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>{i + 1}</span>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f3f4f6', overflow: 'hidden', flexShrink: 0 }}>
                      {p.IMAGEURL
                        ? <img src={p.IMAGEURL} alt={p.NAME} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <Package size={14} style={{ margin: '10px auto', display: 'block', color: '#d1d5db' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.NAME}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                        <div style={{ flex: 1, height: 5, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                          <div className="db-progress-bar" style={{ height: '100%', width: `${pct}%`, background: colors[i] || '#6366f1', borderRadius: 4, transition: 'width .6s cubic-bezier(0.16,1,0.3,1)' }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', flexShrink: 0 }}>{p.SOLDQUANTITY ?? 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══ Globe & Order Status Row ═══ */}
      <div style={{ marginBottom: 24 }}>
        
        {/* Globe + Panel (Left) */}
        <div className="db-card" style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8, padding: '20px 24px 0' }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>🗺️ Mapa de pedidos por región</h2>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: '3px 0 0' }}>Regiones de Chile · pedidos por ubicación</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981', display: 'inline-block', animation: 'db-fade-up 1.5s infinite alternate' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#059669', background: '#ecfdf5', padding: '3px 10px', borderRadius: 20 }}>
              {rangeOrders.filter(o => o.REGION).length} pedidos rastreados
            </span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1.4fr) 1fr 1fr', gap: 24, alignItems: 'stretch', paddingBottom: 0, flex: 1 }}>
          <ChileMap regionCounts={(() => { const c: Record<string,number> = {}; for (const o of rangeOrders) { const rg = normalizeRegion(o.REGION||''); if (rg) c[rg] = (c[rg]||0)+1; } return c; })()} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 600, overflowY: 'auto', paddingRight: 0 }}>
            {(() => {
              const counts: Record<string, number> = {};
              for (const o of rangeOrders) { const rg = normalizeRegion(o.REGION || ''); if (rg) counts[rg] = (counts[rg] || 0) + 1; }
              const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
              const uniqueRegs = sorted.length;
              const topReg = sorted[0];
              const withRegion = rangeOrders.filter(o => o.REGION).length;
              return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '10px 12px', border: '1px solid #d1fae5' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Región top</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#064e3b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topReg ? topReg[0] : '—'}</div>
                    <div style={{ fontSize: 10, color: '#059669', marginTop: 2 }}>{topReg ? `${topReg[1]} pedidos` : 'Sin datos'}</div>
                  </div>
                  <div style={{ background: '#ecfdf5', borderRadius: 10, padding: '10px 12px', border: '1px solid #d1fae5' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Regiones</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#047857' }}>{uniqueRegs}<span style={{ fontSize: 11, fontWeight: 500, color: '#6b7280' }}>/16</span></div>
                    <div style={{ fontSize: 10, color: '#059669', marginTop: 2 }}>con pedidos</div>
                  </div>
                  <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '10px 12px', border: '1px solid #d1fae5' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Cobertura</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#047857' }}>{rangeOrders.length > 0 ? Math.round((withRegion / rangeOrders.length) * 100) : 0}%</div>
                    <div style={{ fontSize: 10, color: '#059669', marginTop: 2 }}>rastreados</div>
                  </div>
                </div>
              );
            })()}
            {(() => {
              const counts: Record<string, number> = {};
              for (const o of rangeOrders) { const rg = normalizeRegion(o.REGION || ''); if (rg) counts[rg] = (counts[rg] || 0) + 1; }
              const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
              const maxC = sorted[0]?.[1] || 1;
              const total = rangeOrders.length;
              const greenScale = ['#064e3b','#065f46','#047857','#059669','#10b981','#34d399','#6ee7b7'];
              if (sorted.length === 0) return (
                <div style={{ background: '#f9fafb', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Sin datos de región en los pedidos</p>
                </div>
              );
              return (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#064e3b', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>🏆 Ranking de regiones</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {sorted.slice(0, 7).map(([reg, count], i) => {
                      const pct = total > 0 ? ((count / total) * 100) : 0;
                      const barPct = (count / maxC) * 100;
                      const col = greenScale[i] || '#d1fae5';
                      const isTop3 = i < 3;
                      return (
                        <div key={reg} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', borderRadius: 8, background: isTop3 ? '#f0fdf4' : 'transparent' }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', width: 20, height: 20, borderRadius: '50%', background: col, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                              <span style={{ fontSize: 12, fontWeight: isTop3 ? 700 : 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reg}</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: col, flexShrink: 0, marginLeft: 6 }}>{count} <span style={{ fontWeight: 400, fontSize: 9, color: '#9ca3af' }}>({pct.toFixed(0)}%)</span></span>
                            </div>
                            <div style={{ height: 4, background: '#f0fdf4', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${barPct}%`, borderRadius: 3, background: col, transition: 'width .8s cubic-bezier(0.16,1,0.3,1)' }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {sorted.length > 7 && <p style={{ fontSize: 10, color: '#6b7280', margin: '2px 0 0', fontStyle: 'italic' }}>+{sorted.length - 7} regiones más</p>}
                  </div>
                </div>
              );
            })()}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>📦 Últimos pedidos</p>
              {recentOrders.length === 0 ? (
                <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Sin pedidos recientes</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {recentOrders.slice(0, 4).map(o => {
                    const reg = normalizeRegion(o.REGION || '');
                    const sc = STATUS_CONF[o.STATUS] || STATUS_CONF.pending;
                    const ago = Math.round((Date.now() - new Date(o.CREATEDAT).getTime()) / 3600000);
                    return (
                      <div key={o.$id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 8, background: '#f9fafb', border: '1px solid #f3f4f6' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: sc.dot, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {o.CUSTOMERNAME || 'Cliente'} — ${(o.TOTAL || 0).toLocaleString()}
                          </div>
                          <div style={{ fontSize: 10, color: '#9ca3af' }}>
                            {reg || 'Sin región'} · hace {ago < 1 ? '<1h' : `${ago}h`}
                          </div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 600, color: sc.color, background: sc.bg, padding: '2px 6px', borderRadius: 6, flexShrink: 0 }}>{sc.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Columna 3: Revenue + Avg Ticket por región ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0 20px 20px', maxHeight: 600, overflowY: 'auto' }}>
            {(() => {
              const revenueMap: Record<string, number> = {};
              const countMap: Record<string, number> = {};
              for (const o of rangeOrders) {
                const rg = normalizeRegion(o.REGION || '');
                if (!rg) continue;
                countMap[rg] = (countMap[rg] || 0) + 1;
                if (o.STATUS === 'paid' || o.STATUS === 'delivered') {
                  revenueMap[rg] = (revenueMap[rg] || 0) + (o.TOTAL || 0);
                }
              }
              const sorted = Object.entries(revenueMap).sort((a, b) => b[1] - a[1]);
              const maxRev = sorted[0]?.[1] || 1;
              const totalRev = sorted.reduce((s, [, v]) => s + v, 0);

              if (sorted.length === 0) return (
                <div style={{ background: '#f9fafb', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Sin datos de ingresos por región</p>
                </div>
              );

              return (
                <>
                  {/* Summary pills */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div style={{ background: '#f0f9ff', borderRadius: 10, padding: '10px 12px', border: '1px solid #bae6fd' }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Ingresos totales</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#0c4a6e' }}>{fmt(totalRev)}</div>
                      <div style={{ fontSize: 10, color: '#0284c7', marginTop: 2 }}>pedidos pagados</div>
                    </div>
                    <div style={{ background: '#faf5ff', borderRadius: 10, padding: '10px 12px', border: '1px solid #e9d5ff' }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Ticket promedio</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#4c1d95' }}>
                        {fmt(sorted.length > 0 ? Math.round(totalRev / sorted.reduce((s, [rg]) => s + (countMap[rg] || 0), 0)) : 0)}
                      </div>
                      <div style={{ fontSize: 10, color: '#7c3aed', marginTop: 2 }}>por pedido</div>
                    </div>
                  </div>

                  {/* Revenue por región */}
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <DollarSign size={12} color="#6366f1" /> Ingresos por región
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {sorted.slice(0, 7).map(([reg, rev]) => {
                        const cnt = countMap[reg] || 0;
                        const avg = cnt > 0 ? Math.round(rev / cnt) : 0;
                        const barPct = (rev / maxRev) * 100;
                        const share = totalRev > 0 ? ((rev / totalRev) * 100).toFixed(0) : '0';
                        return (
                          <div key={reg} style={{ padding: '8px 10px', borderRadius: 9, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{reg}</span>
                              <span style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', flexShrink: 0, marginLeft: 8 }}>{fmt(rev)}</span>
                            </div>
                            <div style={{ height: 3, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
                              <div style={{ height: '100%', width: `${barPct}%`, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius: 3 }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 10, color: '#94a3b8' }}>{cnt} pedido{cnt !== 1 ? 's' : ''} · avg {fmt(avg)}</span>
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#6366f1' }}>{share}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Estado distribución */}
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Estado de pedidos</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {Object.entries(STATUS_CONF).map(([status, conf]) => {
                        const cnt = rangeOrders.filter(o => o.STATUS === status).length;
                        if (cnt === 0) return null;
                        const pct = rangeOrders.length > 0 ? Math.round((cnt / rangeOrders.length) * 100) : 0;
                        return (
                          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: conf.dot, flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: '#374151', flex: 1 }}>{conf.label}</span>
                            <div style={{ width: 50, height: 3, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: conf.dot, borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: conf.color, width: 28, textAlign: 'right' }}>{cnt}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
      </div>

      {/* ═══ Quick actions ═══ */}
      <div style={{ marginBottom: 8 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 14px' }}>Acciones rápidas</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          {[
            { label: 'Agregar producto', href: '/admin/products', color: '#6366f1', bg: '#eef2ff', icon: <Plus size={16} color="#6366f1" /> },
            { label: 'Ver pedidos', href: '/admin/orders', color: '#0891b2', bg: '#ecfeff', icon: <ShoppingCart size={16} color="#0891b2" /> },
            { label: 'Ver analytics', href: '/admin/analytics', color: '#059669', bg: '#ecfdf5', icon: <BarChart3 size={16} color="#059669" /> },
            { label: 'Crear oferta', href: '/admin/timed-offers', color: '#d97706', bg: '#fffbeb', icon: <Zap size={16} color="#d97706" /> },
          ].map(a => (
            <Link key={a.href} href={a.href} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
              background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
              textDecoration: 'none', transition: 'all .15s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.boxShadow = `0 4px 12px ${a.color}22`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'none'; }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {a.icon}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{a.label}</span>
              <ArrowRight size={14} color="#d1d5db" style={{ marginLeft: 'auto' }} />
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
