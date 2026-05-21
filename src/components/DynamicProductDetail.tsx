'use client';
import { useTemplate } from '@/context/TemplateContext';
import ProductDetailPlantilla1 from '@/templates/plantilla1/ProductDetail';
import ProductDetailPlantilla2 from '@/templates/plantilla2/ProductDetail';

export default function DynamicProductDetail() {
  const { template, isLoading } = useTemplate();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #f3f4f6', borderTopColor: '#f18e04', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (template === 1) return <ProductDetailPlantilla1 />;
  return <ProductDetailPlantilla2 />;
}
