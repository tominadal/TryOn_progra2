"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeSlash, EnvelopeSimple } from "@phosphor-icons/react";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api";

const CARD = "liquid-glass-panel liquid-glass-refract p-6 sm:p-8 rounded-3xl transition-colors duration-300";
const INPUT = "w-full liquid-glass-input rounded-xl px-4 py-3 text-sm text-black dark:text-white";
const SUBMIT =
  "w-full py-3.5 sm:py-4 liquid-glass-btn-primary font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2";

function RequestResetForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<{ message: string; resetUrl: string | null } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetchApi("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSent({ message: res.message, resetUrl: res.reset_url ?? null });
    } catch (err) {
      toast.error((err as Error).message || "No se pudo procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className={`${CARD} space-y-5 text-center`}>
        <div className="mx-auto w-12 h-12 rounded-2xl liquid-glass-pill text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <EnvelopeSimple className="w-6 h-6" />
        </div>
        <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{sent.message}</p>
        {sent.resetUrl && (
          <div className="text-left p-4 rounded-2xl liquid-glass-card space-y-2">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Entorno de desarrollo: todavía no hay servicio de correo conectado, por eso el enlace se muestra acá.
            </p>
            <a
              href={sent.resetUrl}
              className="inline-block text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Restablecer mi contraseña
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={CARD}>
      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
        <div>
          <label htmlFor="reset-email" className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
            Correo electrónico
          </label>
          <input
            id="reset-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={INPUT}
            placeholder="tu@ejemplo.com"
          />
        </div>
        <button type="submit" disabled={loading} className={SUBMIT}>
          {loading ? "Enviando..." : "Enviar instrucciones"}
        </button>
      </form>
    </div>
  );
}

function NewPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const mismatch = confirm.length > 0 && password !== confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return;
    setLoading(true);
    try {
      await fetchApi("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, new_password: password }),
      });
      toast.success("Contraseña actualizada. Ya podés iniciar sesión.");
      router.push("/login");
    } catch (err) {
      toast.error((err as Error).message || "No se pudo actualizar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={CARD}>
      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
            Nueva contraseña
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={show ? "text" : "password"}
              required
              minLength={6}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${INPUT} pr-12`}
              placeholder="Mínimo 6 caracteres"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
            >
              {show ? <EyeSlash className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
            Repetir contraseña
          </label>
          <input
            id="confirm-password"
            type={show ? "text" : "password"}
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={INPUT}
            aria-invalid={mismatch}
          />
          {mismatch && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">Las contraseñas no coinciden.</p>}
        </div>
        <button type="submit" disabled={loading || mismatch} className={SUBMIT}>
          {loading ? "Guardando..." : "Guardar nueva contraseña"}
        </button>
      </form>
    </div>
  );
}

function RecoverContent() {
  const token = useSearchParams().get("token");

  return (
    <div className="min-h-screen liquid-bg flex items-center justify-center p-4 sm:p-6 text-neutral-900 dark:text-neutral-50 font-sans transition-colors duration-300">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 sm:mb-10">
          <Link href="/" className="inline-flex items-center gap-2.5 text-2xl font-bold tracking-tighter mb-2 text-black dark:text-white">
            <img src="/logo.png" alt="TryOn Hub Logo" className="w-10 h-10 object-contain" />
            <span>
              TryOn <span className="text-blue-600 dark:text-blue-400">Hub</span>
            </span>
          </Link>
          <h1 className="text-2xl font-semibold mt-5 sm:mt-6">
            {token ? "Elegí una nueva contraseña" : "Recuperá tu contraseña"}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2 text-sm sm:text-base">
            {token
              ? "El enlace es de un solo uso y vence a los 30 minutos."
              : "Ingresá tu correo y te enviaremos las instrucciones."}
          </p>
        </div>

        {token ? <NewPasswordForm token={token} /> : <RequestResetForm />}

        <p className="mt-6 text-center text-sm font-medium">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RecuperarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen liquid-bg flex items-center justify-center p-6">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RecoverContent />
    </Suspense>
  );
}

