'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const [detected, setDetected] = useState(false);
  const [lastCode, setLastCode] = useState('');
  const [ready, setReady] = useState(false);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  // Auto-start on mount — create fresh instance every time to avoid lag
  useEffect(() => {
    let cancelled = false;
    let sc: any = null;

    (async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled) return;

        sc = new Html5Qrcode('barcode-reader-box');
        scannerRef.current = sc;

        if (cancelled) { sc.stop().catch(() => {}); return; }

        await sc.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 280, height: 120 }, aspectRatio: 1.0 },
          (decodedText: string) => {
            // Stop immediately to prevent lag accumulation
            sc.stop().then(() => { sc.clear(); }).catch(() => {});
            setDetected(true);
            setLastCode(decodedText);
          },
          () => {}
        );
        if (!cancelled) setReady(true);
      } catch (e: any) {
        if (!cancelled) setError('No se pudo acceder a la cámara. Verifica los permisos.');
      }
    })();

    return () => {
      cancelled = true;
      if (sc) {
        sc.stop().then(() => { sc.clear(); sc = null; }).catch(() => { sc = null; });
      }
    };
  }, []);

  const confirmScan = () => {
    if (lastCode) onScanRef.current(lastCode);
  };

  const rescan = async () => {
    setDetected(false);
    setLastCode('');
    setReady(false);
    setError('');

    // Destroy and recreate fresh instance to prevent lag
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      try { await scannerRef.current.clear(); } catch {}
      scannerRef.current = null;
    }

    // Small delay then restart
    setTimeout(async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        const sc = new Html5Qrcode('barcode-reader-box');
        scannerRef.current = sc;
        await sc.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 280, height: 120 }, aspectRatio: 1.0 },
          (decodedText: string) => {
            sc.stop().then(() => { sc.clear(); }).catch(() => {});
            setDetected(true);
            setLastCode(decodedText);
          },
          () => {}
        );
        setReady(true);
      } catch {
        setError('Error al reiniciar cámara. Cierra y vuelve a intentar.');
      }
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-white">
            <Camera className="w-5 h-5" />
            <span className="text-sm font-medium">Escanear código de barras</span>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera container — always rendered so Html5Qrcode can attach */}
        <div
          id="barcode-reader-box"
          ref={containerRef}
          className={`w-full rounded-xl overflow-hidden bg-gray-900 border-2 transition-colors ${detected ? 'border-green-500' : 'border-white/20'}`}
          style={{ minHeight: '240px' }}
        />

        {!ready && !error && !detected && (
          <div className="flex items-center justify-center py-4 text-white/50 text-sm">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            Iniciando cámara...
          </div>
        )}

        {ready && !detected && (
          <div className="text-white/60 text-sm text-center mt-3">
            Apunta la cámara al código de barras...
          </div>
        )}

        {error && (
          <div className="text-red-400 text-sm text-center py-6">{error}</div>
        )}

        {detected && (
          <div className="mt-4 space-y-2">
            <div className="bg-green-500/20 border border-green-500 rounded-xl p-3 text-center">
              <div className="text-green-400 text-xs font-medium mb-1">Código detectado</div>
              <div className="text-white font-mono text-lg font-bold">{lastCode}</div>
            </div>
            <button
              onClick={confirmScan}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition"
            >
              <Camera className="w-5 h-5" />
              Confirmar código
            </button>
            <button
              onClick={rescan}
              className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition"
            >
              Reescanear
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
