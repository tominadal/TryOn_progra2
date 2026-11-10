import type { Metadata } from "next";
import Link from "next/link";
import { Storefront, Camera, Ruler, FileXls, ChartBar, ShieldCheck, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Para Marcas",
  description: "Digitalizá tu catálogo, publicá la moldería en centímetros y dejá que tus clientes prueben tus prendas en 3D.",
};

const FEATURES = [
  {
    icon: Camera,
    title: "De la foto al modelado 3D",
    text: "Subí la fotografía de una prenda y la plataforma genera su modelado 3D paramétrico con visión por computadora.",
  },
  {
    icon: Ruler,
    title: "Moldería en centímetros",
    text: "Definí cintura, cadera, muslo, entrepierna, botamanga y tiro. Los demás talles escalan a partir de tu talle base.",
  },
  {
    icon: FileXls,
    title: "Carga masiva por Excel",
    text: "Importá decenas de prendas en una sola planilla y seguí el avance del lote en vivo.",
  },
  {
    icon: ChartBar,
    title: "Catálogo bajo control",
    text: "Editá, duplicá como variante o eliminá prendas, y mirá qué modelos 3D están activos desde un solo panel.",
  },
];

const STEPS = [
  { title: "Creá tu cuenta de marca", text: "Registrate indicando el nombre de tu marca." },
  { title: "Cargá tus prendas", text: "Una por una con moldería en cm, o en lote desde Excel." },
  { title: "Tus clientes prueban en 3D", text: "Cada cliente ve el calce sobre su propio avatar antes de comprar." },
];

export default function MarcasPage() {
  return (
    <PageShell
      icon={Storefront}
      title="Para Marcas"
      subtitle="Mostrá cómo calza cada prenda antes de que se compre. Menos dudas de talle, menos devoluciones."
      widthClass="max-w-5xl"
    >
      <div className="space-y-12">
        <section aria-labelledby="marcas-features" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <h2 id="marcas-features" className="sr-only">
            Qué incluye
          </h2>
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="liquid-glass-card rounded-2xl p-5 sm:p-6 flex gap-4">
              <div className="shrink-0 w-11 h-11 rounded-xl bg-blue-500/15 dark:bg-blue-500/25 border border-blue-400/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{title}</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{text}</p>
              </div>
            </div>
          ))}
        </section>

        <section aria-labelledby="marcas-steps" className="liquid-glass-panel rounded-3xl p-6 sm:p-8">
          <h2 id="marcas-steps" className="text-xl font-bold mb-6">
            Cómo empezar
          </h2>
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-3.5">
                <span className="shrink-0 w-8 h-8 rounded-full liquid-glass-pill text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-sm mb-0.5">{step.title}</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="text-center">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-5">
            <ShieldCheck className="w-4 h-4" />
            Tus fotografías y moldería solo se usan para generar el modelado 3D de tu catálogo.
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full liquid-glass-btn-primary font-semibold text-sm"
            >
              Crear cuenta de marca
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center px-6 py-3 rounded-full liquid-glass-btn-secondary font-semibold text-sm"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

