'use client';
import Link from 'next/link';
import { ShoppingCart, Search, Menu, X, Phone, ChevronDown, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useState } from 'react';

const CATS = ['Herramientas', 'Construcción', 'Jardín', 'Baño', 'Cocina', 'Electricidad', 'Pintura'];

export default function Navbar3() {
  const { totalItems } = useCart();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  return (
    <header className="sticky top-0 z-50 shadow-md">
      {/* Top strip */}
      <div className="bg-[#1a1a2e] text-white">
        <div className="max-w-7xl mx-auto px-4 h-8 flex items-center justify-between text-xs text-gray-300">
          <span className="flex items-center gap-1.5"><Phone size={11}/> Atención al cliente: 600 600 0000</span>
          <div className="hidden md:flex items-center gap-4">
            <Link href="/cuenta/pedidos" className="hover:text-white transition-colors">Mis Pedidos</Link>
            <span className="text-gray-600">|</span>
            <Link href="/cuenta/pedidos" className="hover:text-white transition-colors">Mi Cuenta</Link>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="bg-[#F96302]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/" className="text-2xl font-black text-white shrink-0 mr-2 tracking-tight">
            TIENDA
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-2xl flex">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="¿Qué estás buscando?"
              className="flex-1 h-10 px-4 text-sm text-gray-800 bg-white outline-none rounded-l"
              style={{ boxShadow: 'none' }}
            />
            <Link
              href={query ? `/productos?q=${encodeURIComponent(query)}` : '/productos'}
              className="h-10 px-5 bg-[#1a1a2e] hover:bg-[#2a2a4e] text-white flex items-center rounded-r transition-colors"
            >
              <Search size={18} />
            </Link>
          </div>

          {/* Right */}
          <div className="hidden md:flex items-center gap-4 ml-2 shrink-0">
            <Link href="/cuenta/pedidos" className="flex flex-col items-center text-white hover:text-orange-200 transition-colors">
              <User size={20}/>
              <span className="text-[10px] mt-0.5 font-medium">Cuenta</span>
            </Link>
            <Link href="/carrito" className="relative flex flex-col items-center text-white hover:text-orange-200 transition-colors">
              <ShoppingCart size={20}/>
              <span className="text-[10px] mt-0.5 font-medium">Carro</span>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-3 bg-[#1a1a2e] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>
          </div>
          <button className="md:hidden p-1 text-white" onClick={() => setOpen(!open)}>
            {open ? <X size={24}/> : <Menu size={24}/>}
          </button>
        </div>
      </div>

      {/* Category bar */}
      <div className="bg-[#1a1a2e]">
        <div className="max-w-7xl mx-auto px-4 h-9 flex items-center gap-1 overflow-x-auto whitespace-nowrap">
          {CATS.map(cat => (
            <Link
              key={cat}
              href={`/productos?categoria=${encodeURIComponent(cat)}`}
              className="text-xs text-gray-300 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded transition-colors flex items-center gap-0.5 shrink-0"
            >
              {cat}
            </Link>
          ))}
          <Link href="/ofertas" className="ml-2 text-xs text-[#F96302] hover:text-orange-400 font-semibold px-3 py-1.5 shrink-0 transition-colors">
            🔥 Ofertas
          </Link>
        </div>
      </div>

      {/* Mobile */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-3">
          <div className="flex">
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar..." className="flex-1 border border-gray-300 rounded-l px-3 py-2 text-sm outline-none"/>
            <Link href={query ? `/productos?q=${encodeURIComponent(query)}` : '/productos'} className="bg-[#F96302] text-white px-3 rounded-r flex items-center"><Search size={16}/></Link>
          </div>
          {CATS.map(cat => (
            <Link key={cat} href={`/productos?categoria=${encodeURIComponent(cat)}`} onClick={() => setOpen(false)} className="text-gray-700 text-sm py-1 border-b border-gray-100">{cat}</Link>
          ))}
          <Link href="/carrito" onClick={() => setOpen(false)} className="text-gray-700 text-sm flex items-center gap-2 pt-1">
            <ShoppingCart size={16}/> Carro {totalItems > 0 && `(${totalItems})`}
          </Link>
        </div>
      )}
    </header>
  );
}
