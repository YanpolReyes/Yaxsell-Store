'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Lock, ExternalLink, Loader, Zap, Eye, Palette, Pencil } from 'lucide-react';

interface Template {
  id: number;
  name: string;
  description: string;
  emoji: string;
  tags: string[];
  accent: string;
  accentDark: string;
  bg: string;
  navBg: string;
  locked?: boolean;
  badge?: string;
}

const TEMPLATES: Template[] = [
  {
    id: 1,
    name: 'Moderna',
    description: 'Diseño limpio y minimalista. Fondo blanco, tipografía grande, acentos en violeta. Ideal para marcas premium.',
    emoji: '🛍️',
    tags: ['Minimalista', 'Profesional', 'Violeta'],
    accent: '#667eea', accentDark: '#764ba2', bg: '#f8f9fa', navBg: '#667eea',
    badge: 'Popular',
  },
  {
    id: 2,
    name: 'Marketplace',
    description: 'Estilo mercado masivo. Cabecera amarilla, búsqueda prominente, tarjetas compactas.',
    emoji: '🏪',
    tags: ['Masivo', 'Búsqueda', 'Amarillo'],
    accent: '#3483fa', accentDark: '#2968c8', bg: '#ebebeb', navBg: '#fff159',
  },
  {
    id: 3,
    name: 'Retail',
    description: 'Estilo tienda por departamentos. Cabecera naranja, sidebar de categorías, grid denso.',
    emoji: '🟠',
    tags: ['Departamentos', 'Sidebar', 'Naranja'],
    accent: '#f96302', accentDark: '#c94d00', bg: '#f5f5f5', navBg: '#f96302',
  },
  {
    id: 4,
    name: 'Chinamart',
    description: 'Landing page premium con hero cinematic, servicios, testimonios y contacto. Ideal para marcas e importadores.',
    emoji: '🎨',
    tags: ['Landing', 'Premium', 'Naranja'],
    accent: '#F97316', accentDark: '#EA6C0A', bg: '#FAFAFA', navBg: '#1A1A1A',
  },
];

