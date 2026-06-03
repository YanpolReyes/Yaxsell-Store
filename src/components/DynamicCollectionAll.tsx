'use client';
import { useTemplate } from '@/context/TemplateContext';
import CollectionAll5 from '@/templates/plantilla5/CollectionAll';
import CollectionAll1 from '@/templates/plantilla1/CollectionAll';

export default function DynamicCollectionAll() {
  const { isLoading, getSectionTemplate } = useTemplate();
  
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #f3f4f6', borderTopColor: '#e396bf', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  
  // Use catalog key for all products page
  const template = getSectionTemplate('catalog');
  
  if (template === 5) return <CollectionAll5 />;
  
  // Default to plantilla 1
  return <CollectionAll1 />;
}
