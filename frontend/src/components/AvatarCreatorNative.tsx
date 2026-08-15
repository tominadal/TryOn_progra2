"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, useTexture } from "@react-three/drei";
import { User, Palette, Shirt, Check, Glasses, Smile, Sparkles, Scissors, PenTool, Accessibility, Dumbbell } from "lucide-react";
import * as THREE from "three";

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
  // Morph props
  initialChestWidth?: number;
  initialBellyWidth?: number;
  initialBellyDepth?: number;
  initialHipWidth?: number;
  initialArmThickness?: number;
  initialLegThickness?: number;
  initialBreastSize?: number;
  initialNeckThickness?: number;
}
import { ParametricMannequin, ParametricPants } from './avatar';

//  AVATAR CREATOR COMPONENT — Full UI
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
}: AvatarCreatorNativeProps) {
  type TabType = "body" | "style";
  const [activeTab, setActiveTab] = useState<TabType>("body");

  // Body
  const [skinColor, setSkinColor] = useState(initialSkinColor);
  const [heightCm, setHeightCm] = useState(initialHeight);
  const [gender, setGender] = useState(initialGender);
  const [muscleDefinition, setMuscleDefinition] = useState(initialMuscleDefinition);

  // Morphs
  const [chestWidth, setChestWidth] = useState(initialChestWidth);
  const [bellyWidth, setBellyWidth] = useState(initialBellyWidth);
  const [bellyDepth, setBellyDepth] = useState(initialBellyDepth);
  const [hipWidth, setHipWidth] = useState(initialHipWidth);
  const [armThickness, setArmThickness] = useState(initialArmThickness);
  const [legThickness, setLegThickness] = useState(initialLegThickness);
  const [breastSize, setBreastSize] = useState(initialBreastSize);
  const [neckThickness, setNeckThickness] = useState(initialNeckThickness);

  // Face / Head
  const [hairStyle, setHairStyle] = useState(initialHairStyle);
  const [hairColor, setHairColor] = useState(initialHairColor);
  const [eyebrowStyle, setEyebrowStyle] = useState(initialEyebrowStyle);

  // Clothes
  const [shirtColor, setShirtColor] = useState(initialShirtColor);
  const [shoesColor, setShoesColor] = useState(initialShoesColor);
  const [shirtSleeve, setShirtSleeve] = useState(initialShirtSleeve);

  const scaleY = heightCm / 170.0;
  const scaleXZ = 1.0; // Eliminado el peso, escala base siempre 1.0

  // ── Palette definitions ──────────────────────────────────────────────────
  const hairStyles = ["Calvo", "Corto", "Largo", "Recogido"];
  const eyebrowStyles = ["Fino", "Normal", "Grueso"];
  const shirtSleeves = ["Manga Larga", "Manga Corta", "Sin Mangas"];

  // ── Style Helpers ────────────────────────────────────────────────────────
  const commonSliderClass = "w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all";
  const commonColorPickerClass = "w-16 h-16 p-1 bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 rounded-xl cursor-pointer hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20";
  
  const getSelectBtnClass = (isActive: boolean) => 
    `py-3 text-xs sm:text-sm font-bold rounded-xl border-2 transition-all flex items-center justify-center ${isActive
      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-600 text-blue-700 dark:text-blue-400"
      : "bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:border-neutral-300 dark:hover:border-neutral-700 hover:text-neutral-700 dark:hover:text-neutral-300"
    }`;

  const handleSave = () => {
    onAvatarExported(
      'parametric',
      skinColor,
      heightCm,
      70, // dummy weight
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
      neckThickness
    );
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "body", label: "Cuerpo", icon: <User className="w-5 h-5" /> },
    { id: "style", label: "Estilo", icon: <Shirt className="w-5 h-5" /> },
  ];

  return (
    <div className="flex flex-col md:flex-row w-full h-[720px] rounded-3xl overflow-hidden bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-2xl">

      {/* 3D Viewport */}
      <div className="flex-1 relative cursor-grab active:cursor-grabbing bg-gradient-to-b from-neutral-200/50 to-neutral-100 dark:from-neutral-900/60 dark:to-neutral-950">
        <Canvas camera={{ position: [0, 1.2, 3.5], fov: 44 }} shadows>
          <ambientLight intensity={0.55} />
          <directionalLight position={[4, 10, 5]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
          <directionalLight position={[-4, 4, -3]} intensity={0.5} />
          {/* Rim light for depth */}
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
            />
          )}
          <ContactShadows position={[0, -0.9, 0]} opacity={0.45} scale={5} blur={2.2} far={4} />
          <OrbitControls
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.5}
            minDistance={2.5}
            maxDistance={6}
            target={[0, 0.5, 0]}
          />
        </Canvas>

        <div className="absolute top-5 left-5 bg-white/80 dark:bg-black/50 backdrop-blur-md px-4 py-2 rounded-full text-xs font-semibold border border-neutral-200 dark:border-white/10 flex items-center gap-2 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Motor 3D en Vivo
        </div>

        {/* Stats overlay */}
        <div className="absolute bottom-5 left-5 flex gap-2">
          <div className="bg-white/80 dark:bg-black/60 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold border border-neutral-200 dark:border-white/10">
            {heightCm} cm
          </div>
          <div className="bg-white/80 dark:bg-black/60 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold border border-neutral-200 dark:border-white/10">
            {gender}
          </div>
        </div>
      </div>

      {/* Controls Panel */}
      <div className="w-full md:w-[400px] bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-l border-neutral-200 dark:border-neutral-800 flex flex-col h-full">

        {/* Tabs */}
        <div className="flex p-3 gap-1.5 border-b border-neutral-200 dark:border-neutral-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex flex-col items-center gap-1 transition-all ${
                activeTab === tab.id
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-black shadow-md"
                  : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-7 custom-scrollbar">

          {/* ── BODY TAB ── */}
          {activeTab === "body" && (
            <div className="space-y-7 animate-in fade-in slide-in-from-right-4 duration-300">

              {/* Gender */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Género</label>
                <div className="grid grid-cols-2 gap-2">
                  {["Hombre", "Mujer"].map((g) => (
                    <button key={g} onClick={() => setGender(g)}
                      className={getSelectBtnClass(gender === g)}
                    >{g}</button>
                  ))}
                </div>
              </div>

              {/* Muscle Definition */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Definición Muscular</label>
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400">{Math.round(muscleDefinition * 100)}%</span>
                </div>
                <input type="range" min="0" max="100" value={Math.round(muscleDefinition * 100)}
                  onChange={(e) => setMuscleDefinition(parseInt(e.target.value) / 100)}
                  className={commonSliderClass}
                />
              </div>

              {/* Height */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Altura</label>
                  <span className="text-lg font-black text-blue-600 dark:text-blue-400">{heightCm} cm</span>
                </div>
                <input type="range" min="140" max="210" value={heightCm}
                  onChange={(e) => setHeightCm(parseInt(e.target.value))}
                  className={commonSliderClass}
                />
              </div>

              {/* Skin tone */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Tono de Piel</label>
                </div>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" min="0" max="100" defaultValue="20"
                    onChange={(e) => {
                      // Espectro de piel realista: de muy pálido a muy oscuro
                      // HSL(30, 80%, 90%) -> pálido rosado
                      // HSL(20, 50%, 15%) -> muy oscuro
                      const val = parseInt(e.target.value);
                      const hue = 30 - (val / 100) * 10;
                      const sat = 80 - (val / 100) * 30;
                      const lit = 90 - (val / 100) * 75;
                      setSkinColor(`hsl(${hue}, ${sat}%, ${lit}%)`);
                    }}
                    className="w-full h-4 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    style={{ background: 'linear-gradient(to right, hsl(30, 80%, 90%), hsl(25, 65%, 52%), hsl(20, 50%, 15%))' }}
                  />
                  <div className="w-10 h-10 shrink-0 rounded-full border-2 border-neutral-200 dark:border-neutral-700 shadow-sm" style={{ backgroundColor: skinColor }}></div>
                </div>
              </div>
              
              {/* Advanced Morphs */}
              <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2"><Dumbbell className="w-4 h-4"/> Ajustes Precisos</label>
                
                {[
                  { label: "Grosor de Pecho", value: chestWidth, setter: setChestWidth, min: 0.7, max: 1.5, step: 0.05 },
                  ...(gender === "Mujer" ? [{ label: "Tamaño de Busto", value: breastSize, setter: setBreastSize, min: 0.5, max: 1.10, step: 0.05 }] : []),
                  { label: "Ancho Abdominal", value: bellyWidth, setter: setBellyWidth, min: 0.7, max: 1.2, step: 0.05 },
                  { label: "Prominencia Abdominal", value: bellyDepth, setter: setBellyDepth, min: 0.7, max: 1.5, step: 0.05 },
                  { label: "Ancho de Caderas", value: hipWidth, setter: setHipWidth, min: 0.7, max: 1.4, step: 0.05 },
                  { label: "Grosor de Brazos", value: armThickness, setter: setArmThickness, min: 0.7, max: 1.5, step: 0.05 },
                  { label: "Grosor de Piernas", value: legThickness, setter: setLegThickness, min: 0.7, max: 1.25, step: 0.05 },
                  { label: "Grosor de Cuello", value: neckThickness, setter: setNeckThickness, min: 0.7, max: 1.5, step: 0.05 },
                ].map((morph) => (
                  <div key={morph.label} className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{morph.label}</span>
                      <span className="text-xs text-neutral-400">{morph.value.toFixed(2)}x</span>
                    </div>
                    <input 
                      type="range" 
                      min={morph.min} max={morph.max} step={morph.step} 
                      value={morph.value} 
                      onChange={(e) => morph.setter(parseFloat(e.target.value))}
                      className={commonSliderClass}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── STYLE TAB ── */}
          {activeTab === "style" && (
            <div className="space-y-7 animate-in fade-in slide-in-from-right-4 duration-300">

              {/* Hair Style */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2"><Scissors className="w-4 h-4"/> Peinado</label>
                <div className="grid grid-cols-2 gap-2">
                  {hairStyles.map((s) => (
                    <button key={s} onClick={() => setHairStyle(s)}
                      className={getSelectBtnClass(hairStyle === s)}
                    >{s}</button>
                  ))}
                </div>
              </div>

              {/* Hair Color */}
              <div className={`space-y-3 transition-opacity ${hairStyle === "Calvo" ? "opacity-30 pointer-events-none" : ""}`}>
                <div className="flex justify-between items-end">
                  <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Color de Cabello</label>
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
                <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Cejas</label>
                <div className="grid grid-cols-3 gap-2">
                  {eyebrowStyles.map((s) => (
                    <button key={s} onClick={() => setEyebrowStyle(s)}
                      className={getSelectBtnClass(eyebrowStyle === s)}
                    >{s}</button>
                  ))}
                </div>
              </div>
              {/* ── CLOTHES SECTION ── */}
              

              {/* Shirt Color */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Color de Camiseta</label>
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
                  <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">Calzado</label>
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
                <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Estilo de Prenda Superior</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {shirtSleeves.map((s) => (
                    <button key={s} onClick={() => setShirtSleeve(s)}
                      className={getSelectBtnClass(shirtSleeve === s)}
                    >{s}</button>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="p-5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <button
            onClick={handleSave}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-sm"
          >
            Guardar Gemelo Digital →
          </button>
        </div>
      </div>
    </div>
  );
}

