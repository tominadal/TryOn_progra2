"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { fetchApi } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";
import { ShoppingCart, Ruler, Palette, CheckCircle2, Info } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Box } from "@react-three/drei";
import { ParametricMannequin, ParametricPants } from "@/components/avatar";

// ── Size Parsing Logic ───────────────────────────────────────────────────────
function calculateSizeScale(size: string): number {
  if (!size) return 1.0;
  
  const upperSize = size.toUpperCase().trim();
  
  // Standard letter sizes
  const letterMap: Record<string, number> = {
    "XXS": 0.85, "XS": 0.90, "S": 0.95, "M": 1.00, "L": 1.05, "XL": 1.10, "XXL": 1.15, "3XL": 1.20
  };
  if (letterMap[upperSize] !== undefined) {
    return letterMap[upperSize];
  }
  
  // Try to parse numeric size
  const numMatch = upperSize.match(/\d+/);
  if (numMatch) {
    const numSize = parseInt(numMatch[0]);
    // Standard jeans sizing base is often 32 for M.
    // Each step is approx 1% scale difference to avoid extreme clipping or bagginess
    return 1.0 + (numSize - 32) * 0.01;
  }
  
  // Fallback for custom strings like "Único"
  return 1.0;
}

interface GarmentImage {
  url: string;
  type: string; // FRONT | SIDE | BACK
}

interface ColorOption {
  name: string;
  hex: string;
}

