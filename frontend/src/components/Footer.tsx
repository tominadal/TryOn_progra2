import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { API_DOCS_URL, DOCS } from "@/lib/site";

const LINK_CLASS = "hover:text-blue-600 dark:hover:text-blue-400 transition-colors";

const CONSIGNA_LINKS = [
  { label: "Cumplimiento de la cátedra", href: "/consignas" },
  { label: "API REST con FastAPI", href: "/consignas#api" },
  { label: "Seguridad y roles", href: "/consignas#seguridad" },
  { label: "Testing y CI/CD", href: "/consignas#testing" },
  { label: "Patrones y SOLID", href: "/consignas#patrones" },
  { label: "Docker y despliegue", href: "/consignas#deploy" },
];

const DOC_LINK_IDS = ["requerimientos", "patrones", "clases", "negocio", "changelog"];
const DOC_LINKS = DOCS.filter((d) => DOC_LINK_IDS.includes(d.id));

export function Footer() {
  return (
    <footer className="w-full liquid-glass-panel border-t border-white/50 dark:border-white/10 py-12 px-4 sm:px-6 transition-all duration-300">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

        {/* Brand */}
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-center gap-2.5 text-xl font-bold tracking-tighter text-black dark:text-white">
            <img src="/logo.png" alt="TryOn Hub Logo" className="w-8 h-8 object-contain" />
            <span>TryOn <span className="text-blue-600 dark:text-blue-400">Hub</span></span>
          </Link>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            La nueva generación de probadores virtuales para e-commerce. Pruébalo antes de comprarlo, potenciado por generación 3D avanzada.
          </p>
          <div className="pt-1">
            <Link
              href="/presentacion"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-4 transition-all group"
            >
              <span>Ver Presentación Interactiva (15 min)</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Consignas */}
        <div>
          <h3 className="font-semibold mb-4 text-black dark:text-white">Consignas</h3>
          <ul className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
            {CONSIGNA_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={LINK_CLASS}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Documentación */}
        <div>
          <h3 className="font-semibold mb-4 text-black dark:text-white">Documentación</h3>
          <ul className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
            <li><Link href="/documentacion" className={LINK_CLASS}>Toda la documentación</Link></li>
            {DOC_LINKS.map((doc) => (
              <li key={doc.id}>
                <a href={doc.href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>{doc.title}</a>
              </li>
            ))}
            <li><a href={API_DOCS_URL} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>Referencia de la API</a></li>
            <li><Link href="/ayuda" className={LINK_CLASS}>Centro de Ayuda</Link></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h3 className="font-semibold mb-4 text-black dark:text-white">Mantente Actualizado</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">Suscríbete a nuestro boletín para las últimas novedades.</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              placeholder="Correo electrónico"
              className="w-full liquid-glass-input rounded-xl px-3.5 py-2.5 text-sm text-black dark:text-white placeholder:text-neutral-400"
            />
            <button className="liquid-glass-btn-primary px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 shrink-0">
              Suscribir
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-neutral-200/60 dark:border-white/10 text-center flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">&copy; 2026 TryOn Hub. Todos los derechos reservados.</p>
        <div className="flex flex-wrap justify-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
          <Link href="/privacidad" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Política de Privacidad</Link>
          <Link href="/terminos" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Términos de Servicio</Link>
        </div>
      </div>
    </footer>
  );
}
