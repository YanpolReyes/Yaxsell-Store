'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface Props {
  expiresAt: number; // epoch seconds
  label?: string;
  compact?: boolean;
  onExpire?: () => void;
}

export default function CountdownTimer({ expiresAt, label, compact = false, onExpire }: Props) {
  const [remaining, setRemaining] = useState(() => Math.max(0, expiresAt - Math.floor(Date.now() / 1000)));

  useEffect(() => {
    if (remaining <= 0) { onExpire?.(); return; }
    const id = setInterval(() => {
      const left = Math.max(0, expiresAt - Math.floor(Date.now() / 1000));
      setRemaining(left);
      if (left <= 0) { clearInterval(id); onExpire?.(); }
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt, onExpire, remaining]);

  if (remaining <= 0) return null;

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');

  if (compact) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#e53935' }}>
        <Clock size={12} /> {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </span>
    );
  }

  const boxStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    background: '#333', color: '#fff', borderRadius: 6, minWidth: 48, padding: '6px 8px',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {label && <span style={{ fontSize: 13, fontWeight: 600, color: '#e53935' }}>{label}</span>}
      <div style={{ display: 'flex', gap: 4 }}>
        <div style={boxStyle}>
          <span style={{ fontSize: 20, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{pad(hours)}</span>
          <span style={{ fontSize: 9, color: '#aaa', marginTop: 2 }}>HRS</span>
        </div>
        <span style={{ fontSize: 20, fontWeight: 700, color: '#333', alignSelf: 'flex-start', marginTop: 4 }}>:</span>
        <div style={boxStyle}>
          <span style={{ fontSize: 20, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{pad(minutes)}</span>
          <span style={{ fontSize: 9, color: '#aaa', marginTop: 2 }}>MIN</span>
        </div>
        <span style={{ fontSize: 20, fontWeight: 700, color: '#333', alignSelf: 'flex-start', marginTop: 4 }}>:</span>
        <div style={boxStyle}>
          <span style={{ fontSize: 20, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{pad(seconds)}</span>
          <span style={{ fontSize: 9, color: '#aaa', marginTop: 2 }}>SEG</span>
        </div>
      </div>
    </div>
  );
}
