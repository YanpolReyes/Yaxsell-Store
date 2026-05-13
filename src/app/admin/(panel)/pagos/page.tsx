'use client';

import { useState, useEffect } from 'react';
import { Save, CheckCircle, CreditCard, Copy, Check } from 'lucide-react';

interface BankDetails {
  bankAccountHolder: string;
  bankRut: string;
  bankName: string;
  bankAccountType: string;
  bankAccountNumber: string;
  bankEmail: string;
  bankInstructions: string;
}

const DEFAULT: BankDetails = {
  bankAccountHolder: '',
  bankRut: '',
  bankName: '',
  bankAccountType: 'Cuenta Vista',
  bankAccountNumber: '',
  bankEmail: '',
  bankInstructions: 'Transfiere el monto exacto del pedido y sube el comprobante para confirmar tu orden.',
};

const BANK_TYPES = ['Cuenta Vista', 'Cuenta Corriente', 'Cuenta de Ahorro', 'Cuenta RUT'];

export default function PagosPage() {
  const [form, setForm] = useState<BankDetails>(DEFAULT);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('store_bank_details');
      if (stored) setForm({ ...DEFAULT, ...JSON.parse(stored) });
    } catch {}
  }, []);

  function set(key: keyof BankDetails, val: string) {
    setForm(f => ({ ...f, [key]: val }));
  }

  function handleSave() {
    localStorage.setItem('store_bank_details', JSON.stringify(form));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function copyAll() {
    const text = [
      `Titular: ${form.bankAccountHolder}`,
      `RUT: ${form.bankRut}`,
      `Banco: ${form.bankName}`,
      `Tipo: ${form.bankAccountType}`,
      `N° cuenta: ${form.bankAccountNumber}`,
      `Email: ${form.bankEmail}`,
    ].join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 bg-white';
  const lbl = 'block text-xs font-semibold text-gray-600 mb-1';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-500" />
            Métodos de pago
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Configura los datos que verá el cliente al pagar.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={copyAll} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
            {copied ? <><Check className="w-3.5 h-3.5 text-green-500" />Copiado</> : <><Copy className="w-3.5 h-3.5" />Copiar datos</>}
          </button>
          <button onClick={handleSave} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${saved ? 'bg-green-500' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
            {saved ? <><CheckCircle className="w-4 h-4" />Guardado</> : <><Save className="w-4 h-4" />Guardar</>}
          </button>
        </div>
      </div>

      {/* Transferencia bancaria */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-5">
          <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-blue-600" />
          </span>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Transferencia bancaria</p>
            <p className="text-xs text-gray-500">Único método activo actualmente</p>
          </div>
          <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Activo</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Titular de la cuenta *</label>
            <input value={form.bankAccountHolder} onChange={e => set('bankAccountHolder', e.target.value)}
              className={inp} placeholder="Nombre completo o razón social" />
          </div>
          <div>
            <label className={lbl}>RUT del titular *</label>
            <input value={form.bankRut} onChange={e => set('bankRut', e.target.value)}
              className={inp} placeholder="12.345.678-9" />
          </div>
          <div>
            <label className={lbl}>Banco *</label>
            <input value={form.bankName} onChange={e => set('bankName', e.target.value)}
              className={inp} placeholder="Ej: Banco Estado, Santander..." />
          </div>
          <div>
            <label className={lbl}>Tipo de cuenta *</label>
            <select value={form.bankAccountType} onChange={e => set('bankAccountType', e.target.value)} className={inp}>
              {BANK_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Número de cuenta *</label>
            <input value={form.bankAccountNumber} onChange={e => set('bankAccountNumber', e.target.value)}
              className={inp} placeholder="0000000000" />
          </div>
          <div>
            <label className={lbl}>Email de notificación</label>
            <input type="email" value={form.bankEmail} onChange={e => set('bankEmail', e.target.value)}
              className={inp} placeholder="pagos@tutienda.cl" />
          </div>
          <div className="col-span-2">
            <label className={lbl}>Instrucciones para el cliente</label>
            <textarea value={form.bankInstructions} onChange={e => set('bankInstructions', e.target.value)}
              className={`${inp} resize-none`} rows={3}
              placeholder="Instrucciones adicionales que verá el cliente en la página de confirmación..." />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-sm font-semibold text-gray-700 mb-4">Vista previa — como lo verá el cliente</p>
        <div className="space-y-1.5">
          {[
            { label: 'Titular', value: form.bankAccountHolder || '—' },
            { label: 'RUT', value: form.bankRut || '—' },
            { label: 'Banco', value: form.bankName || '—' },
            { label: 'Tipo de cuenta', value: form.bankAccountType },
            { label: 'N° de cuenta', value: form.bankAccountNumber || '—' },
            { label: 'Email', value: form.bankEmail || '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-500">{label}</span>
              <span className="text-sm font-semibold text-gray-800">{value}</span>
            </div>
          ))}
        </div>
        {form.bankInstructions && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            ⚠️ {form.bankInstructions}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">Los datos se guardan localmente en este navegador. Para sincronizar entre dispositivos, configúralos en cada uno.</p>
    </div>
  );
}
