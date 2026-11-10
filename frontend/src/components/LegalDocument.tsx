import type { ReactNode } from "react";

export interface LegalSection {
  title: string;
  body: ReactNode;
}

/** Renders numbered legal sections inside one glass panel. */
export function LegalDocument({ updated, sections }: { updated: string; sections: LegalSection[] }) {
  return (
    <article className="liquid-glass-panel rounded-3xl p-6 sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-8">
        Última actualización: {updated}
      </p>
      <div className="space-y-8">
        {sections.map((section, index) => (
          <section key={section.title} aria-labelledby={`legal-${index}`}>
            <h2 id={`legal-${index}`} className="text-lg font-bold mb-2.5">
              {index + 1}. {section.title}
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              {section.body}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}

