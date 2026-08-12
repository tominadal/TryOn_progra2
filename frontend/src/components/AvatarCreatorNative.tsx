"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, useTexture } from "@react-three/drei";
import { User, Palette, Shirt, Check, Glasses, Smile, Sparkles, Scissors, PenTool, Accessibility } from "lucide-react";
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
    glasses: boolean,
    bodyType?: string,
    muscleDefinition?: number,
    beardStyle?: string,
    beardColor?: string,
    eyebrowStyle?: string,
    hatStyle?: string,
    shirtStyle?: string,
    tattooLeftArm?: boolean,
  ) => void;
  initialSkinColor?: string;
  initialHeight?: number;
  initialWeight?: number;
  initialShirtColor?: string;
  initialShoesColor?: string;
  initialHairStyle?: string;
  initialHairColor?: string;
  initialGender?: string;
  initialGlasses?: boolean;
  initialBodyType?: string;
  initialMuscleDefinition?: number;
  initialBeardStyle?: string;
  initialBeardColor?: string;
  initialEyebrowStyle?: string;
  initialHatStyle?: string;
  initialShirtStyle?: string;
  initialTattooLeftArm?: boolean;
}

// ──────────────────────────────────────────────────────────────────────────────
//  FACE COMPONENT — Detailed realistic face
// ──────────────────────────────────────────────────────────────────────────────
function RealisticFace({ skinColor, isFemale, beardStyle, beardColor, eyebrowStyle }: {
  skinColor: string;
  isFemale: boolean;
  beardStyle: string;
  beardColor: string;
  eyebrowStyle: string;
}) {
  const skinMat = { color: skinColor, roughness: 0.5, metalness: 0.05 };
  const beardMat = { color: beardColor, roughness: 0.9, metalness: 0.0 };
  const eyebrowThick = eyebrowStyle === "Grueso" ? 0.012 : eyebrowStyle === "Fino" ? 0.006 : 0.009;
  const headR = isFemale ? 0.125 : 0.13;

  return (
    <group>
      {/* Main head */}
      <mesh>
        <sphereGeometry args={[headR, 48, 48]} />
        <meshStandardMaterial {...skinMat} />
      </mesh>

      {/* Jawline / Chin — slight protrusion */}
      <mesh position={[0, -headR * 0.7, headR * 0.15]} scale={[0.9, 0.5, 0.8]}>
        <sphereGeometry args={[headR * 0.55, 32, 24]} />
        <meshStandardMaterial {...skinMat} />
      </mesh>

      {/* Cheeks */}
      <mesh position={[-headR * 0.7, -headR * 0.1, headR * 0.4]} scale={[0.7, 0.6, 0.5]}>
        <sphereGeometry args={[headR * 0.45, 24, 24]} />
        <meshStandardMaterial {...skinMat} />
      </mesh>
      <mesh position={[headR * 0.7, -headR * 0.1, headR * 0.4]} scale={[0.7, 0.6, 0.5]}>
        <sphereGeometry args={[headR * 0.45, 24, 24]} />
        <meshStandardMaterial {...skinMat} />
      </mesh>

      {/* Nose */}
      <group position={[0, -headR * 0.15, headR * 0.9]}>
        <mesh scale={[1, 1.4, 1]}>
          <sphereGeometry args={[isFemale ? 0.018 : 0.022, 16, 16]} />
          <meshStandardMaterial {...skinMat} />
        </mesh>
        {/* Nostrils */}
        <mesh position={[-0.016, -0.008, 0.005]}>
          <sphereGeometry args={[0.010, 12, 12]} />
          <meshStandardMaterial {...skinMat} />
        </mesh>
        <mesh position={[0.016, -0.008, 0.005]}>
          <sphereGeometry args={[0.010, 12, 12]} />
          <meshStandardMaterial {...skinMat} />
        </mesh>
        {/* Nasal bridge */}
        <mesh position={[0, 0.025, -0.005]}>
          <capsuleGeometry args={[0.008, 0.035, 8, 16]} />
          <meshStandardMaterial {...skinMat} />
        </mesh>
      </group>

      {/* Eyes — whites + iris */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * headR * 0.38, headR * 0.08, headR * 0.88]}>
          {/* Eye white */}
          <mesh scale={[1.4, 0.9, 0.5]}>
            <sphereGeometry args={[0.022, 24, 24]} />
            <meshStandardMaterial color="#f5f0eb" roughness={0.3} />
          </mesh>
          {/* Iris */}
          <mesh position={[0, 0, 0.012]} scale={[1.1, 1.0, 0.3]}>
            <sphereGeometry args={[0.013, 20, 20]} />
            <meshStandardMaterial color="#3b2507" roughness={0.2} />
          </mesh>
          {/* Pupil */}
          <mesh position={[0, 0, 0.015]} scale={[1.1, 1.0, 0.2]}>
            <sphereGeometry args={[0.007, 16, 16]} />
            <meshStandardMaterial color="#000000" roughness={0.1} />
          </mesh>
          {/* Eyelid top */}
          <mesh position={[0, 0.015, 0.01]} scale={[1.6, 0.5, 0.5]} rotation={[0.3, 0, 0]}>
            <sphereGeometry args={[0.020, 16, 8]} />
            <meshStandardMaterial {...skinMat} />
          </mesh>
        </group>
      ))}

      {/* Eyebrows */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * headR * 0.37, headR * 0.27, headR * 0.86]}
          rotation={[0, 0, side * -0.15]}
          scale={[1, 1, 1]}
        >
          <boxGeometry args={[0.038, eyebrowThick, 0.006]} />
          <meshStandardMaterial color={beardColor} roughness={0.9} />
        </mesh>
      ))}

      {/* Mouth */}
      <group position={[0, -headR * 0.38, headR * 0.90]}>
        {/* Upper lip */}
        <mesh position={[0, 0.006, 0]} scale={[1.8, 0.5, 0.5]}>
          <sphereGeometry args={[0.018, 20, 10]} />
          <meshStandardMaterial color="#c27d6e" roughness={0.6} />
        </mesh>
        {/* Lower lip */}
        <mesh position={[0, -0.009, 0]} scale={[2.0, 0.7, 0.7]}>
          <sphereGeometry args={[0.015, 20, 10]} />
          <meshStandardMaterial color="#c27d6e" roughness={0.6} />
        </mesh>
      </group>

      {/* Ears */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * headR * 0.98, 0, 0]} scale={[0.25, 0.45, 0.35]}>
          <sphereGeometry args={[headR * 0.6, 20, 20]} />
          <meshStandardMaterial {...skinMat} />
        </mesh>
      ))}

      {/* Beard */}
      {beardStyle !== "Ninguna" && !isFemale && (
        <group>
          {/* Stubble / short beard base */}
          <mesh position={[0, -headR * 0.55, headR * 0.72]} scale={[0.9, 0.6, 0.6]}>
            <sphereGeometry args={[headR * 0.65, 24, 24]} />
            <meshStandardMaterial {...beardMat} opacity={beardStyle === "Esbozo" ? 0.5 : 1} transparent={beardStyle === "Esbozo"} />
          </mesh>
          {/* Long beard addition */}
          {(beardStyle === "Larga") && (
            <mesh position={[0, -headR * 1.1, headR * 0.4]}>
              <capsuleGeometry args={[headR * 0.25, headR * 0.6, 12, 24]} />
              <meshStandardMaterial {...beardMat} />
            </mesh>
          )}
          {/* Moustache */}
          {(beardStyle === "Corta" || beardStyle === "Larga") && (
            <mesh position={[0, -headR * 0.28, headR * 0.98]} scale={[1.9, 0.6, 0.4]}>
              <sphereGeometry args={[0.025, 20, 10]} />
              <meshStandardMaterial {...beardMat} />
            </mesh>
          )}
        </group>
      )}
    </group>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
