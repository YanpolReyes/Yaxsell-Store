'use client';
import { useTemplate } from '@/context/TemplateContext';
import HomePage1 from '@/templates/plantilla1/HomePage';
import HomePage2 from '@/templates/plantilla2/HomePage';
import HomePage3 from '@/templates/plantilla3/HomePage';
import HomePage4 from '@/templates/plantilla4/HomePage';

export default function DynamicHomePage({ children }: { children: React.ReactNode }) {
  const { template, isLoading } = useTemplate();
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #f3f4f6', borderTopColor: '#f18e04', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  if (template === 1) return <HomePage1 />;
  if (template === 2) return <HomePage2 />;
  if (template === 3) return <HomePage3 />;
  if (template === 4) return <HomePage4 />;
  return <>{children}</>;
}
