'use client';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import DynamicProductDetail from '@/components/DynamicProductDetail';

export default function ProductoPage() {
  const { id } = useParams<{ id: string }>();

  // Redirect /producto/[id] → /productos/[id] for consistent URLs
  useEffect(() => {
    if (id) {
      window.history.replaceState(null, '', `/productos/${id}`);
    }
  }, [id]);

  return <DynamicProductDetail />;
}
