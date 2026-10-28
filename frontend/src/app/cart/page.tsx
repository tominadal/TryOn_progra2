"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { toast } from "sonner";
import { Minus, Plus, Trash2 } from "lucide-react";

interface CartItem {
  cart_item_id: number;
  garment_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  size?: string | null;
  color?: string | null;
  garment_details?: any; // We'll fetch this if needed, or rely on a robust cart API
}

const MAX_ITEM_QUANTITY = 99;

/** Swatch color for the chosen variant, looked up by name in the garment's palette. */
function garmentColorHex(item: CartItem): string {
  const palette: { name: string; hex: string }[] = item.garment_details?.available_colors ?? [];
  return palette.find((c) => c.name === item.color)?.hex ?? "#a3a3a3";
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for the session restore (token -> /users/me) before deciding to redirect
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    fetchApi("/commerce/cart")
      .then(async (data) => {
        // Hydrate cart items with garment details (one request per distinct garment,
        // since the same garment can appear in several lines: sizes / colors)
        const garmentIds: number[] = [...new Set<number>(data.items.map((i: CartItem) => i.garment_id))];
        const garments = new Map<number, any>();
        await Promise.all(
          garmentIds.map(async (id) => {
            try {
              garments.set(id, await fetchApi(`/catalog/garments/${id}`));
            } catch {
              // keep the line without details
            }
          })
        );
        const hydratedItems = data.items.map((item: CartItem) => ({
          ...item,
          garment_details: garments.get(item.garment_id),
        }));
        setItems(hydratedItems);
        setTotal(data.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const handleCheckout = async () => {
    try {
      const result = await fetchApi("/commerce/checkout", { method: "POST" });
      toast.success(`¡Pedido realizado con éxito! ID de Pedido: ${result.order_id}`);
      setItems([]);
      setTotal(0);
      window.dispatchEvent(new Event("cart:updated"));
      router.push("/");
    } catch (err) {
      const error = err as Error;
      console.error(err);
      toast.error(error.message || "Error al procesar el pago");
    }
  };

  const handleRemoveItem = async (item: CartItem) => {
    setRemovingId(item.cart_item_id);
    try {
      await fetchApi(`/commerce/cart/${item.cart_item_id}`, { method: "DELETE" });
      const remaining = items.filter((i) => i.cart_item_id !== item.cart_item_id);
      setItems(remaining);
      setTotal(remaining.reduce((acc, i) => acc + (i.subtotal || 0), 0));
      window.dispatchEvent(new Event("cart:updated"));
      toast.success("Prenda quitada del carrito");
    } catch (err) {
      const error = err as Error;
      console.error(err);
      toast.error(error.message || "No se pudo quitar la prenda");
    } finally {
      setRemovingId(null);
    }
  };

  const handleChangeQuantity = async (item: CartItem, quantity: number) => {
    if (quantity < 1 || quantity > MAX_ITEM_QUANTITY) return;

    setUpdatingId(item.cart_item_id);
    try {
      await fetchApi(`/commerce/cart/${item.cart_item_id}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      });
      const updated = items.map((i) =>
        i.cart_item_id === item.cart_item_id
          ? { ...i, quantity, subtotal: i.unit_price * quantity }
          : i
      );
      setItems(updated);
      setTotal(updated.reduce((acc, i) => acc + (i.subtotal || 0), 0));
      window.dispatchEvent(new Event("cart:updated"));
    } catch (err) {
      const error = err as Error;
      console.error(err);
      toast.error(error.message || "No se pudo cambiar la cantidad");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm("¿Vaciar el carrito? Se quitarán todas las prendas.")) return;

    setClearing(true);
    try {
      await fetchApi("/commerce/cart", { method: "DELETE" });
      setItems([]);
      setTotal(0);
      window.dispatchEvent(new Event("cart:updated"));
      toast.success("Carrito vaciado");
    } catch (err) {
      const error = err as Error;
      console.error(err);
      toast.error(error.message || "No se pudo vaciar el carrito");
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center text-neutral-900 dark:text-white transition-colors duration-300">Cargando carrito...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 font-sans selection:bg-blue-500/30 transition-colors duration-300">
      <Navbar />

      <main className="pt-24 pb-12 px-6 max-w-4xl mx-auto min-h-screen">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Tu Carrito</h1>
          {items.length > 0 && (
            <button
              onClick={handleClearCart}
              disabled={clearing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              {clearing ? "Vaciando..." : "Vaciar carrito"}
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-neutral-900/40 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm dark:shadow-none transition-colors duration-300">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-neutral-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <h2 className="text-xl font-medium mb-2">Tu carrito está vacío</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">Parece que aún no has agregado ninguna prenda a tu carrito.</p>
            <Link href="/marketplace" className="px-6 py-3 bg-blue-600 dark:bg-white text-white dark:text-black font-semibold rounded-full hover:bg-blue-700 dark:hover:bg-neutral-200 transition-colors">
              Empezar a Comprar
            </Link>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-4">
              {items.map((item) => (
                <div key={item.cart_item_id} className="flex gap-4 p-4 bg-white dark:bg-neutral-900/40 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm dark:shadow-none transition-colors duration-300">
                  <div className="w-24 h-24 bg-neutral-100 dark:bg-neutral-800 rounded-xl overflow-hidden shrink-0">
                    {item.garment_details?.image && (
                      <img src={item.garment_details.image} alt={item.garment_details.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <h3 className="font-semibold text-lg">{item.garment_details?.name || `Prenda #${item.garment_id}`}</h3>

                    {/* Chosen variant: lets you tell apart the same garment in different sizes/colors */}
                    {(item.size || item.color) && (
                      <div className="flex flex-wrap items-center gap-2 mt-1 mb-2 text-xs text-neutral-600 dark:text-neutral-400">
                        {item.size && (
                          <span className="px-2 py-0.5 rounded-md border border-neutral-200 dark:border-neutral-700">
                            Talle {item.size}
                          </span>
                        )}
                        {item.color && (
                          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-neutral-200 dark:border-neutral-700">
                            <span
                              className="w-3 h-3 rounded-full border border-neutral-300 dark:border-neutral-600"
                              style={{ backgroundColor: garmentColorHex(item) }}
                              aria-hidden="true"
                            />
                            {item.color}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="flex items-center rounded-lg border border-neutral-200 dark:border-neutral-700">
                        <button
                          onClick={() => handleChangeQuantity(item, item.quantity - 1)}
                          disabled={item.quantity <= 1 || updatingId === item.cart_item_id || clearing}
                          aria-label="Una unidad menos"
                          className="p-1.5 text-neutral-500 hover:text-black dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 text-sm font-medium tabular-nums min-w-8 text-center" aria-label={`Cantidad: ${item.quantity}`}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleChangeQuantity(item, item.quantity + 1)}
                          disabled={item.quantity >= MAX_ITEM_QUANTITY || updatingId === item.cart_item_id || clearing}
                          aria-label="Una unidad más"
                          className="p-1.5 text-neutral-500 hover:text-black dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="font-medium">
                        {formatPrice(item.unit_price)}
                        {item.quantity > 1 && (
                          <span className="ml-2 text-xs font-normal text-neutral-500">
                            c/u · {formatPrice(item.subtotal)}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item)}
                    disabled={removingId === item.cart_item_id || clearing}
                    aria-label={`Quitar ${item.garment_details?.name || `prenda ${item.garment_id}`}${
                      item.size || item.color ? ` (${[item.size && `talle ${item.size}`, item.color].filter(Boolean).join(", ")})` : ""
                    } del carrito`}
                    title="Quitar del carrito"
                    className="self-start p-2 rounded-lg text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="w-full md:w-80 h-fit bg-white dark:bg-neutral-900/40 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm dark:shadow-none transition-colors duration-300">
              <h2 className="text-xl font-bold mb-6">Resumen del Pedido</h2>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Subtotal</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Envío</span>
                  <span>Gratis</span>
                </div>
                <hr className="border-neutral-200 dark:border-neutral-800" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
              <button 
                onClick={handleCheckout}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-blue-500/20"
              >
                Proceder al Pago
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
