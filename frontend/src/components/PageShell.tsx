import type { ReactNode, ComponentType } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface PageShellProps {
  icon: ComponentType<{ className?: string; weight?: any }>;
  title: string;
  subtitle: string;
  /** Tailwind max-width class for the content column. */
  widthClass?: string;
  children: ReactNode;
}

/** Shared frame for informational pages: navbar, glass header, content and footer. */
export function PageShell({ icon: Icon, title, subtitle, widthClass = "max-w-4xl", children }: PageShellProps) {
  return (
    <div className="min-h-screen flex flex-col liquid-bg text-neutral-900 dark:text-neutral-50 font-sans selection:bg-blue-500/30 transition-colors duration-300">
      <Navbar />
      <main className={`flex-1 pt-28 md:pt-24 pb-16 px-4 sm:px-6 mx-auto w-full ${widthClass}`}>
        <header className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl liquid-glass-pill liquid-glass-refract text-blue-600 dark:text-blue-400 mb-5">
            <Icon className="w-7 h-7" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">{title}</h1>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            {subtitle}
          </p>
        </header>
        {children}
      </main>
      <Footer />
    </div>
  );
}

