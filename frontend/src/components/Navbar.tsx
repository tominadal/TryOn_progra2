"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ShoppingCart, User as UserIcon, Settings, LogOut, Shirt } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { useRouter } from "next/navigation";

export function Navbar() {
  const { user, logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchApi("/commerce/cart")
        .then((cart) => {
          if (cart.items) {
            setCartCount(cart.items.reduce((acc: number, item: any) => acc + item.quantity, 0));
          }
        })
        .catch(() => setCartCount(0));
    }
  }, [user]);

  return (
    <nav className="fixed w-full z-50 top-0 border-b border-neutral-200 dark:border-neutral-900 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left Side: Brand and Links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold tracking-tighter flex items-center gap-2 hover:opacity-80 transition-opacity text-black dark:text-white">
            <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
              <span className="text-white text-xs">V</span>
            </div>
            TryOn <span className="text-neutral-500">Hub</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">Inicio</Link>
            <Link href="/marketplace" className="text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">Marketplace</Link>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          <Link href="/cart" className="relative p-2 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-full border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center overflow-hidden border border-blue-200 dark:border-blue-800">
                   <UserIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl py-2 flex flex-col z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-800 mb-2">
                    <p className="text-sm font-bold truncate text-black dark:text-white">{user.full_name}</p>
                    <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                  </div>
                  
                  {user.role_id !== 2 && (
                    <Link href="/avatar" onClick={() => setDropdownOpen(false)} className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2">
                      <Shirt className="w-4 h-4" /> Mi Avatar 3D
                    </Link>
                  )}
                  {user.role_id === 2 && (
                    <Link href="/brand/dashboard" onClick={() => setDropdownOpen(false)} className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2">
                      <Settings className="w-4 h-4" /> Brand Dashboard
                    </Link>
                  )}
                  
                  <button onClick={() => { setDropdownOpen(false); logout(); router.push('/login'); }} className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2 text-left w-full mt-2 border-t border-neutral-100 dark:border-neutral-800 pt-2">
                    <LogOut className="w-4 h-4" /> Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors">Iniciar Sesión</Link>
              <Link href="/register" className="px-4 py-2 text-sm font-medium bg-black dark:bg-white text-white dark:text-black rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all active:scale-95">Registrarse</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
