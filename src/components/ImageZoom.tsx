'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface Props {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export default function ImageZoom({ src, alt, width = 480, height = 480 }: Props) {
  const [zooming, setZooming] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  function handleMove(e: React.MouseEvent) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPos({ x, y });
  }

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setZooming(true)}
      onMouseLeave={() => setZooming(false)}
      onMouseMove={handleMove}
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        cursor: zooming ? 'zoom-in' : 'default',
        background: '#f9f9f9',
        borderRadius: 4,
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        style={{
          objectFit: 'contain',
          padding: 16,
          transform: zooming ? 'scale(2.2)' : 'scale(1)',
          transformOrigin: `${pos.x}% ${pos.y}%`,
          transition: zooming ? 'none' : 'transform 0.3s ease',
        }}
        sizes={`${width}px`}
      />
    </div>
  );
}
