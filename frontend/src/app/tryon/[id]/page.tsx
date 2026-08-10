"use client";

import { useState, use, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { fetchApi } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";

interface Garment {
  id: number;
  name: string;
  fit: string;
  price: string;
  image: string; // Now this is a .glb URL
  model_3d_url?: string;
}

// 3D Model Component for the Garment
function GarmentModel({ url }: { url: string }) {
  // If the backend returned a PNG (mock/fallback), do not use useGLTF to avoid crashing
  if (url.endsWith('.png') || url.endsWith('.jpg')) {
    return (
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.5, 1, 0.3]} />
        <meshStandardMaterial color="#4a70a8" wireframe={true} />
      </mesh>
    );
  }
  
  try {
    const { scene } = useGLTF(url);
    // Garment is overlaid
    return <primitive object={scene} scale={1.05} position={[0, -0.9, 0]} />;
  } catch (e) {
    return null;
  }
}

// A parametric humanoid built with primitive meshes instead of a GLB
function ParametricAvatarModel({ skinColor, shirtColor, shoesColor, hairStyle, hairColor, scaleY, scaleXZ }: { skinColor: string, shirtColor: string, shoesColor: string, hairStyle: string, hairColor: string, scaleY: number, scaleXZ: number }) {
  return (
    <group scale={[scaleXZ, scaleY, scaleXZ]} position={[0, -0.9, 0]}>
      {/* Head */}
      <group position={[0, 1.8, 0]}>
        <mesh>
          <sphereGeometry args={[0.15, 32, 32]} />
          <meshStandardMaterial color={skinColor} roughness={0.4} />
        </mesh>
        
        {/* Hair Styles */}
        {hairStyle === "Short" && (
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[0.28, 0.15, 0.28]} />
            <meshStandardMaterial color={hairColor} roughness={0.9} />
          </mesh>
        )}
        
        {hairStyle === "Long" && (
          <group position={[0, 0.05, -0.05]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.3, 0.15, 0.3]} />
              <meshStandardMaterial color={hairColor} roughness={0.9} />
            </mesh>
            <mesh position={[0, -0.2, -0.1]}>
              <boxGeometry args={[0.3, 0.4, 0.1]} />
              <meshStandardMaterial color={hairColor} roughness={0.9} />
            </mesh>
          </group>
        )}
        
        {hairStyle === "Bun" && (
          <group position={[0, 0.08, 0]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.28, 0.15, 0.28]} />
              <meshStandardMaterial color={hairColor} roughness={0.9} />
            </mesh>
            <mesh position={[0, 0, -0.15]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial color={hairColor} roughness={0.9} />
            </mesh>
          </group>
        )}
      </group>
      
      {/* Neck */}
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.2, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.4} />
      </mesh>
      
      {/* Torso (Shirt) */}
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[0.42, 0.82, 0.22]} />
        <meshStandardMaterial color={shirtColor} roughness={0.7} />
      </mesh>
      
      {/* Left Arm (Shirt Sleeves + Skin) */}
      <group position={[-0.28, 1.1, 0]}>
        {/* Sleeve */}
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.07, 0.065, 0.3, 16]} />
          <meshStandardMaterial color={shirtColor} roughness={0.7} />
        </mesh>
        {/* Arm */}
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.055, 0.05, 0.4, 16]} />
          <meshStandardMaterial color={skinColor} roughness={0.4} />
        </mesh>
      </group>
      
      {/* Right Arm (Shirt Sleeves + Skin) */}
      <group position={[0.28, 1.1, 0]}>
        {/* Sleeve */}
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.07, 0.065, 0.3, 16]} />
          <meshStandardMaterial color={shirtColor} roughness={0.7} />
        </mesh>
        {/* Arm */}
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.055, 0.05, 0.4, 16]} />
          <meshStandardMaterial color={skinColor} roughness={0.4} />
        </mesh>
      </group>
      
      {/* Left Leg (Skin + Shoe) */}
      <group position={[-0.12, 0.35, 0]}>
        <mesh>
          <cylinderGeometry args={[0.08, 0.06, 0.8, 16]} />
          <meshStandardMaterial color={skinColor} roughness={0.4} />
        </mesh>
        {/* Shoe */}
        <mesh position={[0, -0.45, 0.05]}>
          <boxGeometry args={[0.12, 0.1, 0.25]} />
          <meshStandardMaterial color={shoesColor} roughness={0.6} />
        </mesh>
      </group>
      
      {/* Right Leg (Skin + Shoe) */}
      <group position={[0.12, 0.35, 0]}>
        <mesh>
          <cylinderGeometry args={[0.08, 0.06, 0.8, 16]} />
          <meshStandardMaterial color={skinColor} roughness={0.4} />
        </mesh>
        {/* Shoe */}
        <mesh position={[0, -0.45, 0.05]}>
          <boxGeometry args={[0.12, 0.1, 0.25]} />
          <meshStandardMaterial color={shoesColor} roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

