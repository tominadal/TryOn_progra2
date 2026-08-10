"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, useTexture } from "@react-three/drei";
import { User, Palette, Shirt, Check, Glasses } from "lucide-react";
import * as THREE from "three";

interface AvatarCreatorNativeProps {
  onAvatarExported: (url: string, skinColor: string, height: number, weight: number, shirtColor: string, shoesColor: string, hairStyle: string, hairColor: string, gender: string, glasses: boolean) => void;
  initialSkinColor?: string;
  initialHeight?: number;
  initialWeight?: number;
  initialShirtColor?: string;
  initialShoesColor?: string;
  initialHairStyle?: string;
  initialHairColor?: string;
  initialGender?: string;
  initialGlasses?: boolean;
}

// A high-quality Parametric Humanoid built with smooth capsules and spheres (Premium Look)
export function ParametricMannequin({ 
  skinColor, shirtColor, pantsColor, shoesColor, hairStyle, hairColor, scaleY, scaleXZ, gender, glasses, pantsFit = "Regular"
}: { 
  skinColor: string, shirtColor: string, pantsColor?: string, shoesColor: string, hairStyle: string, hairColor: string, scaleY: number, scaleXZ: number, gender: string, glasses?: boolean, pantsFit?: string
}) {
  // Load textures
  const [cottonTex, leatherTex] = useTexture(['/textures/cotton.png', '/textures/leather.png']);
  
  // Set texture properties for seamless wrap
  [cottonTex, leatherTex].forEach(tex => {
    if(tex) {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 2);
    }
  });

  // Premium materials
  const skinMaterial = { color: skinColor, roughness: 0.4, metalness: 0.1 };
  const shirtMaterial = { color: shirtColor, map: cottonTex, roughness: 0.9, metalness: 0.0 };
  const pantsMaterial = { color: pantsColor || "#1e3a8a", map: cottonTex, roughness: 0.9, metalness: 0.0 }; // Default denim blue
  const shoeMaterial = { color: shoesColor, map: leatherTex, roughness: 0.5, metalness: 0.2 };
  const hairMaterial = { color: hairColor, roughness: 0.8, metalness: 0.2 };
  const glassMaterial = { color: "#222222", roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.5 };
  const frameMaterial = { color: "#111111", roughness: 0.3, metalness: 0.8 };

  const isFemale = gender === "Mujer";

  // Fit Modifiers
  let thighRadiusMod = 0;
  let calfRadiusMod = 0;
  let hipRadiusMod = 0;
  if (pantsFit === "Skinny") {
    thighRadiusMod = -0.01;
    calfRadiusMod = -0.01;
  } else if (pantsFit === "Wide Leg" || pantsFit === "Relaxed") {
    thighRadiusMod = 0.02;
    calfRadiusMod = 0.035;
  } else if (pantsFit === "Mom Fit") {
    hipRadiusMod = 0.02;
    thighRadiusMod = 0.015;
    calfRadiusMod = 0;
  }

  // Female proportions tweaks
  const chestRadius = isFemale ? 0.15 : 0.18;
  const waistRadius = isFemale ? 0.13 : 0.16;
  const hipRadiusBase = isFemale ? 0.18 : 0.16;
  const shoulderX = isFemale ? 0.14 : 0.16;
  const breastSize = isFemale ? 0.075 : 0;
  
  const finalHipRadius = hipRadiusBase + hipRadiusMod;

  return (
    <group scale={[scaleXZ, scaleY, scaleXZ]} position={[0, -0.9, 0]}>
      {/* Head */}
      <group position={[0, 1.72, 0]}>
        <mesh>
          <sphereGeometry args={[isFemale ? 0.125 : 0.13, 32, 32]} />
          <meshStandardMaterial {...skinMaterial} />
        </mesh>
        
        {/* Glasses */}
        {glasses && (
          <group position={[0, 0.02, 0.13]} scale={[1.3, 1.3, 1.3]}>
            {/* Lenses */}
            <mesh position={[-0.04, 0, 0]}><planeGeometry args={[0.06, 0.04]} /><meshStandardMaterial {...glassMaterial} /></mesh>
            <mesh position={[0.04, 0, 0]}><planeGeometry args={[0.06, 0.04]} /><meshStandardMaterial {...glassMaterial} /></mesh>
            {/* Frames */}
            <mesh position={[-0.04, 0, 0]}><ringGeometry args={[0.025, 0.03, 16]} /><meshStandardMaterial {...frameMaterial} /></mesh>
            <mesh position={[0.04, 0, 0]}><ringGeometry args={[0.025, 0.03, 16]} /><meshStandardMaterial {...frameMaterial} /></mesh>
            {/* Bridge */}
            <mesh position={[0, 0, 0]}><boxGeometry args={[0.02, 0.005, 0.005]} /><meshStandardMaterial {...frameMaterial} /></mesh>
            {/* Temples */}
            <mesh position={[-0.07, 0, -0.05]} rotation={[0, Math.PI/2, 0]}><boxGeometry args={[0.1, 0.005, 0.005]} /><meshStandardMaterial {...frameMaterial} /></mesh>
            <mesh position={[0.07, 0, -0.05]} rotation={[0, Math.PI/2, 0]}><boxGeometry args={[0.1, 0.005, 0.005]} /><meshStandardMaterial {...frameMaterial} /></mesh>
          </group>
        )}

        {/* Hair Styles */}
        {hairStyle === "Corto" && (
          <mesh position={[0, 0.05, -0.02]} scale={[1.05, 0.9, 1.05]}>
            <sphereGeometry args={[isFemale ? 0.135 : 0.14, 32, 16, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
            <meshStandardMaterial {...hairMaterial} />
          </mesh>
        )}
        
        {hairStyle === "Largo" && (
          <group position={[0, 0.05, -0.02]} scale={[1.1, 1, 1.1]}>
            <mesh>
              <sphereGeometry args={[isFemale ? 0.125 : 0.13, 32, 16, 0, Math.PI * 2, 0, Math.PI / 1.5]} />
              <meshStandardMaterial {...hairMaterial} />
            </mesh>
            <mesh position={[0, -0.15, -0.1]}>
              <capsuleGeometry args={[0.1, 0.2, 16, 32]} />
              <meshStandardMaterial {...hairMaterial} />
            </mesh>
          </group>
        )}
        
        {hairStyle === "Recogido" && (
          <group position={[0, 0.05, -0.02]} scale={[1.05, 0.9, 1.05]}>
            <mesh>
              <sphereGeometry args={[isFemale ? 0.135 : 0.14, 32, 16, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
              <meshStandardMaterial {...hairMaterial} />
            </mesh>
            <mesh position={[0, 0.1, -0.1]}>
              <sphereGeometry args={[0.06, 32, 32]} />
              <meshStandardMaterial {...hairMaterial} />
            </mesh>
          </group>
        )}
      </group>
      
      {/* Neck */}
      <mesh position={[0, 1.58, 0]}>
        <cylinderGeometry args={[isFemale ? 0.04 : 0.05, isFemale ? 0.05 : 0.06, 0.15, 32]} />
        <meshStandardMaterial {...skinMaterial} />
      </mesh>
      
      {/* Torso */}
      <group position={[0, 1.18, 0]}>
        {/* Chest */}
        <mesh position={[0, 0.15, 0]}>
          <capsuleGeometry args={[chestRadius, 0.15, 32, 32]} />
          <meshStandardMaterial {...shirtMaterial} />
        </mesh>
        {/* Breasts if female */}
        {isFemale && (
          <group position={[0, 0.14, 0.13]}>
            <mesh position={[-0.07, 0, 0]} rotation={[0.3, -0.1, 0]}><sphereGeometry args={[breastSize, 32, 32]} /><meshStandardMaterial {...shirtMaterial} /></mesh>
            <mesh position={[0.07, 0, 0]} rotation={[0.3, 0.1, 0]}><sphereGeometry args={[breastSize, 32, 32]} /><meshStandardMaterial {...shirtMaterial} /></mesh>
          </group>
        )}
        {/* Abdomen */}
        <mesh position={[0, -0.1, 0]}>
          <capsuleGeometry args={[waistRadius, 0.15, 32, 32]} />
          <meshStandardMaterial {...shirtMaterial} />
        </mesh>
      </group>
      
      {/* Left Arm (Hierarchical) */}
      <group position={[-shoulderX, 1.40, 0]}>
        {/* Shoulder Joint */}
        <mesh><sphereGeometry args={[isFemale ? 0.045 : 0.055, 32, 32]} /><meshStandardMaterial {...shirtMaterial} /></mesh>
        
        {/* Arm Assembly (rotates as one) */}
        <group rotation={[0, 0, -0.3]}>
          {/* Upper Arm Sleeve */}
          <mesh position={[0, -0.12, 0]}>
            <capsuleGeometry args={[isFemale ? 0.04 : 0.05, 0.18, 16, 32]} />
            <meshStandardMaterial {...shirtMaterial} />
          </mesh>
          
          {/* Forearm (rotates relative to upper arm) */}
          <group position={[0, -0.25, 0]} rotation={[-0.1, 0, -0.05]}>
            {/* Elbow Joint (optional smoothing) */}
            <mesh position={[0, 0, 0]}><sphereGeometry args={[isFemale ? 0.035 : 0.045, 32, 32]} /><meshStandardMaterial {...skinMaterial} /></mesh>
            {/* Forearm Bone */}
            <mesh position={[0, -0.11, 0]}>
              <capsuleGeometry args={[isFemale ? 0.035 : 0.045, 0.22, 16, 32]} />
              <meshStandardMaterial {...skinMaterial} />
            </mesh>
            {/* Hand */}
            <mesh position={[0, -0.27, 0]}>
              <sphereGeometry args={[isFemale ? 0.035 : 0.045, 32, 32]} />
              <meshStandardMaterial {...skinMaterial} />
            </mesh>
          </group>
        </group>
      </group>
      
      {/* Right Arm (Hierarchical) */}
      <group position={[shoulderX, 1.40, 0]}>
        {/* Shoulder Joint */}
        <mesh><sphereGeometry args={[isFemale ? 0.045 : 0.055, 32, 32]} /><meshStandardMaterial {...shirtMaterial} /></mesh>
        
        {/* Arm Assembly (rotates as one) */}
        <group rotation={[0, 0, 0.3]}>
          {/* Upper Arm Sleeve */}
          <mesh position={[0, -0.12, 0]}>
            <capsuleGeometry args={[isFemale ? 0.04 : 0.05, 0.18, 16, 32]} />
            <meshStandardMaterial {...shirtMaterial} />
          </mesh>
          
          {/* Forearm (rotates relative to upper arm) */}
          <group position={[0, -0.25, 0]} rotation={[-0.1, 0, 0.05]}>
            {/* Elbow Joint (optional smoothing) */}
            <mesh position={[0, 0, 0]}><sphereGeometry args={[isFemale ? 0.035 : 0.045, 32, 32]} /><meshStandardMaterial {...skinMaterial} /></mesh>
            {/* Forearm Bone */}
            <mesh position={[0, -0.11, 0]}>
              <capsuleGeometry args={[isFemale ? 0.035 : 0.045, 0.22, 16, 32]} />
              <meshStandardMaterial {...skinMaterial} />
            </mesh>
            {/* Hand */}
            <mesh position={[0, -0.27, 0]}>
              <sphereGeometry args={[isFemale ? 0.035 : 0.045, 32, 32]} />
              <meshStandardMaterial {...skinMaterial} />
            </mesh>
          </group>
        </group>
      </group>
      
      {/* Hips / Pelvis (Pants Base) */}
      <mesh position={[0, 0.85, 0]}>
         <sphereGeometry args={[finalHipRadius, 32, 32]} />
         <meshStandardMaterial {...pantsMaterial} />
      </mesh>

      {/* Left Leg */}
      <group position={[isFemale ? -0.10 : -0.09, 0.82, 0]}>
        {/* Thigh */}
        <mesh position={[0, -0.22, 0]}>
          <capsuleGeometry args={[(isFemale ? 0.07 : 0.065) + thighRadiusMod, 0.26, 16, 32]} />
          <meshStandardMaterial {...pantsMaterial} />
        </mesh>
        {/* Knee */}
        <mesh position={[0, -0.42, 0.02]}><sphereGeometry args={[(isFemale ? 0.05 : 0.055) + thighRadiusMod, 32, 32]} /><meshStandardMaterial {...pantsMaterial} /></mesh>
        {/* Calf */}
        <mesh position={[0, -0.62, 0]}>
          <capsuleGeometry args={[(isFemale ? 0.045 : 0.05) + calfRadiusMod, 0.26, 16, 32]} />
          <meshStandardMaterial {...pantsMaterial} />
        </mesh>
        {/* Shoe */}
        <mesh position={[0, -0.84, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[isFemale ? 0.045 : 0.055, 0.13, 16, 32]} />
          <meshStandardMaterial {...shoeMaterial} />
        </mesh>
      </group>
      
      {/* Right Leg */}
      <group position={[isFemale ? 0.10 : 0.09, 0.82, 0]}>
        {/* Thigh */}
        <mesh position={[0, -0.22, 0]}>
          <capsuleGeometry args={[(isFemale ? 0.07 : 0.065) + thighRadiusMod, 0.26, 16, 32]} />
          <meshStandardMaterial {...pantsMaterial} />
        </mesh>
        {/* Knee */}
        <mesh position={[0, -0.42, 0.02]}><sphereGeometry args={[(isFemale ? 0.05 : 0.055) + thighRadiusMod, 32, 32]} /><meshStandardMaterial {...pantsMaterial} /></mesh>
        {/* Calf */}
        <mesh position={[0, -0.62, 0]}>
          <capsuleGeometry args={[(isFemale ? 0.045 : 0.05) + calfRadiusMod, 0.26, 16, 32]} />
          <meshStandardMaterial {...pantsMaterial} />
        </mesh>
        {/* Shoe */}
        <mesh position={[0, -0.84, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[isFemale ? 0.045 : 0.055, 0.13, 16, 32]} />
          <meshStandardMaterial {...shoeMaterial} />
        </mesh>
      </group>
    </group>
  );
}

export function AvatarCreatorNative({ 
  onAvatarExported,
  initialSkinColor = "#f1c27d",
  initialHeight = 170,
  initialWeight = 70,
  initialShirtColor = "#ffffff",
  initialShoesColor = "#000000",
  initialHairStyle = "Corto",
  initialHairColor = "#000000",
  initialGender = "Hombre",
  initialGlasses = false
}: AvatarCreatorNativeProps) {
  const [activeTab, setActiveTab] = useState<"body" | "style" | "clothes">("body");
  const [skinColor, setSkinColor] = useState(initialSkinColor);
  const [heightCm, setHeightCm] = useState(initialHeight);
  const [weightKg, setWeightKg] = useState(initialWeight);
  const [shirtColor, setShirtColor] = useState(initialShirtColor);
  const [shoesColor, setShoesColor] = useState(initialShoesColor);
  const [hairStyle, setHairStyle] = useState(initialHairStyle);
  const [hairColor, setHairColor] = useState(initialHairColor);
  const [gender, setGender] = useState(initialGender);
  const [glasses, setGlasses] = useState(initialGlasses);

  const scaleY = heightCm / 170.0;
  const scaleXZ = Math.pow(weightKg / 70.0, 0.5); 

  const skinTones = [
    { name: "Claro", hex: "#f1c27d" },
    { name: "Medio Claro", hex: "#e0ac69" },
    { name: "Medio", hex: "#c68642" },
    { name: "Medio Oscuro", hex: "#8d5524" },
    { name: "Oscuro", hex: "#3d2210" },
  ];

  const shirtColors = [
    { name: "Blanco", hex: "#ffffff" },
    { name: "Negro", hex: "#1a1a1a" },
    { name: "Azul Marino", hex: "#0a192f" },
    { name: "Carmesí", hex: "#8b0000" },
    { name: "Oliva", hex: "#556b2f" },
  ];

  const shoesColors = [
    { name: "Cuero Negro", hex: "#000000" },
    { name: "Zapatilla Blanca", hex: "#f0f0f0" },
    { name: "Marrón", hex: "#5c4033" },
    { name: "Rojo", hex: "#a52a2a" },
  ];

  const hairColors = [
    { name: "Negro", hex: "#000000" },
    { name: "Castaño", hex: "#4a3018" },
    { name: "Rubio", hex: "#e6cca3" },
    { name: "Pelirrojo", hex: "#8a2b0e" },
    { name: "Gris", hex: "#808080" },
  ];

  const hairStyles = ["Calvo", "Corto", "Largo", "Recogido"];

  const handleSave = () => {
    onAvatarExported("parametric", skinColor, heightCm, weightKg, shirtColor, shoesColor, hairStyle, hairColor, gender, glasses);
  };

  return (
    <div className="flex flex-col md:flex-row w-full h-[700px] rounded-3xl overflow-hidden bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-2xl">
      
      {/* 3D Canvas Viewport */}
      <div className="flex-1 relative cursor-grab active:cursor-grabbing bg-gradient-to-b from-neutral-200/50 to-neutral-50 dark:from-neutral-900/50 dark:to-neutral-950">
        <Canvas camera={{ position: [0, 1.2, 3.5], fov: 45 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
          <directionalLight position={[-5, 5, -5]} intensity={0.5} />
          <Environment preset="studio" />
          
          <ParametricMannequin 
            skinColor={skinColor} 
            shirtColor={shirtColor}
            shoesColor={shoesColor}
            hairStyle={hairStyle}
            hairColor={hairColor}
            gender={gender}
            glasses={glasses}
            scaleY={scaleY} 
            scaleXZ={scaleXZ} 
          />
          <ContactShadows position={[0, -0.9, 0]} opacity={0.4} scale={5} blur={2} far={4} />
          
          <OrbitControls 
            enablePan={false} 
            minPolarAngle={Math.PI / 4} 
            maxPolarAngle={Math.PI / 1.5} 
            minDistance={2.5} 
            maxDistance={6} 
            target={[0, 0.5, 0]}
          />
        </Canvas>
        
        <div className="absolute top-6 left-6 bg-white/80 dark:bg-black/50 backdrop-blur-md px-4 py-2 rounded-full text-xs font-medium border border-neutral-200 dark:border-white/10 flex items-center gap-2 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          Motor de Maniquí Inteligente
        </div>
      </div>
      
      {/* Premium Glassmorphism Controls Panel */}
      <div className="w-full md:w-[400px] bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border-l border-neutral-200 dark:border-neutral-800 flex flex-col h-full relative z-10">
        
        {/* Header Tabs */}
        <div className="flex p-4 gap-2 border-b border-neutral-200 dark:border-neutral-800">
          <button 
            onClick={() => setActiveTab("body")}
            className={`flex-1 py-3 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${activeTab === 'body' ? 'bg-black text-white dark:bg-white dark:text-black shadow-md' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
          >
            <User className="w-4 h-4" /> Cuerpo
          </button>
          <button 
            onClick={() => setActiveTab("style")}
            className={`flex-1 py-3 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${activeTab === 'style' ? 'bg-black text-white dark:bg-white dark:text-black shadow-md' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
          >
            <Palette className="w-4 h-4" /> Cabeza
          </button>
          <button 
            onClick={() => setActiveTab("clothes")}
            className={`flex-1 py-3 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${activeTab === 'clothes' ? 'bg-black text-white dark:bg-white dark:text-black shadow-md' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
          >
            <Shirt className="w-4 h-4" /> Ropa
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {activeTab === "body" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              
              {/* Gender */}
              <div className="space-y-4">
                <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200 block">Género</label>
                <div className="grid grid-cols-2 gap-3">
                  {["Hombre", "Mujer"].map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={`py-3 px-4 text-sm font-bold rounded-xl border-2 transition-all ${gender === g ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-600 text-blue-700 dark:text-blue-400 shadow-sm' : 'bg-transparent border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Height */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Altura</label>
                  <span className="text-lg font-black text-blue-600 dark:text-blue-400">{heightCm} cm</span>
                </div>
                <input 
                  type="range" min="140" max="210" value={heightCm}
                  onChange={(e) => setHeightCm(parseInt(e.target.value))}
                  className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
              
              {/* Weight */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Peso</label>
                  <span className="text-lg font-black text-blue-600 dark:text-blue-400">{weightKg} kg</span>
                </div>
                <input 
                  type="range" min="40" max="140" value={weightKg}
                  onChange={(e) => setWeightKg(parseInt(e.target.value))}
                  className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Skin Tone */}
              <div className="space-y-4">
                <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200 block">Tono de Piel</label>
                <div className="flex gap-3">
                  {skinTones.map((tone) => (
                    <button
                      key={tone.hex}
                      onClick={() => setSkinColor(tone.hex)}
                      className={`relative w-12 h-12 rounded-full shadow-sm transition-all flex items-center justify-center ${skinColor === tone.hex ? 'scale-110 ring-4 ring-blue-500/30' : 'hover:scale-105'}`}
                      style={{ backgroundColor: tone.hex }}
                      title={tone.name}
                    >
                      {skinColor === tone.hex && <Check className="w-5 h-5 text-white/80 mix-blend-difference" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "style" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              
              {/* Glasses */}
              <div className="space-y-4">
                <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                  <Glasses className="w-4 h-4" /> Gafas
                </label>
                <div className="flex gap-4">
                  <button onClick={() => setGlasses(true)} className={`flex-1 py-2 font-bold rounded-xl border-2 transition-all ${glasses ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-600 text-blue-700' : 'border-neutral-200 text-neutral-600'}`}>Sí</button>
                  <button onClick={() => setGlasses(false)} className={`flex-1 py-2 font-bold rounded-xl border-2 transition-all ${!glasses ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-600 text-blue-700' : 'border-neutral-200 text-neutral-600'}`}>No</button>
                </div>
              </div>

              {/* Hair Style */}
              <div className="space-y-4">
                <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200 block">Estilo de Peinado</label>
                <div className="grid grid-cols-2 gap-3">
                  {hairStyles.map((style) => (
                    <button
                      key={style}
                      onClick={() => setHairStyle(style)}
                      className={`py-3 px-4 text-sm font-bold rounded-xl border-2 transition-all ${hairStyle === style ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-600 text-blue-700 dark:text-blue-400 shadow-sm' : 'bg-transparent border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'}`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hair Color */}
              <div className={`space-y-4 transition-opacity duration-300 ${hairStyle === "Calvo" ? "opacity-30 pointer-events-none" : "opacity-100"}`}>
                <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200 block">Color de Cabello</label>
                <div className="flex gap-3">
                  {hairColors.map((tone) => (
                    <button
                      key={tone.hex}
                      onClick={() => setHairColor(tone.hex)}
                      className={`relative w-12 h-12 rounded-full shadow-sm border border-neutral-200 dark:border-neutral-700 transition-all flex items-center justify-center ${hairColor === tone.hex ? 'scale-110 ring-4 ring-blue-500/30' : 'hover:scale-105'}`}
                      style={{ backgroundColor: tone.hex }}
                      title={tone.name}
                    >
                      {hairColor === tone.hex && <Check className="w-5 h-5 text-white/80 mix-blend-difference" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "clothes" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Shirt Color */}
              <div className="space-y-4">
                <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200 block">Color de Camiseta</label>
                <div className="flex gap-3">
                  {shirtColors.map((tone) => (
                    <button
                      key={tone.hex}
                      onClick={() => setShirtColor(tone.hex)}
                      className={`relative w-12 h-12 rounded-full shadow-sm border border-neutral-200 dark:border-neutral-700 transition-all flex items-center justify-center ${shirtColor === tone.hex ? 'scale-110 ring-4 ring-blue-500/30' : 'hover:scale-105'}`}
                      style={{ backgroundColor: tone.hex }}
                      title={tone.name}
                    >
                       {shirtColor === tone.hex && <Check className="w-5 h-5 text-white/80 mix-blend-difference" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shoes Color */}
              <div className="space-y-4">
                <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200 block">Color de Zapatos</label>
                <div className="flex gap-3">
                  {shoesColors.map((tone) => (
                    <button
                      key={tone.hex}
                      onClick={() => setShoesColor(tone.hex)}
                      className={`relative w-12 h-12 rounded-full shadow-sm border border-neutral-200 dark:border-neutral-700 transition-all flex items-center justify-center ${shoesColor === tone.hex ? 'scale-110 ring-4 ring-blue-500/30' : 'hover:scale-105'}`}
                      style={{ backgroundColor: tone.hex }}
                      title={tone.name}
                    >
                       {shoesColor === tone.hex && <Check className="w-5 h-5 text-white/80 mix-blend-difference" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <button 
            onClick={handleSave}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
          >
            Guardar Gemelo Digital
          </button>
        </div>
      </div>
    </div>
  );
}
