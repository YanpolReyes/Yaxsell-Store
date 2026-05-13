'use client';

import { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, GripVertical, ChevronDown, ChevronUp, RotateCcw, Save, CheckCircle, Settings2, Palette, Type, Hash, ToggleLeft, ImageIcon } from 'lucide-react';
import { SectionConfig, SectionSettings, getSectionConfig, saveSectionConfig, resetSectionConfig } from '@/lib/section-config';

export default function SectionsPage() {
  const [sections, setSections] = useState<SectionConfig[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  useEffect(() => {
    setSections(getSectionConfig());
  }, []);

  const handleSave = useCallback(() => {
    const reordered = sections.map((s, i) => ({ ...s, order: i }));
    saveSectionConfig(reordered);
    setSections(reordered);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }, [sections]);

  const handleReset = useCallback(() => {
    if (confirm('¿Restaurar todas las secciones a los valores predeterminados?')) {
      resetSectionConfig();
      setSections(getSectionConfig());
    }
  }, []);

  function toggleSection(id: string) {
    setSections(prev => prev.map(s => s.id === id && !s.locked ? { ...s, enabled: !s.enabled } : s));
  }

  function updateSettings(id: string, patch: Partial<SectionSettings>) {
    setSections(prev => prev.map(s => s.id === id ? { ...s, settings: { ...s.settings, ...patch } } : s));
  }

  function moveSection(fromIdx: number, toIdx: number) {
    if (toIdx < 0 || toIdx >= sections.length) return;
    const next = [...sections];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setSections(next);
  }

  // Drag handlers
  function handleDragStart(idx: number) {
    setDragIdx(idx);
  }
  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    setDragOverIdx(idx);
  }
  function handleDrop(idx: number) {
    if (dragIdx !== null && dragIdx !== idx) {
      moveSection(dragIdx, idx);
    }
    setDragIdx(null);
    setDragOverIdx(null);
  }
  function handleDragEnd() {
    setDragIdx(null);
    setDragOverIdx(null);
  }

  const enabledCount = sections.filter(s => s.enabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editor de Secciones</h1>
          <p className="text-sm text-gray-500 mt-1">
            Arrastra para reordenar, activa/desactiva y configura cada sección de tu homepage.
            <span className="ml-2 text-indigo-600 font-medium">{enabledCount} de {sections.length} activas</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Restaurar
          </button>
          <button onClick={handleSave}
            className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm">
            {saved ? <><CheckCircle className="w-4 h-4" /> Guardado</> : <><Save className="w-4 h-4" /> Guardar cambios</>}
          </button>
        </div>
      </div>

      {/* Preview bar */}
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-indigo-700 mb-2">VISTA PREVIA DEL ORDEN</p>
        <div className="flex flex-wrap gap-2">
          {sections.filter(s => s.enabled).map(s => (
            <span key={s.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 rounded-full text-xs font-medium text-gray-700 shadow-sm">
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

          return (
            <div key={section.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={e => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={handleDragEnd}
              className={`bg-white rounded-xl border transition-all ${
                isDragging ? 'opacity-40 scale-[0.98]' : ''
              } ${isDragOver ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-gray-200'} ${
                !section.enabled ? 'bg-gray-50' : ''
              }`}
            >
              {/* Main row */}
              <div className="flex items-center gap-3 p-4">
                {/* Drag handle */}
                <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition">
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
                    <SettingField icon={<Hash className="w-4 h-4" />} label="Columnas"
                      value={String(section.settings.columns || '')}
                      onChange={v => updateSettings(section.id, { columns: parseInt(v) || undefined })}
                      placeholder="Auto" type="number" />
                  </div>

                  <div className="flex flex-wrap gap-4 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox"
                        checked={section.settings.showViewAll ?? true}
                        onChange={e => updateSettings(section.id, { showViewAll: e.target.checked })}
                        className="w-4 h-4 accent-indigo-600" />
                      <span className="text-sm text-gray-700">Mostrar "Ver todos"</span>
                    </label>
                    {(section.id === 'hero_carousel' || section.id === 'recommended') && (
                      <>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox"
                            checked={section.settings.autoplay ?? true}
                            onChange={e => updateSettings(section.id, { autoplay: e.target.checked })}
                            className="w-4 h-4 accent-indigo-600" />
                          <span className="text-sm text-gray-700">Autoplay</span>
                        </label>
                        {section.settings.autoplay && (
                          <SettingField icon={<ToggleLeft className="w-4 h-4" />} label="Velocidad (ms)"
                            value={String(section.settings.autoplaySpeed || 5000)}
                            onChange={v => updateSettings(section.id, { autoplaySpeed: parseInt(v) || 5000 })}
                            placeholder="5000" type="number" inline />
                        )}
                      </>
                    )}
                  </div>

                  {/* Marquee-specific fields */}
                  {(section.id === 'tpl1_marquee' || section.id === 'tpl1_marquee_2') && (
                    <div className="border-t border-gray-100 pt-4 mt-2 space-y-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Texto Animado</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <SettingField icon={<Type className="w-4 h-4" />} label="Texto 1"
                          value={section.id === 'tpl1_marquee_2' ? (section.settings.marquee2Text1 || '') : (section.settings.marqueeText1 || '')}
                          onChange={v => updateSettings(section.id, section.id === 'tpl1_marquee_2' ? { marquee2Text1: v } : { marqueeText1: v })}
                          placeholder="Beauty Redefined" />
                        <SettingField icon={<Type className="w-4 h-4" />} label="Texto 2"
                          value={section.id === 'tpl1_marquee_2' ? (section.settings.marquee2Text2 || '') : (section.settings.marqueeText2 || '')}
                          onChange={v => updateSettings(section.id, section.id === 'tpl1_marquee_2' ? { marquee2Text2: v } : { marqueeText2: v })}
                          placeholder="Gracefully Ageless" />
                        <SettingField icon={<Type className="w-4 h-4" />} label="Texto 3"
                          value={section.id === 'tpl1_marquee_2' ? (section.settings.marquee2Text3 || '') : (section.settings.marqueeText3 || '')}
                          onChange={v => updateSettings(section.id, section.id === 'tpl1_marquee_2' ? { marquee2Text3: v } : { marqueeText3: v })}
                          placeholder="Timeless Elegance" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <SettingField icon={<ImageIcon className="w-4 h-4" />} label="Imagen 1 URL"
                          value={section.id === 'tpl1_marquee_2' ? (section.settings.marquee2Image1 || '') : (section.settings.marqueeImage1 || '')}
                          onChange={v => updateSettings(section.id, section.id === 'tpl1_marquee_2' ? { marquee2Image1: v } : { marqueeImage1: v })}
                          placeholder="URL de imagen" />
                        <SettingField icon={<ImageIcon className="w-4 h-4" />} label="Imagen 2 URL"
                          value={section.id === 'tpl1_marquee_2' ? (section.settings.marquee2Image2 || '') : (section.settings.marqueeImage2 || '')}
                          onChange={v => updateSettings(section.id, section.id === 'tpl1_marquee_2' ? { marquee2Image2: v } : { marqueeImage2: v })}
                          placeholder="URL de imagen" />
                        <SettingField icon={<ImageIcon className="w-4 h-4" />} label="Imagen 3 URL"
                          value={section.id === 'tpl1_marquee_2' ? (section.settings.marquee2Image3 || '') : (section.settings.marqueeImage3 || '')}
                          onChange={v => updateSettings(section.id, section.id === 'tpl1_marquee_2' ? { marquee2Image3: v } : { marqueeImage3: v })}
                          placeholder="URL de imagen (opcional)" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <SettingField icon={<Hash className="w-4 h-4" />} label="Velocidad (seg)"
                          value={String(section.id === 'tpl1_marquee_2' ? (section.settings.marquee2Speed || 18) : (section.settings.marqueeSpeed || 18))}
                          onChange={v => updateSettings(section.id, section.id === 'tpl1_marquee_2' ? { marquee2Speed: parseInt(v) || 18 } : { marqueeSpeed: parseInt(v) || 18 })}
                          placeholder="18" type="number" inline />
                        <SettingField icon={<Hash className="w-4 h-4" />} label="Altura imagen (px)"
                          value={String(section.id === 'tpl1_marquee_2' ? (section.settings.marquee2ImageHeight || 32) : (section.settings.marqueeImageHeight || 50))}
                          onChange={v => updateSettings(section.id, section.id === 'tpl1_marquee_2' ? { marquee2ImageHeight: parseInt(v) || 32 } : { marqueeImageHeight: parseInt(v) || 50 })}
                          placeholder="50" type="number" inline />
                      </div>
                    </div>
                  )}

                  {/* Custom CSS */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">CSS personalizado (avanzado)</label>
                    <textarea
                      value={section.settings.customCSS || ''}
                      onChange={e => updateSettings(section.id, { customCSS: e.target.value })}
                      placeholder=".section { border-radius: 16px; }"
                      className="w-full px-3 py-2 text-sm font-mono border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y"
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
          <li>• <strong>Arrastra</strong> las secciones para cambiar el orden en tu homepage.</li>
          <li>• El ícono del <strong>ojo</strong> activa o desactiva la sección. Las secciones marcadas como "FIJA" no se pueden desactivar.</li>
          <li>• Haz clic en el ícono de <strong>engranaje</strong> para configurar títulos, colores y comportamiento.</li>
          <li>• Los cambios se aplican al hacer clic en <strong>"Guardar cambios"</strong> y se verán de inmediato en la tienda.</li>
        </ul>
      </div>
    </div>
  );
}

/* ─── Reusable settings field ─── */
function SettingField({ icon, label, value, onChange, placeholder, type = 'text', inline = false }: {
  icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; inline?: boolean;
}) {
  return (
    <div className={inline ? 'flex items-center gap-2' : ''}>
      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
        {icon} {label}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inline ? 'w-24' : 'w-full'} px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none`}
      />
    </div>
  );
}
