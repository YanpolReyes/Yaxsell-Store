'use client';
import { useTemplate } from '@/context/TemplateContext';
import HomePage1 from '@/templates/plantilla1/HomePage';
import HomePage2 from '@/templates/plantilla2/HomePage';
import HomePage3 from '@/templates/plantilla3/HomePage';
import HomePage4 from '@/templates/plantilla4/HomePage';

export default function DynamicHomePage({ children }: { children: React.ReactNode }) {
  const { template, isLoading } = useTemplate();
  if (isLoading) return null;
  if (template === 1) return <HomePage1 />;
  if (template === 2) return <HomePage2 />;
  if (template === 3) return <HomePage3 />;
  if (template === 4) return <HomePage4 />;
  return <>{children}</>;
}
