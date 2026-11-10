"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import { User, TShirt, Scissors, Ruler, ArrowRight } from "@phosphor-icons/react";
import {
  ANTHROPOMETRIC_SPECS,
  cmToMorphFactor,
  estimateInseamCm,
  getAvatarMeasurementsCm,
  MorphKey,
  morphToCm,
  normalizeMorphFactor,
} from "@/lib/avatars";
import { ParametricMannequin, ParametricPants } from "./avatar";

interface AvatarCreatorNativeProps {
  onAvatarExported: (
    url: string,
    skinColor: string,
    height: number,
    weight: number,
    shirtColor: string,
    shoesColor: string,
    hairStyle: string,
    hairColor: string,
    gender: string,
    muscleDefinition?: number,
    eyebrowStyle?: string,
    shirtSleeve?: string,
    chestWidth?: number,
    bellyWidth?: number,
    bellyDepth?: number,
    hipWidth?: number,
    armThickness?: number,
    legThickness?: number,
    breastSize?: number,
    neckThickness?: number,
    glasses?: boolean,
    glassesColor?: string,
    watch?: boolean,
    watchColor?: string
  ) => void;
  initialSkinColor?: string;
  initialHeight?: number;
  initialWeight?: number;
  initialShirtColor?: string;
  initialShoesColor?: string;
  initialHairStyle?: string;
  initialHairColor?: string;
  initialGender?: string;
  initialMuscleDefinition?: number;
  initialEyebrowStyle?: string;
  initialShirtSleeve?: string;
  initialChestWidth?: number;
  initialBellyWidth?: number;
  initialBellyDepth?: number;
  initialHipWidth?: number;
  initialArmThickness?: number;
  initialLegThickness?: number;
  initialBreastSize?: number;
  initialNeckThickness?: number;
  initialGlasses?: boolean;
  initialGlassesColor?: string;
  initialWatch?: boolean;
  initialWatchColor?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
//  AVATAR CREATOR COMPONENT — Centimeter-Driven (cm) Anthropometric Editor
// ──────────────────────────────────────────────────────────────────────────────
export function AvatarCreatorNative({
  onAvatarExported,
  initialSkinColor = "#f1c27d",
  initialHeight = 170,
  initialWeight = 70,
  initialShirtColor = "#ffffff",
  initialShoesColor = "#1a1a1a",
  initialHairStyle = "Corto",
  initialHairColor = "#1a0a00",
  initialGender = "Hombre",
  initialMuscleDefinition = 0.3,
  initialEyebrowStyle = "Normal",
  initialShirtSleeve = "Manga Corta",
  initialChestWidth = 1.0,
  initialBellyWidth = 1.0,
  initialBellyDepth = 1.0,
  initialHipWidth = 1.0,
  initialArmThickness = 1.0,
  initialLegThickness = 1.0,
  initialBreastSize = 1.0,
  initialNeckThickness = 1.0,
  initialGlasses = false,
  initialGlassesColor = "#111827",
  initialWatch = false,
  initialWatchColor = "#18181b",
}: AvatarCreatorNativeProps) {
  type TabType = "body" | "style";
  const [activeTab, setActiveTab] = useState<TabType>("body");

  // Body
  const [skinColor, setSkinColor] = useState(initialSkinColor);
  const [heightCm, setHeightCm] = useState(initialHeight);
  const [gender, setGender] = useState(initialGender);
  const [muscleDefinition, setMuscleDefinition] = useState(initialMuscleDefinition);

  // Normalized morph factors (backed by real-world centimeter sliders in the UI)
  const [chestWidth, setChestWidth] = useState(() =>
    normalizeMorphFactor(initialChestWidth, "chestWidth", initialGender)
  );
  const [bellyWidth, setBellyWidth] = useState(() =>
    normalizeMorphFactor(initialBellyWidth, "bellyWidth", initialGender)
  );
  const [bellyDepth, setBellyDepth] = useState(() =>
    normalizeMorphFactor(initialBellyDepth, "bellyDepth", initialGender)
  );
  const [hipWidth, setHipWidth] = useState(() =>
    normalizeMorphFactor(initialHipWidth, "hipWidth", initialGender)
  );
  const [armThickness, setArmThickness] = useState(() =>
    normalizeMorphFactor(initialArmThickness, "armThickness", initialGender)
  );
  const [legThickness, setLegThickness] = useState(() =>
    normalizeMorphFactor(initialLegThickness, "legThickness", initialGender)
  );
  const [breastSize, setBreastSize] = useState(() =>
    normalizeMorphFactor(initialBreastSize, "breastSize", initialGender)
  );
  const [neckThickness, setNeckThickness] = useState(() =>
    normalizeMorphFactor(initialNeckThickness, "neckThickness", initialGender)
  );

  // Face / Head & Accessories
  const [hairStyle, setHairStyle] = useState(initialHairStyle);
  const [hairColor, setHairColor] = useState(initialHairColor);
  const [eyebrowStyle, setEyebrowStyle] = useState(initialEyebrowStyle);
  const [glasses, setGlasses] = useState(Boolean(initialGlasses));
  const [glassesColor, setGlassesColor] = useState(initialGlassesColor || "#111827");
  const [watch, setWatch] = useState(Boolean(initialWatch));
  const [watchColor, setWatchColor] = useState(initialWatchColor || "#18181b");

  // Clothes
  const [shirtColor, setShirtColor] = useState(initialShirtColor);
  const [shoesColor, setShoesColor] = useState(initialShoesColor);
  const [shirtSleeve, setShirtSleeve] = useState(initialShirtSleeve);

  const scaleY = heightCm / 170.0;
  const scaleXZ = 1.0;

  // Live anthropometric profile in centimeters (cm)
  const measurementsCm = getAvatarMeasurementsCm(heightCm, gender, {
    chestWidth,
    breastSize,
    bellyWidth,
    bellyDepth,
    hipWidth,
    legThickness,
    armThickness,
    neckThickness,
  });

  // ── Palette definitions ──────────────────────────────────────────────────
  const hairStyles = ["Calvo", "Corto", "Largo", "Recogido"];
  const eyebrowStyles = ["Fino", "Normal", "Grueso"];
  const shirtSleeves = ["Manga Larga", "Manga Corta", "Sin Mangas"];

  // ── Style Helpers ────────────────────────────────────────────────────────
  const commonSliderClass =
    "w-full h-2 bg-neutral-200/80 dark:bg-neutral-800/80 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all";
  const commonColorPickerClass =
    "w-14 h-14 sm:w-16 sm:h-16 p-1 liquid-glass-card rounded-xl cursor-pointer hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20";

  const getSelectBtnClass = (isActive: boolean) =>
    `py-3 px-2 text-xs sm:text-sm font-bold rounded-xl border transition-all flex items-center justify-center ${
      isActive
        ? "bg-blue-500/15 dark:bg-blue-500/25 border-blue-500 text-blue-700 dark:text-blue-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)]"
        : "liquid-glass-btn-secondary text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white"
    }`;

  // Estimate body weight in kg from height & centimeter circumferences so DB weight_kg stays coherent
  const estimatedWeightKg = Math.round(
    Math.max(
      42,
      Math.min(
        140,
        (heightCm - 100) * 0.48 +
          (measurementsCm.waistCm - 78) * 0.45 +
          (measurementsCm.hipCm - 96) * 0.35 +
          (measurementsCm.chestCm - 92) * 0.25
      )
    )
  );

  const handleSave = () => {
    onAvatarExported(
      "parametric",
      skinColor,
      heightCm,
      estimatedWeightKg || initialWeight,
      shirtColor,
      shoesColor,
      hairStyle,
      hairColor,
      gender,
      muscleDefinition,
      eyebrowStyle,
      shirtSleeve,
      chestWidth,
      bellyWidth,
      bellyDepth,
      hipWidth,
      armThickness,
      legThickness,
      breastSize,
      neckThickness,
      glasses,
      glassesColor,
      watch,
      watchColor
    );
  };

  const morphControlItems: {
    key: MorphKey;
    value: number;
    setter: (val: number) => void;
  }[] = [
    { key: "chestWidth", value: chestWidth, setter: setChestWidth },
    ...(gender === "Mujer"
      ? [{ key: "breastSize" as MorphKey, value: breastSize, setter: setBreastSize }]
      : []),
    { key: "bellyWidth", value: bellyWidth, setter: setBellyWidth },
    { key: "bellyDepth", value: bellyDepth, setter: setBellyDepth },
    { key: "hipWidth", value: hipWidth, setter: setHipWidth },
    { key: "legThickness", value: legThickness, setter: setLegThickness },
    { key: "armThickness", value: armThickness, setter: setArmThickness },
    { key: "neckThickness", value: neckThickness, setter: setNeckThickness },
  ];

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "body", label: "Medidas (cm)", icon: <User className="w-5 h-5" /> },
    { id: "style", label: "Estilo", icon: <TShirt className="w-5 h-5" /> },
  ];

  return (
    <div className="flex flex-col md:flex-row w-full h-auto md:h-[760px] rounded-2xl sm:rounded-3xl overflow-hidden liquid-glass-card">
      {/* 3D Viewport */}
      <div className="w-full h-[380px] sm:h-[440px] md:h-auto md:flex-1 relative cursor-grab active:cursor-grabbing bg-gradient-to-b from-blue-500/5 via-neutral-200/40 to-neutral-100/70 dark:from-blue-950/20 dark:via-neutral-900/50 dark:to-neutral-950/80">
        <Canvas dpr={[1, 2]} camera={{ position: [0, 1.2, 3.5], fov: 44 }} shadows>
          <ambientLight intensity={0.55} />
          <directionalLight
            position={[4, 10, 5]}
            intensity={1.6}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight position={[-4, 4, -3]} intensity={0.5} />
          <pointLight position={[0, 2.5, -2.5]} intensity={0.4} color="#b0d0ff" />
          <Environment preset="city" />

          <ParametricMannequin
            skinColor={skinColor}
            shirtColor={shirtColor}
            shoesColor={shoesColor}
            hairStyle={hairStyle}
            hairColor={hairColor}
            gender={gender}
            scaleY={scaleY}
            scaleXZ={scaleXZ}
            muscleDefinition={muscleDefinition}
            eyebrowStyle={eyebrowStyle}
            shirtSleeve={shirtSleeve}
            chestWidth={chestWidth}
            bellyWidth={bellyWidth}
            bellyDepth={bellyDepth}
            hipWidth={hipWidth}
            armThickness={armThickness}
            legThickness={legThickness}
            breastSize={breastSize}
            neckThickness={neckThickness}
            glasses={glasses}
            glassesColor={glassesColor}
            watch={watch}
            watchColor={watchColor}
            isNakedBottom={!["Calzoncillos", "Bragas"].includes(shirtSleeve)}
          />
          {!["Calzoncillos", "Bragas"].includes(shirtSleeve) && (
            <ParametricPants
              avatarScaleY={scaleY}
              avatarScaleXZ={scaleXZ}
              pantsScaleX={1.0}
              pantsScaleY={1.0}
              isFemale={gender === "Mujer"}
              legThickness={legThickness}
              hipWidth={hipWidth}
              bellyWidth={bellyWidth}
              bellyDepth={bellyDepth}
              chestWidth={chestWidth}
            />
          )}
          <ContactShadows
            position={[0, -0.9, 0]}
            opacity={0.45}
            scale={5}
            blur={2.2}
            far={4}
          />
          <OrbitControls
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.5}
            minDistance={2.5}
            maxDistance={6}
            target={[0, 0.5, 0]}
          />
        </Canvas>

        <div className="absolute top-4 sm:top-5 left-4 sm:left-5 liquid-glass-pill liquid-glass-refract text-neutral-900 dark:text-white px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-semibold flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Motor Antropométrico 3D (cm)
        </div>

        {/* Live Anthropometric Stats Overlay */}
        <div className="absolute bottom-4 sm:bottom-5 left-4 sm:left-5 flex flex-wrap gap-1.5 sm:gap-2 pr-4">
          <div className="liquid-glass-pill liquid-glass-refract text-neutral-900 dark:text-white px-3 py-1.5 rounded-full text-xs font-bold">
            Altura {heightCm} cm
          </div>
          <div className="liquid-glass-pill liquid-glass-refract text-neutral-900 dark:text-white px-3 py-1.5 rounded-full text-xs font-bold">
            Cintura {measurementsCm.waistCm} cm
          </div>
          <div className="liquid-glass-pill liquid-glass-refract text-neutral-900 dark:text-white px-3 py-1.5 rounded-full text-xs font-bold">
            Cadera {measurementsCm.hipCm} cm
          </div>
          <div className="liquid-glass-pill liquid-glass-refract text-neutral-900 dark:text-white px-3 py-1.5 rounded-full text-xs font-bold">
            {gender}
          </div>
        </div>
      </div>

      {/* Controls Panel */}
      <div className="w-full md:w-[410px] lg:w-[435px] liquid-glass-panel border-t md:border-t-0 md:border-l border-neutral-200/70 dark:border-white/10 flex flex-col max-h-[560px] md:max-h-none md:h-full">
        {/* Tabs */}
        <div className="flex p-3 gap-2 border-b border-neutral-200/70 dark:border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex flex-col items-center gap-1 transition-all ${
                activeTab === tab.id
                  ? "liquid-glass-btn-primary shadow-md"
                  : "liquid-glass-btn-secondary text-neutral-600 dark:text-neutral-300"
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          {/* ── BODY TAB (Centimeters) ── */}
          {activeTab === "body" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Gender */}
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                  Género / Base Anatómica
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["Hombre", "Mujer"].map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={getSelectBtnClass(gender === g)}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Height & Leg Inseam in cm */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-end">
                  <div>
                    <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200 block">
                      Altura Total
                    </label>
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Largo de pierna (entrepierna): ~{estimateInseamCm(heightCm)} cm
                    </span>
                  </div>
                  <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                    {heightCm} cm
                  </span>
                </div>
                <input
                  type="range"
                  min="140"
                  max="210"
                  value={heightCm}
                  onChange={(e) => setHeightCm(parseInt(e.target.value))}
                  className={commonSliderClass}
                />
              </div>

              {/* Muscle Definition */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                    Tonificación / Definición Muscular
                  </label>
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                    {Math.round(muscleDefinition * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(muscleDefinition * 100)}
                  onChange={(e) => setMuscleDefinition(parseInt(e.target.value) / 100)}
                  className={commonSliderClass}
                />
              </div>

              {/* Skin tone */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                    Tono de Piel
                  </label>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="20"
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      const hue = 30 - (val / 100) * 10;
                      const sat = 80 - (val / 100) * 30;
                      const lit = 90 - (val / 100) * 75;
                      setSkinColor(`hsl(${hue}, ${sat}%, ${lit}%)`);
                    }}
                    className="w-full h-4 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    style={{
                      background:
                        "linear-gradient(to right, hsl(30, 80%, 90%), hsl(25, 65%, 52%), hsl(20, 50%, 15%))",
                    }}
                  />
                  <div
                    className="w-10 h-10 shrink-0 rounded-full border-2 border-neutral-200 dark:border-neutral-700 shadow-sm"
                    style={{ backgroundColor: skinColor }}
                  />
                </div>
              </div>

              {/* Anthropometric Measurements in Centimeters (cm) */}
              <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Medidas Corporales (en cm)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setChestWidth(1.0);
                      setBreastSize(1.0);
                      setBellyWidth(1.0);
                      setBellyDepth(1.0);
                      setHipWidth(1.0);
                      setArmThickness(1.0);
                      setLegThickness(1.0);
                      setNeckThickness(1.0);
                      setMuscleDefinition(0.3);
                      setHeightCm(170);
                    }}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Restablecer estándar
                  </button>
                </div>

                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Ingresa tus medidas reales en centímetros con cinta métrica. Estas medidas se
                  compararán directamente contra los centímetros de cada pantalón en el probador.
                </p>

                {morphControlItems.map((item) => {
                  const spec = ANTHROPOMETRIC_SPECS[item.key];
                  const currentCm = morphToCm(item.value, item.key, gender);
                  return (
                    <div key={item.key} className="space-y-1.5">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                          {spec.label}
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={spec.minCm}
                            max={spec.maxCm}
                            step={spec.stepCm}
                            value={currentCm}
                            onChange={(e) => {
                              const parsed = parseFloat(e.target.value);
                              if (!Number.isNaN(parsed)) {
                                item.setter(cmToMorphFactor(parsed, item.key, gender));
                              }
                            }}
                            className="w-16 px-2 py-0.5 text-right text-xs font-black text-blue-600 dark:text-blue-400 rounded-lg liquid-glass-input"
                          />
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                            cm
                          </span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={spec.minCm}
                        max={spec.maxCm}
                        step={spec.stepCm}
                        value={currentCm}
                        onChange={(e) => {
                          const newCm = parseFloat(e.target.value);
                          item.setter(cmToMorphFactor(newCm, item.key, gender));
                        }}
                        className={commonSliderClass}
                      />
                      <div className="flex justify-between text-[10px] text-neutral-400">
                        <span>Mín: {spec.minCm} cm</span>
                        <span>{spec.helpText}</span>
                        <span>Máx: {spec.maxCm} cm</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── STYLE TAB ── */}
          {activeTab === "style" && (
            <div className="space-y-7 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Hair Style */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                  <Scissors className="w-4 h-4" /> Peinado
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {hairStyles.map((s) => (
                    <button
                      key={s}
                      onClick={() => setHairStyle(s)}
                      className={getSelectBtnClass(hairStyle === s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hair Color */}
              <div
                className={`space-y-3 transition-opacity ${
                  hairStyle === "Calvo" ? "opacity-30 pointer-events-none" : ""
                }`}
              >
                <div className="flex justify-between items-end">
                  <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                    Color de Cabello
                  </label>
                  <span className="text-xs text-neutral-500 uppercase font-bold">{hairColor}</span>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={hairColor}
                    onChange={(e) => setHairColor(e.target.value)}
                    className={commonColorPickerClass}
                  />
                  <p className="text-xs text-neutral-500 max-w-[200px]">
                    Elige el tono exacto para el cabello.
                  </p>
                </div>
              </div>

              {/* Eyebrows */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                  Cejas
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {eyebrowStyles.map((s) => (
                    <button
                      key={s}
                      onClick={() => setEyebrowStyle(s)}
                      className={getSelectBtnClass(eyebrowStyle === s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shirt Color */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                    Color de Camiseta
                  </label>
                  <span className="text-xs text-neutral-500 uppercase font-bold">{shirtColor}</span>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={shirtColor}
                    onChange={(e) => setShirtColor(e.target.value)}
                    className={commonColorPickerClass}
                  />
                  <p className="text-xs text-neutral-500 max-w-[200px]">
                    Elige el color exacto para tu camiseta.
                  </p>
                </div>
              </div>

              {/* Shoes Color */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                    Calzado
                  </label>
                  <span className="text-xs text-neutral-500 uppercase font-bold">{shoesColor}</span>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={shoesColor}
                    onChange={(e) => setShoesColor(e.target.value)}
                    className={commonColorPickerClass}
                  />
                  <p className="text-xs text-neutral-500 max-w-[200px]">
                    Elige el color exacto para el calzado.
                  </p>
                </div>
              </div>

              {/* Shirt Sleeve */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                  Estilo de Prenda Superior
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {shirtSleeves.map((s) => (
                    <button
                      key={s}
                      onClick={() => setShirtSleeve(s)}
                      className={getSelectBtnClass(shirtSleeve === s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accessories: Anteojos (Sí/No + Color) */}
              <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                  Anteojos
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGlasses(false)}
                    className={getSelectBtnClass(!glasses)}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => setGlasses(true)}
                    className={getSelectBtnClass(glasses)}
                  >
                    Sí
                  </button>
                </div>

                {glasses && (
                  <div className="space-y-2.5 pt-1 animate-in fade-in duration-200">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                        Color de Armazón
                      </span>
                      <span className="text-xs text-neutral-500 uppercase font-bold">
                        {glassesColor}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={glassesColor}
                        onChange={(e) => setGlassesColor(e.target.value)}
                        className="w-11 h-11 p-1 liquid-glass-card rounded-xl cursor-pointer shrink-0"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { name: "Negro", hex: "#111827" },
                          { name: "Carey", hex: "#5c3a21" },
                          { name: "Dorado", hex: "#d4af37" },
                          { name: "Plata", hex: "#94a3b8" },
                          { name: "Azul", hex: "#1e3a8a" },
                        ].map((preset) => (
                          <button
                            key={preset.hex}
                            type="button"
                            onClick={() => setGlassesColor(preset.hex)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                              glassesColor.toLowerCase() === preset.hex
                                ? "border-blue-500 bg-blue-500/15 text-blue-700 dark:text-blue-300"
                                : "liquid-glass-btn-secondary text-neutral-600 dark:text-neutral-300"
                            }`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-white/50 shrink-0"
                              style={{ backgroundColor: preset.hex }}
                            />
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Accessories: Reloj de Pulsera (Sí/No + Color) */}
              <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                  Reloj de Pulsera
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWatch(false)}
                    className={getSelectBtnClass(!watch)}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => setWatch(true)}
                    className={getSelectBtnClass(watch)}
                  >
                    Sí
                  </button>
                </div>

                {watch && (
                  <div className="space-y-2.5 pt-1 animate-in fade-in duration-200">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                        Color del Reloj
                      </span>
                      <span className="text-xs text-neutral-500 uppercase font-bold">
                        {watchColor}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={watchColor}
                        onChange={(e) => setWatchColor(e.target.value)}
                        className="w-11 h-11 p-1 liquid-glass-card rounded-xl cursor-pointer shrink-0"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { name: "Negro", hex: "#18181b" },
                          { name: "Acero", hex: "#cbd5e1" },
                          { name: "Oro", hex: "#d4af37" },
                          { name: "Cuero", hex: "#6b4423" },
                          { name: "Azul", hex: "#1e3a8a" },
                        ].map((preset) => (
                          <button
                            key={preset.hex}
                            type="button"
                            onClick={() => setWatchColor(preset.hex)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                              watchColor.toLowerCase() === preset.hex
                                ? "border-blue-500 bg-blue-500/15 text-blue-700 dark:text-blue-300"
                                : "liquid-glass-btn-secondary text-neutral-600 dark:text-neutral-300"
                            }`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-white/50 shrink-0"
                              style={{ backgroundColor: preset.hex }}
                            />
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="p-4 sm:p-5 border-t border-neutral-200/70 dark:border-white/10">
          <button
            onClick={handleSave}
            className="w-full py-3.5 sm:py-4 liquid-glass-btn-primary font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
          >
            Guardar Gemelo Digital
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
