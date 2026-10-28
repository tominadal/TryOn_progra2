import Link from "next/link";
import { MessageSquare, Camera, Briefcase } from "lucide-react";

const GITHUB_URL = "https://github.com/tominadal/TryOn_progra2";

/** GitHub mark. lucide-react no longer ships brand icons, so it is drawn inline. */
function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="w-full bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-900 py-12 px-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand */}
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold tracking-tighter text-black dark:text-white">
            <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain dark:invert" />
            TryOn <span className="text-neutral-500">Hub</span>
          </Link>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            La nueva generación de probadores virtuales para e-commerce. Pruébalo antes de comprarlo, potenciado por generación 3D avanzada.
          </p>
          <div className="flex gap-4 pt-2">
            <a href="#" className="text-neutral-400 hover:text-blue-500 transition-colors"><MessageSquare className="w-5 h-5" /></a>
            <a href="#" className="text-neutral-400 hover:text-pink-500 transition-colors"><Camera className="w-5 h-5" /></a>
            <a href="#" className="text-neutral-400 hover:text-blue-700 transition-colors"><Briefcase className="w-5 h-5" /></a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Código del proyecto en GitHub"
              title="GitHub"
              className="text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
            >
              <GithubIcon className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Links */}
        <div>
          <h3 className="font-semibold mb-4 text-black dark:text-white">Producto</h3>
          <ul className="space-y-3 text-sm text-neutral-500 dark:text-neutral-400">
            <li><Link href="/marketplace" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Marketplace</Link></li>
            <li><Link href="/avatar" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Gemelo Digital</Link></li>
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
            <li><Link href="/ayuda" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Centro de Ayuda</Link></li>
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
