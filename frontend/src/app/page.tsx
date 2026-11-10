"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { ArrowRight } from "@phosphor-icons/react";

interface Garment {
  id: number;
  name: string;
  fit: string;
  price: string;
  image: string;
  is_processed?: boolean;
}

export default function Home() {
  const [jeans, setJeans] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi("/catalog/garments")
      .then(data => {
        setJeans(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen liquid-bg text-neutral-900 dark:text-neutral-50 font-sans selection:bg-blue-500/30 transition-colors duration-300">
      <Navbar />

      {/* Hero Section Carousel Style */}
      <section className="relative pt-36 md:pt-32 pb-20 md:pb-24 px-4 sm:px-6 overflow-hidden min-h-[82vh] flex items-center bg-scroll md:bg-fixed" style={{ backgroundImage: 'url(/images/hero_bg.png?v=2)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/65 via-slate-950/50 to-slate-950/80 backdrop-blur-[1.5px]"></div>
        </div>
        
        <div className="max-w-5xl mx-auto text-center space-y-6 sm:space-y-8 relative z-10 text-white">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/15 border border-white/30 text-white text-xs sm:text-sm font-medium mb-2 sm:mb-4 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_8px_24px_rgba(0,0,0,0.25)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            La Prueba Virtual con IA está activa
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.1] pb-3 text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-neutral-300 drop-shadow-sm">
            El fin de las devoluciones por talle. <br/> Bienvenido al estándar del gemelo digital.
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-neutral-200 max-w-2xl mx-auto leading-relaxed px-2">
            No somos un &ldquo;probador mejorado&rdquo;. Somos una forma radicalmente diferente de comprar. Crea tu clon 3D paramétrico y ten la certeza absoluta de cómo te quedará la ropa antes de pagarla.
          </p>
          <div className="pt-4 sm:pt-8 flex justify-center gap-4">
            <Link href="/marketplace" className="px-7 sm:px-8 py-3.5 sm:py-4 liquid-glass-btn-primary font-semibold rounded-full transition-all active:scale-95">
              Explorar Catálogo
            </Link>
          </div>
        </div>
      </section>

      {/* Sobre Nosotros */}
      <section className="py-16 md:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-stretch gap-8 lg:gap-12">
          <div className="w-full lg:w-1/2 flex flex-col justify-between space-y-5 sm:space-y-6 liquid-glass-panel p-6 sm:p-10 rounded-3xl">
            <div className="space-y-5 sm:space-y-6">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">Nuestro Movimiento</h2>
              <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 leading-relaxed">
                En TryOnHub no buscamos mejorar la tabla de talles. Queremos volverla obsoleta. 
                Nuestra misión es liderar un movimiento hacia el consumo responsable, reduciendo drásticamente la huella de carbono causada por las devoluciones masivas de e-commerce.
              </p>
              <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Al digitalizar prendas con Inteligencia Artificial y permitirte probarlas sobre tu propio avatar paramétrico exacto, 
                te devolvemos la confianza absoluta sobre tu cuerpo a la hora de comprar online. Es el punto de inflexión del retail.
              </p>
            </div>
            <div className="pt-2 sm:pt-4">
              <Link href="/avatar" className="inline-flex items-center justify-center w-full sm:w-auto gap-2 px-6 py-4 liquid-glass-btn-primary font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-95">
                Personalizar mi Avatar <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="w-full lg:w-1/2 flex">
            <div className="w-full min-h-[360px] sm:min-h-[420px] lg:min-h-0 lg:h-full flex-1 liquid-glass-card rounded-3xl overflow-hidden relative p-1.5 flex">
              <div className="w-full flex-1 rounded-[20px] overflow-hidden relative">
                <img 
                  src="/images/about_fashion.png?v=2" 
                  alt="Tecnología 3D en el Estudio" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent"></div>
                <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6">
                  <div className="liquid-glass-pill liquid-glass-refract p-4 sm:p-5 rounded-2xl">
                    <h3 className="font-bold text-base sm:text-lg mb-1 text-neutral-900 dark:text-white">Estudio de Diseño Digital</h3>
                    <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">Innovación continua para asegurar un modelado preciso y un calce perfecto.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Artículos Más Vendidos */}
      <section className="py-16 md:py-24 px-4 sm:px-6 border-t border-white/50 dark:border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">Artículos Más Vendidos</h2>
            <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400">Las prendas favoritas de nuestra comunidad, listas para probar.</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[1, 2, 3].map((n) => (
                <div key={n} className="liquid-glass-card h-96 rounded-3xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 md:mb-16">
              {jeans.slice(0,3).map((garment) => (
                <Link 
                  key={garment.id} 
                  href={`/product/${garment.id}`}
                  className="group relative liquid-glass-card rounded-3xl overflow-hidden hover:-translate-y-1.5 block"
                >
                  <div className="aspect-[4/5] bg-neutral-100/60 dark:bg-neutral-800/60 relative overflow-hidden">
                    {garment.image ? (
                      <img
                        src={garment.image}
                        alt={garment.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/products/jean_classic.png";
                        }}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400 font-medium">Sin Imagen</div>
                    )}
                    {garment.is_processed && (
                      <div className="absolute top-4 right-4 liquid-glass-pill liquid-glass-refract text-neutral-900 dark:text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
                        <span className="flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Listo para 3D
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5 sm:p-6">
                    <div className="flex justify-between items-start gap-3 mb-4">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-medium mb-1 uppercase tracking-wider">TryOnHub Exclusive</p>
                        <h3 className="text-lg sm:text-xl font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">{garment.name}</h3>
                      </div>
                      <span className="text-lg sm:text-xl font-black shrink-0">{formatPrice(garment.price)}</span>
                    </div>
                    <div className="flex justify-end">
                      <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold px-3.5 py-2 liquid-glass-btn-secondary rounded-xl text-neutral-800 dark:text-neutral-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all">
                        Comprar <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center">
            <Link href="/marketplace" className="inline-flex items-center gap-2 px-7 sm:px-8 py-3.5 sm:py-4 liquid-glass-btn-secondary text-black dark:text-white font-bold rounded-full transition-all active:scale-95">
              Ver Catálogo Completo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
