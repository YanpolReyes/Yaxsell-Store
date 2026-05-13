'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++toastId;
    console.log('🔔 Toast:', message, type);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const remove = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  const iconMap: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle size={20} color="#fff" strokeWidth={2.5} />,
    error: <AlertTriangle size={20} color="#fca5a5" strokeWidth={2.5} />,
    warning: <AlertTriangle size={20} color="#fde68a" strokeWidth={2.5} />,
    info: <Info size={20} color="#fff" strokeWidth={2.5} />,
  };

  const bgMap: Record<ToastType, string> = {
    success: 'linear-gradient(135deg, #fbcfe8, #f9a8d4)',
    error: 'linear-gradient(135deg, #dc2626, #991b1b)',
    warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
    info: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  };

  const borderMap: Record<ToastType, string> = {
    success: 'rgba(255,255,255,0.25)',
    error: 'rgba(255,255,255,0.2)',
    warning: 'rgba(255,255,255,0.2)',
    info: 'rgba(255,255,255,0.2)',
  };

  return (
    <>
      {React.createElement(ToastContext.Provider, { value: { showToast } }, children)}
      {toasts.length > 0 && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 999999, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 380, pointerEvents: 'none' }}>
          {toasts.map(t => (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
              background: bgMap[t.type], border: `1px solid ${borderMap[t.type]}`,
              backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              borderRadius: 16, boxShadow: '0 12px 40px rgba(236,72,153,0.35), 0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)',
              animation: 'slideIn .4s cubic-bezier(0.16,1,0.3,1)',
              pointerEvents: 'auto',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
                {iconMap[t.type]}
              </div>
              <span style={{ flex: 1, fontSize: 14.5, color: t.type === 'success' || t.type === 'info' ? '#fff' : '#1f2937', fontWeight: 600, letterSpacing: '0.01em', textShadow: (t.type === 'success' || t.type === 'info') ? '0 1px 2px rgba(0,0,0,0.15)' : 'none' }}>{t.message}</span>
              <button onClick={() => remove(t.id)} style={{ background: (t.type === 'success' || t.type === 'info') ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: (t.type === 'success' || t.type === 'info') ? 'rgba(255,255,255,0.8)' : '#6b7280', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={e => { e.currentTarget.style.background = (t.type === 'success' || t.type === 'info') ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)'; e.currentTarget.style.color = (t.type === 'success' || t.type === 'info') ? '#fff' : '#1f2937'; }}
                onMouseLeave={e => { e.currentTarget.style.background = (t.type === 'success' || t.type === 'info') ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)'; e.currentTarget.style.color = (t.type === 'success' || t.type === 'info') ? 'rgba(255,255,255,0.8)' : '#6b7280'; }}>
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>
          ))}
          <style>{`
            @keyframes slideIn { 
              from { opacity: 0; transform: translateX(40px) scale(0.9) translateY(-8px); } 
              to { opacity: 1; transform: translateX(0) scale(1) translateY(0); } 
            }
          `}</style>
        </div>
      )}
    </>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
