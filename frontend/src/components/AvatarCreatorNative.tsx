"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";

interface AvatarCreatorNativeProps {
  onAvatarExported: (url: string, skinColor: string, height: number, weight: number, shirtColor: string, shoesColor: string, hairStyle: string, hairColor: string) => void;
  initialSkinColor?: string;
  initialHeight?: number;
  initialWeight?: number;
  initialShirtColor?: string;
  initialShoesColor?: string;
  initialHairStyle?: string;
  initialHairColor?: string;
}

// A highly abstracted parametric humanoid built with primitive meshes
function ParametricMannequin({ skinColor, shirtColor, shoesColor, hairStyle, hairColor, scaleY, scaleXZ }: { skinColor: string, shirtColor: string, shoesColor: string, hairStyle: string, hairColor: string, scaleY: number, scaleXZ: number }) {
  // scaleY adjusts height
  // scaleXZ adjusts thickness (weight)
  
  return (
    <group scale={[scaleXZ, scaleY, scaleXZ]} position={[0, 0.5, 0]}>
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

export function AvatarCreatorNative({ 
  onAvatarExported,
  initialSkinColor = "#f1c27d",
  initialHeight = 170,
  initialWeight = 70,
  initialShirtColor = "#ffffff",
  initialShoesColor = "#000000",
  initialHairStyle = "Short",
  initialHairColor = "#000000"
}: AvatarCreatorNativeProps) {
  const [skinColor, setSkinColor] = useState(initialSkinColor);
  const [heightCm, setHeightCm] = useState(initialHeight);
  const [weightKg, setWeightKg] = useState(initialWeight);
  const [shirtColor, setShirtColor] = useState(initialShirtColor);
  const [shoesColor, setShoesColor] = useState(initialShoesColor);
  const [hairStyle, setHairStyle] = useState(initialHairStyle);
  const [hairColor, setHairColor] = useState(initialHairColor);

  // Math mappings for parametric mutation
  // Base model is assumed to be 170cm, 70kg = scale 1.0
  const scaleY = heightCm / 170.0;
  // Weight adds thickness
  const scaleXZ = Math.pow(weightKg / 70.0, 0.5); 

  const skinTones = [
    { name: "Light", hex: "#f1c27d" },
    { name: "Medium Light", hex: "#e0ac69" },
    { name: "Medium", hex: "#c68642" },
    { name: "Medium Dark", hex: "#8d5524" },
    { name: "Dark", hex: "#3d2210" },
  ];

  const shirtColors = [
    { name: "White", hex: "#ffffff" },
    { name: "Black", hex: "#1a1a1a" },
    { name: "Navy", hex: "#0a192f" },
    { name: "Crimson", hex: "#8b0000" },
    { name: "Olive", hex: "#556b2f" },
  ];

  const shoesColors = [
    { name: "Black Leather", hex: "#000000" },
    { name: "White Sneaker", hex: "#f0f0f0" },
    { name: "Brown", hex: "#5c4033" },
    { name: "Red", hex: "#a52a2a" },
  ];

  const hairColors = [
    { name: "Black", hex: "#000000" },
    { name: "Brown", hex: "#4a3018" },
    { name: "Blonde", hex: "#e6cca3" },
    { name: "Red", hex: "#8a2b0e" },
    { name: "Gray", hex: "#808080" },
  ];

  const hairStyles = ["Bald", "Short", "Long", "Bun"];

  const handleSave = () => {
    onAvatarExported("parametric", skinColor, heightCm, weightKg, shirtColor, shoesColor, hairStyle, hairColor);
  };

  return (
    <div className="flex flex-col md:flex-row w-full h-[600px] rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-inner">
      
      {/* 3D Canvas Viewport */}
      <div className="flex-1 relative cursor-grab active:cursor-grabbing">
        <Canvas camera={{ position: [0, 1.5, 3], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <Environment preset="studio" />
          
          <ParametricMannequin 
            skinColor={skinColor} 
            shirtColor={shirtColor}
            shoesColor={shoesColor}
            hairStyle={hairStyle}
            hairColor={hairColor}
            scaleY={scaleY} 
            scaleXZ={scaleXZ} 
          />
          
          <OrbitControls 
            enablePan={false} 
            minPolarAngle={Math.PI / 4} 
            maxPolarAngle={Math.PI / 1.5} 
            minDistance={2} 
            maxDistance={5} 
            target={[0, 1, 0]}
          />
        </Canvas>
        
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium text-white flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          Native 3D Engine
        </div>
      </div>
      
      {/* Controls Panel */}
      <div className="w-full md:w-80 bg-white dark:bg-neutral-950 p-6 flex flex-col gap-6 border-l border-neutral-200 dark:border-neutral-800 overflow-y-auto">
        <h3 className="text-xl font-bold">Customize Avatar</h3>
        
        {/* Height Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Height (cm)</label>
            <span className="text-sm font-bold">{heightCm}</span>
          </div>
          <input 
            type="range" 
            min="140" 
            max="210" 
            value={heightCm}
            onChange={(e) => setHeightCm(parseInt(e.target.value))}
            className="w-full accent-black dark:accent-white"
          />
        </div>
        
        {/* Weight Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Weight (kg)</label>
            <span className="text-sm font-bold">{weightKg}</span>
          </div>
          <input 
            type="range" 
            min="40" 
            max="140" 
            value={weightKg}
            onChange={(e) => setWeightKg(parseInt(e.target.value))}
            className="w-full accent-black dark:accent-white"
          />
        </div>
        
        {/* Skin Tone Selector */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Skin Tone</label>
          <div className="flex gap-2">
            {skinTones.map((tone) => (
              <button
                key={tone.hex}
                onClick={() => setSkinColor(tone.hex)}
                className={`w-8 h-8 rounded-full shadow-sm transition-transform ${skinColor === tone.hex ? 'scale-125 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-neutral-950' : 'hover:scale-110'}`}
                style={{ backgroundColor: tone.hex }}
                title={tone.name}
              />
            ))}
          </div>
        </div>

        {/* Hair Style Selector */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Hair Style</label>
          <div className="grid grid-cols-2 gap-2">
            {hairStyles.map((style) => (
              <button
                key={style}
                onClick={() => setHairStyle(style)}
                className={`py-1.5 px-3 text-sm font-medium rounded-lg border transition-all ${hairStyle === style ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white' : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Hair Color Selector */}
        {hairStyle !== "Bald" && (
          <div className="space-y-3">
            <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Hair Color</label>
            <div className="flex gap-2">
              {hairColors.map((tone) => (
                <button
                  key={tone.hex}
                  onClick={() => setHairColor(tone.hex)}
                  className={`w-8 h-8 rounded-full shadow-sm border border-neutral-200 dark:border-neutral-700 transition-transform ${hairColor === tone.hex ? 'scale-125 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-neutral-950' : 'hover:scale-110'}`}
                  style={{ backgroundColor: tone.hex }}
                  title={tone.name}
                />
              ))}
            </div>
          </div>
        )}

        {/* Shirt Color Selector */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Shirt Color</label>
          <div className="flex gap-2">
            {shirtColors.map((tone) => (
              <button
                key={tone.hex}
                onClick={() => setShirtColor(tone.hex)}
                className={`w-8 h-8 rounded-full shadow-sm border border-neutral-200 dark:border-neutral-700 transition-transform ${shirtColor === tone.hex ? 'scale-125 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-neutral-950' : 'hover:scale-110'}`}
                style={{ backgroundColor: tone.hex }}
                title={tone.name}
              />
            ))}
          </div>
        </div>

        {/* Shoes Color Selector */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Shoes Color</label>
          <div className="flex gap-2">
            {shoesColors.map((tone) => (
              <button
                key={tone.hex}
                onClick={() => setShoesColor(tone.hex)}
                className={`w-8 h-8 rounded-full shadow-sm border border-neutral-200 dark:border-neutral-700 transition-transform ${shoesColor === tone.hex ? 'scale-125 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-neutral-950' : 'hover:scale-110'}`}
                style={{ backgroundColor: tone.hex }}
                title={tone.name}
              />
            ))}
          </div>
        </div>
        
        <div className="mt-auto pt-6 border-t border-neutral-200 dark:border-neutral-800">
          <button 
            onClick={handleSave}
            className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl transition-all active:scale-95 shadow-lg"
          >
            Save Avatar
          </button>
        </div>
      </div>

    </div>
  );
}
