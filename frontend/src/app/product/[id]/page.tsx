"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { fetchApi } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";
import { ShoppingCart, Shirt, CheckCircle2, Ruler, Palette } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Box } from "@react-three/drei";
import { ParametricMannequin } from "@/components/AvatarCreatorNative";
import * as THREE from "three";

interface Garment {
  id: number;
  name: string;
  fit: string;
  price: number;
  image: string;
  model_3d_url?: string;
  color: string;
  size: string;
}

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const productId = parseInt(resolvedParams.id);
  const router = useRouter();
  const { user } = useAuth();
  
  const [product, setProduct] = useState<Garment | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Try-On State
  const [isTryOnActive, setIsTryOnActive] = useState(false);
  const [avatarData, setAvatarData] = useState<any>(null);

  // Customization State
  const [selectedColor, setSelectedColor] = useState<string>("#1e3a8a"); // Default denim color
  const [selectedSize, setSelectedSize] = useState<string>("M");
  
  // Gallery State
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  const colors = [
    { name: "Azul Clásico", hex: "#1e3a8a" },
    { name: "Negro Profundo", hex: "#111827" },
    { name: "Celeste Vintage", hex: "#60a5fa" }
  ];
  const sizes = ["S", "M", "L", "XL"];

  useEffect(() => {
    // Fetch product
    fetchApi(`/catalog/garments/${productId}`)
      .then((garmentData) => {
        setProduct(garmentData);
        setSelectedSize(garmentData.size || "M");
        // Set gallery based on SKU or fit
        const ident = ((garmentData.sku || "") + " " + (garmentData.name || "")).toUpperCase();
        
        // Determine if it's the V2 (older) product version
        const isV2 = ident.includes("RECTOS CLÁSICOS") || ident.includes("AJUSTADOS NEGROS") || ident.includes("VINTAGE RASGADOS");
        const suffix = isV2 ? "_v2" : "";

        let sideImg = `/products/jean_side${suffix}.png?v=5`;
        let backImg = `/products/jean_back${suffix}.png?v=5`;

        if (ident.includes("SKN") || ident.includes("SKINNY") || ident.includes("NEGRO") || ident.includes("BLACK")) {
          sideImg = `/products/jean_black_side${suffix}.png?v=5`;
          backImg = `/products/jean_black_back${suffix}.png?v=5`;
        } else if (ident.includes("VNT") || ident.includes("VINTAGE") || ident.includes("RELAXED") || ident.includes("RASGADO")) {
          sideImg = `/products/jean_vintage_side${suffix}.png?v=5`;
          backImg = `/products/jean_vintage_back${suffix}.png?v=5`;
        }

        setGalleryImages([
          (garmentData.image || "/products/jean_classic.png") + "?v=5",
          sideImg,
          backImg
        ]);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));

    // Fetch avatar if logged in
    if (user) {
      fetchApi("/tryon/avatar")
        .then((data) => {
          if (data) setAvatarData(data);
        })
        .catch(() => {
          // No avatar, we'll use defaults
        });
    }
  }, [productId, user]);

  const handleAddToCart = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    
    try {
      await fetchApi("/commerce/cart", {
        method: "POST",
        body: JSON.stringify({
          garment_id: productId,
          quantity: 1,
          size: selectedSize,
          color: selectedColor
        })
      });
      toast.success("¡Añadido al carrito!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al añadir al carrito");
    }
  };

  const handleTryOnToggle = () => {
    if (!user) {
      toast.error("Por favor inicia sesión para usar el Probador Virtual");
      router.push("/login");
      return;
    }
    if (!avatarData) {
      toast.error("¡Primero debes crear tu Avatar 3D!");
      router.push("/avatar");
      return;
    }
    setIsTryOnActive(!isTryOnActive);
  };

  if (loading || !product) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center text-neutral-900 dark:text-white transition-colors duration-300">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Parse avatar data if available
  const avatarSkinColor = avatarData?.skin_color || "#f1c27d";
  const avatarHeight = avatarData?.height_cm || 170;
  const avatarWeight = avatarData?.weight_kg || 70;
  const avatarHairStyle = avatarData?.hair_style || "Corto";
  const avatarHairColor = avatarData?.hair_color || "#000000";
  const avatarShoesColor = avatarData?.shoes_color || "#000000";
  const avatarGender = avatarData?.gender || "Hombre";
  const avatarGlasses = avatarData?.glasses || false;
  
  const tryOnPantsColor = selectedColor;
  const tryOnPantsFit = product.fit || "Regular";

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 font-sans selection:bg-blue-500/30 transition-colors duration-300 flex flex-col">
      <Navbar />

      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto flex-1 w-full">
        <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white mb-8 transition-colors">
          &larr; Volver al Catálogo
        </Link>
        
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Left: Image Gallery or 3D TryOn */}
          <div className="w-full lg:w-1/2">
            <div className={`w-full aspect-[4/5] bg-neutral-100 dark:bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-200 dark:border-neutral-800 relative transition-all duration-500 ${isTryOnActive ? 'shadow-2xl ring-4 ring-blue-500/20' : ''}`}>
              
              {isTryOnActive ? (
                <div className="w-full h-full relative cursor-grab active:cursor-grabbing bg-neutral-200 dark:bg-neutral-800">
                  <Canvas camera={{ position: [0, 1.2, 3.5], fov: 45 }}>
                    <ambientLight intensity={0.6} />
                    <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
                    <directionalLight position={[-5, 5, -5]} intensity={0.5} />
                    <Environment preset="studio" />
                    
                    {/* Fitting Room Environment Simulation */}
                    <group position={[0, -0.965, 0]}> {/* Floor matched perfectly to avatar feet */}
                      {/* Back Wall */}
                      <Box args={[6, 4, 0.1]} position={[0, 2, -1.5]} receiveShadow>
                        <meshStandardMaterial color="#f0f0f0" />
                      </Box>
                      {/* Left Wall */}
                      <Box args={[0.1, 4, 3]} position={[-2, 2, 0]} receiveShadow>
                        <meshStandardMaterial color="#e5e7eb" roughness={0.8} />
                      </Box>
                      {/* Right Wall */}
                      <Box args={[0.1, 4, 3]} position={[2, 2, 0]} receiveShadow>
                        <meshStandardMaterial color="#e5e7eb" roughness={0.8} />
                      </Box>
                      {/* Floor (Wood color) */}
                      <Box args={[6, 0.05, 4]} position={[0, 0, 0]} receiveShadow>
                        <meshStandardMaterial color="#8b5a2b" roughness={0.9} />
                      </Box>
                      {/* Mirror effect plane */}
                      <Box args={[2.5, 3, 0.1]} position={[0, 1.5, -1.4]}>
                        <meshStandardMaterial color="#ffffff" metalness={0.9} roughness={0.05} />
                      </Box>
                    </group>

                    <ParametricMannequin 
                      skinColor={avatarSkinColor} 
                      shirtColor="#ffffff"
                      pantsColor={tryOnPantsColor}
                      pantsFit={tryOnPantsFit}
                      shoesColor={avatarShoesColor}
                      hairStyle={avatarHairStyle}
                      hairColor={avatarHairColor}
                      gender={avatarGender}
                      glasses={avatarGlasses}
                      scaleY={avatarHeight / 170.0} 
                      scaleXZ={Math.pow(avatarWeight / 70.0, 0.5)} 
                    />
                    <ContactShadows position={[0, -0.89, 0]} opacity={0.6} scale={5} blur={1.5} far={4} />
                    
                    <OrbitControls 
                      enablePan={false} 
                      minPolarAngle={Math.PI / 4} 
                      maxPolarAngle={Math.PI / 1.5} 
                      minDistance={2.5} 
                      maxDistance={6} 
                      target={[0, 0.5, 0]}
                    />
                  </Canvas>
                  
                  <div className="absolute top-4 left-4 flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-100/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-blue-200 shadow-sm animate-fade-in">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    Probador 3D en Vivo
                  </div>
                  
                  <button onClick={handleTryOnToggle} className="absolute top-4 right-4 bg-white/90 dark:bg-black/90 backdrop-blur-md p-2 rounded-full shadow-sm hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <img 
                    src={galleryImages[activeImageIndex]} 
                    alt={product.name} 
                    className="w-full h-full object-cover animate-fade-in"
                  />
                  {product.model_3d_url && (
                    <div className="absolute top-4 left-4 flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-green-200 shadow-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      Gemelo Digital 3D Disponible
                    </div>
                  )}
                </>
              )}
            </div>
            
            {!isTryOnActive && (
              <div className="flex gap-4 mt-4 overflow-x-auto pb-2">
                {galleryImages.map((imgSrc, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`shrink-0 w-20 h-24 bg-neutral-200 dark:bg-neutral-800 rounded-xl overflow-hidden border-2 transition-colors ${activeImageIndex === idx ? 'border-blue-500' : 'border-transparent hover:border-neutral-400'}`}
                  >
                    <img src={imgSrc} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details and CTAs */}
          <div className="w-full lg:w-1/2 flex flex-col justify-start">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight">{product.name}</h1>
            <p className="text-3xl font-medium text-blue-600 dark:text-blue-400 mb-6">${product.price}</p>
            
            <div className="prose prose-neutral dark:prose-invert mb-8 text-neutral-600 dark:text-neutral-400">
              <p>
                Experimenta la nueva generación de compras en línea. Esta prenda ha sido meticulosamente digitalizada
                para ofrecer una vista de alta fidelidad, permitiéndote probarla en tu propio gemelo digital antes de comprar.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10 border-b border-neutral-200 dark:border-neutral-800 pb-8">
              {product.model_3d_url ? (
                <button 
                  onClick={handleTryOnToggle}
                  className={`flex-1 py-4 px-6 font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg flex items-center justify-center gap-2 ${isTryOnActive ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white border-2 border-transparent' : 'bg-black dark:bg-white text-white dark:text-black border-2 border-transparent'}`}
                >
                  {isTryOnActive ? (
                    <>Cerrar Probador Virtual</>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Activar Probador 3D
                    </>
                  )}
                </button>
              ) : (
                <button disabled className="flex-1 py-4 px-6 bg-neutral-200 dark:bg-neutral-800 text-neutral-400 font-bold rounded-2xl cursor-not-allowed flex items-center justify-center gap-2">
                  Probador No Disponible
                </button>
              )}
              
              <button 
                onClick={handleAddToCart}
                className="flex-1 py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Añadir al Carrito
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center shrink-0">
                  <Ruler className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Perfil de Calce</p>
                  <p className="font-semibold text-sm">Corte {product.fit || "Regular"}</p>
                </div>
              </div>
              <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center shrink-0">
                  <Shirt className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Material</p>
                  <p className="font-semibold text-sm">Denim Premium</p>
                </div>
              </div>
            </div>

            {/* Options: Color and Size */}
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3"><Palette className="w-4 h-4" /> Color</h3>
                <div className="flex gap-3">
                  {colors.map(c => (
                    <button
                      key={c.hex}
                      onClick={() => setSelectedColor(c.hex)}
                      className={`w-12 h-12 rounded-full border-2 transition-all ${selectedColor === c.hex ? 'border-blue-500 scale-110 shadow-md ring-4 ring-blue-500/20' : 'border-transparent hover:scale-105 shadow-sm'}`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-3">
                  <h3 className="font-semibold">Talle</h3>
                  <button className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">Guía de Talles</button>
                </div>
                <div className="flex gap-3">
                  {sizes.map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`w-14 h-12 rounded-xl font-bold transition-all border-2 ${selectedSize === s ? 'bg-black text-white dark:bg-white dark:text-black border-transparent shadow-md' : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
