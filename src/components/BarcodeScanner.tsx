'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, X, RotateCcw, Zap } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState(false);
  const [lastCode, setLastCode] = useState('');
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  // Start camera preview on mount — NO auto-scanning
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch {
        if (!cancelled) setError('No se pudo acceder a la cámara. Verifica los permisos.');
      }
    })();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Capture current frame and scan for barcode
  const captureAndScan = async () => {
    const video = videoRef.current;
    if (!video) return;
    setScanning(true);
    setError('');

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas failed');
      ctx.drawImage(video, 0, 0);

      let decodedText = '';

      // Try native BarcodeDetector first (Chrome/Edge — faster, no DOM manipulation)
      if ('BarcodeDetector' in window) {
        try {
          const detector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'upc_e']
          });
          const results = await detector.detect(canvas);
          if (results.length > 0) decodedText = results[0].rawValue;
        } catch { /* fallback */ }
      }

      // Fallback: html5-qrcode scanFileV2 (off-screen, no React DOM conflict)
      if (!decodedText) {
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png');
        });
        const file = new File([blob], 'capture.png', { type: 'image/png' });

        const helperId = 'bch-' + Date.now();
        const helperDiv = document.createElement('div');
        helperDiv.id = helperId;
        helperDiv.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;';
        document.body.appendChild(helperDiv);

        try {
          const { Html5Qrcode } = await import('html5-qrcode');
          const scanner = new Html5Qrcode(helperId);
          const result = await scanner.scanFileV2(file, false);
          decodedText = result.decodedText;
          scanner.clear();
        } finally {
          if (document.body.contains(helperDiv)) document.body.removeChild(helperDiv);
        }
      }

      if (decodedText) {
        setDetected(true);
        setLastCode(decodedText);
      } else {
        setError('No se detectó código. Apunta mejor e intenta de nuevo.');
        setTimeout(() => setError(''), 3000);
      }
    } catch {
      setError('No se detectó código. Apunta mejor e intenta de nuevo.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setScanning(false);
    }
  };

  const confirmScan = () => {
    const code = String(lastCode ?? '').trim();
    if (!code) return;
    try {
      onScanRef.current(code);
    } catch (err) {
      console.error('[BarcodeScanner] onScan error:', err);
    }
  };

  const rescan = () => {
    setDetected(false);
    setLastCode('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))' }}>
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

        <div className="relative w-full rounded-xl overflow-hidden bg-gray-900 border-2 border-white/20" style={{ minHeight: '240px' }}>
          <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
          {ready && !detected && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-[280px] h-[120px] border-2 border-white/40 rounded-lg" />
            </div>
          )}
          {scanning && (
            <div className="absolute inset-0 bg-white/20 flex items-center justify-center">
              <div className="w-8 h-8 border-[3px] border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {!ready && !error && (
          <div className="flex items-center justify-center py-4 text-white/50 text-sm">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            Iniciando cámara...
          </div>
        )}

        {ready && !detected && (
          <div className="mt-4 space-y-2">
            <button
              onClick={captureAndScan}
              disabled={scanning}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800/70 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition text-lg shadow-lg active:scale-95"
            >
              {scanning ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Escaneando...
                </>
              ) : (
                <>
                  <Zap className="w-6 h-6" />
                  Tomar foto y escanear
                </>
              )}
            </button>
            <p className="text-white/50 text-xs text-center">
              Apunta la cámara al código y presiona el botón
            </p>
          </div>
        )}

        {error && (
          <div className="text-amber-400 text-sm text-center py-3 bg-amber-500/10 rounded-lg mt-3 border border-amber-500/30">
            {error}
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
              className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition"
            >
              <RotateCcw className="w-4 h-4" />
              Reescanear
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
