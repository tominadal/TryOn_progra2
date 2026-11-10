"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";
import { Minus, Plus, Trash, Package, Warning, ArrowSquareOut } from "@phosphor-icons/react";

interface OrderItemSummary {
  garment_id: number | null;
  garment_name: string;
  size?: string | null;
  color?: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface OrderSummary {
  order_id: number;
  status: string;
  total: number;
  created_at: string;
  items: OrderItemSummary[];
}

interface GarmentDetails {
  id: number;
  name: string;
  image?: string | null;
  available_colors?: { name: string; hex: string }[];
}

interface CartItem {
  cart_item_id: number;
  garment_id: number;
  garment_name?: string;
  image?: string | null;
  available_colors?: { name: string; hex: string }[];
  quantity: number;
  unit_price: number;
  subtotal: number;
  size?: string | null;
  color?: string | null;
  garment_details?: GarmentDetails;
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
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
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

    fetchApi("/commerce/orders")
      .then((orderList: OrderSummary[]) => setOrders(orderList))
      .catch(() => {});

    fetchApi("/commerce/cart")
      .then(async (data) => {
        // Hydrate cart items directly from /commerce/cart payload (avoids N+1 requests),
        // with fallback fetch only if an item is missing inline details.
        const missingIds: number[] = [
          ...new Set<number>(
            data.items
              .filter((i: CartItem) => i.image === undefined && i.available_colors === undefined)
              .map((i: CartItem) => i.garment_id)
          ),
        ];
        const fallbackGarments = new Map<number, GarmentDetails>();
        if (missingIds.length > 0) {
          await Promise.all(
            missingIds.map(async (id) => {
              try {
                fallbackGarments.set(id, await fetchApi(`/catalog/garments/${id}`));
              } catch {
                // keep the line without details
              }
            })
          );
        }
        const hydratedItems = data.items.map((item: CartItem) => ({
          ...item,
          garment_details:
            fallbackGarments.get(item.garment_id) ?? {
              id: item.garment_id,
              name: item.garment_name || `Prenda #${item.garment_id}`,
              image: item.image ?? null,
              available_colors: item.available_colors ?? [],
            },
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
      toast.success(`¡Pedido realizado con éxito! ID de Pedido: #${result.order_id}`);
      setItems([]);
      setTotal(0);
      window.dispatchEvent(new Event("cart:updated"));
      fetchApi("/commerce/orders")
        .then((orderList: OrderSummary[]) => setOrders(orderList))
        .catch(() => {});
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
    setClearing(true);
    try {
      await fetchApi("/commerce/cart", { method: "DELETE" });
      setItems([]);
      setTotal(0);
      setConfirmClearOpen(false);
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
    return <div className="min-h-screen liquid-bg flex items-center justify-center text-neutral-900 dark:text-white transition-colors duration-300">Cargando carrito...</div>;
  }

  return (
    <div className="min-h-screen liquid-bg text-neutral-900 dark:text-neutral-50 font-sans selection:bg-blue-500/30 transition-colors duration-300">
      <Navbar />

      <main className="pt-28 md:pt-24 pb-12 px-4 sm:px-6 max-w-4xl mx-auto min-h-screen">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Tu Carrito</h1>
          {items.length > 0 && (
            <button
              onClick={() => setConfirmClearOpen(true)}
              disabled={clearing}
              className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400 border border-red-300/60 dark:border-red-900/50 rounded-xl bg-red-500/10 hover:bg-red-500/20 backdrop-blur-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash className="w-4 h-4" />
              {clearing ? "Vaciando..." : "Vaciar carrito"}
            </button>
          )}
        </div>

        {confirmClearOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-md p-4">
            <div className="liquid-glass-panel liquid-glass-refract rounded-3xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-red-500/15 border border-red-400/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                  <Warning className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Vaciar Carrito</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{items.length} líneas en el carrito</p>
                </div>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                ¿Estás seguro de que deseas quitar todas las prendas de tu carrito?
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={clearing}
                  onClick={() => setConfirmClearOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold liquid-glass-btn-secondary text-neutral-700 dark:text-neutral-300 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={clearing}
                  onClick={handleClearCart}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25 transition-all"
                >
                  {clearing ? "Vaciando..." : "Sí, Vaciar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-20 px-4 liquid-glass-panel rounded-3xl transition-colors duration-300">
            <div className="w-16 h-16 liquid-glass-pill rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <h2 className="text-xl font-medium mb-2">Tu carrito está vacío</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">Parece que aún no has agregado ninguna prenda a tu carrito.</p>
            <Link href="/marketplace" className="inline-block px-6 py-3 liquid-glass-btn-primary font-semibold rounded-full transition-all">
              Empezar a Comprar
            </Link>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            <div className="flex-1 space-y-4">
              {items.map((item) => (
                <div key={item.cart_item_id} className="flex gap-3 sm:gap-4 p-4 liquid-glass-card rounded-2xl transition-all duration-300">
                  <Link
                    href={`/product/${item.garment_id}`}
                    className="w-20 h-20 sm:w-24 sm:h-24 bg-neutral-100/70 dark:bg-neutral-800/70 rounded-xl overflow-hidden shrink-0 border border-white/40 dark:border-white/10 group/img relative"
                    title="Ver prenda en el Probador 3D"
                  >
                    <img
                      src={item.garment_details?.image || "/products/jean_classic.png"}
                      alt={item.garment_details?.name || `Prenda #${item.garment_id}`}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/products/jean_classic.png";
                      }}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                    />
                  </Link>
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <Link
                      href={`/product/${item.garment_id}`}
                      className="font-semibold text-base sm:text-lg truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1.5 w-fit max-w-full"
                    >
                      <span className="truncate">{item.garment_details?.name || `Prenda #${item.garment_id}`}</span>
                      <ArrowSquareOut className="w-3.5 h-3.5 opacity-60 shrink-0" />
                    </Link>

                    {/* Chosen variant: lets you tell apart the same garment in different sizes/colors */}
                    {(item.size || item.color) && (
                      <div className="flex flex-wrap items-center gap-2 mt-1 mb-2 text-xs text-neutral-600 dark:text-neutral-300">
                        {item.size && (
                          <span className="px-2 py-0.5 rounded-md liquid-glass-pill">
                            Talle {item.size}
                          </span>
                        )}
                        {item.color && (
                          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md liquid-glass-pill">
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

                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mt-1">
                      <div className="flex items-center rounded-xl liquid-glass-pill">
                        <button
                          onClick={() => handleChangeQuantity(item, item.quantity - 1)}
                          disabled={item.quantity <= 1 || updatingId === item.cart_item_id || clearing}
                          aria-label="Una unidad menos"
                          className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 text-sm font-semibold tabular-nums min-w-8 text-center" aria-label={`Cantidad: ${item.quantity}`}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleChangeQuantity(item, item.quantity + 1)}
                          disabled={item.quantity >= MAX_ITEM_QUANTITY || updatingId === item.cart_item_id || clearing}
                          aria-label="Una unidad más"
                          className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="font-semibold text-sm sm:text-base">
                        {formatPrice(item.unit_price)}
                        {item.quantity > 1 && (
                          <span className="ml-2 text-xs font-normal text-neutral-500 dark:text-neutral-400">
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
                    className="self-start p-2 rounded-xl text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="w-full md:w-80 h-fit md:sticky md:top-24 liquid-glass-panel p-6 rounded-3xl transition-colors duration-300">
              <h2 className="text-xl font-bold mb-6">Resumen del Pedido</h2>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-neutral-600 dark:text-neutral-300">
                  <span>Subtotal</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-neutral-600 dark:text-neutral-300">
                  <span>Envío</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Gratis</span>
                </div>
                <hr className="border-neutral-200/70 dark:border-white/10" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
              <button 
                onClick={handleCheckout}
                className="w-full py-4 liquid-glass-btn-primary font-bold rounded-2xl transition-all active:scale-95"
              >
                Proceder al Pago
              </button>
            </div>
          </div>
        )}

        {/* Historial de Pedidos del Cliente */}
        {orders.length > 0 && (
          <section className="mt-12 pt-10 border-t border-neutral-200/70 dark:border-white/10">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">Mis Pedidos Realizados</h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Historial de compras con precio congelado (Snapshot Pricing)
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.order_id} className="liquid-glass-card rounded-2xl p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200/60 dark:border-white/10 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-sm sm:text-base">Pedido #{order.order_id}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-400/40 text-emerald-800 dark:text-emerald-300">
                        {order.status === "PENDING" ? "Confirmado" : order.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 mr-3">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString("es-AR") : ""}
                      </span>
                      <span className="font-black text-base sm:text-lg text-blue-600 dark:text-blue-400">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-neutral-200/50 dark:divide-white/5 text-xs sm:text-sm">
                    {order.items.map((oi, idx) => (
                      <div key={idx} className="py-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{oi.garment_name}</span>
                          {oi.size && (
                            <span className="px-2 py-0.5 rounded-md liquid-glass-pill text-xs">
                              Talle {oi.size}
                            </span>
                          )}
                          {oi.color && (
                            <span className="px-2 py-0.5 rounded-md liquid-glass-pill text-xs">
                              {oi.color}
                            </span>
                          )}
                          <span className="text-neutral-500 dark:text-neutral-400">× {oi.quantity}</span>
                        </div>
                        <span className="font-semibold">{formatPrice(oi.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
