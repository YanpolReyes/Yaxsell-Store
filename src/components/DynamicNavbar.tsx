'use client';
import { useTemplate } from '@/context/TemplateContext';
import Navbar1 from '@/templates/plantilla1/Navbar';
import Navbar2 from '@/templates/plantilla2/Navbar';
import Navbar3 from '@/templates/plantilla3/Navbar';
import Navbar4 from '@/templates/plantilla4/Navbar';

export default function DynamicNavbar() {
  const { template, isLoading } = useTemplate();
  if (isLoading) return null;
  if (template === 1) return <Navbar1 />;
  if (template === 2) return <Navbar2 />;
  if (template === 3) return <Navbar3 />;
  if (template === 4) return <Navbar4 />;
  
  // All other templates (5+) are HTML-migrated themes that contain their own embedded navbars.
  return null;
}
