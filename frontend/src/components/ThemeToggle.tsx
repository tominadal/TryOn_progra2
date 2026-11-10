"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) {
    return <div className="w-9 h-9" />;
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-full liquid-glass-btn-secondary transition-all active:scale-95"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 hover:text-amber-200 transition-colors" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-700 hover:text-blue-600 transition-colors" />}
    </button>
  );
}
