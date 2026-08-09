"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";

interface CartItem {
  cart_item_id: number;
  garment_id: number;
  quantity: number;
  price: number;
  garment_details?: any; // We'll fetch this if needed, or rely on a robust cart API
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    fetchApi("/commerce/cart")
      .then(async (data) => {
        // Hydrate cart items with garment details
        const hydratedItems = await Promise.all(
          data.items.map(async (item: any) => {
            try {
              const garmentData = await fetchApi(`/catalog/garments/${item.garment_id}`);
              return { ...item, garment_details: garmentData };
            } catch {
              return item;
            }
          })
        );
        setItems(hydratedItems);
        setTotal(data.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, router]);

  const handleCheckout = async () => {
    try {
      const result = await fetchApi("/commerce/checkout", { method: "POST" });
      alert(`Order placed successfully! Order ID: ${result.order_id}`);
      setItems([]);
      setTotal(0);
      router.push("/");
    } catch (err) {
      console.error(err);
      alert("Checkout failed");
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center text-neutral-900 dark:text-white transition-colors duration-300">Loading cart...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 font-sans selection:bg-blue-500/30 transition-colors duration-300">
      <nav className="fixed w-full z-50 top-0 border-b border-neutral-200 dark:border-neutral-900 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tighter flex items-center gap-2 hover:opacity-80 transition-opacity text-black dark:text-white">
            <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
              <span className="text-white text-xs">V</span>
            </div>
            TryOn <span className="text-neutral-500">Hub</span>
          </Link>
          <div className="flex gap-4 items-center">
            <ThemeToggle />
            <Link href="/" className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
              &larr; Continue Shopping
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-6 max-w-4xl mx-auto min-h-screen">
        <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-neutral-900/40 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm dark:shadow-none transition-colors duration-300">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-neutral-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <h2 className="text-xl font-medium mb-2">Your cart is empty</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">Looks like you haven't added any garments to your cart yet.</p>
            <Link href="/" className="px-6 py-3 bg-blue-600 dark:bg-white text-white dark:text-black font-semibold rounded-full hover:bg-blue-700 dark:hover:bg-neutral-200 transition-colors">
              Start Shopping
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
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="font-semibold text-lg">{item.garment_details?.name || `Garment #${item.garment_id}`}</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-2">Qty: {item.quantity}</p>
                    <p className="font-medium">${item.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="w-full md:w-80 h-fit bg-white dark:bg-neutral-900/40 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm dark:shadow-none transition-colors duration-300">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <hr className="border-neutral-200 dark:border-neutral-800" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
              <button 
                onClick={handleCheckout}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-blue-500/20"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