interface Garment {
  id: number;
  name: string;
  fit: string;
  price: number;
  image: string;
  images: GarmentImage[];
  model_3d_url?: string;
  color: string;
  size: string;
  description?: string;
  material?: string;
  available_sizes: string[];
  available_colors: ColorOption[];
  metadata_json?: any;
}

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const productId = parseInt(resolvedParams.id);
  const router = useRouter();
  const { user } = useAuth();

  const [product, setProduct] = useState<Garment | null>(null);
  const [loading, setLoading] = useState(true);

  // Try-On state
  const [isTryOnActive, setIsTryOnActive] = useState(false);
  const [avatarData, setAvatarData] = useState<any>(null);

  // Selection state
  const [selectedColor, setSelectedColor] = useState<ColorOption | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");

  // Gallery
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchApi(`/catalog/garments/${productId}`)
      .then((g: Garment) => {
        setProduct(g);
        // Default to first available color and size
        if (g.available_colors?.length) setSelectedColor(g.available_colors[0]);
        if (g.available_sizes?.length) setSelectedSize(g.available_sizes[1] ?? g.available_sizes[0]);
      })
      .catch((err) => {
        console.error(err);
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [productId]);

  useEffect(() => {
    if (user) {
      fetchApi("/tryon/avatar")
        .then((d) => { if (d) setAvatarData(d); })
        .catch(() => {});
    }
  }, [user]);

  const handleAddToCart = async () => {
    if (!user) { router.push("/login"); return; }
    try {
      await fetchApi("/commerce/cart", {
        method: "POST",
        body: JSON.stringify({
          garment_id: productId,
          quantity: 1,
          size: selectedSize,
          color: selectedColor?.name,
        }),
      });
      toast.success("¡Añadido al carrito!");
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Error al añadir al carrito");
    }
  };

  const handleTryOnToggle = () => {
    if (!user) { toast.error("Por favor inicia sesión para usar el Probador Virtual"); router.push("/login"); return; }
    if (!avatarData) { toast.error("¡Primero debes crear tu Avatar 3D!"); router.push("/avatar"); return; }
    setIsTryOnActive((v) => !v);
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">Producto no encontrado</h1>
        <button onClick={() => router.push("/")} className="text-blue-500 hover:underline">Volver al inicio</button>
      </div>
    );
  }

  if (loading || !product) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Avatar values for Try-On ─────────────────────────────────────────────
  const avatarSkinColor = avatarData?.skin_color || "#f1c27d";
  const avatarHeight = avatarData?.height_cm || 170;
  const avatarWeight = avatarData?.weight_kg || 70;
  const avatarHairStyle = avatarData?.hair_style || "Corto";
  const avatarHairColor = avatarData?.hair_color || "#1a0a00";
  const avatarShoesColor = avatarData?.shoes_color || "#0f0f0f";
  const avatarGender = avatarData?.gender || "Hombre";
  const avatarGlasses = Boolean(avatarData?.glasses);
  const avatarBodyType = avatarData?.body_type || "Normal";
  const avatarMuscle = avatarData?.muscle_definition ?? 0.3;
  const avatarBeardStyle = avatarData?.beard_style || "Ninguna";
  const avatarBeardColor = avatarData?.beard_color || "#2d1a0e";
  const avatarEyebrow = avatarData?.eyebrow_style || "Normal";
  const avatarHat = avatarData?.hat_style || "Ninguno";
  const avatarShirtStyle = avatarData?.shirt_style || "Basic";
  const avatarTattoo = Boolean(avatarData?.tattoo_left_arm);

  // Parse advanced morphs
  let morphs: any = {};
  try {
    morphs = JSON.parse(avatarBodyType);
  } catch (e) {
    // Legacy string
  }

  // ── Selected color drives TryOn pants color ──────────────────────────────
  // Use selected variant color; fall back to AI-detected color from the real image
  const aiColorHex = product.metadata_json?.color_hex ?? product.available_colors?.[0]?.hex ?? "#1e3a8a";
  const tryOnPantsColor = selectedColor?.hex || aiColorHex;
  const accentHex = product.metadata_json?.accent_hex ?? tryOnPantsColor;

  // ── Avatar scale ─────────────────────────────────────────────────────────
  const avatarScaleY = avatarHeight / 170.0;
  const avatarScaleXZ = Math.pow(avatarWeight / 70.0, 0.5);

  // ── Size drives pants scale in 3D ────────────────────────────────────────
  const sizeScaleMod = calculateSizeScale(selectedSize);

  // ── AI Vision Parameters ─────────────────────────────────────────────────
  // These come from Gemini analysing the REAL garment photograph,
  // making every product's 3D representation unique and image-faithful.
  const aiScaleX    = product.metadata_json?.scale_x    ?? 1.0;
  const aiScaleY    = product.metadata_json?.scale_y    ?? 1.0;
  const aiRoughness = product.metadata_json?.roughness  ?? 0.82;
  const aiTaper     = product.metadata_json?.taper      ?? 0.0;  // negative=wide, positive=skinny
  const aiWaistRise = product.metadata_json?.waist_rise ?? 0.5;
  const aiDistress  = product.metadata_json?.distress   ?? 0.0;
  const aiHasCuff   = product.metadata_json?.has_cuff   ?? false;
  const aiHasPleats = product.metadata_json?.has_pleats ?? false;
  // fit_label from Vision takes precedence over text field
  const aiFitLabel  = product.metadata_json?.fit_label  ?? product.fit ?? "Regular";
  const aiSource    = product.metadata_json?.source ?? "";

  // Combine AI scale with Avatar size and weight
  const finalPantsScaleX = aiScaleX * sizeScaleMod * avatarScaleXZ;
  const finalPantsScaleY = aiScaleY;

  // ── Gallery images (from backend GarmentImage records) ───────────────────
  const galleryImages: string[] = product.images?.length
    ? product.images.map((img) => img.url)
    : [product.image || "/products/jean_classic.png"];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 font-sans selection:bg-blue-500/30 transition-colors duration-300 flex flex-col">
      <Navbar />

      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto flex-1 w-full">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white mb-8 transition-colors"
        >
          ← Volver al Catálogo
        </Link>

        <div className="flex flex-col lg:flex-row gap-12">

          {/* ── LEFT: Gallery / Try-On ─────────────────────────────────── */}
          <div className="w-full lg:w-1/2">
            <div
              className={`w-full aspect-[4/5] bg-neutral-100 dark:bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-200 dark:border-neutral-800 relative transition-all duration-500 ${
                isTryOnActive ? "shadow-2xl ring-4 ring-blue-500/20" : ""
              }`}
            >
              {isTryOnActive ? (
                <div className="w-full h-full cursor-grab active:cursor-grabbing">
                  <Canvas camera={{ position: [0, 1.2, 3.5], fov: 44 }} shadows>
                    <ambientLight intensity={0.55} />
                    <directionalLight position={[5, 10, 5]} intensity={1.6} castShadow />
                    <directionalLight position={[-4, 4, -4]} intensity={0.5} />
                    <pointLight position={[0, 2.5, -2.5]} intensity={0.4} color="#b0d0ff" />
                    <Environment preset="city" />

                    {/* Fitting room */}
                    <group position={[0, -0.965, 0]}>
                      <Box args={[6, 4, 0.1]} position={[0, 2, -1.5]} receiveShadow>
                        <meshStandardMaterial color="#f5f5f0" />
                      </Box>
                      <Box args={[0.1, 4, 3]} position={[-2, 2, 0]} receiveShadow>
                        <meshStandardMaterial color="#eaeae5" roughness={0.85} />
                      </Box>
                      <Box args={[0.1, 4, 3]} position={[2, 2, 0]} receiveShadow>
                        <meshStandardMaterial color="#eaeae5" roughness={0.85} />
                      </Box>
                      <Box args={[6, 0.05, 4]} position={[0, 0, 0]} receiveShadow>
                        <meshStandardMaterial color="#8b5a2b" roughness={0.9} />
                      </Box>
                      {/* Mirror */}
                      <Box args={[2.5, 3.2, 0.08]} position={[0, 1.6, -1.42]}>
                        <meshStandardMaterial color="#cce4ff" metalness={0.92} roughness={0.04} />
                      </Box>
                    </group>

                    <group>
                      <ParametricMannequin
                        skinColor={avatarSkinColor}
                        shirtColor={avatarData?.shirt_color || "#f8f8f8"}
                        shoesColor={avatarShoesColor}
                        hairStyle={avatarHairStyle}
                        hairColor={avatarHairColor}
                        gender={avatarGender}
                        scaleY={avatarScaleY}
                        scaleXZ={avatarScaleXZ}
                        muscleDefinition={avatarMuscle}
                        eyebrowStyle={avatarEyebrow}
                        isNakedBottom={true}
                        chestWidth={morphs.chestWidth}
                        bellyWidth={morphs.bellyWidth}
                        bellyDepth={morphs.bellyDepth}
                        hipWidth={morphs.hipWidth}
                        armThickness={morphs.armThickness}
                        legThickness={morphs.legThickness}
                        breastSize={morphs.breastSize}
                        neckThickness={morphs.neckThickness}
                      />
                      <ParametricPants
                        color={tryOnPantsColor}
                        accentColor={accentHex}
                        avatarScaleXZ={avatarScaleXZ}
                        avatarScaleY={avatarScaleY}
                        pantsScaleX={finalPantsScaleX}
                        pantsScaleY={finalPantsScaleY}
                        pantsFit={aiFitLabel}
                        isFemale={avatarGender === "Mujer"}
                        legThickness={morphs.legThickness}
                        hipWidth={morphs.hipWidth}
                        waistRise={aiWaistRise}
                        taper={aiTaper}
                        roughness={aiRoughness}
                        hasCuff={aiHasCuff}
                      />
                    </group>
                    <ContactShadows position={[0, -0.89, 0]} opacity={0.6} scale={5} blur={1.8} far={4} />
                    <OrbitControls
                      enablePan={false}
                      minPolarAngle={Math.PI / 4}
                      maxPolarAngle={Math.PI / 1.5}
                      minDistance={2.5}
                      maxDistance={6}
                      target={[0, 0.5, 0]}
                    />
                  </Canvas>

                  <div className="absolute top-4 left-4 flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-100/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-blue-200 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    Probador 3D en Vivo
                  </div>
                  {/* Size indicator in TryOn */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs font-bold text-white bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full">
                    Talle {selectedSize} · {selectedColor?.name}
                  </div>
                  {/* AI analysis source badge */}
                  {aiSource && (
                    <div className="absolute bottom-4 right-4 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border shadow-sm backdrop-blur-md"
                      style={{
                        background: aiSource.includes("vision") ? "rgba(124,58,237,0.12)" : "rgba(0,0,0,0.5)",
                        borderColor: aiSource.includes("vision") ? "#7c3aed" : "#555",
                        color: aiSource.includes("vision") ? "#c4b5fd" : "#aaa",
                      }}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${aiSource.includes("vision") ? "bg-blue-400 animate-pulse" : "bg-gray-500"}`} />
                      {aiSource.includes("vision") ? "IA Visión" : "IA Texto"}
                    </div>
                  )}
                  <button
                    onClick={handleTryOnToggle}
                    className="absolute top-4 right-4 bg-white/90 dark:bg-black/90 backdrop-blur-md p-2 rounded-full shadow-sm hover:scale-110 transition-transform"
                  >
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
                    className="w-full h-full object-cover animate-in fade-in duration-300"
                    key={galleryImages[activeImageIndex]}
                  />
                  {(product.model_3d_url || product.metadata_json?.scale_x) && (
                    <div className="absolute top-4 left-4 flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-green-200 shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Try-On 3D disponible
                    </div>
                  )}
                  {/* Photo type label */}
                  {product.images?.[activeImageIndex]?.type && (
                    <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur font-semibold">
                      {{ FRONT: "Vista Frontal", SIDE: "Vista Lateral", BACK: "Vista Posterior" }[product.images[activeImageIndex].type] ?? ""}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Thumbnails */}
            {!isTryOnActive && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
                {galleryImages.map((imgSrc, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`shrink-0 w-20 h-24 bg-neutral-200 dark:bg-neutral-800 rounded-2xl overflow-hidden border-2 transition-all ${
                      activeImageIndex === idx
                        ? "border-blue-500 shadow-md scale-105"
                        : "border-transparent hover:border-neutral-400 hover:scale-105"
                    }`}
                  >
                    <img src={imgSrc} alt={`Vista ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Product details ─────────────────────────────────── */}
          <div className="w-full lg:w-1/2 flex flex-col">

            {/* Header */}
            <div className="mb-2">
              <p className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1">Acme Denim · {product.fit} Fit</p>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-2">{product.name}</h1>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">${product.price.toFixed(2)}</p>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6 border-l-2 border-blue-200 dark:border-blue-800 pl-4">
                {product.description}
              </p>
            )}

            {/* Material badge */}
            {product.material && (
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-6">
                <Info className="w-3.5 h-3.5" />
                {product.material}
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8 pb-8 border-b border-neutral-200 dark:border-neutral-800">
              {(product.model_3d_url || product.metadata_json?.scale_x) ? (
                <button
                  onClick={handleTryOnToggle}
                  className={`flex-1 py-4 px-6 font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg flex items-center justify-center gap-2 text-sm ${
                    isTryOnActive
                      ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                      : "bg-black dark:bg-white text-white dark:text-black shadow-black/20"
                  }`}
                >
                  {isTryOnActive ? (
                    "Cerrar Probador Virtual"
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Probarse en 3D
                    </>
                  )}
                </button>
              ) : (
                <button disabled className="flex-1 py-4 px-6 bg-neutral-200 dark:bg-neutral-800 text-neutral-400 font-bold rounded-xl cursor-not-allowed text-sm">
                  Probador No Disponible
                </button>
              )}

              <button
                onClick={handleAddToCart}
                className="flex-1 py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-sm"
              >
                <ShoppingCart className="w-4 h-4" />
                Añadir al Carrito
              </button>
            </div>

            {/* Color Selector */}
            {product.available_colors?.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-4 h-4 text-neutral-500" />
                  <h3 className="font-semibold text-sm">Color</h3>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-auto font-medium">{selectedColor?.name}</span>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {product.available_colors.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => setSelectedColor(c)}
                      className={`w-12 h-12 rounded-full border-2 transition-all shadow-sm ${
                        selectedColor?.hex === c.hex
                          ? "border-blue-500 scale-110 shadow-md ring-4 ring-blue-500/20"
                          : "border-transparent hover:scale-105 hover:shadow-md"
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
                {isTryOnActive && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-2 animate-in fade-in duration-300">
                    ✨ El color se aplica en tiempo real en el Probador 3D
                  </p>
                )}
              </div>
            )}

            {/* Size Selector */}
            {product.available_sizes?.length > 0 && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-neutral-500" />
                    <h3 className="font-semibold text-sm">Talle</h3>
                  </div>
                  <button className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                    Guía de Talles
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {product.available_sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`min-w-[3rem] h-11 px-3 rounded-xl font-bold text-sm transition-all border-2 flex items-center justify-center ${
                        selectedSize === s
                          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-600 text-blue-700 dark:text-blue-400"
                          : "bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:border-neutral-300 dark:hover:border-neutral-700 hover:text-neutral-700 dark:hover:text-neutral-300"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {isTryOnActive && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-2 animate-in fade-in duration-300">
                    📏 El talle ajusta el ancho del pantalón en el Probador 3D
                  </p>
                )}
              </div>
            )}

            {/* Specs mini-grid */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl">
                <p className="text-xs text-neutral-400 mb-1">Corte</p>
                <p className="font-bold text-sm">{product.fit || "Regular"} Fit</p>
              </div>
              <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl">
                <p className="text-xs text-neutral-400 mb-1">Talle seleccionado</p>
                <p className="font-bold text-sm">{selectedSize || "—"}</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
