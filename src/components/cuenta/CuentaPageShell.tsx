'use client';

import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const FF = '"DM Sans",system-ui,sans-serif';
const PINK = '#ec4899';

export interface PromoHint {
  id: string;
  title: string;
  desc: string;
  href: string;
  gradient: string;
  badge?: string;
}

interface Props {
  title: string;
  subtitle?: string;
  backHref?: string;
  promos?: PromoHint[];
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}

export default function CuentaPageShell({
  title,
  subtitle,
  backHref = '/cuenta',
  promos,
  children,
  headerRight,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ minHeight: '100vh', fontFamily: FF, background: 'linear-gradient(180deg, #fff5f8 0%, #fafafa 220px)' }}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #fce7f3',
          padding: '14px 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 720, margin: '0 auto' }}>
          <Link
            href={backHref}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: '#fdf2f8',
              border: '1px solid #fce7f3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={20} color={PINK} strokeWidth={2.5} />
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#111827', letterSpacing: '-0.02em' }}>{title}</h1>
            {subtitle && (
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>{subtitle}</p>
            )}
          </div>
          {headerRight}
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 16px 48px' }}>
        {promos && promos.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Sparkles size={14} color={PINK} />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Promociones activas
              </span>
            </div>
            <motion.div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {promos.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    href={p.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '14px 16px',
                      borderRadius: 16,
                      background: p.gradient,
                      textDecoration: 'none',
                      boxShadow: '0 8px 24px rgba(236,72,153,0.15)',
                      border: '1px solid rgba(255,255,255,0.25)',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      {p.badge && (
                        <span
                          style={{
                            display: 'inline-block',
                            marginBottom: 4,
                            padding: '2px 8px',
                            borderRadius: 999,
                            background: 'rgba(255,255,255,0.25)',
                            fontSize: 9,
                            fontWeight: 800,
                            color: '#fff',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                          }}
                        >
                          {p.badge}
                        </span>
                      )}
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#fff' }}>{p.title}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.88)', fontWeight: 500 }}>{p.desc}</p>
                    </div>
                    <span style={{ fontSize: 18, color: '#fff', flexShrink: 0 }}>→</span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}
        {children}
      </div>
    </motion.div>
  );
}
