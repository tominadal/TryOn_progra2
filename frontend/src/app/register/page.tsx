"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { Eye, EyeOff, User, Store } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"customer" | "brand">("customer");
  const [brandName, setBrandName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Mapping: Customer = 3, Brand Manager = 2
      const role_id = role === "customer" ? 3 : 2;

      await fetchApi("/users/", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          role_id,
          // If the backend doesn't support brand_name in /users/ yet, this will just be ignored or we might need an endpoint,
          // but for now we pass it just in case or for future implementation
          ...(role === "brand" && { brand_name: brandName })
        })
      });

      toast.success("¡Cuenta creada exitosamente! Por favor inicia sesión.");
      router.push("/login");
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Error al registrarse");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen liquid-bg flex items-center justify-center p-4 sm:p-6 text-neutral-900 dark:text-neutral-50 font-sans transition-colors duration-300">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 sm:mb-10">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold tracking-tighter mb-2 text-black dark:text-white">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain dark:invert drop-shadow-sm" />
            TryOn <span className="text-neutral-500 dark:text-neutral-400">Hub</span>
          </Link>
          <h1 className="text-2xl font-semibold mt-5 sm:mt-6">Crea una cuenta</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2 text-sm sm:text-base">Comienza tu experiencia de probador virtual</p>
        </div>

        <div className="liquid-glass-panel liquid-glass-refract p-6 sm:p-8 rounded-3xl transition-colors duration-300">
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">Tipo de Cuenta</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("customer")}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border font-semibold transition-all text-sm ${
                    role === "customer" 
                      ? "border-blue-500 bg-blue-500/15 dark:bg-blue-500/25 text-blue-700 dark:text-blue-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)]" 
                      : "liquid-glass-btn-secondary text-neutral-600 dark:text-neutral-300"
                  }`}
                >
                  <User className="w-4 h-4" /> Cliente
                </button>
                <button
                  type="button"
                  onClick={() => setRole("brand")}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border font-semibold transition-all text-sm ${
                    role === "brand" 
                      ? "border-blue-500 bg-blue-500/15 dark:bg-blue-500/25 text-blue-700 dark:text-blue-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)]" 
                      : "liquid-glass-btn-secondary text-neutral-600 dark:text-neutral-300"
                  }`}
                >
                  <Store className="w-4 h-4" /> Marca
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">Nombre Completo</label>
              <input 
                type="text" 
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full liquid-glass-input rounded-xl px-4 py-3 text-sm text-black dark:text-white"
                placeholder="Juan Pérez"
              />
            </div>
            
            {role === "brand" && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">Nombre de la Marca</label>
                <input 
                  type="text" 
                  required
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                  className="w-full liquid-glass-input rounded-xl px-4 py-3 text-sm text-black dark:text-white"
                  placeholder="Acme Co."
                />
              </div>
            )}

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
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 sm:py-4 liquid-glass-btn-primary font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creando cuenta...
                </>
              ) : "Registrarse"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-neutral-600 dark:text-neutral-400">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
