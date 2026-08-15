"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { fetchApi } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

interface Garment {
  id: number;
  name: string;
  fit: string;
  price: string;
  image: string;
  is_processed?: boolean;
}

export default function Home() {
  const { user, logout } = useAuth();
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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 font-sans selection:bg-blue-500/30 transition-colors duration-300">
      <Navbar />

      {/* Hero Section Carousel Style */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden min-h-[80vh] flex items-center bg-fixed" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=2000)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
        </div>
        
        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10 text-white">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm font-medium mb-4 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            La Prueba Virtual con IA está activa
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-400">
            El fin de las devoluciones por talle. <br/> Bienvenido al estándar del gemelo digital.
          </h1>
          <p className="text-lg md:text-xl text-neutral-300 max-w-2xl mx-auto leading-relaxed">
            No somos un "probador mejorado". Somos una forma radicalmente diferente de comprar. Crea tu clon 3D paramétrico y ten la certeza absoluta de cómo te quedará la ropa antes de pagarla.
          </p>
          <div className="pt-8 flex justify-center gap-4">
            <Link href="/marketplace" className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-500/30">
              Explorar Catálogo
            </Link>
          </div>
        </div>
      </section>

      {/* Sobre Nosotros */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="w-full lg:w-1/2 space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Nuestro Movimiento</h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
              En TryOnHub no buscamos mejorar la tabla de talles. Queremos volverla obsoleta. 
              Nuestra misión es liderar un movimiento hacia el consumo responsable, reduciendo drásticamente la huella de carbono causada por las devoluciones masivas de e-commerce.
            </p>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Al digitalizar prendas con Inteligencia Artificial y permitirte probarlas sobre tu propio avatar paramétrico exacto, 
              te devolvemos la confianza absoluta sobre tu cuerpo a la hora de comprar online. Es el punto de inflexión del retail.
            </p>
            <div className="pt-4">
              <Link href="/avatar" className="inline-flex items-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-500/25">
                Personalizar mi Avatar &rarr;
              </Link>
            </div>
          </div>
          <div className="w-full lg:w-1/2">
            <div className="aspect-[4/3] md:aspect-video lg:aspect-[4/3] bg-neutral-200 dark:bg-neutral-800 rounded-3xl overflow-hidden relative shadow-2xl">
              <img 
                src="/images/about_fashion.png" 
                alt="Tecnología 3D en el Estudio" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-white/90 dark:bg-black/80 backdrop-blur p-4 rounded-2xl shadow-lg border border-white/20">
                  <h3 className="font-bold text-lg mb-1 dark:text-white">Estudio de Diseño Digital</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Innovación continua para asegurar un modelado preciso y un calce perfecto.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Artículos Más Vendidos */}
      <section className="py-24 px-6 bg-white dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Artículos Más Vendidos</h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">Las prendas favoritas de nuestra comunidad, listas para probar.</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-neutral-200 dark:bg-neutral-800 h-96 rounded-3xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {jeans.slice(0,3).map((garment) => (
                <Link 
                  key={garment.id} 
                  href={`/product/${garment.id}`}
                  className="group relative bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-xl hover:-translate-y-1 block"
                >
                  <div className="aspect-[4/5] bg-neutral-100 dark:bg-neutral-800 relative overflow-hidden">
                    {garment.image ? (
                      <img src={garment.image} alt={garment.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400 font-medium">Sin Imagen</div>
                    )}
                    {garment.is_processed && (
                      <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border border-neutral-200 dark:border-neutral-800 flex items-center gap-1">
                        <span className="flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Listo para 3D
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium mb-1 uppercase tracking-wider">TryOnHub Exclusive</p>
                        <h3 className="text-xl font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{garment.name}</h3>
                      </div>
                      <span className="text-xl font-black">${garment.price}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center">
            <Link href="/marketplace" className="inline-flex items-center gap-2 px-8 py-4 bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white font-bold rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
              Ver Catálogo Completo &rarr;
            </Link>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
