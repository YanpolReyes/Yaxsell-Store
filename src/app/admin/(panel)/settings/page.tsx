'use client';

import { useState, useEffect } from 'react';
import { getAppwriteConfig, saveAppwriteConfig, clearAppwriteConfig, exportAppwriteConfig, AppwriteConfig, getServices } from '@/lib/appwrite-admin';
import { Settings, Save, CheckCircle, AlertTriangle, Database, Globe, Key, RefreshCw, XCircle, HardDrive, Copy, Trash2, Megaphone } from 'lucide-react';

function AnnouncementConfig() {
  const [text, setText] = useState('');
  const [link, setLink] = useState('');
  const [bg, setBg] = useState('linear-gradient(90deg, #6366f1, #8b5cf6)');
  const [enabled, setEnabled] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('announcement_config');
      if (stored) {
        const c = JSON.parse(stored);
        setText(c.text || ''); setLink(c.link || ''); setBg(c.bg || ''); setEnabled(c.enabled !== false);
      }
    } catch {}
  }, []);

  function save() {
    localStorage.setItem('announcement_config', JSON.stringify({ text, link, bg, color: '#fff', enabled }));
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  const input = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Megaphone className="w-4 h-4 text-indigo-600" />
        <p className="font-semibold text-gray-900 text-sm">Barra de Anuncio</p>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Texto del anuncio</label>
          <input value={text} onChange={e => setText(e.target.value)} placeholder="🔥 Envío gratis en compras sobre $30.000" className={input} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Link (opcional)</label>
            <input value={link} onChange={e => setLink(e.target.value)} placeholder="/productos" className={input} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Fondo CSS</label>
            <input value={bg} onChange={e => setBg(e.target.value)} placeholder="linear-gradient(90deg, #6366f1, #8b5cf6)" className={input} />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
          <span className="text-sm text-gray-700">Mostrar barra de anuncio</span>
        </label>
        <button onClick={save} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition flex items-center gap-2">
          {saved ? <><CheckCircle className="w-4 h-4" /> Guardado</> : <><Save className="w-4 h-4" /> Guardar</>}
        </button>
      </div>
    </div>
  );
}

const EXPECTED_COLLECTIONS = [
  'products', 'categories', 'banners', 'orders', 'users',
  'notifications', 'timed_offers', 'live_streams', 'support_tickets',
  'sequences', 'fcm_tokens', 'order_status_history', 'wholesale_requests', 'coupons',
];

