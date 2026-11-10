import type { Metadata } from "next";
import { ClipboardText, Check } from "@phosphor-icons/react/dist/ssr";
import { PageShell } from "@/components/PageShell";
import { CONSIGNAS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Consignas de la cátedra",
  description: "Cumplimiento de las consignas de Programación II por parte de TryOnHub.",
};

export default function ConsignasPage() {
  return (
    <PageShell
      icon={ClipboardText}
      title="Consignas de la cátedra"
      subtitle="Requisitos de Programación II y cómo los resuelve TryOnHub."
    >
      <ol className="space-y-3">
        {CONSIGNAS.map((c, index) => (
          <li
            key={c.id}
            id={CONSIGNAS.findIndex((x) => x.anchor === c.anchor) === index ? c.anchor : undefined}
            className="liquid-glass-card rounded-2xl p-5 flex gap-4 scroll-mt-28"
          >
            <span className="shrink-0 w-9 h-9 rounded-xl bg-blue-500/15 dark:bg-blue-500/25 border border-blue-400/30 text-blue-700 dark:text-blue-300 text-sm font-bold flex items-center justify-center">
              {c.id}
            </span>
            <div className="min-w-0">
              <h2 className="font-semibold text-base flex items-center gap-2">
                {c.title}
                <Check className="w-4 h-4 text-emerald-500 shrink-0" aria-label="Cumplida" />
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mt-1">{c.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </PageShell>
  );
}
