'use client';

import { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, GripVertical, ChevronDown, ChevronUp, RotateCcw, Save, CheckCircle, Settings2, Palette, Type, Hash } from 'lucide-react';
import { SectionConfig, SectionSettings, getSectionConfig, saveSectionConfig, resetSectionConfig } from '@/lib/section-config';

/* Only show these section IDs in the custom template editor */
const CUSTOM_IDS = new Set([
  'cm_navbar',
  'cm_hero',
  'cm_services',
  'cm_about',
  'cm_products',
  'cm_testimonials',
  'cm_contact',
  'cm_footer',
]);

export default function SectionsCustomPage() {
  const [allSections, setAllSections] = useState<SectionConfig[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  /* Load all sections (we save ALL back so we don't lose non-custom ones) */
  useEffect(() => {
    setAllSections(getSectionConfig());
  }, []);

  /* Derived: only the custom subset */
  const sections = allSections.filter(s => CUSTOM_IDS.has(s.id));

  const handleSave = useCallback(() => {
    /* Rebuild order for the custom subset, then merge back into allSections */
    const customOrdered = sections.map((s, i) => ({ ...s, order: i }));
    const customMap = new Map(customOrdered.map(s => [s.id, s]));
    const merged = allSections.map(s => customMap.get(s.id) ?? s);
    saveSectionConfig(merged);
    setAllSections(merged);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }, [sections, allSections]);

  const handleReset = useCallback(() => {
    if (confirm('¿Restaurar secciones personalizadas a valores predeterminados?')) {
      resetSectionConfig();
      setAllSections(getSectionConfig());
    }
  }, []);

  function toggleSection(id: string) {
    setAllSections(prev => prev.map(s => s.id === id && !s.locked ? { ...s, enabled: !s.enabled } : s));
  }

  function updateSettings(id: string, patch: Partial<SectionSettings>) {
    setAllSections(prev => prev.map(s => s.id === id ? { ...s, settings: { ...s.settings, ...patch } } : s));
  }

  function moveSection(fromIdx: number, toIdx: number) {
    if (toIdx < 0 || toIdx >= sections.length) return;
    /* Operate on allSections using the real indices */
    const realFrom = allSections.findIndex(s => s.id === sections[fromIdx].id);
    const realTo = allSections.findIndex(s => s.id === sections[toIdx].id);
    if (realFrom === -1 || realTo === -1) return;
    const next = [...allSections];
    const [moved] = next.splice(realFrom, 1);
    next.splice(realTo, 0, moved);
    setAllSections(next);
  }

  function handleDragStart(idx: number) { setDragIdx(idx); }
  function handleDragOver(e: React.DragEvent, idx: number) { e.preventDefault(); setDragOverIdx(idx); }
  function handleDrop(idx: number) {
    if (dragIdx !== null && dragIdx !== idx) moveSection(dragIdx, idx);
    setDragIdx(null); setDragOverIdx(null);
  }
  function handleDragEnd() { setDragIdx(null); setDragOverIdx(null); }

  const enabledCount = sections.filter(s => s.enabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🎨 Editor de Tema Personalizado</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configura las secciones de tu plantilla personalizada. El <strong>encabezado</strong> y <strong>pie de página</strong> nativos se conservan automáticamente.
            <span className="ml-2 text-orange-600 font-medium">{enabledCount} de {sections.length} activas</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Restaurar
          </button>
          <button onClick={handleSave}
            className="px-5 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition flex items-center gap-2 shadow-sm">
            {saved ? <><CheckCircle className="w-4 h-4" /> Guardado</> : <><Save className="w-4 h-4" /> Guardar cambios</>}
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-orange-700 mb-1">PLANTILLA PERSONALIZADA</p>
        <p className="text-xs text-orange-600">
          Esta vista muestra <strong>todas las secciones de la plantilla personalizada</strong> (Chinamart).
          Cada sección es independiente: puedes activarla, desactivarla, reordenarla o configurarla.
        </p>
      </div>

      {/* Preview bar */}
      <div className="bg-gradient-to-r from-orange-50/60 to-amber-50/60 border border-orange-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-orange-700 mb-2">VISTA PREVIA DEL ORDEN</p>
        <div className="flex flex-wrap gap-2">
          {sections.filter(s => s.enabled).map(s => (
            <span key={s.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-orange-200 rounded-full text-xs font-medium text-gray-700 shadow-sm">
              <span>{s.icon}</span> {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Section list */}
      <div className="space-y-2">
        {sections.map((section, idx) => {
          const isExpanded = expandedId === section.id;
          const isDragging = dragIdx === idx;
          const isDragOver = dragOverIdx === idx;
          const isHeader = false; /* All chinamart sections are draggable */

          return (
            <div key={section.id}
              draggable={!isHeader}
              onDragStart={() => !isHeader && handleDragStart(idx)}
              onDragOver={e => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={handleDragEnd}
              className={`bg-white rounded-xl border transition-all ${
                isDragging ? 'opacity-40 scale-[0.98]' : ''
              } ${isDragOver ? 'border-orange-400 ring-2 ring-orange-100' : 'border-gray-200'} ${
                !section.enabled ? 'bg-gray-50' : ''
              } border-l-4 border-l-orange-400`}
            >
              {/* Main row */}
              <div className="flex items-center gap-3 p-4">
                {/* Drag handle */}
                <div className={`${isHeader ? 'text-gray-200 cursor-default' : 'cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500'} transition`}>
                  <GripVertical className="w-5 h-5" />
                </div>

                {/* Icon */}
                <span className="text-2xl w-10 text-center shrink-0">{section.icon}</span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold text-sm ${section.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                      {section.label}
                    </p>
                    {section.locked && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-bold">FIJA</span>
                    )}
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-mono">#{idx + 1}</span>
                  </div>
                  <p className={`text-xs mt-0.5 ${section.enabled ? 'text-gray-500' : 'text-gray-400'}`}>
                    {section.description}
                  </p>
                </div>

                {/* Move buttons */}
                {!isHeader && (
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveSection(idx, idx - 1)} disabled={idx === 0}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-20 transition">
                      <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                    <button onClick={() => moveSection(idx, idx + 1)} disabled={idx === sections.length - 1}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-20 transition">
                      <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                  </div>
                )}

                {/* Toggle */}
                <button onClick={() => toggleSection(section.id)}
                  disabled={section.locked}
                  className={`p-2 rounded-lg transition ${
                    section.enabled
                      ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  } ${section.locked ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {section.enabled ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>

                {/* Expand settings */}
                <button onClick={() => setExpandedId(isExpanded ? null : section.id)}
                  className="p-2 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition">
                  <Settings2 className="w-4 h-4" />
                </button>
              </div>

              {/* Expanded settings panel */}
              {isExpanded && (
                <div className="border-t border-gray-100 p-4 bg-gray-50/50 space-y-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Configuración de sección</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <SettingField icon={<Type className="w-4 h-4" />} label="Título"
                      value={section.settings.title || ''}
                      onChange={v => updateSettings(section.id, { title: v })}
                      placeholder="Título de la sección" />
                    <SettingField icon={<Type className="w-4 h-4" />} label="Subtítulo"
                      value={section.settings.subtitle || ''}
                      onChange={v => updateSettings(section.id, { subtitle: v })}
                      placeholder="Texto secundario" />
                    <SettingField icon={<Hash className="w-4 h-4" />} label="Cantidad de items"
                      value={String(section.settings.itemsCount || '')}
                      onChange={v => updateSettings(section.id, { itemsCount: parseInt(v) || undefined })}
                      placeholder="8" type="number" />
                    <SettingField icon={<Palette className="w-4 h-4" />} label="Color de fondo"
                      value={section.settings.bgColor || ''}
                      onChange={v => updateSettings(section.id, { bgColor: v })}
                      placeholder="#ffffff" />
                    <SettingField icon={<Palette className="w-4 h-4" />} label="Color de texto"
                      value={section.settings.textColor || ''}
                      onChange={v => updateSettings(section.id, { textColor: v })}
                      placeholder="#333333" />
                  </div>

                  {/* Custom CSS */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">CSS personalizado (avanzado)</label>
                    <textarea
                      value={section.settings.customCSS || ''}
                      onChange={e => updateSettings(section.id, { customCSS: e.target.value })}
                      placeholder=".section { border-radius: 16px; }"
                      className="w-full px-3 py-2 text-sm font-mono border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-y"
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Help text */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-semibold text-gray-500 mb-2">💡 CONSEJOS</p>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• <strong>Arrastra</strong> las secciones para cambiar el orden en la plantilla personalizada.</li>
          <li>• El ícono del <strong>ojo</strong> activa o desactiva cada sección individualmente.</li>
          <li>• Haz clic en el ícono de <strong>engranaje</strong> para configurar títulos, colores y más.</li>
          <li>• Este editor es <strong>independiente</strong> del editor de secciones nativas (plantillas 1, 2 y 3).</li>
          <li>• Los cambios se aplican al hacer clic en <strong>&quot;Guardar cambios&quot;</strong>.</li>
        </ul>
      </div>
    </div>
  );
}

/* ─── Reusable settings field ─── */
function SettingField({ icon, label, value, onChange, placeholder, type = 'text' }: {
  icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
        {icon} {label}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
      />
    </div>
  );
}