export default function SettingsPage() {
  const [config, setConfig] = useState<AppwriteConfig>({ endpoint: '', projectId: '', databaseId: '' });
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [checkingCols, setCheckingCols] = useState(false);
  const [colResults, setColResults] = useState<Record<string, 'ok' | 'missing' | 'error'> | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [latencyHistory, setLatencyHistory] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);
  const [checkingBuckets, setCheckingBuckets] = useState(false);
  const [bucketResults, setBucketResults] = useState<Record<string, 'ok' | 'missing' | 'error'> | null>(null);

  useEffect(() => {
    setConfig(getAppwriteConfig());
  }, []);

  const handleSave = () => {
    if (!config.endpoint || !config.projectId || !config.databaseId) {
      alert('Todos los campos son requeridos');
      return;
    }
    saveAppwriteConfig(config);
    setSaved(true);
    setTestResult(null);
    setTimeout(() => setSaved(false), 3000);
  };

  const checkCollections = async () => {
    setCheckingCols(true);
    setColResults(null);
    const results: Record<string, 'ok' | 'missing' | 'error'> = {};
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await Promise.all(
        EXPECTED_COLLECTIONS.map(async col => {
          try {
            await databases.listDocuments(databaseId, col, []);
            results[col] = 'ok';
          } catch (e: any) {
            results[col] = e?.message?.includes('not found') || e?.code === 404 ? 'missing' : 'error';
          }
        })
      );
      setColResults(results);
    } catch (e: any) {
      setTestResult({ ok: false, message: 'Error al verificar colecciones: ' + e.message });
    } finally {
      setCheckingCols(false);
    }
  };

  const EXPECTED_BUCKETS = ['products', 'banners', 'categories-icons', 'comprobantes', 'live-thumbnails'];

  const checkBuckets = async () => {
    setCheckingBuckets(true); setBucketResults(null);
    const results: Record<string, 'ok' | 'missing' | 'error'> = {};
    try {
      const { storage } = getServices();
      await Promise.all(
        EXPECTED_BUCKETS.map(async id => {
          try {
            await storage.listFiles(id, []);
            results[id] = 'ok';
          } catch (e: any) {
            results[id] = e?.code === 404 || e?.message?.includes('not found') ? 'missing' : 'error';
          }
        })
      );
      setBucketResults(results);
    } catch (e: any) { setBucketResults({}); }
    finally { setCheckingBuckets(false); }
  };

  const checkAll = async () => {
    await Promise.all([checkCollections(), checkBuckets()]);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    setLatencyMs(null);
    const t0 = Date.now();
    try {
      const { Client, Account } = await import('appwrite');
      const client = new Client().setEndpoint(config.endpoint).setProject(config.projectId);
      const account = new Account(client);
      await account.get();
      const ms = Date.now() - t0;
      setLatencyMs(ms);
      setLatencyHistory(prev => [...prev.slice(-9), ms]);
      setTestResult({ ok: true, message: 'Conexión exitosa. Sesión activa detectada.' });
    } catch (e: any) {
      setLatencyMs(Date.now() - t0);
      const msg = e?.message || '';
      if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('missing scope')) {
        setTestResult({ ok: true, message: 'Conexión exitosa con Appwrite (sin sesión activa, normal).' });
      } else {
        setTestResult({ ok: false, message: `Error: ${msg}` });
      }
    } finally {
      setTesting(false);
    }
  };

  const F = ({ label, field, placeholder, icon: Icon, hint }: {
    label: string; field: keyof AppwriteConfig; placeholder: string; icon: any; hint?: string;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={config[field]}
          onChange={e => setConfig(c => ({ ...c, [field]: e.target.value }))}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
        />
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500">Credenciales de Appwrite para este panel de administración</p>
      </div>

      {/* Appwrite Config Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Database className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Appwrite</p>
            <p className="text-xs text-gray-500">Configuración de conexión al backend</p>
          </div>
        </div>

        <F label="Endpoint" field="endpoint" placeholder="https://cloud.appwrite.io/v1" icon={Globe}
          hint="URL base de tu instancia Appwrite. Ej: https://fra.cloud.appwrite.io/v1" />

        <F label="Project ID" field="projectId" placeholder="mi-proyecto-id" icon={Key}
          hint="ID del proyecto en la consola de Appwrite" />

        <F label="Database ID" field="databaseId" placeholder="67f1dc940037b3d367bb" icon={Database}
          hint="ID de la base de datos que contiene tus colecciones" />

        {testResult && (
          <div className={`flex items-start gap-2 p-3 rounded-xl border text-sm ${testResult.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {testResult.ok ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
            <span className="flex-1">{testResult.message}</span>
            {latencyMs !== null && (
              <span className={`text-xs font-mono px-1.5 py-0.5 rounded shrink-0 ${latencyMs < 400 ? 'bg-emerald-200 text-emerald-900' : latencyMs < 1000 ? 'bg-amber-200 text-amber-900' : 'bg-red-200 text-red-900'}`}>
                {latencyMs}ms
              </span>
            )}
          </div>
        )}

        {latencyHistory.length > 1 && (
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-2">Historial latencia (últimas {latencyHistory.length} pruebas)</p>
            <div className="flex items-end gap-1 h-8">
              {latencyHistory.map((ms, i) => {
                const maxMs = Math.max(...latencyHistory, 1);
                const h = Math.max(Math.round((ms / maxMs) * 28), 4);
                const color = ms < 400 ? '#10b981' : ms < 1000 ? '#f59e0b' : '#ef4444';
                return (
                  <div key={i} title={`${ms}ms`} className="flex-1 rounded-sm transition-all cursor-default"
                    style={{ height: `${h}px`, backgroundColor: color }} />
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Avg: {Math.round(latencyHistory.reduce((s, v) => s + v, 0) / latencyHistory.length)}ms ·
              Min: {Math.min(...latencyHistory)}ms · Max: {Math.max(...latencyHistory)}ms
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-2 flex-wrap">
          <button onClick={handleTest} disabled={testing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-60">
            <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Probando...' : 'Probar conexión'}
          </button>
          <button onClick={checkAll} disabled={checkingCols || checkingBuckets}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-200 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition disabled:opacity-60">
            <Database className={`w-4 h-4 ${(checkingCols || checkingBuckets) ? 'animate-pulse' : ''}`} />
            {(checkingCols || checkingBuckets) ? 'Verificando...' : 'Verificar todo'}
          </button>
          <button onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${saved ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
            {saved ? <><CheckCircle className="w-4 h-4" />Guardado</> : <><Save className="w-4 h-4" />Guardar</>}
          </button>
          <button onClick={() => { navigator.clipboard.writeText(exportAppwriteConfig()); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition" title="Copiar config como JSON">
            {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
          <button onClick={() => { if (confirm('¿Limpiar la configuración guardada en el navegador?')) { clearAppwriteConfig(); setConfig(getAppwriteConfig()); } }}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-red-500 hover:bg-red-50 transition" title="Resetear configuración">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Collection Checker */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-500" />
            <p className="font-semibold text-gray-900 text-sm">Verificar Colecciones</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { checkCollections(); checkBuckets(); }} disabled={checkingCols || checkingBuckets}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-60">
              <RefreshCw className={`w-3.5 h-3.5 ${(checkingCols || checkingBuckets) ? 'animate-spin' : ''}`} />
              {(checkingCols || checkingBuckets) ? 'Verificando...' : 'Verificar todo'}
            </button>
            <button onClick={checkCollections} disabled={checkingCols}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition disabled:opacity-60">
              {checkingCols ? 'Verificando...' : 'Solo cols'}
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-3">Haz clic en &quot;Verificar&quot; para comprobar qué colecciones existen:</p>
        <div className="grid grid-cols-2 gap-2">
          {EXPECTED_COLLECTIONS.map(col => {
            const status = colResults?.[col];
            return (
              <div key={col} className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
                status === 'ok' ? 'bg-emerald-50' : status === 'missing' ? 'bg-red-50' : status === 'error' ? 'bg-amber-50' : 'bg-gray-50'
              }`}>
                {status === 'ok' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  : status === 'missing' ? <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  : status === 'error' ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  : <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 shrink-0" />}
                <code className={`text-xs ${
                  status === 'ok' ? 'text-emerald-700' : status === 'missing' ? 'text-red-700' : status === 'error' ? 'text-amber-700' : 'text-gray-600'
                }`}>{col}</code>
              </div>
            );
          })}
        </div>
        {colResults && (
          <p className="text-xs text-gray-400 mt-3">
            {Object.values(colResults).filter(v => v === 'ok').length} de {EXPECTED_COLLECTIONS.length} colecciones encontradas
          </p>
        )}
      </div>

      {/* Storage Buckets */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-gray-500" />
            <p className="font-semibold text-gray-900 text-sm">Verificar Storage Buckets</p>
          </div>
          <button onClick={checkBuckets} disabled={checkingBuckets}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition disabled:opacity-60">
            <RefreshCw className={`w-3.5 h-3.5 ${checkingBuckets ? 'animate-spin' : ''}`} />
            {checkingBuckets ? 'Verificando...' : 'Verificar'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-3">Comprueba que los buckets de almacenamiento existen y son accesibles:</p>
        <div className="grid grid-cols-2 gap-2">
          {['products', 'banners', 'categories-icons', 'comprobantes', 'live-thumbnails'].map(id => {
            const status = bucketResults?.[id];
            return (
              <div key={id} className={`flex items-center gap-2 px-3 py-2 rounded-xl ${
                status === 'ok' ? 'bg-emerald-50' : status === 'missing' ? 'bg-red-50' : status === 'error' ? 'bg-amber-50' : 'bg-gray-50'
              }`}>
                {status === 'ok' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  : status === 'missing' ? <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  : status === 'error' ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  : <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 shrink-0" />}
                <code className={`text-xs ${
                  status === 'ok' ? 'text-emerald-700' : status === 'missing' ? 'text-red-700' : status === 'error' ? 'text-amber-700' : 'text-gray-600'
                }`}>{id}</code>
              </div>
            );
          })}
        </div>
        {bucketResults && (
          <p className="text-xs text-gray-400 mt-3">
            {Object.values(bucketResults).filter(v => v === 'ok').length} de 5 buckets encontrados
          </p>
        )}
      </div>

      {/* Announcement Bar Config */}
      <AnnouncementConfig />

      {/* Session Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="font-semibold text-gray-900 text-sm mb-3">Acerca del Panel</p>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• Las credenciales se guardan en <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">localStorage</code> del navegador.</p>
          <p>• Para configuración permanente, usa variables de entorno en <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">.env.local</code>:</p>
          <pre className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs mt-2 overflow-x-auto text-gray-700">
{`NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=tu-project-id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=tu-database-id`}
          </pre>
          <p className="text-xs text-gray-400 mt-2">Las variables de entorno tienen prioridad si no hay configuración guardada en el navegador.</p>
        </div>
      </div>
    </div>
  );
}
