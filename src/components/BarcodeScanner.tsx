'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<any>(null);
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled) return;

        const scanner = new Html5Qrcode('barcode-reader');
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 280, height: 120 },
            aspectRatio: 1.0,
          },
          (decodedText: string) => {
            if (scannerRef.current) {
              scannerRef.current.stop().then(() => {
                scannerRef.current?.clear();
                scannerRef.current = null;
              }).catch(() => { scannerRef.current = null; });
            }
            onScanRef.current(decodedText);
          },
          () => {} // ignore scan failures
        );
        if (!cancelled) setStarted(true);
      } catch (e: any) {
        if (!cancelled) setError('No se pudo acceder a la cámara. Verifica los permisos.');
      }
    })();

    return () => {
      cancelled = true;
      if (scannerRef.current) {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
          scannerRef.current = null;
        }).catch(() => {
          scannerRef.current = null;
        });
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
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
        <div
          id="barcode-reader"
          ref={scannerRef}
          className="w-full rounded-xl overflow-hidden bg-gray-900"
          style={{ minHeight: started ? 'auto' : '240px' }}
        />
        {!started && !error && (
          <div className="flex items-center justify-center py-20 text-white/50 text-sm">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            Iniciando cámara...
          </div>
        )}
        {error && (
          <div className="text-red-400 text-sm text-center py-6">{error}</div>
        )}
        <p className="text-white/40 text-xs text-center mt-3">
          Apunta la cámara al código de barras del producto
        </p>
      </div>
    </div>
  );
}