//  HAIR COMPONENT
// ──────────────────────────────────────────────────────────────────────────────
function HairComponent({ hairStyle, hairColor, isFemale }: {
  hairStyle: string; hairColor: string; isFemale: boolean;
}) {
  const mat = { color: hairColor, roughness: 0.85, metalness: 0.05 };
  const r = isFemale ? 0.125 : 0.13;

  if (hairStyle === "Calvo") return null;

  if (hairStyle === "Corto") return (
    <group position={[0, 0.04, -0.01]}>
      <mesh scale={[1.06, 0.85, 1.06]}>
        <sphereGeometry args={[r * 1.05, 32, 16, 0, Math.PI * 2, 0, Math.PI / 1.75]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      {/* Side detail */}
      <mesh position={[-r * 0.95, -r * 0.2, 0]} scale={[0.3, 0.6, 0.7]}>
        <sphereGeometry args={[r * 0.7, 16, 16]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <mesh position={[r * 0.95, -r * 0.2, 0]} scale={[0.3, 0.6, 0.7]}>
        <sphereGeometry args={[r * 0.7, 16, 16]} />
        <meshStandardMaterial {...mat} />
      </mesh>
    </group>
  );

  if (hairStyle === "Largo") return (
    <group position={[0, 0.04, -0.01]}>
      {/* Cap */}
      <mesh scale={[1.08, 0.9, 1.08]}>
        <sphereGeometry args={[r * 1.05, 32, 16, 0, Math.PI * 2, 0, Math.PI / 1.5]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      {/* Long sides + back */}
      <mesh position={[-r * 0.65, -r * 0.9, -r * 0.2]} scale={[0.38, 1, 0.5]}>
        <capsuleGeometry args={[r * 0.8, r * 1.2, 12, 20]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <mesh position={[r * 0.65, -r * 0.9, -r * 0.2]} scale={[0.38, 1, 0.5]}>
        <capsuleGeometry args={[r * 0.8, r * 1.2, 12, 20]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <mesh position={[0, -r * 1.1, -r * 0.5]} scale={[0.7, 1, 0.6]}>
        <capsuleGeometry args={[r * 0.65, r * 1.0, 12, 20]} />
        <meshStandardMaterial {...mat} />
      </mesh>
    </group>
  );

  if (hairStyle === "Recogido") return (
    <group position={[0, 0.04, -0.01]}>
      <mesh scale={[1.06, 0.85, 1.06]}>
        <sphereGeometry args={[r * 1.05, 32, 16, 0, Math.PI * 2, 0, Math.PI / 1.75]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      {/* Bun */}
      <mesh position={[0, r * 1.05, -r * 0.35]}>
        <sphereGeometry args={[r * 0.32, 24, 24]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      {/* Hair band */}
      <mesh position={[0, r * 0.95, -r * 0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[r * 0.3, 0.007, 8, 20]} />
        <meshStandardMaterial color="#222222" roughness={0.8} />
      </mesh>
    </group>
  );

  return null;
}

// ──────────────────────────────────────────────────────────────────────────────
//  HAT COMPONENT
// ──────────────────────────────────────────────────────────────────────────────
function HatComponent({ hatStyle, isFemale }: { hatStyle: string; isFemale: boolean }) {
  const r = isFemale ? 0.125 : 0.13;
  if (hatStyle === "Ninguno") return null;

  if (hatStyle === "Gorra") return (
    <group position={[0, r * 0.85, 0]}>
      {/* Cap dome */}
      <mesh scale={[1.12, 0.7, 1.12]}>
        <sphereGeometry args={[r * 1.1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
      </mesh>
      {/* Visor / brim */}
      <mesh position={[0, -r * 0.35, r * 1.0]} rotation={[-0.3, 0, 0]} scale={[1, 0.12, 0.7]}>
        <cylinderGeometry args={[r * 1.1, r * 1.2, 0.08, 20, 1, false, -Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
      </mesh>
    </group>
  );

  if (hatStyle === "Sombrero") return (
    <group position={[0, r * 0.8, 0]}>
      <mesh scale={[1.15, 1.1, 1.15]}>
        <sphereGeometry args={[r * 1.1, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
        <meshStandardMaterial color="#5c3d11" roughness={0.9} />
      </mesh>
      {/* Wide brim */}
      <mesh position={[0, -r * 0.5, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[r * 2.0, r * 2.0, 0.04, 32]} />
        <meshStandardMaterial color="#5c3d11" roughness={0.9} />
      </mesh>
    </group>
  );

  if (hatStyle === "Headband") return (
    <mesh position={[0, r * 0.3, 0]} rotation={[0.1, 0, 0]}>
      <torusGeometry args={[r * 1.08, 0.025, 12, 40, Math.PI * 1.6]} />
      <meshStandardMaterial color="#e11d48" roughness={0.7} />
    </mesh>
  );

  return null;
}

// ──────────────────────────────────────────────────────────────────────────────
//  TATTOO SLEEVE
// ──────────────────────────────────────────────────────────────────────────────
function TattooSleeve({ isFemale }: { isFemale: boolean }) {
  const r = isFemale ? 0.035 : 0.045;
  return (
    <group>
      {/* Decorative tattoo rings on forearm */}
      {[0, 0.05, 0.10, 0.15].map((offset, i) => (
        <mesh key={i} position={[0, -0.11 - offset, 0]}>
          <torusGeometry args={[r * 1.15, 0.005, 6, 20]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#1a1a2e" : "#4a0e8f"} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
//  SHIRT COMPONENT — Collar/neckline varies by style
// ──────────────────────────────────────────────────────────────────────────────
function ShirtCollars({ shirtStyle, shirtColor, isFemale }: {
  shirtStyle: string; shirtColor: string; isFemale: boolean;
}) {
  const mat = { color: shirtColor, roughness: 0.85 };
  if (shirtStyle === "Polo") return (
    <group position={[0, 0.07, 0.12]}>
      {/* Polo collar */}
      <mesh rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.14, 0.04, 0.04]} />
        <meshStandardMaterial {...mat} />
      </mesh>
    </group>
  );
  if (shirtStyle === "V-Neck") return (
    <group position={[0, 0.16, 0.14]}>
      <mesh rotation={[0.4, 0, 0]}>
        <torusGeometry args={[0.08, 0.015, 8, 3, Math.PI]} />
        <meshStandardMaterial {...mat} />
      </mesh>
    </group>
  );
  return null; // Basic — no collar
}

// ──────────────────────────────────────────────────────────────────────────────
//  MAIN PARAMETRIC MANNEQUIN — High-realism humanoid
// ──────────────────────────────────────────────────────────────────────────────
export function ParametricMannequin({
  skinColor,
  shirtColor,
  pantsColor,
  shoesColor,
  hairStyle,
  hairColor,
  scaleY,
  scaleXZ,
  gender,
  glasses = false,
  pantsFit = "Regular",
  bodyType = "Normal",
  muscleDefinition = 0.3,
  beardStyle = "Ninguna",
  beardColor = "#2d1a0e",
  eyebrowStyle = "Normal",
  hatStyle = "Ninguno",
  shirtStyle = "Basic",
  tattooLeftArm = false,
}: {
  skinColor: string;
  shirtColor: string;
  pantsColor?: string;
  shoesColor: string;
  hairStyle: string;
  hairColor: string;
  scaleY: number;
  scaleXZ: number;
  gender: string;
  glasses?: boolean;
  pantsFit?: string;
  bodyType?: string;
  muscleDefinition?: number;
  beardStyle?: string;
  beardColor?: string;
  eyebrowStyle?: string;
  hatStyle?: string;
  shirtStyle?: string;
  tattooLeftArm?: boolean;
}) {
  const [cottonTex, leatherTex, denimTex] = useTexture([
    "/textures/cotton.png",
    "/textures/leather.png",
    "/textures/denim.png",
  ]);

  [cottonTex, leatherTex, denimTex].forEach((tex) => {
    if (tex) {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 2);
    }
  });

  const skinMat = { color: skinColor, roughness: 0.5, metalness: 0.05 };
  const shirtMat = { color: shirtColor, map: cottonTex, roughness: 0.88, metalness: 0.0 };
  const deniMat = {
    color: pantsColor || "#1e3a8a",
    map: denimTex,
    roughness: 0.82,
    metalness: 0.02,
  };
  const shoeMat = { color: shoesColor, map: leatherTex, roughness: 0.4, metalness: 0.25 };
  const glassMat = { color: "#222222", roughness: 0.05, metalness: 0.9, transparent: true, opacity: 0.45 };
  const frameMat = { color: "#0a0a0a", roughness: 0.2, metalness: 0.9 };

  const isFemale = gender === "Mujer";

  // ── Body type modifiers ──────────────────────────────────────────────────
  const muscFactor = 1 + muscleDefinition * 0.25; // up to 25% bigger muscles
  const bodyFat = bodyType === "Robusto" ? 1.18 : bodyType === "Atlético" ? 1.05 : bodyType === "Delgado" ? 0.88 : 1.0;

  // ── Chest / torso dims ───────────────────────────────────────────────────
  const chestR = isFemale
    ? 0.145 * bodyFat
    : 0.175 * bodyFat * muscFactor;
  const waistR = isFemale ? 0.12 * bodyFat : 0.148 * bodyFat;
  const hipR_base = isFemale ? 0.175 * bodyFat : 0.155 * bodyFat;
  const shoulderX = isFemale ? 0.155 * bodyFat : 0.175 * bodyFat * muscFactor;
  const breastR = isFemale ? 0.07 * bodyFat : 0;

  // ── Pants fit modifiers ──────────────────────────────────────────────────
  let thighMod = 0, calfMod = 0, hipMod = 0, inseamOffset = 0;
  switch (pantsFit) {
    case "Skinny":
      thighMod = -0.015; calfMod = -0.018; break;
    case "Wide Leg":
      thighMod = 0.03; calfMod = 0.038; break;
    case "Relaxed":
      thighMod = 0.02; calfMod = 0.025; break;
    case "Mom Fit":
      hipMod = 0.025; thighMod = 0.012; calfMod = -0.005; break;
    case "Skinny-Mom":
      hipMod = 0.02; thighMod = -0.008; calfMod = -0.015; inseamOffset = 0.02; break;
    case "Bermuda":
      thighMod = 0.01; break;
    case "Flared":
      hipMod = 0.01; thighMod = -0.01; calfMod = -0.015; break;
    case "Skirt":
      hipMod = 0.01; thighMod = -0.01; calfMod = -0.01; break;
  }

  const isBermuda = pantsFit === "Bermuda";
  const isSkirt = pantsFit === "Skirt";
  const isFlared = pantsFit === "Flared";

  const finalHipR = hipR_base + hipMod;
  const thighR = (isFemale ? 0.068 : 0.062) + thighMod;
  const calfR = (isFemale ? 0.046 : 0.05) + calfMod;

  const thighMat = isSkirt ? skinMat : deniMat;
  const kneeMat = isSkirt || isBermuda ? skinMat : deniMat;
  const lowerLegMat = isSkirt || isBermuda ? skinMat : deniMat;

  // ── Arm segment dims ─────────────────────────────────────────────────────
  const upperArmR = isFemale ? 0.038 : 0.048 * muscFactor;
  const foreArmR = isFemale ? 0.033 : 0.042;

  // The lowest point of the character's geometry (the bottom of the soles) is at Y = -0.111 in local space.
  // We offset the whole model up by 0.111 * scaleY so that the bottom rests exactly at the global -0.9 floor.
  const modelY = -0.9 + (0.111 * scaleY);

  return (
    <group scale={[scaleXZ, scaleY, scaleXZ]} position={[0, modelY, 0]}>

      {/* ── HEAD ── */}
      <group position={[0, 1.72, 0]}>
        <RealisticFace
          skinColor={skinColor}
          isFemale={isFemale}
          beardStyle={beardStyle || "Ninguna"}
          beardColor={beardColor || "#2d1a0e"}
          eyebrowStyle={eyebrowStyle || "Normal"}
        />

        {/* Hair */}
        <HairComponent hairStyle={hairStyle} hairColor={hairColor} isFemale={isFemale} />

        {/* Hat (on top of hair) */}
        <HatComponent hatStyle={hatStyle || "Ninguno"} isFemale={isFemale} />

        {/* Glasses */}
        {glasses && (
          <group position={[0, 0.022, 0.13]} scale={[1.25, 1.25, 1.25]}>
            <mesh position={[-0.038, 0, 0]}>
              <planeGeometry args={[0.055, 0.038]} />
              <meshStandardMaterial {...glassMat} />
            </mesh>
            <mesh position={[0.038, 0, 0]}>
              <planeGeometry args={[0.055, 0.038]} />
              <meshStandardMaterial {...glassMat} />
            </mesh>
            {/* Frames */}
            <mesh position={[-0.038, 0, 0]}>
              <ringGeometry args={[0.022, 0.028, 20]} />
              <meshStandardMaterial {...frameMat} />
            </mesh>
            <mesh position={[0.038, 0, 0]}>
              <ringGeometry args={[0.022, 0.028, 20]} />
              <meshStandardMaterial {...frameMat} />
            </mesh>
            {/* Bridge */}
            <mesh><boxGeometry args={[0.016, 0.005, 0.004]} /><meshStandardMaterial {...frameMat} /></mesh>
            {/* Temples */}
            <mesh position={[-0.065, 0, -0.042]} rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[0.085, 0.004, 0.004]} />
              <meshStandardMaterial {...frameMat} />
            </mesh>
            <mesh position={[0.065, 0, -0.042]} rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[0.085, 0.004, 0.004]} />
              <meshStandardMaterial {...frameMat} />
            </mesh>
          </group>
        )}
      </group>

      {/* ── NECK ── */}
      <mesh position={[0, 1.59, 0]}>
        <cylinderGeometry args={[
          isFemale ? 0.038 : 0.048,
          isFemale ? 0.045 : 0.055,
          0.14, 32
        ]} />
        <meshStandardMaterial {...skinMat} />
      </mesh>

      {/* ── TORSO ── */}
      <group position={[0, 1.20, 0]}>
        {/* Chest */}
        <mesh position={[0, 0.16, 0]}>
          <capsuleGeometry args={[chestR, 0.18, 32, 32]} />
          <meshStandardMaterial {...shirtMat} />
        </mesh>

        {/* Shirt collar details */}
        <ShirtCollars shirtStyle={shirtStyle || "Basic"} shirtColor={shirtColor} isFemale={isFemale} />

        {/* Female bust */}
        {isFemale && breastR > 0 && (
          <group position={[0, 0.15, 0.12]}>
            <mesh position={[-0.065, 0, 0]} rotation={[0.25, -0.12, 0]}>
              <sphereGeometry args={[breastR, 32, 32]} />
              <meshStandardMaterial {...shirtMat} />
            </mesh>
            <mesh position={[0.065, 0, 0]} rotation={[0.25, 0.12, 0]}>
              <sphereGeometry args={[breastR, 32, 32]} />
              <meshStandardMaterial {...shirtMat} />
            </mesh>
          </group>
        )}

        {/* Male pecs (subtle) */}
        {!isFemale && muscleDefinition > 0.2 && (
          <group position={[0, 0.20, chestR * 0.85]}>
            <mesh position={[-0.07, 0, 0]} scale={[1.2, 0.65, 0.15]}>
              <sphereGeometry args={[chestR * 0.42, 20, 20]} />
              <meshStandardMaterial {...shirtMat} />
            </mesh>
            <mesh position={[0.07, 0, 0]} scale={[1.2, 0.65, 0.15]}>
              <sphereGeometry args={[chestR * 0.42, 20, 20]} />
              <meshStandardMaterial {...shirtMat} />
            </mesh>
          </group>
        )}

        {/* Abdomen */}
        <mesh position={[0, -0.1, 0]}>
          <capsuleGeometry args={[waistR, 0.18, 32, 32]} />
          <meshStandardMaterial {...shirtMat} />
        </mesh>

        {/* Shirt hem at bottom (slight overhang) */}
        <mesh position={[0, -0.22, 0]}>
          <cylinderGeometry args={[waistR * 1.06, waistR * 1.1, 0.04, 32]} />
          <meshStandardMaterial {...shirtMat} />
        </mesh>
      </group>

      {/* ── LEFT SHOULDER + ARM ── */}
      <group position={[-shoulderX, 1.42, 0]}>
        {/* Shoulder sphere */}
        <mesh>
          <sphereGeometry args={[isFemale ? 0.042 : 0.054 * muscFactor, 32, 32]} />
          <meshStandardMaterial {...shirtMat} />
        </mesh>
        <group rotation={[0, 0, -0.28]}>
          {/* Upper arm */}
          <mesh position={[0, -0.13, 0]}>
            <capsuleGeometry args={[upperArmR, 0.20, 16, 32]} />
            <meshStandardMaterial {...shirtMat} />
          </mesh>
          <group position={[0, -0.27, 0]} rotation={[-0.12, 0, -0.04]}>
            {/* Elbow */}
            <mesh>
              <sphereGeometry args={[foreArmR * 0.95, 24, 24]} />
              <meshStandardMaterial {...skinMat} />
            </mesh>
            {/* Forearm */}
            <mesh position={[0, -0.12, 0]}>
              <capsuleGeometry args={[foreArmR, 0.23, 16, 32]} />
              <meshStandardMaterial {...skinMat} />
            </mesh>
            {/* Tattoo sleeve */}
            {tattooLeftArm && <TattooSleeve isFemale={isFemale} />}
            {/* Wrist */}
            <mesh position={[0, -0.265, 0]}>
              <sphereGeometry args={[foreArmR * 0.88, 20, 20]} />
              <meshStandardMaterial {...skinMat} />
            </mesh>
            {/* Hand (simplified palm + finger blob) */}
            <group position={[0, -0.32, 0]}>
              <mesh scale={[1.1, 0.8, 0.4]}>
                <sphereGeometry args={[foreArmR * 1.2, 20, 20]} />
                <meshStandardMaterial {...skinMat} />
              </mesh>
              {/* Thumb */}
              <mesh position={[foreArmR * 0.9, 0.02, foreArmR * 0.2]} rotation={[0, 0, -0.5]}>
                <capsuleGeometry args={[foreArmR * 0.25, 0.04, 8, 12]} />
                <meshStandardMaterial {...skinMat} />
              </mesh>
            </group>
          </group>
        </group>
      </group>

      {/* ── RIGHT SHOULDER + ARM ── */}
      <group position={[shoulderX, 1.42, 0]}>
        <mesh>
          <sphereGeometry args={[isFemale ? 0.042 : 0.054 * muscFactor, 32, 32]} />
          <meshStandardMaterial {...shirtMat} />
        </mesh>
        <group rotation={[0, 0, 0.28]}>
          <mesh position={[0, -0.13, 0]}>
            <capsuleGeometry args={[upperArmR, 0.20, 16, 32]} />
            <meshStandardMaterial {...shirtMat} />
          </mesh>
          <group position={[0, -0.27, 0]} rotation={[-0.12, 0, 0.04]}>
            <mesh>
              <sphereGeometry args={[foreArmR * 0.95, 24, 24]} />
              <meshStandardMaterial {...skinMat} />
            </mesh>
            <mesh position={[0, -0.12, 0]}>
              <capsuleGeometry args={[foreArmR, 0.23, 16, 32]} />
              <meshStandardMaterial {...skinMat} />
            </mesh>
            <mesh position={[0, -0.265, 0]}>
              <sphereGeometry args={[foreArmR * 0.88, 20, 20]} />
              <meshStandardMaterial {...skinMat} />
            </mesh>
            <group position={[0, -0.32, 0]}>
              <mesh scale={[1.1, 0.8, 0.4]}>
                <sphereGeometry args={[foreArmR * 1.2, 20, 20]} />
                <meshStandardMaterial {...skinMat} />
              </mesh>
              <mesh position={[-foreArmR * 0.9, 0.02, foreArmR * 0.2]} rotation={[0, 0, 0.5]}>
                <capsuleGeometry args={[foreArmR * 0.25, 0.04, 8, 12]} />
                <meshStandardMaterial {...skinMat} />
              </mesh>
            </group>
          </group>
        </group>
      </group>

      {/* ── HIPS / PELVIS ── */}
      <mesh position={[0, 0.87, 0]}>
        <sphereGeometry args={[finalHipR, 32, 32]} />
        <meshStandardMaterial {...deniMat} />
      </mesh>

      {/* Skirt Cone */}
      {isSkirt && (
        <mesh position={[0, 0.65, 0]}>
          <cylinderGeometry args={[finalHipR * 1.02, finalHipR * 1.3, 0.45, 32]} />
          <meshStandardMaterial {...deniMat} />
        </mesh>
      )}

      {/* Belt */}
      <mesh position={[0, 0.90, 0]}>
        <cylinderGeometry args={[finalHipR * 1.03, finalHipR * 1.03, 0.04, 32]} />
        <meshStandardMaterial {...shoeMat} />
      </mesh>
      {/* Belt buckle */}
      <mesh position={[0, 0.90, finalHipR * 1.05]}>
        <boxGeometry args={[0.04, 0.038, 0.01]} />
        <meshStandardMaterial color="#c0a060" roughness={0.2} metalness={0.85} />
      </mesh>

      {/* ── LEFT LEG ── */}
      <group position={[isFemale ? -0.095 : -0.088, 0.82, 0]}>
        {/* Thigh */}
        <mesh position={[0, -0.24, 0]}>
          <capsuleGeometry args={[isSkirt ? thighR * 0.9 : thighR, 0.30, 16, 32]} />
          <meshStandardMaterial {...thighMat} />
        </mesh>
        {/* Bermuda Hem */}
        {isBermuda && (
          <mesh position={[0, -0.4, 0]}>
            <cylinderGeometry args={[thighR * 1.05, thighR * 1.05, 0.03, 32]} />
            <meshStandardMaterial {...deniMat} />
          </mesh>
        )}
        {/* Knee */}
        <mesh position={[0, -0.43, 0.018]}>
          <sphereGeometry args={[isSkirt || isBermuda ? thighR * 0.8 : thighR * 0.88, 28, 28]} />
          <meshStandardMaterial {...kneeMat} />
        </mesh>
        {/* Cargo pocket (Relaxed fit only) */}
        {pantsFit === "Relaxed" && (
          <mesh position={[-thighR * 0.85, -0.25, 0]} scale={[0.4, 0.5, 0.2]}>
            <boxGeometry args={[0.1, 0.12, 0.04]} />
            <meshStandardMaterial {...deniMat} />
          </mesh>
        )}
        {/* Calf */}
        <mesh position={[0, -0.64, 0]}>
          <capsuleGeometry args={[isSkirt || isBermuda ? calfR * 0.9 : calfR, 0.28, 16, 32]} />
          <meshStandardMaterial {...lowerLegMat} />
        </mesh>
        {/* Flared extension */}
        {isFlared && (
          <mesh position={[0, -0.72, 0]}>
            <cylinderGeometry args={[calfR, calfR * 1.8, 0.35, 32]} />
            <meshStandardMaterial {...deniMat} />
          </mesh>
        )}
        {/* Unified Shoe (Flat-bottom architecture) */}
        <group position={[0, -0.86, 0.04]}>
          {/* High-top ankle collar */}
          <mesh position={[0, 0.04, -0.04]}>
            <cylinderGeometry args={[calfR * 0.85, calfR * 0.95, 0.05, 24]} />
            <meshStandardMaterial {...shoeMat} />
          </mesh>
          {/* Shoe Top Dome */}
          <mesh position={[0, 0.02, 0.02]} scale={[1, 0.5, 2.4]}>
            <sphereGeometry args={[isFemale ? 0.042 : 0.048, 24, 24]} />
            <meshStandardMaterial {...shoeMat} />
          </mesh>
          {/* Shoe Lower Body (Flat bottom cylinder) */}
          <mesh position={[0, -0.01, 0.02]} scale={[1, 1, 2.4]}>
            <cylinderGeometry args={[isFemale ? 0.042 : 0.048, isFemale ? 0.042 : 0.048, 0.06, 24]} />
            <meshStandardMaterial {...shoeMat} />
          </mesh>
          {/* Rubber Sole (Flat Cylinder) */}
          <mesh position={[0, -0.045, 0.02]} scale={[1.05, 1, 2.5]}>
            <cylinderGeometry args={[isFemale ? 0.042 : 0.048, isFemale ? 0.042 : 0.048, 0.012, 24]} />
            <meshStandardMaterial {...shoeMat} />
          </mesh>
        </group>
      </group>

      {/* ── RIGHT LEG ── */}
      <group position={[isFemale ? 0.095 : 0.088, 0.82, 0]}>
        <mesh position={[0, -0.24, 0]}>
          <capsuleGeometry args={[isSkirt ? thighR * 0.9 : thighR, 0.30, 16, 32]} />
          <meshStandardMaterial {...thighMat} />
        </mesh>
        {isBermuda && (
          <mesh position={[0, -0.4, 0]}>
            <cylinderGeometry args={[thighR * 1.05, thighR * 1.05, 0.03, 32]} />
            <meshStandardMaterial {...deniMat} />
          </mesh>
        )}
        <mesh position={[0, -0.43, 0.018]}>
          <sphereGeometry args={[isSkirt || isBermuda ? thighR * 0.8 : thighR * 0.88, 28, 28]} />
          <meshStandardMaterial {...kneeMat} />
        </mesh>
        {pantsFit === "Relaxed" && (
          <mesh position={[thighR * 0.85, -0.25, 0]} scale={[0.4, 0.5, 0.2]}>
            <boxGeometry args={[0.1, 0.12, 0.04]} />
            <meshStandardMaterial {...deniMat} />
          </mesh>
        )}
        <mesh position={[0, -0.64, 0]}>
          <capsuleGeometry args={[isSkirt || isBermuda ? calfR * 0.9 : calfR, 0.28, 16, 32]} />
          <meshStandardMaterial {...lowerLegMat} />
        </mesh>
        {isFlared && (
          <mesh position={[0, -0.72, 0]}>
            <cylinderGeometry args={[calfR, calfR * 1.8, 0.35, 32]} />
            <meshStandardMaterial {...deniMat} />
          </mesh>
        )}
        {/* Unified Shoe (Flat-bottom architecture) */}
        <group position={[0, -0.86, 0.04]}>
          {/* High-top ankle collar */}
          <mesh position={[0, 0.04, -0.04]}>
            <cylinderGeometry args={[calfR * 0.85, calfR * 0.95, 0.05, 24]} />
            <meshStandardMaterial {...shoeMat} />
          </mesh>
          {/* Shoe Top Dome */}
          <mesh position={[0, 0.02, 0.02]} scale={[1, 0.5, 2.4]}>
            <sphereGeometry args={[isFemale ? 0.042 : 0.048, 24, 24]} />
            <meshStandardMaterial {...shoeMat} />
          </mesh>
          {/* Shoe Lower Body (Flat bottom cylinder) */}
          <mesh position={[0, -0.01, 0.02]} scale={[1, 1, 2.4]}>
            <cylinderGeometry args={[isFemale ? 0.042 : 0.048, isFemale ? 0.042 : 0.048, 0.06, 24]} />
            <meshStandardMaterial {...shoeMat} />
          </mesh>
          {/* Rubber Sole (Flat Cylinder) */}
          <mesh position={[0, -0.045, 0.02]} scale={[1.05, 1, 2.5]}>
            <cylinderGeometry args={[isFemale ? 0.042 : 0.048, isFemale ? 0.042 : 0.048, 0.012, 24]} />
            <meshStandardMaterial {...shoeMat} />
          </mesh>
        </group>
      </group>

    </group>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
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
  initialGlasses = false,
  initialBodyType = "Normal",
  initialMuscleDefinition = 0.3,
  initialBeardStyle = "Ninguna",
  initialBeardColor = "#2d1a0e",
  initialEyebrowStyle = "Normal",
  initialHatStyle = "Ninguno",
  initialShirtStyle = "Basic",
  initialTattooLeftArm = false,
}: AvatarCreatorNativeProps) {
  type TabType = "body" | "face" | "clothes" | "extras";
  const [activeTab, setActiveTab] = useState<TabType>("body");

  // Body
  const [skinColor, setSkinColor] = useState(initialSkinColor);
  const [heightCm, setHeightCm] = useState(initialHeight);
  const [weightKg, setWeightKg] = useState(initialWeight);
  const [gender, setGender] = useState(initialGender);
  const [bodyType, setBodyType] = useState(initialBodyType);
  const [muscleDefinition, setMuscleDefinition] = useState(initialMuscleDefinition);

  // Face / Head
  const [hairStyle, setHairStyle] = useState(initialHairStyle);
  const [hairColor, setHairColor] = useState(initialHairColor);
  const [beardStyle, setBeardStyle] = useState(initialBeardStyle);
  const [beardColor, setBeardColor] = useState(initialBeardColor);
  const [eyebrowStyle, setEyebrowStyle] = useState(initialEyebrowStyle);
  const [glasses, setGlasses] = useState(initialGlasses);
  const [hatStyle, setHatStyle] = useState(initialHatStyle);

  // Clothes
  const [shirtColor, setShirtColor] = useState(initialShirtColor);
  const [shirtStyle, setShirtStyle] = useState(initialShirtStyle);
  const [shoesColor, setShoesColor] = useState(initialShoesColor);

  // Extras
  const [tattooLeftArm, setTattooLeftArm] = useState(initialTattooLeftArm);

  const scaleY = heightCm / 170.0;
  const scaleXZ = Math.pow(weightKg / 70.0, 0.5);

  // ── Palette definitions ──────────────────────────────────────────────────
  const skinTones = [
    { name: "Claro", hex: "#f5deb3" },
    { name: "Medio Claro", hex: "#e0ac69" },
    { name: "Medio", hex: "#c68642" },
    { name: "Medio Oscuro", hex: "#8d5524" },
    { name: "Oscuro", hex: "#3d2210" },
  ];
  const hairColors = [
    { name: "Negro Azabache", hex: "#1a0a00" },
    { name: "Castaño", hex: "#4a3018" },
    { name: "Rubio Miel", hex: "#d4a855" },
    { name: "Pelirrojo", hex: "#8a2b0e" },
    { name: "Gris", hex: "#888888" },
    { name: "Blanco", hex: "#e8e8e8" },
  ];
  const shirtColors = [
    { name: "Blanco", hex: "#f8f8f8" },
    { name: "Negro", hex: "#1a1a1a" },
    { name: "Azul Marino", hex: "#0a1a3a" },
    { name: "Carmesí", hex: "#8b0000" },
    { name: "Oliva", hex: "#4a5a2a" },
    { name: "Terracota", hex: "#c1440e" },
  ];
  const shoesColors = [
    { name: "Cuero Negro", hex: "#0f0f0f" },
    { name: "Zapatilla Blanca", hex: "#f0f0f0" },
    { name: "Marrón Cognac", hex: "#5c3415" },
    { name: "Rojo", hex: "#a52a2a" },
    { name: "Gris Urbano", hex: "#606060" },
  ];
  const hairStyles = ["Calvo", "Corto", "Largo", "Recogido"];
  const beardStyles = ["Ninguna", "Esbozo", "Corta", "Larga"];
  const bodyTypes = ["Delgado", "Normal", "Atlético", "Robusto"];
  const eyebrowStyles = ["Fino", "Normal", "Grueso"];
  const hatStyles = ["Ninguno", "Gorra", "Sombrero", "Headband"];
  const shirtStyles = ["Basic", "V-Neck", "Polo"];

  const handleSave = () => {
    onAvatarExported(
      "parametric",
      skinColor,
      heightCm,
      weightKg,
      shirtColor,
      shoesColor,
      hairStyle,
      hairColor,
      gender,
      glasses,
      bodyType,
      muscleDefinition,
      beardStyle,
      beardColor,
      eyebrowStyle,
      hatStyle,
      shirtStyle,
      tattooLeftArm,
    );
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "body", label: "Cuerpo", icon: <Accessibility className="w-5 h-5" /> },
    { id: "face", label: "Cabeza", icon: <Smile className="w-5 h-5" /> },
    { id: "clothes", label: "Ropa", icon: <Shirt className="w-5 h-5" /> },
    { id: "extras", label: "Extras", icon: <Sparkles className="w-5 h-5" /> },
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
            bodyType={bodyType}
            muscleDefinition={muscleDefinition}
            beardStyle={beardStyle}
            beardColor={beardColor}
            eyebrowStyle={eyebrowStyle}
            hatStyle={hatStyle}
            shirtStyle={shirtStyle}
            tattooLeftArm={tattooLeftArm}
          />
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
            {weightKg} kg
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
                      className={`py-3 text-sm font-bold rounded-xl border-2 transition-all ${gender === g
                        ? "bg-violet-50 dark:bg-violet-900/20 border-violet-600 text-violet-700 dark:text-violet-400"
                        : "border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:border-neutral-300"
                      }`}
                    >{g}</button>
                  ))}
                </div>
              </div>

              {/* Body Type */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Tipo de Cuerpo</label>
                <div className="grid grid-cols-2 gap-2">
                  {bodyTypes.map((bt) => (
                    <button key={bt} onClick={() => setBodyType(bt)}
                      className={`py-2.5 text-xs font-bold rounded-xl border-2 transition-all ${bodyType === bt
                        ? "bg-violet-50 dark:bg-violet-900/20 border-violet-600 text-violet-700 dark:text-violet-400"
                        : "border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:border-neutral-300"
                      }`}
                    >{bt}</button>
                  ))}
                </div>
              </div>

              {/* Muscle Definition */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Definición Muscular</label>
                  <span className="text-sm font-black text-violet-600 dark:text-violet-400">{Math.round(muscleDefinition * 100)}%</span>
                </div>
                <input type="range" min="0" max="100" value={Math.round(muscleDefinition * 100)}
                  onChange={(e) => setMuscleDefinition(parseInt(e.target.value) / 100)}
                  className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-violet-600"
                />
              </div>

              {/* Height */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Altura</label>
                  <span className="text-lg font-black text-violet-600 dark:text-violet-400">{heightCm} cm</span>
                </div>
                <input type="range" min="140" max="210" value={heightCm}
                  onChange={(e) => setHeightCm(parseInt(e.target.value))}
                  className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-violet-600"
                />
              </div>

              {/* Weight */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Peso</label>
                  <span className="text-lg font-black text-violet-600 dark:text-violet-400">{weightKg} kg</span>
                </div>
                <input type="range" min="40" max="140" value={weightKg}
                  onChange={(e) => setWeightKg(parseInt(e.target.value))}
                  className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-violet-600"
                />
              </div>

              {/* Skin tone */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Tono de Piel</label>
                <div className="flex gap-3 flex-wrap">
                  {skinTones.map((t) => (
                    <button key={t.hex} onClick={() => setSkinColor(t.hex)}
                      className={`relative w-11 h-11 rounded-full shadow transition-all flex items-center justify-center ${skinColor === t.hex ? "scale-110 ring-4 ring-violet-400/40" : "hover:scale-105"}`}
                      style={{ backgroundColor: t.hex }} title={t.name}
                    >
                      {skinColor === t.hex && <Check className="w-4 h-4 text-white/80 mix-blend-difference" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── FACE TAB ── */}
          {activeTab === "face" && (
            <div className="space-y-7 animate-in fade-in slide-in-from-right-4 duration-300">

              {/* Glasses */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2"><Glasses className="w-4 h-4"/> Gafas</label>
                <div className="flex gap-3">
                  {[{label: "Con gafas", val: true}, {label: "Sin gafas", val: false}].map((opt) => (
                    <button key={String(opt.val)} onClick={() => setGlasses(opt.val)}
                      className={`flex-1 py-2.5 font-bold rounded-xl border-2 text-sm transition-all ${glasses === opt.val
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-600 text-blue-700"
                        : "border-neutral-200 dark:border-neutral-800 text-neutral-500"
                      }`}
                    >{opt.label}</button>
                  ))}
                </div>
              </div>

              {/* Hair Style */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2"><Scissors className="w-4 h-4"/> Peinado</label>
                <div className="grid grid-cols-2 gap-2">
                  {hairStyles.map((s) => (
                    <button key={s} onClick={() => setHairStyle(s)}
                      className={`py-2.5 text-xs font-bold rounded-xl border-2 transition-all ${hairStyle === s
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-600 text-blue-700 dark:text-blue-400"
                        : "border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:border-neutral-300"
                      }`}
                    >{s}</button>
                  ))}
                </div>
              </div>

              {/* Hair Color */}
              <div className={`space-y-3 transition-opacity ${hairStyle === "Calvo" ? "opacity-30 pointer-events-none" : ""}`}>
                <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Color de Cabello</label>
                <div className="flex gap-2 flex-wrap">
                  {hairColors.map((c) => (
                    <button key={c.hex} onClick={() => setHairColor(c.hex)}
                      className={`w-10 h-10 rounded-full border border-neutral-300 dark:border-neutral-700 transition-all flex items-center justify-center ${hairColor === c.hex ? "scale-110 ring-4 ring-blue-400/40" : "hover:scale-105"}`}
                      style={{ backgroundColor: c.hex }} title={c.name}
                    >
                      {hairColor === c.hex && <Check className="w-3.5 h-3.5 text-white/90 mix-blend-difference" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Beard (hidden for female) */}
              {!( gender === "Mujer") && (
                <div className="space-y-3">
                  <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2"><User className="w-4 h-4"/> Barba</label>
                  <div className="grid grid-cols-2 gap-2">
                    {beardStyles.map((s) => (
                      <button key={s} onClick={() => setBeardStyle(s)}
                        className={`py-2.5 text-xs font-bold rounded-xl border-2 transition-all ${beardStyle === s
                          ? "bg-amber-50 dark:bg-amber-900/20 border-amber-600 text-amber-700 dark:text-amber-400"
                          : "border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:border-neutral-300"
                        }`}
                      >{s}</button>
                    ))}
                  </div>
                  {/* Beard Color */}
                  <div className={`transition-opacity ${beardStyle === "Ninguna" ? "opacity-30 pointer-events-none" : ""}`}>
                    <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 block mb-2">Color de Barba</label>
                    <div className="flex gap-2 flex-wrap">
                      {hairColors.map((c) => (
                        <button key={c.hex} onClick={() => setBeardColor(c.hex)}
                          className={`w-9 h-9 rounded-full border border-neutral-300 dark:border-neutral-700 transition-all flex items-center justify-center ${beardColor === c.hex ? "scale-110 ring-4 ring-amber-400/40" : "hover:scale-105"}`}
                          style={{ backgroundColor: c.hex }} title={c.name}
                        >
                          {beardColor === c.hex && <Check className="w-3 h-3 text-white/90 mix-blend-difference" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Eyebrows */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Cejas</label>
                <div className="grid grid-cols-3 gap-2">
                  {eyebrowStyles.map((s) => (
                    <button key={s} onClick={() => setEyebrowStyle(s)}
                      className={`py-2.5 text-xs font-bold rounded-xl border-2 transition-all ${eyebrowStyle === s
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-600 text-blue-700"
                        : "border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:border-neutral-300"
                      }`}
                    >{s}</button>
                  ))}
                </div>
              </div>

              {/* Hat */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2"><Sparkles className="w-4 h-4"/> Accesorio</label>
                <div className="grid grid-cols-2 gap-2">
                  {hatStyles.map((s) => (
                    <button key={s} onClick={() => setHatStyle(s)}
                      className={`py-2.5 text-xs font-bold rounded-xl border-2 transition-all ${hatStyle === s
                        ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-600 text-emerald-700"
                        : "border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:border-neutral-300"
                      }`}
                    >{s}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── CLOTHES TAB ── */}
          {activeTab === "clothes" && (
            <div className="space-y-7 animate-in fade-in slide-in-from-right-4 duration-300">

              {/* Shirt Style */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2"><Shirt className="w-4 h-4"/> Estilo de Camiseta</label>
                <div className="grid grid-cols-3 gap-2">
                  {shirtStyles.map((s) => (
                    <button key={s} onClick={() => setShirtStyle(s)}
                      className={`py-2.5 text-xs font-bold rounded-xl border-2 transition-all ${shirtStyle === s
                        ? "bg-rose-50 dark:bg-rose-900/20 border-rose-600 text-rose-700 dark:text-rose-400"
                        : "border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:border-neutral-300"
                      }`}
                    >{s}</button>
                  ))}
                </div>
              </div>

              {/* Shirt Color */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Color de Camiseta</label>
                <div className="flex gap-2 flex-wrap">
                  {shirtColors.map((c) => (
                    <button key={c.hex} onClick={() => setShirtColor(c.hex)}
                      className={`w-11 h-11 rounded-full border border-neutral-300 dark:border-neutral-700 shadow-sm transition-all flex items-center justify-center ${shirtColor === c.hex ? "scale-110 ring-4 ring-rose-400/40" : "hover:scale-105"}`}
                      style={{ backgroundColor: c.hex }} title={c.name}
                    >
                      {shirtColor === c.hex && <Check className="w-4 h-4 text-white/80 mix-blend-difference" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shoes Color */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">Calzado</label>
                <div className="flex gap-2 flex-wrap">
                  {shoesColors.map((c) => (
                    <button key={c.hex} onClick={() => setShoesColor(c.hex)}
                      className={`w-11 h-11 rounded-full border border-neutral-300 dark:border-neutral-700 shadow-sm transition-all flex items-center justify-center ${shoesColor === c.hex ? "scale-110 ring-4 ring-rose-400/40" : "hover:scale-105"}`}
                      style={{ backgroundColor: c.hex }} title={c.name}
                    >
                      {shoesColor === c.hex && <Check className="w-4 h-4 text-white/80 mix-blend-difference" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── EXTRAS TAB ── */}
          {activeTab === "extras" && (
            <div className="space-y-7 animate-in fade-in slide-in-from-right-4 duration-300">

              <div className="space-y-3">
                <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2"><PenTool className="w-4 h-4"/> Tatuaje Brazo Izquierdo</label>
                <div className="flex gap-3">
                  {[{label: "Con tatuaje", val: true}, {label: "Sin tatuaje", val: false}].map((opt) => (
                    <button key={String(opt.val)} onClick={() => setTattooLeftArm(opt.val)}
                      className={`flex-1 py-2.5 font-bold rounded-xl border-2 text-sm transition-all ${tattooLeftArm === opt.val
                        ? "bg-purple-50 dark:bg-purple-900/20 border-purple-600 text-purple-700"
                        : "border-neutral-200 dark:border-neutral-800 text-neutral-500"
                      }`}
                    >{opt.label}</button>
                  ))}
                </div>
                {tattooLeftArm && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    ✨ Mangas de tatuaje tribal visibles en el brazo izquierdo del maniquí.
                  </p>
                )}
              </div>

              {/* Summary card */}
              <div className="bg-neutral-50 dark:bg-neutral-800 rounded-2xl p-4 space-y-2 border border-neutral-200 dark:border-neutral-700">
                <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Resumen del Avatar</p>
                {[
                  ["Género", gender],
                  ["Cuerpo", `${bodyType} · ${Math.round(muscleDefinition * 100)}% músculo`],
                  ["Medidas", `${heightCm} cm · ${weightKg} kg`],
                  ["Cabello", `${hairStyle}`],
                  ...(!( gender === "Mujer") ? [["Barba", beardStyle] as [string,string]] : []),
                  ["Gafas", glasses ? "Sí" : "No"],
                  ["Accesorio", hatStyle],
                  ["Camiseta", shirtStyle],
                ].map(([key, val]) => (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-neutral-500 dark:text-neutral-400">{key}</span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="p-5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <button
            onClick={handleSave}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 text-sm"
          >
            Guardar Gemelo Digital →
          </button>
        </div>
      </div>
    </div>
  );
}
