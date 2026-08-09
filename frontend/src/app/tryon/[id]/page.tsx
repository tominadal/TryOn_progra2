"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { fetchApi } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Garment {
  id: number;
  name: string;
  fit: string;
  price: string;
  image: string;
}

export default function TryOnPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const productId = parseInt(resolvedParams.id);
  const router = useRouter();
  const { user } = useAuth();
  
  const [product, setProduct] = useState<Garment | null>(null);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState<"avatar" | "processing" | "result">("avatar");
  const [shirtColor, setShirtColor] = useState("white");
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);

  const colors = [
    { name: "white", class: "bg-neutral-100" },
    { name: "black", class: "bg-neutral-900 border border-neutral-700" },
    { name: "navy", class: "bg-blue-900" },
    { name: "olive", class: "bg-green-900" },
  ];

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    Promise.all([
      fetchApi(`/catalog/garments/${productId}`),
      fetchApi("/tryon/avatar").catch(() => null)
    ]).then(([garmentData, avatarData]) => {
      setProduct({
        ...garmentData,
        image: garmentData.image || "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=800"
      });
      if (avatarData && avatarData.base_photo_url) {
        setAvatarImage(avatarData.base_photo_url);
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [productId, user, router]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setAvatarImage(url);
      
      try {
        const formData = new FormData();
        formData.append("height_cm", "170.0");
        formData.append("weight_kg", "70.0");
        formData.append("body_type", "athletic");
        formData.append("file", file);

        await fetchApi("/tryon/avatar", {
          method: "POST",
          body: formData
        });
      } catch (err) {
        console.error("Failed to save avatar configuration", err);
      }
    }
  };

  const handleTryOn = async () => {
    if (!avatarImage) return;
    setStep("processing");
    try {
      const result = await fetchApi(`/tryon/preview/${productId}`, {
        method: "POST"
      });
      
      // Simulate rendering time
      setTimeout(() => {
        setResultImage(result.preview_url || product?.image);
        setStep("result");
      }, 2000);
      
    } catch (err) {
      console.error("Try on failed", err);
      alert("Try-On generation failed. Please try again.");
      setStep("avatar");
    }
  };

  const handleAddToCart = async () => {
    try {
      await fetchApi("/commerce/cart", {
        method: "POST",
        body: JSON.stringify({
          garment_id: productId,
          quantity: 1
        })
      });
      alert("Added to cart!");
      router.push("/cart");
    } catch (err) {
      console.error(err);
      alert("Failed to add to cart");
    }
  };

  if (loading || !product) {
    return <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center text-neutral-900 dark:text-white transition-colors duration-300">Loading Virtual Studio...</div>;
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
            <Link href="/cart" className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">Cart</Link>
            <Link href="/" className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">&larr; Back to Marketplace</Link>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto min-h-screen flex flex-col md:flex-row gap-8">
        
        {/* Left Column - The Studio */}
        <div className="flex-1 bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden relative flex flex-col min-h-[600px] shadow-sm dark:shadow-2xl transition-colors duration-300">
          <div className="absolute top-4 left-4 z-10 bg-white/80 dark:bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium border border-neutral-200 dark:border-white/10 flex items-center gap-2 text-black dark:text-white">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            Virtual Studio
          </div>

          <div className="flex-1 flex items-center justify-center p-8 relative">
            {step === "avatar" && (
              <div className="text-center w-full max-w-md">
                {!avatarImage ? (
                  <label className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-blue-500 hover:bg-blue-500/5 transition-all rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer group">
                    <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-neutral-500 dark:text-neutral-400 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Upload your photo</h3>
                    <p className="text-neutral-500 text-sm mb-6">For best results, use a full-body photo with good lighting.</p>
                    <span className="px-6 py-2.5 bg-neutral-200 dark:bg-neutral-100 text-black text-sm font-medium rounded-full hover:bg-neutral-300 dark:hover:bg-white transition-colors">Browse Files</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </label>
                ) : (
                  <div className="relative group flex justify-center">
                    <div className="relative w-64 aspect-[3/4] rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700">
                      <img src={avatarImage} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <button 
                      onClick={() => setAvatarImage(null)}
                      className="absolute top-4 right-4 bg-white/80 dark:bg-black/70 text-black dark:text-white backdrop-blur p-2 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                )}
              </div>
            )}

            {step === "processing" && (
              <div className="text-center flex flex-col items-center">
                <div className="relative w-32 h-32 mb-8">
                  <div className="absolute inset-0 border-4 border-neutral-200 dark:border-neutral-800 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-blue-500 font-bold">AI</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2 animate-pulse">Generating your fit...</h3>
                <p className="text-neutral-600 dark:text-neutral-500">Combining {product.name} with your digital twin.</p>
              </div>
            )}

            {step === "result" && (
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden border border-neutral-700 shadow-2xl group">
                  {/* Real composed image returned by backend (Pillow processing) */}
                  <img src={resultImage || ""} alt="Virtual Try-On Result" className="absolute inset-0 w-full h-full object-cover" />
                  
                  <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20">
                    <span className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-full text-xs font-medium border border-white/10 flex items-center gap-2">
                      <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      Try-On Successful
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Controls */}
        <div className="w-full md:w-96 flex flex-col gap-6">
          <div className="bg-white dark:bg-neutral-900/40 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 transition-colors duration-300 shadow-sm dark:shadow-none">
            <h1 className="text-2xl font-bold mb-1">{product.name}</h1>
            <p className="text-xl font-medium text-neutral-600 dark:text-neutral-400 mb-6">{product.price}</p>
            
            <div className="flex gap-2 mb-6">
              <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-300">{product.fit || "Regular"} Fit</span>
              <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-300">New Collection</span>
            </div>

            <hr className="border-neutral-200 dark:border-neutral-800 mb-6" />

            {step === "avatar" && (
              <div className="space-y-4">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Ready to see how it looks on you?</p>
                <button 
                  onClick={handleTryOn}
                  disabled={!avatarImage}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-200 dark:disabled:bg-neutral-800 disabled:text-neutral-400 dark:disabled:text-neutral-600 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-all shadow-lg shadow-blue-500/20"
                >
                  Generate Virtual Try-On
                </button>
              </div>
            )}

            {(step === "result" || step === "processing") && (
              <div className="space-y-6">
                <hr className="border-neutral-200 dark:border-neutral-800" />

                <button 
                  onClick={handleAddToCart}
                  disabled={step === "processing"}
                  className="w-full py-4 bg-blue-600 dark:bg-white hover:bg-blue-700 dark:hover:bg-neutral-200 text-white dark:text-black font-bold rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/20 dark:shadow-white/10"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  Add to Cart
                </button>
                
                {step === "result" && (
                  <button onClick={() => setStep("avatar")} className="w-full py-3 text-sm text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                    Try another photo
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
