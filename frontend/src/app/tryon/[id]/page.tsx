"use client";

import { useState, use } from "react";
import Link from "next/link";
import Image from "next/image";

// Mock data for the product
const productDetails = {
  1: { id: 1, name: "Classic Straight", fit: "Straight", price: "$89.99", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=800" },
  2: { id: 2, name: "Vintage Slim", fit: "Slim", price: "$95.00", image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=800" },
  3: { id: 3, name: "Modern Skinny", fit: "Skinny", price: "$79.99", image: "https://images.unsplash.com/photo-1604176354204-9268737828e4?auto=format&fit=crop&q=80&w=800" },
  4: { id: 4, name: "Relaxed Fit", fit: "Relaxed", price: "$110.00", image: "https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?auto=format&fit=crop&q=80&w=800" },
};

export default function TryOnPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const productId = parseInt(resolvedParams.id);
  const product = productDetails[productId as keyof typeof productDetails] || productDetails[1];

  const [step, setStep] = useState<"avatar" | "processing" | "result">("avatar");
  const [shirtColor, setShirtColor] = useState("white");
  const [avatarImage, setAvatarImage] = useState<string | null>(null);

  const colors = [
    { name: "white", class: "bg-neutral-100" },
    { name: "black", class: "bg-neutral-900 border border-neutral-700" },
    { name: "navy", class: "bg-blue-900" },
    { name: "olive", class: "bg-green-900" },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setAvatarImage(url);
    }
  };

  const handleTryOn = () => {
    if (!avatarImage) return;
    setStep("processing");
    setTimeout(() => {
      setStep("result");
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 font-sans selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="fixed w-full z-50 top-0 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tighter flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
              <span className="text-white text-xs">V</span>
            </div>
            TryOn <span className="text-neutral-500">Hub</span>
          </Link>
          <Link href="/" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">
            &larr; Back to Marketplace
          </Link>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto min-h-screen flex flex-col md:flex-row gap-8">
        
        {/* Left Column - The Studio */}
        <div className="flex-1 bg-neutral-900/40 border border-neutral-800 rounded-3xl overflow-hidden relative flex flex-col min-h-[600px] shadow-2xl">
          <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium border border-white/10 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            Virtual Studio
          </div>

          <div className="flex-1 flex items-center justify-center p-8 relative">
            {step === "avatar" && (
              <div className="text-center w-full max-w-md">
                {!avatarImage ? (
                  <label className="border-2 border-dashed border-neutral-700 hover:border-blue-500 hover:bg-blue-500/5 transition-all rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer group">
                    <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-neutral-400 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Upload your photo</h3>
                    <p className="text-neutral-500 text-sm mb-6">For best results, use a full-body photo with good lighting.</p>
                    <span className="px-6 py-2.5 bg-neutral-100 text-black text-sm font-medium rounded-full">Browse Files</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </label>
                ) : (
                  <div className="relative group">
                    <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border border-neutral-700">
                      <img src={avatarImage} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <button 
                      onClick={() => setAvatarImage(null)}
                      className="absolute top-4 right-4 bg-black/70 backdrop-blur p-2 rounded-full hover:bg-red-500/80 transition-colors"
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
                  <div className="absolute inset-0 border-4 border-neutral-800 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-blue-500 font-bold">AI</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2 animate-pulse">Generating your fit...</h3>
                <p className="text-neutral-500">Combining {product.name} with your digital twin.</p>
              </div>
            )}

            {step === "result" && (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Composite Result Simulation */}
                <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden border border-neutral-700 shadow-2xl group">
                  <img src={avatarImage || ""} alt="Avatar" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity" />
                  
                  {/* The applied garment */}
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  <img src={product.image} alt={product.name} className="absolute inset-0 w-full h-full object-cover opacity-90 drop-shadow-2xl" style={{ clipPath: 'polygon(15% 45%, 85% 45%, 90% 100%, 10% 100%)', mixBlendMode: 'hard-light' }} />
                  
                  {/* T-shirt overlay simulation */}
                  <div className={`absolute top-[20%] left-[20%] right-[20%] h-[30%] opacity-80 mix-blend-multiply rounded-b-3xl ${colors.find(c => c.name === shirtColor)?.class}`}></div>

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
          <div className="bg-neutral-900/40 p-6 rounded-3xl border border-neutral-800">
            <h1 className="text-2xl font-bold mb-1">{product.name}</h1>
            <p className="text-xl font-medium text-neutral-400 mb-6">{product.price}</p>
            
            <div className="flex gap-2 mb-6">
              <span className="px-3 py-1 bg-neutral-800 rounded-lg text-xs font-medium text-neutral-300">{product.fit} Fit</span>
              <span className="px-3 py-1 bg-neutral-800 rounded-lg text-xs font-medium text-neutral-300">100% Cotton</span>
            </div>

            <hr className="border-neutral-800 mb-6" />

            {/* Controls only show in appropriate steps */}
            {step === "avatar" && (
              <div className="space-y-4">
                <p className="text-sm text-neutral-400">Ready to see how it looks on you?</p>
                <button 
                  onClick={handleTryOn}
                  disabled={!avatarImage}
                  className="w-full py-4 bg-blue-500 hover:bg-blue-400 disabled:bg-neutral-800 disabled:text-neutral-600 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-all shadow-lg shadow-blue-500/20"
                >
                  Generate Virtual Try-On
                </button>
              </div>
            )}

            {(step === "result" || step === "processing") && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-3 flex justify-between">
                    Basic T-Shirt Color
                    <span className="text-neutral-500 capitalize">{shirtColor}</span>
                  </h4>
                  <div className="flex gap-3">
                    {colors.map(color => (
                      <button 
                        key={color.name}
                        onClick={() => setShirtColor(color.name)}
                        disabled={step === "processing"}
                        className={`w-10 h-10 rounded-full transition-all flex items-center justify-center ${color.class} ${shirtColor === color.name ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-neutral-950 scale-110' : 'hover:scale-105'} disabled:opacity-50`}
                      >
                        {shirtColor === color.name && color.name === "white" && <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                        {shirtColor === color.name && color.name !== "white" && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                      </button>
                    ))}
                  </div>
                </div>

                <hr className="border-neutral-800" />

                <button 
                  disabled={step === "processing"}
                  className="w-full py-4 bg-white hover:bg-neutral-200 text-black font-bold rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  Add to Cart
                </button>
                
                {step === "result" && (
                  <button onClick={() => setStep("avatar")} className="w-full py-3 text-sm text-neutral-400 hover:text-white transition-colors">
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
