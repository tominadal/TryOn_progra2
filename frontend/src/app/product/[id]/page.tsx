"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { fetchApi } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { SavedAvatar, getStoredAvatarId, parseMorphs, pickAvatar, storeAvatarId } from "@/lib/avatars";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";
import { ShoppingCart, Ruler, Palette, CheckCircle2, Info, User as UserIcon } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Box } from "@react-three/drei";
import { ParametricMannequin, ParametricPants } from "@/components/avatar";

// ── Size Parsing Logic ───────────────────────────────────────────────────────
function parseSizeInches(size: string): number {
  if (!size) return 32;
  const numMatch = size.match(/\d+/);
  if (numMatch) {
    const num = parseInt(numMatch[0]);
    if (num >= 22 && num <= 54) return num;
  }
  const upper = size.toUpperCase().trim();
  const letterMap: Record<string, number> = {
    "XXS": 26, "XS": 28, "S": 30, "M": 32, "L": 34, "XL": 36, "XXL": 38, "3XL": 40
  };
  return letterMap[upper] ?? 32;
}

function calculateSizeScale(size: string): number {
  if (!size) return 1.0;
  const inches = parseSizeInches(size);
  // Realistic sizing scale: 2.5% volume difference per inch (~5% per standard size step)
  return 1.0 + (inches - 32) * 0.025;
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
  // The user can own several avatars (e.g. one per child): they pick one to try clothes on
  const [avatars, setAvatars] = useState<SavedAvatar[]>([]);
  const [selectedAvatarId, setSelectedAvatarId] = useState<number | null>(null);
  const avatarData = pickAvatar(avatars, selectedAvatarId);

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
      fetchApi("/tryon/avatars")
        .then((list: SavedAvatar[]) => {
          setAvatars(list);
          setSelectedAvatarId(pickAvatar(list, getStoredAvatarId())?.id ?? null);
        })
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
      window.dispatchEvent(new Event("cart:updated"));
      toast.success("¡Añadido al carrito!");
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Error al añadir al carrito");
    }
  };

  const handleSelectAvatar = (avatar: SavedAvatar) => {
    setSelectedAvatarId(avatar.id);
    storeAvatarId(avatar.id);
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
  const avatarMuscle = avatarData?.muscle_definition ?? 0.3;
  const avatarBeardStyle = avatarData?.beard_style || "Ninguna";
  const avatarBeardColor = avatarData?.beard_color || "#2d1a0e";
  const avatarEyebrow = avatarData?.eyebrow_style || "Normal";
  const avatarHat = avatarData?.hat_style || "Ninguno";
  const avatarShirtStyle = avatarData?.shirt_style || "Basic";
  const avatarTattoo = Boolean(avatarData?.tattoo_left_arm);

  // Parse advanced morphs
  const morphs = parseMorphs(avatarData?.body_type);

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

  // ── Smart Fit Diagnostic ─────────────────────────────────────────────────
  const garmentSizeInches = parseSizeInches(selectedSize);
  const avatarWaistInches = Math.round(
    32 +
    (avatarWeight - 70) * 0.35 +
    ((morphs.bellyWidth ?? 1.0) - 1.0) * 8 +
    ((morphs.hipWidth ?? 1.0) - 1.0) * 6
  );
  // Difference between garment size and avatar waist:
  // Negative = garment is smaller than avatar (tight)
  // Positive = garment is larger than avatar (loose/baggy)
  const fitDiff = garmentSizeInches - avatarWaistInches;
  const fitTightness = Math.max(-1.0, Math.min(1.0, fitDiff * 0.24));
  const isTooSmall = fitTightness < -0.22;
  const isTooBig = fitTightness > 0.22;

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
                        fitTightness={fitTightness}
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

                  {/* Dynamic Fit Badge on top-left of Canvas */}
                  <div className={`absolute top-4 left-4 flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md shadow-md border transition-all ${
                    isTooSmall
                      ? "bg-amber-500/20 text-amber-900 dark:text-amber-200 border-amber-500/40"
                      : isTooBig
                      ? "bg-purple-500/20 text-purple-900 dark:text-purple-200 border-purple-500/40"
                      : "bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 border-emerald-500/40"
                  }`}>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                      isTooSmall ? "bg-amber-500" : isTooBig ? "bg-purple-500" : "bg-emerald-500"
                    }`} />
                    {isTooSmall ? "⚠️ Talla Muy Ajustada (Chica)" : isTooBig ? "⚠️ Talla Holgada (Grande)" : "✨ Calce Ideal"}
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
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{formatPrice(product.price)}</p>
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

            {/* Avatar picker: who is trying the garment on (only useful inside the 3D fitting room) */}
            {isTryOnActive && avatars.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">Probar en</span>
                  <Link href="/avatar" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                    Gestionar avatares
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Avatar para el probador">
                  {avatars.map((avatar) => {
                    const active = avatar.id === avatarData?.id;
                    return (
                      <button
                        key={avatar.id}
                        role="radio"
                        aria-checked={active}
                        onClick={() => handleSelectAvatar(avatar)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-colors ${
                          active
                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-600 text-blue-700 dark:text-blue-400"
                            : "bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:border-neutral-300 dark:hover:border-neutral-700"
                        }`}
                      >
                        <UserIcon className="w-4 h-4" />
                        {avatar.name}
                      </button>
                    );
                  })}
                </div>
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
                  <div className={`mt-3.5 p-3.5 rounded-2xl border text-xs transition-all shadow-sm ${
                    isTooSmall
                      ? "bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/60 text-amber-900 dark:text-amber-200"
                      : isTooBig
                      ? "bg-purple-50/80 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800/60 text-purple-900 dark:text-purple-200"
                      : "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200"
                  }`}>
                    <div className="flex items-center gap-2 font-bold mb-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        isTooSmall ? "bg-amber-500" : isTooBig ? "bg-purple-500" : "bg-emerald-500"
                      }`} />
                      {isTooSmall
                        ? "⚠️ Diagnóstico: Talla Ajustada / Pequeña"
                        : isTooBig
                        ? "⚠️ Diagnóstico: Talla Holgada / Grande"
                        : "✨ Diagnóstico: Calce Recomendado"}
                    </div>
                    <p className="opacity-90 leading-relaxed">
                      {isTooSmall
                        ? `Para tu complexión (~talle ${avatarWaistInches}), el talle ${selectedSize} ejerce tensión en cintura y muslos; la botamanga queda corta en tus tobillos. Se muestran líneas de tensión en el 3D.`
                        : isTooBig
                        ? `Para tu complexión (~talle ${avatarWaistInches}), el talle ${selectedSize} queda suelto con holgura en cintura y exceso de tela acumulado sobre las zapatillas.`
                        : `El talle ${selectedSize} se adapta con caída limpia a tus proporciones (~talle ${avatarWaistInches}), sin tirantez ni arrugas de holgura excesiva.`}
                    </p>
                  </div>
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
