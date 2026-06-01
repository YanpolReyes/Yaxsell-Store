'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, Plus, Save, Trash2, CheckCircle, Edit2, X, GripVertical, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { isAdminEmail } from '@/lib/admin-access';

interface Agency {
  id: string;
  name: string;
  color: string;
  bg: string;
  desc: string;
  logo: string;
  active: boolean;
}

const DEFAULTS: Agency[] = [
  { id: '', name: 'STARKEN',          color: '#1a7f37', bg: '#e6f4ea', desc: 'Entrega rápida y confiable',   logo: 'https://media.licdn.com/dms/image/v2/C510BAQGf7frAaAcogw/company-logo_200_200/company-logo_200_200/0/1631323622266?e=2147483647&v=beta&t=PQt6O5DgEP72brYnRu0ypoR_k9rrAIQ7XAHmQL0Q1uM', active: true },
  { id: '', name: 'BLUEXPRESS',       color: '#1558b0', bg: '#e8f0fe', desc: 'Servicio express premium',    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSz2T8HSqmWqmSShlCx8iGNP2tkT_OGLK4cdg&s', active: true },
  { id: '', name: 'VARMONTT',          color: '#c62828', bg: '#fce8e6', desc: 'Cobertura nacional completa', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEPQN4hjn8F2PQXVmphZVnstiaQTEs4ILyArmNbu1DjCaj2EfwPxnUnEWLEUivCr_95IE&usqp=CAU', active: true },
  { id: '', name: 'RETIRO EN TIENDA',  color: '#e65c00', bg: '#fff3e0', desc: 'Retira en nuestra sucursal',  logo: '', active: true },
];

const EMPTY_AGENCY: Omit<Agency, 'id'> = {
  name: '', color: '#3483fa', bg: '#e8f0fe', desc: '', logo: '', active: true,
};

export default function AgenciasPage() {
  const router = useRouter();
  const { user, isLoggedIn, isLoading: authLoading, logout } = useAuth();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [newForm, setNewForm] = useState<Omit<Agency, 'id'> | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) { router.replace('/admin/login'); return; }
    if (!isAdminEmail(user?.email)) { logout().finally(() => router.replace('/admin/login')); }
  }, [authLoading, isLoggedIn, user?.email, router, logout]);

  const loadAgencies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agencies');
      const data = await res.json();
      if (data.agencies && data.agencies.length > 0) {
        setAgencies(data.agencies);
      } else {
        setAgencies(DEFAULTS);
      }
    } catch {
      setAgencies(DEFAULTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAgencies(); }, [loadAgencies]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/agencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencies }),
      });
      const data = await res.json();
      if (data.success && data.agencies) {
        setAgencies(data.agencies);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      alert('Error al guardar: ' + (e instanceof Error ? e.message : e));
    } finally {
      setSaving(false);
    }
  }

  function toggleActive(id: string) {
    setAgencies(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
  }

  function deleteAgency(id: string) {
    if (!confirm('¿Eliminar esta agencia?')) return;
    setAgencies(prev => prev.filter(a => a.id !== id));
  }

  function updateField(id: string, key: keyof Agency, val: string | boolean) {
    setAgencies(prev => prev.map(a => a.id === id ? { ...a, [key]: val } : a));
  }

  function addAgency() {
    if (!newForm?.name.trim()) return;
    const agency: Agency = { ...newForm, id: Date.now().toString(), name: newForm.name.trim().toUpperCase() };
    setAgencies(prev => [...prev, agency]);
    setNewForm(null);
  }

  const inp = 'w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-indigo-400 bg-white';

  if (authLoading) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-500" />
            Agencias de envío
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Estas agencias aparecen en el checkout de la tienda.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadAgencies} disabled={loading}
            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleSave} disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${saved ? 'bg-green-500' : 'bg-indigo-600 hover:bg-indigo-700'} disabled:opacity-60`}>
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando...</>
            ) : saved ? (
              <><CheckCircle className="w-4 h-4" />Guardado</>
            ) : (
              <><Save className="w-4 h-4" />Guardar cambios</>
            )}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Agency list */}
      {!loading && (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {agencies.map(agency => (
            <div key={agency.id || agency.name}>
              {editing === agency.id ? (
                /* ── Edit mode ── */
                <div className="p-4 space-y-3 bg-indigo-50/50">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre</label>
                      <input value={agency.name} onChange={e => updateField(agency.id, 'name', e.target.value.toUpperCase())}
                        className={inp} placeholder="NOMBRE AGENCIA" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
                      <input value={agency.desc} onChange={e => updateField(agency.id, 'desc', e.target.value)}
                        className={inp} placeholder="Breve descripción" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">URL del logo</label>
                      <input value={agency.logo} onChange={e => updateField(agency.id, 'logo', e.target.value)}
                        className={inp} placeholder="https://..." />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Color texto</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={agency.color} onChange={e => updateField(agency.id, 'color', e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer border border-gray-200" />
                          <input value={agency.color} onChange={e => updateField(agency.id, 'color', e.target.value)}
                            className={`${inp} flex-1`} placeholder="#000000" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Color fondo</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={agency.bg} onChange={e => updateField(agency.id, 'bg', e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer border border-gray-200" />
                          <input value={agency.bg} onChange={e => updateField(agency.id, 'bg', e.target.value)}
                            className={`${inp} flex-1`} placeholder="#ffffff" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditing(null)}
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 flex items-center gap-1">
                      <X className="w-3.5 h-3.5" /> Cancelar
                    </button>
                    <button onClick={() => setEditing(null)}
                      className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Listo
                    </button>
                  </div>
                </div>
              ) : (
                /* ── View mode ── */
                <div className="flex items-center gap-3 p-4">
                  <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
                  <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center overflow-hidden border border-gray-100"
                    style={{ background: agency.bg }}>
                    {agency.logo
                      ? <img src={agency.logo} alt={agency.name} className="w-8 h-8 object-contain" />
                      : <Truck className="w-5 h-5" style={{ color: agency.color }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{agency.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: agency.bg, color: agency.color }}>
                        vista previa
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{agency.desc || '—'}</p>
                  </div>
                  <button onClick={() => toggleActive(agency.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${agency.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {agency.active ? 'Activa' : 'Inactiva'}
                  </button>
                  <button onClick={() => setEditing(agency.id)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteAgency(agency.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* ── New agency form ── */}
          {newForm !== null ? (
            <div className="p-4 bg-green-50/50 space-y-3">
              <p className="text-sm font-semibold text-gray-700">Nueva agencia</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre *</label>
                  <input value={newForm.name} onChange={e => setNewForm(f => f && ({ ...f, name: e.target.value.toUpperCase() }))}
                    className={inp} placeholder="NOMBRE AGENCIA" autoFocus />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
                  <input value={newForm.desc} onChange={e => setNewForm(f => f && ({ ...f, desc: e.target.value }))}
                    className={inp} placeholder="Breve descripción" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">URL del logo</label>
                  <input value={newForm.logo} onChange={e => setNewForm(f => f && ({ ...f, logo: e.target.value }))}
                    className={inp} placeholder="https://..." />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Color texto</label>
                    <div className="flex gap-1.5">
                      <input type="color" value={newForm.color} onChange={e => setNewForm(f => f && ({ ...f, color: e.target.value }))}
                        className="w-8 h-8 rounded cursor-pointer border border-gray-200 shrink-0" />
                      <input value={newForm.color} onChange={e => setNewForm(f => f && ({ ...f, color: e.target.value }))}
                        className={`${inp} flex-1`} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Color fondo</label>
                    <div className="flex gap-1.5">
                      <input type="color" value={newForm.bg} onChange={e => setNewForm(f => f && ({ ...f, bg: e.target.value }))}
                        className="w-8 h-8 rounded cursor-pointer border border-gray-200 shrink-0" />
                      <input value={newForm.bg} onChange={e => setNewForm(f => f && ({ ...f, bg: e.target.value }))}
                        className={`${inp} flex-1`} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setNewForm(null)}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> Cancelar
                </button>
                <button onClick={addAgency}
                  className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1 font-semibold">
                  <Plus className="w-3.5 h-3.5" /> Agregar agencia
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setNewForm({ ...EMPTY_AGENCY })}
              className="w-full flex items-center justify-center gap-2 p-4 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors font-medium">
              <Plus className="w-4 h-4" /> Agregar nueva agencia
            </button>
          )}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>⚠️ Recuerda:</strong> Después de agregar o modificar agencias, presiona <strong>Guardar cambios</strong> para que aparezcan en el checkout de la tienda.
      </div>
    </div>
  );
}
