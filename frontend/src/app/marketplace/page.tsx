"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { Search, Filter, Grid3X3, List, Star } from "lucide-react";

interface Garment {
  id: number;
  name: string;
  sku: string;
  price: number;
  color: string;
  fit: string;
  size: string;
  brand_id: number;
  image?: string;
  is_processed: boolean;
}

export default function MarketplacePage() {
  const [garments, setGarments] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFits, setSelectedFits] = useState<string[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    fetchApi("/catalog/garments")
      .then((data) => setGarments(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleFitChange = (fit: string) => {
    setSelectedFits(prev => 
      prev.includes(fit) ? prev.filter(f => f !== fit) : [...prev, fit]
    );
  };

  const filteredGarments = garments.filter((g) => {
    const matchesSearch = 
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.color.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFit = selectedFits.length === 0 || selectedFits.some(fit => g.fit.toLowerCase().includes(fit.toLowerCase()));
    
    let matchesPrice = true;
    if (selectedPrice === "under_50") matchesPrice = g.price < 50;
    else if (selectedPrice === "50_to_100") matchesPrice = g.price >= 50 && g.price <= 100;
    else if (selectedPrice === "over_100") matchesPrice = g.price > 100;

    return matchesSearch && matchesFit && matchesPrice;
  });

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 font-sans selection:bg-blue-500/30 transition-colors duration-300">
      <Navbar />

      <main className="pt-24 pb-12 px-6 max-w-[1400px] mx-auto min-h-screen flex flex-col lg:flex-row gap-8">
        
        {/* Sticky Sidebar (Left) */}
        <aside className="w-full lg:w-64 shrink-0 space-y-8 lg:sticky lg:top-24 h-fit">
          <div>
            <h2 className="text-2xl font-bold mb-6">Filtros</h2>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input 
                type="text" 
                placeholder="Buscar modelo o color..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Filter className="w-4 h-4" /> Calce (Jeans)</h3>
            <div className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400 font-medium">
              <label className="flex items-center gap-3 cursor-pointer hover:text-black dark:hover:text-white transition-colors">
                <input type="checkbox" checked={selectedFits.includes("Straight")} onChange={() => handleFitChange("Straight")} className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500" /> Straight / Recto
              </label>
              <label className="flex items-center gap-3 cursor-pointer hover:text-black dark:hover:text-white transition-colors">
                <input type="checkbox" checked={selectedFits.includes("Skinny")} onChange={() => handleFitChange("Skinny")} className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500" /> Skinny / Ajustado
              </label>
              <label className="flex items-center gap-3 cursor-pointer hover:text-black dark:hover:text-white transition-colors">
                <input type="checkbox" checked={selectedFits.includes("Wide Leg")} onChange={() => handleFitChange("Wide Leg")} className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500" /> Wide Leg
              </label>
              <label className="flex items-center gap-3 cursor-pointer hover:text-black dark:hover:text-white transition-colors">
                <input type="checkbox" checked={selectedFits.includes("Mom Fit")} onChange={() => handleFitChange("Mom Fit")} className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500" /> Mom Fit
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Precio</h3>
            <div className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400 font-medium">
              <label className="flex items-center gap-3 cursor-pointer hover:text-black dark:hover:text-white transition-colors">
                <input type="radio" name="price" checked={selectedPrice === "all"} onChange={() => setSelectedPrice("all")} className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-neutral-300" /> Todos
              </label>
              <label className="flex items-center gap-3 cursor-pointer hover:text-black dark:hover:text-white transition-colors">
                <input type="radio" name="price" checked={selectedPrice === "under_50"} onChange={() => setSelectedPrice("under_50")} className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-neutral-300" /> Menos de $50
              </label>
              <label className="flex items-center gap-3 cursor-pointer hover:text-black dark:hover:text-white transition-colors">
                <input type="radio" name="price" checked={selectedPrice === "50_to_100"} onChange={() => setSelectedPrice("50_to_100")} className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-neutral-300" /> $50 - $100
              </label>
              <label className="flex items-center gap-3 cursor-pointer hover:text-black dark:hover:text-white transition-colors">
                <input type="radio" name="price" checked={selectedPrice === "over_100"} onChange={() => setSelectedPrice("over_100")} className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-neutral-300" /> Más de $100
              </label>
            </div>
          </div>
        </aside>

        {/* Content (Right) */}
        <section className="flex-1 w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 border-b border-neutral-200 dark:border-neutral-800 pb-4 gap-4">
            <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
            <div className="flex gap-2">
              <button 
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-xl transition-colors ${viewMode === 'grid' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-xl transition-colors ${viewMode === 'list' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-neutral-100 dark:bg-neutral-900 h-96 rounded-3xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-6"}>
              {filteredGarments.length === 0 ? (
                <div className="col-span-full py-12 text-center text-neutral-500 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800">
                  <p className="text-lg font-medium">No se encontraron prendas con esos filtros.</p>
                  <button onClick={() => { setSearchQuery(""); setSelectedFits([]); setSelectedPrice("all"); }} className="mt-4 text-blue-600 hover:underline">Limpiar filtros</button>
                </div>
              ) : filteredGarments.map((garment) => (
                <Link 
                  key={garment.id} 
                  href={`/product/${garment.id}`}
                  className={`group bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 block ${viewMode === 'list' ? 'flex flex-col sm:flex-row h-auto sm:h-56' : ''}`}
                >
                  <div className={`relative bg-neutral-100 dark:bg-neutral-800 ${viewMode === 'list' ? 'w-full sm:w-48 h-64 sm:h-full shrink-0' : 'aspect-[4/5] w-full'}`}>
                    {garment.image ? (
                      <img src={garment.image + "?v=5"} alt={garment.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400 font-medium">Sin Imagen</div>
                    )}
                    {garment.is_processed && (
                      <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/90 backdrop-blur text-xs font-bold px-3 py-1.5 rounded-full shadow-sm border border-neutral-200 dark:border-neutral-800 flex items-center gap-1.5">
                        <span className="flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Listo para 3D
                      </div>
                    )}
                  </div>
                  <div className={`p-6 flex flex-col justify-between ${viewMode === 'list' ? 'flex-1' : ''}`}>
                    <div>
                      <p className="text-xs text-neutral-500 font-bold mb-2 tracking-widest uppercase">
                        {garment.brand_id === 1 ? 'Acme Denim' : 'Marca ' + garment.brand_id}
                      </p>
                      <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">{garment.name}</h3>
                      {viewMode === 'list' && (
                         <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 line-clamp-2">
                           Jeans premium con calce perfecto. Digitalizado para TryOnHub.
                         </p>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-6">
                      <span className="text-2xl font-black">${garment.price}</span>
                      <span className="text-sm font-bold px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-neutral-700 dark:text-neutral-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        Comprar &rarr;
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
