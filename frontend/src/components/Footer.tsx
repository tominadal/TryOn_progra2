import Link from "next/link";
import { MessageSquare, Camera, Briefcase, Globe } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-900 py-12 px-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand */}
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold tracking-tighter text-black dark:text-white">
            <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
              <span className="text-white text-xs">V</span>
            </div>
            TryOn <span className="text-neutral-500">Hub</span>
          </Link>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            La nueva generación de probadores virtuales para e-commerce. Pruébalo antes de comprarlo, potenciado por generación 3D avanzada.
          </p>
          <div className="flex gap-4 pt-2">
            <a href="#" className="text-neutral-400 hover:text-blue-500 transition-colors"><MessageSquare className="w-5 h-5" /></a>
            <a href="#" className="text-neutral-400 hover:text-pink-500 transition-colors"><Camera className="w-5 h-5" /></a>
            <a href="#" className="text-neutral-400 hover:text-blue-700 transition-colors"><Briefcase className="w-5 h-5" /></a>
            <a href="#" className="text-neutral-400 hover:text-black dark:hover:text-white transition-colors"><Globe className="w-5 h-5" /></a>
          </div>
        </div>

        {/* Links */}
        <div>
          <h3 className="font-semibold mb-4 text-black dark:text-white">Producto</h3>
          <ul className="space-y-3 text-sm text-neutral-500 dark:text-neutral-400">
            <li><Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Marketplace</Link></li>
            <li><Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Gemelo Digital</Link></li>
            <li><Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Para Marcas</Link></li>
            <li><Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Precios</Link></li>
          </ul>
        </div>

        {/* Resources */}
        <div>
          <h3 className="font-semibold mb-4 text-black dark:text-white">Recursos</h3>
          <ul className="space-y-3 text-sm text-neutral-500 dark:text-neutral-400">
            <li><Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Documentación</Link></li>
            <li><Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Referencia API</Link></li>
            <li><Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Blog</Link></li>
            <li><Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Centro de Ayuda</Link></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h3 className="font-semibold mb-4 text-black dark:text-white">Mantente Actualizado</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Suscríbete a nuestro boletín para las últimas novedades.</p>
          <div className="flex gap-2">
            <input 
              type="email" 
              placeholder="Correo electrónico"
              className="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors text-black dark:text-white"
            />
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
              Suscribir
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-900 text-center flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm text-neutral-400">&copy; 2026 TryOn Hub. Todos los derechos reservados.</p>
        <div className="flex gap-4 text-sm text-neutral-400">
          <a href="#" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Política de Privacidad</a>
          <a href="#" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Términos de Servicio</a>
        </div>
      </div>
    </footer>
  );
}
