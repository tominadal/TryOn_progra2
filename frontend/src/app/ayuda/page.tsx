import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, LifeBuoy } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FAQ_ITEMS, groupFaqs } from "@/lib/faqs";

export const metadata: Metadata = {
  title: "Centro de Ayuda",
  description: "Preguntas frecuentes sobre el probador virtual 3D, los avatares y las compras en TryOnHub.",
};

export default function HelpPage() {
  const groups = groupFaqs(FAQ_ITEMS);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 font-sans selection:bg-blue-500/30 transition-colors duration-300">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 px-6 max-w-3xl mx-auto w-full">
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-5">
            <LifeBuoy className="w-7 h-7" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Centro de Ayuda</h1>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto text-sm leading-relaxed">
            Respuestas a las dudas más comunes sobre el probador virtual 3D, tus avatares y tus compras.
          </p>
        </header>

        {groups.length === 0 ? (
          <section
            aria-labelledby="faq-empty-title"
            className="text-center py-16 px-6 bg-white dark:bg-neutral-900/40 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm dark:shadow-none"
          >
            <h2 id="faq-empty-title" className="text-xl font-semibold mb-2">
              Estamos preparando las preguntas frecuentes
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6">
              Pronto vas a encontrar acá las respuestas a las dudas más habituales.
            </p>
            <Link
              href="/marketplace"
              className="inline-block px-6 py-3 bg-blue-600 dark:bg-white text-white dark:text-black font-semibold rounded-full hover:bg-blue-700 dark:hover:bg-neutral-200 transition-colors"
            >
              Ir al Marketplace
            </Link>
          </section>
        ) : (
          <div className="space-y-10">
            {groups.map((group) => (
              <section key={group.category} aria-labelledby={`faq-${group.category}`}>
                <h2
                  id={`faq-${group.category}`}
                  className="text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3"
                >
                  {group.category}
                </h2>
                <div className="space-y-3">
                  {group.items.map((item) => (
                    <details
                      key={item.id}
                      id={item.id}
                      className="group bg-white dark:bg-neutral-900/40 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm dark:shadow-none open:border-blue-500/50 transition-colors"
                    >
                      <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-5 py-4 font-medium [&::-webkit-details-marker]:hidden">
                        {item.question}
                        <ChevronDown className="w-4 h-4 shrink-0 text-neutral-400 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="px-5 pb-5 space-y-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                        {item.answer.split("\n\n").map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
