"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ShoppingCart, User as UserIcon, Settings, LogOut, Shirt } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { useRouter } from "next/navigation";

const NAV_LINK_BASE =
  "px-3.5 py-1.5 rounded-full border transition-all duration-300";
const NAV_LINK_ACTIVE =
  "liquid-glass-pill border-white/60 dark:border-white/20 text-blue-600 dark:text-blue-400 font-semibold shadow-sm";
const NAV_LINK_INACTIVE =
  "border-transparent text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5";

export function Navbar() {
  const { user, logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // "Marketplace" also covers product pages, which are part of the shopping flow
  const isHome = pathname === "/";
  const isMarketplace = pathname.startsWith("/marketplace") || pathname.startsWith("/product");

  useEffect(() => {
    if (!user) return;

    const refreshCartCount = () => {
      fetchApi("/commerce/cart")
        .then((cart) => {
          setCartCount(
            cart.items
              ? cart.items.reduce((acc: number, item: { quantity: number }) => acc + item.quantity, 0)
              : 0
          );
        })
        .catch(() => setCartCount(0));
    };

    refreshCartCount();
    // Other pages dispatch "cart:updated" after changing the cart (clear, checkout)
    window.addEventListener("cart:updated", refreshCartCount);
    return () => window.removeEventListener("cart:updated", refreshCartCount);
  }, [user]);

  return (
    <nav className="fixed w-full z-50 top-0 liquid-glass-nav liquid-glass-refract transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 md:py-0 md:h-16 flex flex-wrap items-center justify-between gap-y-2 relative">
        {/* Left Side: Brand */}
        <div className="flex items-center">
          <Link href="/" className="text-lg sm:text-xl font-bold tracking-tighter flex items-center gap-2 hover:opacity-80 transition-opacity text-black dark:text-white">
            <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain dark:invert drop-shadow-sm" />
            TryOn <span className="text-neutral-500 dark:text-neutral-400">Hub</span>
          </Link>
        </div>

        {/* Center: Links */}
        <div className="order-3 md:order-none w-full md:w-auto flex justify-center md:absolute md:left-1/2 md:-translate-x-1/2 items-center gap-1.5 text-xs sm:text-sm font-medium pt-1 md:pt-0 border-t border-white/30 dark:border-white/5 md:border-0">
          <Link href="/" aria-current={isHome ? "page" : undefined} className={`${NAV_LINK_BASE} ${isHome ? NAV_LINK_ACTIVE : NAV_LINK_INACTIVE}`}>Inicio</Link>
          <Link href="/marketplace" aria-current={isMarketplace ? "page" : undefined} className={`${NAV_LINK_BASE} ${isMarketplace ? NAV_LINK_ACTIVE : NAV_LINK_INACTIVE}`}>Marketplace</Link>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          
          <Link href="/cart" className="relative p-2 rounded-full liquid-glass-btn-secondary text-neutral-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all">
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md ring-2 ring-white/80 dark:ring-neutral-900">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-full liquid-glass-pill hover:scale-105 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500/15 dark:bg-blue-500/25 flex items-center justify-center overflow-hidden border border-blue-400/40 dark:border-blue-400/30">
                   <UserIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-60 max-w-[calc(100vw-2rem)] liquid-glass-panel rounded-2xl py-2 flex flex-col z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2.5 border-b border-neutral-200/60 dark:border-white/10 mb-1.5">
                    <p className="text-sm font-bold truncate text-black dark:text-white">{user.full_name}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{user.email}</p>
                  </div>
                  
                  {user.role_id !== 2 && (
                    <Link href="/avatar" onClick={() => setDropdownOpen(false)} className="mx-1.5 px-3 py-2 rounded-xl text-sm text-neutral-700 dark:text-neutral-200 hover:bg-white/60 dark:hover:bg-white/10 flex items-center gap-2 transition-colors">
                      <Shirt className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Mi Avatar 3D
                    </Link>
                  )}
                  {user.role_id === 2 && (
                    <Link href="/brand/dashboard" onClick={() => setDropdownOpen(false)} className="mx-1.5 px-3 py-2 rounded-xl text-sm text-neutral-700 dark:text-neutral-200 hover:bg-white/60 dark:hover:bg-white/10 flex items-center gap-2 transition-colors">
                      <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Brand Dashboard
                    </Link>
                  )}
                  
                  <button onClick={() => { setDropdownOpen(false); logout(); router.push('/login'); }} className="mx-1.5 px-3 py-2 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 flex items-center gap-2 text-left mt-1.5 border-t border-neutral-200/60 dark:border-white/10 pt-2.5 transition-colors">
                    <LogOut className="w-4 h-4" /> Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link href="/login" className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-full liquid-glass-btn-secondary text-neutral-700 dark:text-neutral-200 hover:text-black dark:hover:text-white transition-all whitespace-nowrap">Iniciar Sesión</Link>
              <Link href="/register" className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold liquid-glass-btn-primary rounded-full transition-all active:scale-95 whitespace-nowrap">Registrarse</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
