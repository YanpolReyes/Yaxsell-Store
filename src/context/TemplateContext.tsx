'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getServices, getAppwriteConfig } from '@/lib/appwrite';
import { Query } from 'appwrite';

const TEMPLATE_KEY = 'store_template';
const SEQUENCES_COLLECTION = 'sequences';

interface TemplateContextType {
  template: number;
  isLoading: boolean;
}

const TemplateContext = createContext<TemplateContextType>({ template: 1, isLoading: true });

export function useTemplate() {
  return useContext(TemplateContext);
}

export function TemplateProvider({ children }: { children: ReactNode }) {
  const [template, setTemplate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Check for _tpl override from theme editor iframe
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const tplOverride = params.get('_tpl');
        if (tplOverride) {
          setTemplate(Number(tplOverride) || 1);
          setIsLoading(false);
          return;
        }
      }
      try {
        const { databases } = getServices();
        const { databaseId } = getAppwriteConfig();
        if (!databaseId) { setIsLoading(false); return; }
        const res = await databases.listDocuments(databaseId, SEQUENCES_COLLECTION, [
          Query.equal('key', TEMPLATE_KEY), Query.limit(1),
        ]);
        if (res.documents.length > 0) {
          setTemplate(Number(res.documents[0].value) || 1);
        }
      } catch {
        setTemplate(1);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    const bgMap: Record<number, string> = {
      1: '#f8f9fa',
      2: '#ebebeb',
      3: '#f5f5f5',
      4: '#ffffff',
    };
    document.body.style.backgroundColor = bgMap[template] || '#f8f9fa';
    document.body.style.color = template === 2 ? '#333333' : template === 4 ? '#1F1F1F' : '#111827';
  }, [template]);

  return (
    <TemplateContext.Provider value={{ template, isLoading }}>
      <div data-template={template} className="contents">
        {children}
      </div>
    </TemplateContext.Provider>
  );
}
