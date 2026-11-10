"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { fetchApi } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import {
  AvatarMeasurementsCm,
  BodyMorphs,
  GarmentPatternCm,
  SavedAvatar,
  getAvatarMeasurementsCm,
  getDefaultGarmentPatternCm,
  getStoredAvatarId,
  parseMorphs,
  pickAvatar,
  storeAvatarId,
} from "@/lib/avatars";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";
import { ArrowLeft, ShoppingCart, Ruler, Palette, CheckCircle, Warning, Info, User as UserIcon } from "@phosphor-icons/react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Box } from "@react-three/drei";
import { ParametricMannequin, ParametricPants } from "@/components/avatar";

// ── Size Parsing & Centimeter (cm) Fit Diagnostic Logic ──────────────────────
function parseSizeInches(size: string): number {
  if (!size) return 32;
  const upper = size.toUpperCase().trim();
  const letterMap: Record<string, number> = {
    "XXS": 26, "XS": 28, "S": 30, "M": 32, "L": 34, "XL": 36, "XXL": 38, "3XL": 40
  };
  if (letterMap[upper] !== undefined) {
    return letterMap[upper];
  }

  const numMatch = size.match(/\d+/);
  if (numMatch) {
    const num = parseInt(numMatch[0]);
    if (num >= 38 && num <= 60) {
      return Math.round(num - 10);
    }
    if (num >= 22 && num < 38) {
      return num;
    }
  }

  return 32;
}

function calculateSizeScale(size: string): number {
  if (!size) return 1.0;
  const inches = parseSizeInches(size);
  return 1.0 + (inches - 32) * 0.025;
}

/**
 * Computes the exact garment measurements in centimeters (cm) for the selected size,
 * anchored on the brand's base pattern in cm (reference size M / 32 US / 42 AR).
 */
function getGarmentSizeMeasurementsCm(
  selectedSize: string,
  fitLabel: string,
  meta?: GarmentMetadata
): GarmentPatternCm {
  const defaults = getDefaultGarmentPatternCm(
    fitLabel,
    typeof meta?.waist_rise === "string" ? meta.waist_rise : meta?.waist_rise_label || "Tiro Medio"
  );
  const baseWaist = meta?.waist_cm ?? defaults.waistCm;
  const baseHip = meta?.hip_cm ?? defaults.hipCm;
  const baseThigh = meta?.thigh_cm ?? defaults.thighCm;
  const baseInseam = meta?.inseam_cm ?? defaults.inseamCm;
  const baseHem = meta?.hem_width_cm ?? defaults.hemWidthCm;
  const baseRise = meta?.rise_cm ?? defaults.riseCm;

  const sizeInches = parseSizeInches(selectedSize);
  const inchDelta = sizeInches - 32; // 0 for M / 32 US / 42 AR

  return {
    waistCm: Math.round(baseWaist + inchDelta * 2.5),
    hipCm: Math.round(baseHip + inchDelta * 2.5),
    thighCm: Math.round(baseThigh + inchDelta * 1.4),
    inseamCm: Math.round(baseInseam + inchDelta * 0.5),
    hemWidthCm: Number((baseHem + inchDelta * 0.35).toFixed(1)),
    riseCm: Number((baseRise + inchDelta * 0.25).toFixed(1)),
  };
}

interface FitDiagnosticResult {
  garmentSizeInches: number;
  garmentCm: GarmentPatternCm;
  avatarCm: AvatarMeasurementsCm;
  waistDeltaCm: number;
  hipDeltaCm: number;
  thighDeltaCm: number;
  fitTightness: number;
  isTooSmall: boolean;
  isTooBig: boolean;
  badgeText: string;
  badgeClass: string;
  dotClass: string;
  detailTitle: string;
  detailBody: string;
}

