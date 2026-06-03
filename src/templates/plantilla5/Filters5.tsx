import { useState } from 'react';
import { Category } from '@/types';

interface Filters5Props {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
  priceRange: [number, number];
  onPriceChange: (min: number, max: number) => void;
  maxPrice: number;
}

export default function Filters5({ categories, selectedCategory, onSelectCategory, priceRange, onPriceChange, maxPrice }: Filters5Props) {
  const [minStr, setMinStr] = useState(priceRange[0].toString());
  const [maxStr, setMaxStr] = useState(priceRange[1].toString());

  const applyPrice = () => {
    let min = parseInt(minStr) || 0;
    let max = parseInt(maxStr) || maxPrice;
    if (min < 0) min = 0;
    if (max > maxPrice) max = maxPrice;
    if (min > max) min = max;
    onPriceChange(min, max);
  };

  return (
    <div className="w-full flex flex-col gap-8 py-6 pr-4">
      {/* Categorías */}
      <div className="filter-group">
        <h3 className="h6 font-bold mb-4" style={{ fontSize: 18, color: '#111827' }}>Categorías</h3>
        <ul className="flex flex-col gap-2 list-unstyled">
          <li>
            <button
              onClick={() => onSelectCategory(null)}
              className="text-left w-full flex items-center gap-2 transition-colors"
              style={{ color: selectedCategory === null ? '#111827' : '#6b7280', fontWeight: selectedCategory === null ? 700 : 400 }}
            >
              <div style={{ width: 16, height: 16, borderRadius: 4, border: '1px solid #d1d5db', background: selectedCategory === null ? '#dfe146' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {selectedCategory === null && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="#2a2120" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              Todas las categorías
            </button>
          </li>
          {categories.map(cat => (
            <li key={cat.$id}>
              <button
                onClick={() => onSelectCategory(cat.$id)}
                className="text-left w-full flex items-center gap-2 transition-colors"
                style={{ color: selectedCategory === cat.$id ? '#111827' : '#6b7280', fontWeight: selectedCategory === cat.$id ? 700 : 400 }}
              >
                <div style={{ width: 16, height: 16, borderRadius: 4, border: '1px solid #d1d5db', background: selectedCategory === cat.$id ? '#dfe146' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selectedCategory === cat.$id && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="#2a2120" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Rango de Precio */}
      <div className="filter-group border-t border-gray-100 pt-8">
        <h3 className="h6 font-bold mb-4" style={{ fontSize: 18, color: '#111827' }}>Precio</h3>
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Min</span>
            <span className="text-sm text-gray-500">Max</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
              <input 
                type="number" 
                value={minStr}
                onChange={e => setMinStr(e.target.value)}
                onBlur={applyPrice}
                className="w-full pl-7 pr-2 py-2.5 bg-white border border-gray-200 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#dfe146] focus:border-transparent transition-all"
                placeholder="0"
                style={{ MozAppearance: 'textfield' }}
              />
            </div>
            <div className="w-4 h-[1px] bg-gray-300"></div>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
              <input 
                type="number" 
                value={maxStr}
                onChange={e => setMaxStr(e.target.value)}
                onBlur={applyPrice}
                className="w-full pl-7 pr-2 py-2.5 bg-white border border-gray-200 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#dfe146] focus:border-transparent transition-all"
                placeholder={maxPrice.toString()}
                style={{ MozAppearance: 'textfield' }}
              />
            </div>
          </div>

          <style jsx>{`
            input[type=number]::-webkit-inner-spin-button, 
            input[type=number]::-webkit-outer-spin-button { 
              -webkit-appearance: none; 
              margin: 0; 
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}
