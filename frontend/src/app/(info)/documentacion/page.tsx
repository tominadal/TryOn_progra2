import type { Metadata } from "next";
import { BookOpen, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { PageShell } from "@/components/PageShell";
import { DOCS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Documentación",
  description: "Documentación técnica, de negocio y de arquitectura de TryOnHub.",
};

const GROUPS = ["Producto y negocio", "Ingeniería", "Referencia"] as const;

export default function DocumentacionPage() {
  return (
    <PageShell
      icon={BookOpen}
      title="Documentación"
      subtitle="Todo lo que documenta el proyecto: negocio, arquitectura, diagramas y referencia de la API. Cada documento se abre en el repositorio, siempre en su última versión."
    >
      <div className="space-y-10">
        {GROUPS.map((group) => (
          <section key={group} aria-labelledby={`doc-${group}`}>
            <h2
              id={`doc-${group}`}
              className="text-xs sm:text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3.5 px-1"
            >
              {group}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DOCS.filter((d) => d.group === group).map((doc) => (
                <a
                  key={doc.id}
                  href={doc.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group liquid-glass-card rounded-2xl p-5 flex flex-col gap-2"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="font-semibold text-base">{doc.title}</span>
                    <ArrowUpRight className="w-4 h-4 shrink-0 mt-1 text-neutral-400 group-hover:text-blue-500 transition-colors" />
                  </span>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {doc.description}
                  </span>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  );
}

