import { Suspense } from 'react';
import ThemeEditorClient from './ThemeEditorClient';

export const dynamic = 'force-dynamic';

const THEME_EDITOR_DISABLED = true; // ⚠️ Temporal: deshabilitado para evitar que resetee la config

export default function ThemeEditorPage() {
  if (THEME_EDITOR_DISABLED) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui', background: '#f9fafb' }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 20 }}>🚧</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Editor Visual Deshabilitado</h1>
        <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 400, textAlign: 'center', lineHeight: 1.6 }}>
          El editor está temporalmente fuera de servicio para evitar que sobreescriba la configuración de la plantilla con los valores predeterminados.
        </p>
        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 16 }}>
          Cambia <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>THEME_EDITOR_DISABLED = false</code> en <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>theme-editor/page.tsx</code> para reactivarlo.
        </p>
      </div>
    );
  }
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui' }}>Cargando editor...</div>}>
      <ThemeEditorClient />
    </Suspense>
  );
}