export default function TryOnPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const productId = parseInt(resolvedParams.id);
  const router = useRouter();
  const { user } = useAuth();
  
  const [product, setProduct] = useState<Garment | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAvatar, setHasAvatar] = useState(false);
  
  // Avatar Parameters
  const [avatarSkinColor, setAvatarSkinColor] = useState<string>("#f1c27d");
  const [avatarHeight, setAvatarHeight] = useState<number>(170);
  const [avatarWeight, setAvatarWeight] = useState<number>(70);
  const [avatarShirtColor, setAvatarShirtColor] = useState<string>("#ffffff");
  const [avatarShoesColor, setAvatarShoesColor] = useState<string>("#000000");
  const [avatarHairStyle, setAvatarHairStyle] = useState<string>("Short");
  const [avatarHairColor, setAvatarHairColor] = useState<string>("#000000");

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
      });
      
      if (avatarData) {
        setHasAvatar(true);
        if (avatarData.skin_color) setAvatarSkinColor(avatarData.skin_color);
        if (avatarData.height_cm) setAvatarHeight(avatarData.height_cm);
        if (avatarData.weight_kg) setAvatarWeight(avatarData.weight_kg);
        if (avatarData.shirt_color) setAvatarShirtColor(avatarData.shirt_color);
        if (avatarData.shoes_color) setAvatarShoesColor(avatarData.shoes_color);
        if (avatarData.hair_style) setAvatarHairStyle(avatarData.hair_style);
        if (avatarData.hair_color) setAvatarHairColor(avatarData.hair_color);
      } else {
        setHasAvatar(false);
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [productId, user, router]);

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

  const scaleY = avatarHeight / 170.0;
  const scaleXZ = Math.pow(avatarWeight / 70.0, 0.5);

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
            Virtual Studio 3D
          </div>

          <div className="flex-1 flex flex-col items-center justify-center relative w-full h-full">
            {!hasAvatar ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-neutral-100 dark:bg-neutral-900/50">
                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold mb-4">No Digital Twin Found</h3>
                <p className="text-neutral-500 max-w-md mb-8 text-lg">You need to create your 3D avatar before you can use the Virtual Try-On studio.</p>
                <Link href="/avatar" className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-all active:scale-95 shadow-lg shadow-blue-500/20">
                  Create My Avatar
                </Link>
              </div>
            ) : (
              <div className="relative w-full h-full min-h-[600px] cursor-grab active:cursor-grabbing">
                <Canvas camera={{ position: [0, 1, 3], fov: 45 }}>
                  <ambientLight intensity={0.5} />
                  <directionalLight position={[10, 10, 5]} intensity={1} />
                  <Environment preset="city" />
                  
                  <Suspense fallback={null}>
                    <ParametricAvatarModel 
                      skinColor={avatarSkinColor} 
                      shirtColor={avatarShirtColor}
                      shoesColor={avatarShoesColor}
                      hairStyle={avatarHairStyle}
                      hairColor={avatarHairColor}
                      scaleY={scaleY} 
                      scaleXZ={scaleXZ} 
                    />
                    {product.model_3d_url && <GarmentModel url={product.model_3d_url} />}
                  </Suspense>
                  
                  <OrbitControls 
                    enablePan={false} 
                    minPolarAngle={Math.PI / 4} 
                    maxPolarAngle={Math.PI / 1.5} 
                    minDistance={2} 
                    maxDistance={5} 
                    target={[0, 0, 0]}
                  />
                </Canvas>
                <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20 pointer-events-none">
                  <span className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-full text-xs font-medium border border-white/10 flex items-center gap-2 text-white shadow-xl">
                    <svg className="w-4 h-4 text-white animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Drag to rotate 360&deg;
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Controls */}
        <div className="w-full md:w-96 flex flex-col gap-6">
          <div className="bg-white dark:bg-neutral-900/40 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 transition-colors duration-300 shadow-sm dark:shadow-none">
            <h1 className="text-2xl font-bold mb-1">{product.name}</h1>
            <p className="text-xl font-medium text-neutral-600 dark:text-neutral-400 mb-6">${product.price}</p>
            
            <div className="flex gap-2 mb-6">
              <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-300">{product.fit || "Regular"} Fit</span>
              <span className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-medium">Native 3D Engine</span>
            </div>

            <hr className="border-neutral-200 dark:border-neutral-800 mb-6" />

            {hasAvatar && (
              <div className="space-y-6">
                <button 
                  onClick={handleAddToCart}
                  className="w-full py-4 bg-blue-600 dark:bg-white hover:bg-blue-700 dark:hover:bg-neutral-200 text-white dark:text-black font-bold rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 dark:shadow-white/10"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  Add to Cart
                </button>
                
                <Link href="/avatar" className="block text-center w-full py-3 text-sm text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                  Edit Avatar Style
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
