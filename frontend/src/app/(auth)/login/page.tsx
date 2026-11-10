"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { fetchApi } from "@/lib/api";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import { toast } from "sonner";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  
  // Show toast if redirected due to expired session
  useEffect(() => {
    if (typeof window !== 'undefined' && searchParams.get('expired') === 'true') {
      // Prevent showing toast on every render by replacing the URL
      window.history.replaceState(null, '', '/login');
      setTimeout(() => toast.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'), 100);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);
      formData.append("remember_me", "true");

      const json = await fetchApi("/auth/login", {
        method: "POST",
        body: formData,
      });
      await login(json.access_token);
      toast.success("¡Bienvenido de nuevo!");
      router.push("/");
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen liquid-bg flex items-center justify-center p-4 sm:p-6 text-neutral-900 dark:text-neutral-50 font-sans transition-colors duration-300">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 sm:mb-10">
          <Link href="/" className="inline-flex items-center gap-2.5 text-2xl font-bold tracking-tighter mb-2 text-black dark:text-white">
            <img src="/logo.png" alt="TryOn Hub Logo" className="w-10 h-10 object-contain drop-shadow-[0_2px_10px_rgba(37,99,235,0.4)]" />
            <span>TryOn <span className="text-blue-600 dark:text-blue-400">Hub</span></span>
          </Link>
          <h1 className="text-2xl font-semibold mt-5 sm:mt-6">Bienvenido de nuevo</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2 text-sm sm:text-base">Ingresa tus credenciales para acceder a tu cuenta</p>
        </div>

        <div className="liquid-glass-panel liquid-glass-refract p-6 sm:p-8 rounded-3xl transition-colors duration-300">
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">Correo Electrónico</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full liquid-glass-input rounded-xl px-4 py-3 text-sm text-black dark:text-white"
                placeholder="tu@ejemplo.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">Contraseña</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full liquid-glass-input rounded-xl px-4 py-3 text-sm text-black dark:text-white pr-12"
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                >
                  {showPassword ? <EyeSlash className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">

              <Link href="/recuperar" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">¿Olvidaste tu contraseña?</Link>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 sm:py-4 liquid-glass-btn-primary font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Iniciando sesión...
                </>
              ) : "Iniciar Sesión"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-neutral-600 dark:text-neutral-400">
            ¿No tienes una cuenta?{" "}
            <Link href="/register" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen liquid-bg flex items-center justify-center p-6"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>}>
      <LoginForm />
    </Suspense>
  );
}
