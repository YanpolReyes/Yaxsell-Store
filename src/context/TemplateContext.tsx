'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface SectionTemplates {
  landing: number;
  productDetail: number;
  cart: number;
  checkout: number;
}

interface TemplateContextType {
  template: number;
  isLoading: boolean;
  sections: SectionTemplates;
  getSectionTemplate: (section: keyof SectionTemplates) => number;
}

const DEFAULT_SECTIONS: SectionTemplates = { landing: 1, productDetail: 1, cart: 1, checkout: 1 };

const TemplateContext = createContext<TemplateContextType>({
  template: 1,
  isLoading: true,
  sections: DEFAULT_SECTIONS,
  getSectionTemplate: () => 1,
});

export function useTemplate() {
  return useContext(TemplateContext);
}

export function TemplateProvider({ children }: { children: ReactNode }) {
  const [template, setTemplate] = useState(1);
  const [sections, setSections] = useState<SectionTemplates>(DEFAULT_SECTIONS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      let dbGlobal = 1;
      let dbSections = { ...DEFAULT_SECTIONS };

      // 1. Fetch template configuration from the database first
      try {
        const res = await fetch(`/api/template?_t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          dbGlobal = Number(data.template) || 1;
          if (data.sections) {
            dbSections = {
              landing: Number(data.sections.landing) || dbGlobal,
              productDetail: Number(data.sections.productDetail) || dbGlobal,
              cart: Number(data.sections.cart) || dbGlobal,
              checkout: Number(data.sections.checkout) || dbGlobal,
            };
          } else {
            dbSections = { landing: dbGlobal, productDetail: dbGlobal, cart: dbGlobal, checkout: dbGlobal };
          }
        }
      } catch (err) {
        console.error('[TemplateContext] failed to load template from API:', err);
      }

      // 2. Check for _tpl override or pathname match to apply target section override
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const tplOverride = params.get('_tpl');
        const pathnameMatch = window.location.pathname.match(/\/preview\/plantilla\/(\d+)/);

        if (tplOverride) {
          const t = Number(tplOverride) || 1;
          const section = params.get('section') as keyof SectionTemplates | null;
          if (section && dbSections[section] !== undefined) {
            dbSections[section] = t;
          } else {
            // Apply globally if no specific section is provided
            dbSections = { landing: t, productDetail: t, cart: t, checkout: t };
          }
          dbGlobal = t;
        } else if (pathnameMatch && pathnameMatch[1]) {
          const t = Number(pathnameMatch[1]);
          // Check if current route is a product detail preview page
          const isProductDetail = window.location.pathname.includes('/producto/') || window.location.pathname.includes('/productos/');
          if (isProductDetail) {
            dbSections.productDetail = t;
          } else {
            dbSections.landing = t;
          }
          dbGlobal = t;
        }
      }

      setTemplate(dbGlobal);
      setSections(dbSections);
      setIsLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    const bgMap: Record<number, string> = {
      1: '#f8f9fa',
      2: '#ebebeb',
      3: '#f5f5f5',
      4: '#ffffff',
      5: '#fdfbf7',
    };
    document.body.style.backgroundColor = bgMap[template] || '#f8f9fa';
    document.body.style.color = template === 2 ? '#333333' : template === 4 ? '#1F1F1F' : template === 5 ? '#2a2120' : '#111827';
  }, [template]);

  const getSectionTemplate = (section: keyof SectionTemplates): number => {
    return sections[section] || template;
  };

  return (
    <TemplateContext.Provider value={{ template, isLoading, sections, getSectionTemplate }}>
      <div data-template={template} className="contents">
        {children}
      </div>
    </TemplateContext.Provider>
  );
}