function calculateFitDiagnostic(
  selectedSize: string,
  avatarHeight: number,
  avatarGender: string,
  morphs: BodyMorphs,
  fitLabel: string,
  meta?: GarmentMetadata
): FitDiagnosticResult {
  const garmentSizeInches = parseSizeInches(selectedSize);
  const garmentCm = getGarmentSizeMeasurementsCm(selectedSize, fitLabel, meta);
  const avatarCm = getAvatarMeasurementsCm(avatarHeight, avatarGender, morphs);

  const waistDeltaCm = garmentCm.waistCm - avatarCm.waistCm;
  const hipDeltaCm = garmentCm.hipCm - avatarCm.hipCm;
  const thighDeltaCm = garmentCm.thighCm - avatarCm.thighCm;

  // Weighted anthropometric delta in cm (Waist 55%, Hip 35%, Thigh 10%)
  const weightedDeltaCm = waistDeltaCm * 0.55 + hipDeltaCm * 0.35 + thighDeltaCm * 0.10;
  const fitTightness = Math.max(-1.0, Math.min(1.0, weightedDeltaCm / 12.0));
  const isTooSmall = fitTightness < -0.22 || waistDeltaCm < -3 || hipDeltaCm < -4;
  const isTooBig = !isTooSmall && (fitTightness > 0.22 || waistDeltaCm > 5 || hipDeltaCm > 7);

  const formatSignedCm = (v: number) => (v > 0 ? `+${v} cm` : `${v} cm`);

  let badgeText = `Calce Ideal (${formatSignedCm(waistDeltaCm)} cintura)`;
  let badgeClass =
    "bg-white/90 dark:bg-slate-900/90 text-emerald-800 dark:text-emerald-300 border-emerald-500/50";
  let dotClass = "bg-emerald-500";
  let detailTitle = "Diagnóstico Antropométrico: Calce Recomendado";
  let detailBody = `Tu cintura (${avatarCm.waistCm} cm) y cadera (${avatarCm.hipCm} cm) calzan de forma óptima en el talle ${selectedSize} (cintura ${garmentCm.waistCm} cm · cadera ${garmentCm.hipCm} cm · tiro/largo ${garmentCm.inseamCm} cm).`;

  if (isTooSmall) {
    badgeText = `Talla Chica (${formatSignedCm(waistDeltaCm)} cintura)`;
    badgeClass =
      "bg-white/90 dark:bg-slate-900/90 text-amber-800 dark:text-amber-300 border-amber-500/50";
    dotClass = "bg-amber-500";
    detailTitle = "Diagnóstico Antropométrico: Talla Ajustada / Pequeña";
    detailBody = `Tu avatar mide ${avatarCm.waistCm} cm de cintura y ${avatarCm.hipCm} cm de cadera, mientras que el talle ${selectedSize} ofrece ${garmentCm.waistCm} cm de cintura (${formatSignedCm(waistDeltaCm)}) y ${garmentCm.hipCm} cm de cadera (${formatSignedCm(hipDeltaCm)}). Se visualiza tensión textil en 3D.`;
  } else if (isTooBig) {
    badgeText = `Talla Holgada (${formatSignedCm(waistDeltaCm)} cintura)`;
    badgeClass =
      "bg-white/90 dark:bg-slate-900/90 text-purple-800 dark:text-purple-300 border-purple-500/50";
    dotClass = "bg-purple-500";
    detailTitle = "Diagnóstico Antropométrico: Talla Holgada / Grande";
    detailBody = `Para tu cintura (${avatarCm.waistCm} cm) y cadera (${avatarCm.hipCm} cm), el talle ${selectedSize} (${garmentCm.waistCm} cm cintura · ${garmentCm.hipCm} cm cadera) deja una holgura de ${formatSignedCm(waistDeltaCm)} en cintura y acumulación sobre el calzado.`;
  }

  return {
    garmentSizeInches,
    garmentCm,
    avatarCm,
    waistDeltaCm,
    hipDeltaCm,
    thighDeltaCm,
    fitTightness,
    isTooSmall,
    isTooBig,
    badgeText,
    badgeClass,
    dotClass,
    detailTitle,
    detailBody,
  };
}

interface GarmentImage {
  url: string;
  type: string; // FRONT | SIDE | BACK
}

interface ColorOption {
  name: string;
  hex: string;
}

