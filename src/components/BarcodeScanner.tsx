'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, X, CameraOff } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<any>(null);
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState(false);
  const [lastCode, setLastCode] = useState('');
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const startScanning = async () => {
    if (scanning || !scannerRef.current) return;
    setScanning(true);
    setDetected(false);
    setLastCode('');
    try {
      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 280, height: 120 },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          // Stop scanning immediately when code detected
          if (scannerRef.current && scanning) {
            scannerRef.current.stop().then(() => {
              scannerRef.current?.clear();
            }).catch(() => {});
            setScanning(false);
          }
          setDetected(true);
          setLastCode(decodedText);
        },
        () => {} // ignore scan failures
      );
    } catch (e: any) {
      setError('Error al iniciar escaneo');
      setScanning(false);
    }
  };

  const confirmScan = () => {
    if (lastCode) {
      onScanRef.current(lastCode);
    }
  };

  const rescan = async () => {
    setDetected(false);
    setLastCode('');
    // Recreate scanner instance to prevent lag
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (e) {}
    }
    const { Html5Qrcode } = await import('html5-qrcode');
    const scanner = new Html5Qrcode('barcode-reader');
    scannerRef.current = scanner;
    startScanning();
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled) return;

        const scanner = new Html5Qrcode('barcode-reader');
        scannerRef.current = scanner;
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
        <div
          id="barcode-reader"
          ref={scannerRef}
          className={`w-full rounded-xl overflow-hidden bg-gray-900 border-2 transition-colors ${detected ? 'border-green-500' : 'border-transparent'}`}
          style={{ minHeight: started ? '240px' : '240px' }}
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
        {started && !scanning && !error && (
          <button
            onClick={startScanning}
            className="w-full mt-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition"
          >
            <Camera className="w-5 h-5" />
            Iniciar escaneo
          </button>
        )}
        {scanning && !detected && (
          <div className="text-white/60 text-sm text-center mt-3">
            Apunta la cámara al código de barras...
          </div>
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