function TemplatePreview({ t, isActive }: { t: Template; isActive: boolean }) {
  return (
    <div style={{ height: 160, background: t.bg, borderRadius: '12px 12px 0 0', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
      {/* Navbar */}
      <div style={{ height: 34, background: t.navBg, display: 'flex', alignItems: 'center', padding: '0 10px', gap: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
        <div style={{ width: 52, height: 8, borderRadius: 4, background: t.id === 2 ? '#333' : 'rgba(255,255,255,0.7)' }} />
        {t.id === 2 && <div style={{ flex: 1, height: 18, borderRadius: 4, background: '#fff', margin: '0 6px' }} />}
        <div style={{ marginLeft: t.id === 2 ? 0 : 'auto', display: 'flex', gap: 4 }}>
          <div style={{ width: 22, height: 6, borderRadius: 3, background: t.id === 2 ? '#999' : 'rgba(255,255,255,0.5)' }} />
          <div style={{ width: 22, height: 6, borderRadius: 3, background: t.id === 2 ? '#999' : 'rgba(255,255,255,0.5)' }} />
        </div>
      </div>

      {/* Hero banner */}
      <div style={{ height: 30, background: `linear-gradient(90deg, ${t.accent}22, ${t.accentDark}11)`, borderBottom: `2px solid ${t.accent}30`, display: 'flex', alignItems: 'center', padding: '0 10px', gap: 8 }}>
        <div style={{ width: 80, height: 6, borderRadius: 3, background: `${t.accent}80` }} />
        <div style={{ width: 40, height: 14, borderRadius: 4, background: t.accent, marginLeft: 4 }} />
      </div>

      {/* Content area */}
      <div style={{ display: 'flex', flex: 1, padding: 6, gap: 5 }}>
        {t.id === 3 && (
          <div style={{ width: 42, display: 'flex', flexDirection: 'column', gap: 3, paddingTop: 2 }}>
            {[70, 90, 75, 85, 60].map((w, i) => (
              <div key={i} style={{ height: 5, borderRadius: 2, background: '#ccc', width: `${w}%` }} />
            ))}
          </div>
        )}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: t.id === 1 ? '1fr 1fr' : '1fr 1fr 1fr', gap: 4 }}>
          {[...Array(t.id === 1 ? 4 : 6)].map((_, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 5, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <div style={{ height: 22, background: `linear-gradient(135deg, ${t.accent}25, ${t.accentDark}15)` }} />
              <div style={{ padding: '3px 4px' }}>
                <div style={{ height: 4, borderRadius: 2, background: '#e5e7eb', width: '75%', marginBottom: 2 }} />
                <div style={{ height: 5, borderRadius: 2, background: t.accent, width: '50%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lock overlay */}
      {t.locked && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(249,250,251,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: 11, color: '#6b7280', fontWeight: 600 }}>
            <Lock size={12} /> Próximamente
          </div>
        </div>
      )}

      {/* Active badge */}
      {isActive && (
        <div style={{ position: 'absolute', top: 8, right: 8, background: '#10b981', color: '#fff', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 3, letterSpacing: '0.04em' }}>
          <Check size={9} /> EN USO
        </div>
      )}
    </div>
  );
}

export default function PlantillasPage() {
  const [activeTemplate, setActiveTemplate] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/template', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setActiveTemplate(Number(data.template) || 1);
        }
      } catch {
        setActiveTemplate(1);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function activateTemplate(id: number) {
    setSaving(true);
    try {
      const res = await fetch('/api/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: id }),
      });
      if (res.ok) {
        setActiveTemplate(id);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const err = await res.json();
        alert('Error al guardar: ' + (err.error || 'desconocido'));
      }
    } catch (e) {
      console.error(e);
      alert('Error al guardar la plantilla.');
    } finally {
      setSaving(false);
    }
  }

  const activeInfo = TEMPLATES.find(t => t.id === activeTemplate)!;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '4px 0 32px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Palette size={18} color="#fff" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Plantillas de Tienda</h1>
          </div>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Elige y activa el diseño visual de tu tienda web. Los cambios son inmediatos.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          {saved && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#059669', background: '#ecfdf5', border: '1px solid #6ee7b7', padding: '6px 14px', borderRadius: 20, fontWeight: 600 }}>
              <Check size={13} /> ¡Plantilla activada!
            </span>
          )}
          <a
            href="http://localhost:3003"
            target="_blank"
            rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#374151', background: '#fff', border: '1px solid #e5e7eb', padding: '7px 14px', borderRadius: 8, fontWeight: 600, textDecoration: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
          >
            <Eye size={13} /> Ver tienda
          </a>
        </div>
      </div>

      {/* ── Active banner ── */}
      {!loading && (
        <div style={{ background: `linear-gradient(135deg, ${activeInfo.accent}18, ${activeInfo.accentDark}08)`, border: `1.5px solid ${activeInfo.accent}40`, borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', flexShrink: 0 }}>
            {activeInfo.emoji}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Plantilla activa: <span style={{ color: activeInfo.accent }}>{activeInfo.name}</span></div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{activeInfo.description}</div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
            {[activeInfo.accent, activeInfo.accentDark, activeInfo.bg].map((c, i) => (
              <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: c, border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
            ))}
          </div>
        </div>
      )}

      {/* ── Grid ── */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
          <Loader size={24} style={{ color: '#667eea', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {TEMPLATES.map(t => {
            const isActive = activeTemplate === t.id;
            const isHov = hovered === t.id && !t.locked && !isActive;
            return (
              <div
                key={t.id}
                onMouseEnter={() => setHovered(t.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  border: isActive ? `2px solid ${t.accent}` : isHov ? '2px solid #d1d5db' : '2px solid #f3f4f6',
                  boxShadow: isActive ? `0 4px 20px ${t.accent}25` : isHov ? '0 4px 16px rgba(0,0,0,0.08)' : '0 1px 4px rgba(0,0,0,0.04)',
                  overflow: 'hidden',
                  transition: 'all 0.18s ease',
                  opacity: t.locked ? 0.65 : 1,
                  cursor: t.locked ? 'default' : 'pointer',
                }}
              >
                <TemplatePreview t={t} isActive={isActive} />

                <div style={{ padding: '14px 16px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Plantilla {t.id} — {t.name}</span>
                        {t.badge && (
                          <span style={{ fontSize: 9, fontWeight: 700, background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: 20, letterSpacing: '0.04em' }}>
                            {t.badge.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>{t.description}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
                    {t.tags.map(tag => (
                      <span key={tag} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: '#f3f4f6', color: '#4b5563', fontWeight: 600 }}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {[t.accent, t.accentDark, t.navBg].map((c, i) => (
                        <div key={i} title={c} style={{ width: 16, height: 16, borderRadius: '50%', background: c, border: '2px solid #f3f4f6', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }} />
                      ))}
                    </div>
                    {!t.locked && isActive && (
                      <button
                        onClick={() => router.push(`/admin/theme-editor?t=${t.id}`)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          fontSize: 12, fontWeight: 600,
                          padding: '7px 14px', borderRadius: 8,
                          background: '#f3f4f6', color: '#374151',
                          border: '1px solid #e5e7eb', cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#e5e7eb'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#f3f4f6'; }}
                      >
                        <Pencil size={12} /> Editar
                      </button>
                    )}
                    {t.locked ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>
                        <Lock size={11} /> Bloqueada
                      </span>
                    ) : isActive ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#059669', fontWeight: 700 }}>
                        <Check size={13} /> En uso
                      </span>
                    ) : (
                      <button
                        onClick={() => activateTemplate(t.id)}
                        disabled={saving}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          fontSize: 12, fontWeight: 700,
                          padding: '7px 16px', borderRadius: 8,
                          background: isHov ? t.accent : '#111827',
                          color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                          opacity: saving ? 0.6 : 1,
                          transition: 'background 0.15s',
                        }}
                      >
                        {saving ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={12} />}
                        Activar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Info ── */}
      <div style={{ marginTop: 20, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#92400e', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
        <div>
          <strong>¿Cómo funciona?</strong> La plantilla seleccionada se guarda en Appwrite y la tienda la carga automáticamente.
          Los cambios son inmediatos — basta con recargar{' '}
          <a href="http://localhost:3003" target="_blank" rel="noreferrer" style={{ color: '#b45309', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            localhost:3003 <ExternalLink size={11} />
          </a>.
        </div>
      </div>
    </div>
  );
}