interface GarmentMetadata {
  scale_x?: number;
  scale_y?: number;
  color_hex?: string;
  accent_hex?: string;
  roughness?: number;
  taper?: number;
  waist_rise?: number | string;
  waist_rise_label?: string;
  distress?: number;
  distress_level?: number;
  texture?: string;
  has_cuff?: boolean;
  has_cuffs?: boolean;
  has_pleats?: boolean;
  fit_label?: string;
  source?: string;
  waist_cm?: number;
  hip_cm?: number;
  thigh_cm?: number;
  inseam_cm?: number;
  hem_width_cm?: number;
  rise_cm?: number;
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
  metadata_json?: GarmentMetadata;
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
  const [showSizeGuide, setShowSizeGuide] = useState(false);

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
      <div className="min-h-screen liquid-bg flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Producto no encontrado</h1>
        <button onClick={() => router.push("/")} className="text-blue-500 hover:underline font-medium">Volver al inicio</button>
      </div>
    );
  }

  if (loading || !product) {
    return (
      <div className="min-h-screen liquid-bg flex items-center justify-center">
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
  const avatarMuscle = avatarData?.muscle_definition ?? 0.3;
  const avatarEyebrow = avatarData?.eyebrow_style || "Normal";

  // Parse advanced morphs
  const morphs = parseMorphs(avatarData?.body_type);

  // ── Selected color drives TryOn pants color ──────────────────────────────
  // Use selected variant color; fall back to AI-detected color from the real image
  const aiColorHex = product.metadata_json?.color_hex ?? product.available_colors?.[0]?.hex ?? "#1e3a8a";
  const tryOnPantsColor = selectedColor?.hex || aiColorHex;
  const accentHex = product.metadata_json?.accent_hex ?? tryOnPantsColor;

  // ── Avatar scale (Height drives Y; horizontal widths are driven by cm morphs) ──
  const avatarScaleY = avatarHeight / 170.0;
  const avatarScaleXZ = 1.0;

  // ── Size drives pants scale in 3D ────────────────────────────────────────
  const sizeScaleMod = calculateSizeScale(selectedSize);

  // ── AI Vision & Parametric cm Parameters ─────────────────────────────────
  const aiScaleX    = product.metadata_json?.scale_x    ?? 1.0;
  const aiScaleY    = product.metadata_json?.scale_y    ?? 1.0;
  const aiRoughness = product.metadata_json?.roughness  ?? 0.80;
  const aiTaper     = product.metadata_json?.taper      ?? 0.0;
  const rawWaistRise = product.metadata_json?.waist_rise;
  const aiWaistRise = typeof rawWaistRise === "number"
    ? rawWaistRise
    : typeof rawWaistRise === "string"
    ? (rawWaistRise.toLowerCase().includes("alto") ? 0.85 : rawWaistRise.toLowerCase().includes("bajo") ? 0.2 : 0.5)
    : 0.5;
  const aiHasCuff   = Boolean(product.metadata_json?.has_cuff ?? product.metadata_json?.has_cuffs ?? false);
  const aiHasPleats = Boolean(product.metadata_json?.has_pleats ?? false);
  const aiDistress  = product.metadata_json?.distress ?? (product.metadata_json?.distress_level ? product.metadata_json.distress_level / 100 : 0);
  const aiTexture   = product.metadata_json?.texture ?? product.material ?? "Denim Clásico";
  const aiFitLabel  = product.metadata_json?.fit_label  ?? product.fit ?? "Regular";
  const aiSource    = product.metadata_json?.source ?? "";
  const formattedFit = product.fit?.toLowerCase().includes("fit") ? product.fit : `${product.fit || "Regular"} Fit`;

  // ── Smart Centimeter (cm) Fit Diagnostic ─────────────────────────────────
  const fitDiagnostic = calculateFitDiagnostic(
    selectedSize,
    avatarHeight,
    avatarGender,
    morphs,
    aiFitLabel,
    product.metadata_json
  );
  const { fitTightness, isTooSmall, isTooBig, garmentCm, avatarCm } = fitDiagnostic;

  // Combine AI scale with selected garment size scale
  const finalPantsScaleX = aiScaleX * sizeScaleMod;
  const finalPantsScaleY = aiScaleY;

  // ── Gallery images (from backend GarmentImage records) ───────────────────
  const galleryImages: string[] = product.images?.length
    ? product.images.map((img) => img.url)
    : [product.image || "/products/jean_classic.png"];

  return (
    <div className="min-h-screen liquid-bg text-neutral-900 dark:text-neutral-50 font-sans selection:bg-blue-500/30 transition-colors duration-300 flex flex-col">
      <Navbar />

      <main className="pt-28 md:pt-24 pb-12 px-4 sm:px-6 max-w-7xl mx-auto flex-1 w-full">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass-pill text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white mb-6 sm:mb-8 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Catálogo
        </Link>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

          {/* ── LEFT: Gallery / Try-On ─────────────────────────────────── */}
          <div className="w-full lg:w-1/2">
            <div
              className={`w-full aspect-[4/5] liquid-glass-card rounded-3xl overflow-hidden relative transition-all duration-500 ${
                isTryOnActive ? "shadow-2xl ring-4 ring-blue-500/25" : ""
              }`}
            >
              {isTryOnActive ? (
                <div className="w-full h-full cursor-grab active:cursor-grabbing">
                  <Canvas dpr={[1, 2]} camera={{ position: [0, 1.2, 3.5], fov: 44 }} shadows>
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
                        shirtSleeve={avatarData?.shirt_style || "Manga Corta"}
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
                        glasses={Boolean(avatarData?.glasses)}
                        glassesColor={avatarData?.glasses_color || "#111827"}
                        watch={Boolean(avatarData?.watch)}
                        watchColor={avatarData?.watch_color || "#18181b"}
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
                        bellyWidth={morphs.bellyWidth}
                        bellyDepth={morphs.bellyDepth}
                        chestWidth={morphs.chestWidth}
                        waistRise={aiWaistRise}
                        taper={aiTaper}
                        roughness={aiRoughness}
                        hasCuff={aiHasCuff}
                        hasPleats={aiHasPleats}
                        distress={aiDistress}
                        texture={aiTexture}
                        fitTightness={fitTightness}
                        garmentPatternCm={garmentCm}
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
                  <div className={`absolute top-3 sm:top-4 left-3 sm:left-4 max-w-[calc(100%-4.5rem)] flex items-center gap-2 text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_8px_20px_rgba(0,0,0,0.18)] border transition-all truncate ${fitDiagnostic.badgeClass}`}>
                    <div className={`w-2 h-2 rounded-full shrink-0 animate-pulse ${fitDiagnostic.dotClass}`} />
                    <span className="truncate">{fitDiagnostic.badgeText}</span>
                  </div>
                  {/* Size indicator in TryOn */}
                  <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 flex items-center gap-2 text-[11px] sm:text-xs font-bold text-white bg-black/65 backdrop-blur-xl border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] px-3 py-1.5 rounded-full">
                    Talle {selectedSize} · {selectedColor?.name}
                  </div>
                  {/* AI analysis source badge */}
                  {aiSource && (
                    <div
                      className={`absolute bottom-3 sm:bottom-4 right-3 sm:right-4 flex items-center gap-1.5 text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-full border shadow-md backdrop-blur-xl ${
                        aiSource.includes("vision")
                          ? "bg-purple-950/85 text-purple-100 border-purple-400/50"
                          : "bg-black/75 text-neutral-100 border-white/25"
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${aiSource.includes("vision") ? "bg-blue-400 animate-pulse" : "bg-gray-300"}`} />
                      {aiSource.includes("vision") ? "IA Visión" : "IA Texto"}
                    </div>
                  )}
                  <button
                    onClick={handleTryOnToggle}
                    className="absolute top-3 sm:top-4 right-3 sm:right-4 liquid-glass-pill liquid-glass-refract p-2 rounded-full hover:scale-110 transition-transform"
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
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/products/jean_classic.png";
                    }}
                    className="w-full h-full object-cover animate-in fade-in duration-300"
                    key={galleryImages[activeImageIndex]}
                  />
                  {(product.model_3d_url || product.metadata_json?.scale_x) && (
                    <div className="absolute top-4 left-4 flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-white/90 dark:bg-slate-900/85 backdrop-blur-xl px-3.5 py-1.5 rounded-full border border-emerald-500/50 shadow-md">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Try-On 3D disponible
                    </div>
                  )}
                  {/* Photo type label */}
                  {product.images?.[activeImageIndex]?.type && (
                    <div className="absolute bottom-4 right-4 bg-black/70 text-white text-xs px-3.5 py-1.5 rounded-full backdrop-blur-xl border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] font-semibold">
                      {{ FRONT: "Vista Frontal", SIDE: "Vista Lateral", BACK: "Vista Posterior" }[product.images[activeImageIndex].type] ?? ""}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Thumbnails */}
            {!isTryOnActive && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-2 pt-1 px-1">
                {galleryImages.map((imgSrc, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`shrink-0 w-18 sm:w-20 h-22 sm:h-24 liquid-glass-card rounded-2xl overflow-hidden border-2 transition-all ${
                      activeImageIndex === idx
                        ? "border-blue-500 shadow-lg scale-105 ring-2 ring-blue-500/25"
                        : "border-transparent hover:border-blue-400/50 hover:scale-105"
                    }`}
                  >
                    <img
                      src={imgSrc}
                      alt={`Vista ${idx + 1}`}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/products/jean_classic.png";
                      }}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Product details ─────────────────────────────────── */}
          <div className="w-full lg:w-1/2 flex flex-col liquid-glass-panel p-5 sm:p-8 rounded-3xl h-fit">

            {/* Header */}
            <div className="mb-3">
              <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-1">Acme Denim · {formattedFit}</p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2">{product.name}</h1>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">{formatPrice(product.price)}</p>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed mb-6 border-l-2 border-blue-400/60 dark:border-blue-500/60 pl-4">
                {product.description}
              </p>
            )}

            {/* Material badge */}
            {product.material && (
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-6 px-3 py-1.5 rounded-full liquid-glass-pill w-fit">
                <Info className="w-3.5 h-3.5 text-blue-500" />
                {product.material}
              </div>
            )}

            {/* Avatar picker: who is trying the garment on (only useful inside the 3D fitting room) */}
            {isTryOnActive && avatars.length > 0 && (
              <div className="mb-5 p-3.5 rounded-2xl liquid-glass-card">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-sm font-semibold">Probar en</span>
                  <Link href="/avatar" className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">
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
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
                          active
                            ? "bg-blue-500/15 dark:bg-blue-500/25 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm"
                            : "liquid-glass-btn-secondary text-neutral-600 dark:text-neutral-300"
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
            <div className="flex flex-col sm:flex-row gap-3 mb-8 pb-8 border-b border-neutral-200/70 dark:border-white/10">
              {(product.model_3d_url || product.metadata_json?.scale_x) ? (
                <button
                  onClick={handleTryOnToggle}
                  className={`flex-1 py-4 px-6 font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 text-sm ${
                    isTryOnActive
                      ? "liquid-glass-btn-secondary text-neutral-900 dark:text-white hover:bg-neutral-200/80 dark:hover:bg-neutral-800/80"
                      : "bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 backdrop-blur-xl text-white dark:text-neutral-950 border border-neutral-800 dark:border-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_10px_24px_-6px_rgba(0,0,0,0.3)]"
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
                <button disabled className="flex-1 py-4 px-6 liquid-glass-btn-secondary text-neutral-400 font-bold rounded-2xl cursor-not-allowed text-sm opacity-60">
                  Probador No Disponible
                </button>
              )}

              <button
                onClick={handleAddToCart}
                className="flex-1 py-4 px-6 liquid-glass-btn-primary font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 text-sm"
              >
                <ShoppingCart className="w-4 h-4" />
                Añadir al Carrito
              </button>
            </div>

            {/* Color Selector */}
            {product.available_colors?.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-sm">Color</h3>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-auto font-medium">{selectedColor?.name}</span>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {product.available_colors.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => setSelectedColor(c)}
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 transition-all shadow-[inset_0_2px_4px_rgba(255,255,255,0.45),0_4px_10px_rgba(0,0,0,0.15)] ${
                        selectedColor?.hex === c.hex
                          ? "border-blue-500 scale-110 ring-4 ring-blue-500/25"
                          : "border-white/50 dark:border-white/20 hover:scale-105"
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
                {isTryOnActive && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-2 animate-in fade-in duration-300">
                    El color se aplica en tiempo real en el Probador 3D
                  </p>
                )}
              </div>
            )}

            {/* Size Selector */}
            {product.available_sizes?.length > 0 && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-sm">Talle</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSizeGuide((v) => !v)}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {showSizeGuide ? "Ocultar Guía de Talles" : "Guía de Talles"}
                  </button>
                </div>
                {showSizeGuide && (
                  <div className="mb-4 p-4 rounded-2xl liquid-glass-card text-xs animate-in fade-in duration-200">
                    <p className="font-bold mb-2 text-neutral-800 dark:text-neutral-200">Equivalencia de Talles (Jeans)</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[280px]">
                        <thead>
                          <tr className="border-b border-neutral-300/70 dark:border-white/15 text-neutral-500 dark:text-neutral-400">
                            <th className="py-1.5 pr-3">Letra</th>
                            <th className="py-1.5 pr-3">US (Pulg.)</th>
                            <th className="py-1.5 pr-3">AR / EU</th>
                            <th className="py-1.5 pr-3">Cintura (cm)</th>
                            <th className="py-1.5">Cadera (cm)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200/60 dark:divide-white/10">
                          <tr><td className="py-1.5 font-semibold">XS</td><td>26 - 28</td><td>36 - 38</td><td>68 - 73</td><td>88 - 93</td></tr>
                          <tr><td className="py-1.5 font-semibold">S</td><td>29 - 30</td><td>38 - 40</td><td>74 - 78</td><td>94 - 98</td></tr>
                          <tr><td className="py-1.5 font-semibold">M</td><td>31 - 32</td><td>42</td><td>79 - 84</td><td>99 - 104</td></tr>
                          <tr><td className="py-1.5 font-semibold">L</td><td>33 - 34</td><td>44</td><td>85 - 90</td><td>105 - 110</td></tr>
                          <tr><td className="py-1.5 font-semibold">XL</td><td>36 - 38</td><td>46 - 48</td><td>91 - 98</td><td>111 - 118</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                <div className="flex gap-2 flex-wrap">
                  {product.available_sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`min-w-[3rem] h-11 px-3.5 rounded-xl font-bold text-sm transition-all border flex items-center justify-center ${
                        selectedSize === s
                          ? "bg-blue-500/15 dark:bg-blue-500/25 border-blue-500 text-blue-700 dark:text-blue-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)]"
                          : "liquid-glass-btn-secondary text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Ficha de Medidas Reales en Centímetros (cm) del Talle Seleccionado */}
                <div className="mt-3 p-3.5 rounded-2xl liquid-glass-card text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">
                      Medidas de la Prenda (Talle {selectedSize})
                    </span>
                    {avatarData && (
                      <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                        Comparado con {avatarData.name} ({avatarCm.heightCm} cm)
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="p-2 rounded-xl bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10">
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block">Cintura</span>
                      <span className="font-bold text-neutral-900 dark:text-white">{garmentCm.waistCm} cm</span>
                      {avatarData && (
                        <span className="text-[10px] text-neutral-500 block">
                          Tu avatar: {avatarCm.waistCm} cm
                        </span>
                      )}
                    </div>
                    <div className="p-2 rounded-xl bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10">
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block">Cadera</span>
                      <span className="font-bold text-neutral-900 dark:text-white">{garmentCm.hipCm} cm</span>
                      {avatarData && (
                        <span className="text-[10px] text-neutral-500 block">
                          Tu avatar: {avatarCm.hipCm} cm
                        </span>
                      )}
                    </div>
                    <div className="p-2 rounded-xl bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10">
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block">Muslo</span>
                      <span className="font-bold text-neutral-900 dark:text-white">{garmentCm.thighCm} cm</span>
                      {avatarData && (
                        <span className="text-[10px] text-neutral-500 block">
                          Tu avatar: {avatarCm.thighCm} cm
                        </span>
                      )}
                    </div>
                    <div className="p-2 rounded-xl bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10">
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block">Entrepierna</span>
                      <span className="font-bold text-neutral-900 dark:text-white">{garmentCm.inseamCm} cm</span>
                      {avatarData && (
                        <span className="text-[10px] text-neutral-500 block">
                          Tu pierna: ~{avatarCm.inseamCm} cm
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {isTryOnActive && (
                  <div className={`mt-3.5 p-3.5 rounded-2xl border backdrop-blur-xl text-xs transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)] ${
                    isTooSmall
                      ? "bg-amber-500/15 border-amber-400/50 text-amber-950 dark:text-amber-200"
                      : isTooBig
                      ? "bg-purple-500/15 border-purple-400/50 text-purple-950 dark:text-purple-200"
                      : "bg-emerald-500/15 border-emerald-400/50 text-emerald-950 dark:text-emerald-200"
                  }`}>
                    <div className="flex items-center gap-2 font-bold mb-1.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${fitDiagnostic.dotClass}`} />
                      {fitDiagnostic.detailTitle}
                    </div>
                    <p className="opacity-90 leading-relaxed">
                      {fitDiagnostic.detailBody}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Specs mini-grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <div className="p-4 liquid-glass-card rounded-2xl">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Corte</p>
                <p className="font-bold text-sm">{formattedFit}</p>
              </div>
              <div className="p-4 liquid-glass-card rounded-2xl">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Talle seleccionado</p>
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
