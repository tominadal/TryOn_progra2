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
//  FACE COMPONENT — Oval, realistic head
// ──────────────────────────────────────────────────────────────────────────────
function RealisticFace({ skinColor, isFemale, eyebrowStyle }: {
  skinColor: string;
  isFemale: boolean;
  eyebrowStyle: string;
}) {
  const skinMat = { color: skinColor, roughness: 0.5, metalness: 0.05 };
  const eyebrowThick = eyebrowStyle === "Grueso" ? 0.025 : eyebrowStyle === "Fino" ? 0.003 : 0.009;
  // Base sphere radius — the OVAL is achieved via scale on the parent group
  const headR = isFemale ? 0.128 : 0.134;
  // Oval scale: narrower X (0.86), taller Y (1.0), slightly shallow Z (0.93)
  const headScaleX = isFemale ? 0.84 : 0.86;
  const headScaleZ = isFemale ? 0.91 : 0.93;

  return (
    // The outer scale makes the whole head oval (taller than wide)
    <group scale={[headScaleX, 1.0, headScaleZ]}>

      {/* ── SKULL BASE ── */}
      <mesh>
        <sphereGeometry args={[headR, 48, 48]} />
        <meshStandardMaterial {...skinMat} />
      </mesh>

      {/* ── JAW / CHIN — tapers downward ── */}
      <mesh position={[0, -headR * 0.72, headR * 0.12]} scale={[0.85, 0.52, 0.78]}>
        <sphereGeometry args={[headR * 0.58, 32, 24]} />
        <meshStandardMaterial {...skinMat} />
      </mesh>


      {/* ── EARS — single flat ellipsoid, close to skull ── */}
      {[-1, 1].map((side) => (
        // position: pushed to the side of the skull; scale makes it a flat oval disc
        <mesh
          key={side}
          position={[side * headR * 0.96, -headR * 0.05, 0]}
          scale={[0.18, 0.38, 0.28]}
        >
          <sphereGeometry args={[headR * 0.78, 24, 20]} />
          <meshStandardMaterial {...skinMat} />
        </mesh>
      ))}

      {/* ── NOSE ── */}
      <group position={[0, -headR * 0.13, headR * 0.94]}>
        {/* Tip */}
        <mesh scale={[1.0, 1.3, 0.9]}>
          <sphereGeometry args={[isFemale ? 0.017 : 0.021, 16, 16]} />
          <meshStandardMaterial {...skinMat} />
        </mesh>
        {/* Nasal bridge — runs up toward forehead */}
        <mesh position={[0, 0.028, -0.006]}>
          <capsuleGeometry args={[isFemale ? 0.0075 : 0.009, 0.036, 8, 16]} />
          <meshStandardMaterial {...skinMat} />
        </mesh>
        {/* Nostrils */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.015, -0.008, 0.004]} scale={[0.9, 0.7, 0.7]}>
            <sphereGeometry args={[0.009, 12, 12]} />
            <meshStandardMaterial {...skinMat} />
          </mesh>
        ))}
      </group>

      {/* ── EYES — whites + iris + pupil + upper lid ── */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * headR * 0.36, headR * 0.07, headR * 0.90]}>
          {/* Eye white */}
          <mesh scale={[1.35, 0.85, 0.45]}>
            <sphereGeometry args={[0.021, 24, 24]} />
            <meshStandardMaterial color="#f4ede8" roughness={0.25} />
          </mesh>
          {/* Iris */}
          <mesh position={[0, 0, 0.011]} scale={[1.05, 1.0, 0.28]}>
            <sphereGeometry args={[0.013, 20, 20]} />
            <meshStandardMaterial color="#3b2507" roughness={0.2} />
          </mesh>
          {/* Pupil */}
          <mesh position={[0, 0, 0.014]} scale={[1.05, 1.0, 0.18]}>
            <sphereGeometry args={[0.007, 16, 16]} />
            <meshStandardMaterial color="#060606" roughness={0.1} />
          </mesh>
          {/* Upper eyelid crease */}
          <mesh position={[0, 0.013, 0.009]} scale={[1.55, 0.42, 0.42]} rotation={[0.28, 0, 0]}>
            <sphereGeometry args={[0.020, 16, 8]} />
            <meshStandardMaterial {...skinMat} />
          </mesh>
        </group>
      ))}

      {/* ── EYEBROWS ── */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * headR * 0.355, headR * 0.26, headR * 0.88]}
          rotation={[0, 0, side * -0.18]}
        >
          <boxGeometry args={[0.036, eyebrowThick, 0.007]} />
          <meshStandardMaterial color="#2d1a0e" roughness={0.9} />
        </mesh>
      ))}

      {/* ── MOUTH ── */}
      <group position={[0, -headR * 0.40, headR * 0.92]}>
        {/* Upper lip */}
        <mesh position={[0, 0.007, 0]} scale={[1.7, 0.48, 0.48]}>
          <sphereGeometry args={[0.017, 20, 10]} />
          <meshStandardMaterial color={isFemale ? "#c46e6e" : "#b06050"} roughness={0.65} />
        </mesh>
        {/* Lower lip — slightly fuller */}
        <mesh position={[0, -0.01, 0.001]} scale={[1.9, 0.65, 0.62]}>
          <sphereGeometry args={[0.015, 20, 10]} />
          <meshStandardMaterial color={isFemale ? "#c46e6e" : "#b06050"} roughness={0.65} />
        </mesh>
        {/* Mouth line separator */}
        <mesh position={[0, -0.001, 0.005]} scale={[1.5, 0.18, 0.3]}>
          <sphereGeometry args={[0.012, 12, 8]} />
          <meshStandardMaterial color="#7a3a30" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
//  HAIR COMPONENT — single-shell approach, face always open
// ──────────────────────────────────────────────────────────────────────────────
function HairComponent({ hairStyle, hairColor, isFemale }: {
  hairStyle: string; hairColor: string; isFemale: boolean;
}) {
  const mat = { color: hairColor, roughness: 0.82, metalness: 0.06 };
  const headR  = isFemale ? 0.128 : 0.134;
  // Same oval scale as the face so hair matches the skull exactly
  const hsx = isFemale ? 0.84 : 0.86;
  const hsz = isFemale ? 0.91 : 0.93;

  if (hairStyle === "Calvo") return null;

  // The key trick: shift every hair cap slightly BACK (-Z) so it never
  // drapes in front of the face. The sphere's leading edge sits roughly
  // at the hairline without covering the forehead.
  const backZ = -headR * 0.08; // small backward offset in pre-scale space

  // ── CORTO — tight close crop, covers crown + sides + nape ──
  if (hairStyle === "Corto") return (
    <group scale={[hsx, 1.0, hsz]}>
      {/* Single shell: from crown down 108° (just past ear level) */}
      <mesh position={[0, headR * 0.04, backZ]}>
        <sphereGeometry args={[headR * 1.055, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
        <meshStandardMaterial {...mat} />
      </mesh>
    </group>
  );

  // ── LARGO — long hair: shell cap + back curtain, face completely open ──
  if (hairStyle === "Largo") return (
    <group scale={[hsx, 1.0, hsz]}>
      {/* Crown shell */}
      <mesh position={[0, headR * 0.04, backZ]}>
        <sphereGeometry args={[headR * 1.058, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      {/* Back curtain — hangs down from the nape */}
      <mesh position={[0, -headR * 0.72, -headR * 0.48]} scale={[0.82, 1.0, 0.58]}>
        <capsuleGeometry args={[headR * 0.72, headR * 0.90, 12, 20]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      {/* Side curtains — behind ear-line, fall downward */}
      {[-1, 1].map((side) => (
        <mesh key={side}
          position={[side * headR * 0.74, -headR * 0.58, -headR * 0.22]}
          scale={[0.28, 1.0, 0.50]}
        >
          <capsuleGeometry args={[headR * 0.68, headR * 0.70, 10, 16]} />
          <meshStandardMaterial {...mat} />
        </mesh>
      ))}
    </group>
  );

  // ── RECOGIDO — updo bun, smooth sides, face open ──
  if (hairStyle === "Recogido") return (
    <group scale={[hsx, 1.0, hsz]}>
      {/* Tight cap */}
      <mesh position={[0, headR * 0.04, backZ]}>
        <sphereGeometry args={[headR * 1.042, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.60]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      {/* Bun at nape (back of neck) */}
      <mesh position={[0, -headR * 0.35, -headR * 0.85]} scale={[1.2, 0.95, 0.95]}>
        <sphereGeometry args={[headR * 0.35, 24, 24]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      {/* Hair tie */}
      <mesh position={[0, -headR * 0.25, -headR * 0.70]} rotation={[0.4, 0, 0]}>
        <torusGeometry args={[headR * 0.25, 0.012, 8, 24]} />
        <meshStandardMaterial color="#111111" roughness={0.8} />
      </mesh>
    </group>
  );

  return null;
}

// Removed HatComponent, TattooSleeve and ShirtCollars

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
  pantsFit = "Regular",
  bodyType = "Normal",
  muscleDefinition = 0.3,
  eyebrowStyle = "Normal",
  tattooArm = "Ninguno",
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
  pantsFit?: string;
  bodyType?: string;
  muscleDefinition?: number;
  eyebrowStyle?: string;
  tattooArm?: string;
}) {
  const [cottonTex, leatherTex, denimTex, tattooTex] = useTexture([
    "/textures/cotton.png",
    "/textures/leather.png",
    "/textures/denim.png",
    "/textures/tattoo_maori.png",
  ]);

  [cottonTex, leatherTex, denimTex, tattooTex].forEach((tex) => {
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

  // -- Body type modifiers (split: chest / belly / arms) --
  const muscFactor = 1 + muscleDefinition * 0.22;
  const chestFat = bodyType === "Robusto" ? 1.05 : bodyType === "Atlético" ? 1.04 : bodyType === "Delgado" ? 0.88 : 1.0;
  const bellyFat = bodyType === "Robusto" ? 1.38 : bodyType === "Atlético" ? 0.93 : bodyType === "Delgado" ? 0.85 : 1.0;
  const armMod   = bodyType === "Atlético" ? 1.14 : bodyType === "Robusto" ? 1.06 : bodyType === "Delgado" ? 0.88 : 1.0;
  const hipFat   = bodyType === "Robusto"  ? 1.10 : bodyType === "Atlético" ? 1.02 : bodyType === "Delgado" ? 0.90 : 1.0;

  // -- Chest / torso dims (slimmer) --
  const chestR    = isFemale ? 0.112 * chestFat : 0.115 * chestFat * muscFactor;
  const waistR    = isFemale ? 0.092 * bellyFat : 0.098; // Base waist for men, scaled via group

  let bellyScaleX = 1.0;
  let bellyScaleZ = 1.0;
  if (!isFemale) {
    if (bodyType === "Robusto") {
      bellyScaleX = 1.35; // Cintura más ancha
      bellyScaleZ = 1.8;  // Panza mucho más pronunciada hacia adelante
    } else if (bodyType === "Atlético" || bodyType === "Normal") {
      bellyScaleX = 1.25; // Cintura como el viejo robusto
      bellyScaleZ = 1.38; // Panza como el viejo robusto
    } else {
      bellyScaleX = 0.85;
      bellyScaleZ = 0.85;
    }
  }
  const hipR_base = isFemale ? 0.145 * hipFat   : 0.125 * hipFat;
  const shoulderX = isFemale ? 0.115 * chestFat : 0.128 * chestFat * muscFactor;
  const breastR   = isFemale ? 0.060 * chestFat : 0;

  // -- Arm segment dims --
  const upperArmR = isFemale ? 0.034 : 0.038 * muscFactor * armMod;
  const foreArmR  = isFemale ? 0.030 : 0.036 * armMod;

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
          eyebrowStyle={eyebrowStyle || "Normal"}
        />

        {/* Hair */}
        <HairComponent hairStyle={hairStyle} hairColor={hairColor} isFemale={isFemale} />
      </group>

      {/* ── NECK — realistic tapered cylinder with sternocleidomastoid suggestion ── */}
      <group position={[0, 1.585, 0]}>
        {/* Main neck column — slightly wider at base */}
        <mesh>
          <cylinderGeometry args={[
            isFemale ? 0.036 : 0.045,
            isFemale ? 0.044 : 0.056,
            0.13, 32
          ]} />
          <meshStandardMaterial {...skinMat} />
        </mesh>
        {/* Adam's apple suggestion (male only) */}
        {!isFemale && (
          <mesh position={[0, 0.012, 0.038]} scale={[0.55, 0.45, 0.30]}>
            <sphereGeometry args={[0.032, 16, 12]} />
            <meshStandardMaterial {...skinMat} />
          </mesh>
        )}
      </group>

      {/* ── TORSO ── */}
      <group position={[0, 1.20, 0]}>
        {/* Chest — slimmer capsule, taller to look more natural */}
        <mesh position={[0, 0.10, 0]}>
          <capsuleGeometry args={[chestR, 0.22, 32, 32]} />
          <meshStandardMaterial {...shirtMat} />
        </mesh>

        {/* Basic shirt style only */}

        {/* Female bust */}
        {isFemale && breastR > 0 && (
          <group position={[0, 0.10, 0.12]}>
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


        {/* Abdomen/belly — bigger for Robusto thanks to bellyFat */}
        <group scale={[isFemale ? 1 : bellyScaleX, 1, isFemale ? 1 : bellyScaleZ]}>
          <mesh position={[0, -0.10, 0]}>
            <capsuleGeometry args={[waistR, 0.20, 32, 32]} />
            <meshStandardMaterial {...shirtMat} />
          </mesh>

          {/* Removed Shirt hem as requested */}
        </group>
      </group>

      {/* ── LEFT SHOULDER + ARM ── */}
      <group position={[-shoulderX, 1.50, 0]}>
        {/* Shoulder sphere — smaller, natural */}
        <mesh>
          <sphereGeometry args={[isFemale ? 0.038 : 0.042 * muscFactor * armMod, 32, 32]} />
          <meshStandardMaterial {...shirtMat} />
        </mesh>
        <group rotation={[0, 0, -0.14]}>
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
            {tattooArm === "Brazo Izquierdo" && (
              <mesh position={[0, -0.12, 0]}>
                <capsuleGeometry args={[foreArmR * 1.01, 0.23, 16, 32]} />
                <meshStandardMaterial map={tattooTex} transparent color="#0a0a0a" roughness={0.7} opacity={0.85} alphaTest={0.1} />
              </mesh>
            )}
            {/* Wrist and Hand (single oval) */}
            <mesh position={[0, -0.29, 0]} scale={[1.0, 1.3, 1.0]}>
              <sphereGeometry args={[foreArmR * 1.05, 24, 24]} />
              <meshStandardMaterial {...skinMat} />
            </mesh>
          </group>
        </group>
      </group>

      {/* ── RIGHT SHOULDER + ARM ── */}
      <group position={[shoulderX, 1.50, 0]}>
        <mesh>
          <sphereGeometry args={[isFemale ? 0.038 : 0.042 * muscFactor * armMod, 32, 32]} />
          <meshStandardMaterial {...shirtMat} />
        </mesh>
        <group rotation={[0, 0, 0.14]}>
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
            {/* Tattoo sleeve */}
            {tattooArm === "Brazo Derecho" && (
              <mesh position={[0, -0.12, 0]}>
                <capsuleGeometry args={[foreArmR * 1.01, 0.23, 16, 32]} />
                <meshStandardMaterial map={tattooTex} transparent color="#0a0a0a" roughness={0.7} opacity={0.85} alphaTest={0.1} />
              </mesh>
            )}
            {/* Wrist and Hand (single oval) */}
            <mesh position={[0, -0.29, 0]} scale={[1.0, 1.3, 1.0]}>
              <sphereGeometry args={[foreArmR * 1.05, 24, 24]} />
              <meshStandardMaterial {...skinMat} />
            </mesh>
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
          <mesh position={[thighR * 0.85, -0.25, 0]} scale={[0.4, 0.5, 0.2]}>
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
  initialBodyType = "Normal",
  initialMuscleDefinition = 0.3,
  initialEyebrowStyle = "Normal",
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
  const [eyebrowStyle, setEyebrowStyle] = useState(initialEyebrowStyle);

  // Clothes
  const [shirtColor, setShirtColor] = useState(initialShirtColor);
  const [shoesColor, setShoesColor] = useState(initialShoesColor);

  // Extras
  const [tattooArm, setTattooArm] = useState("Ninguno");

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
  const bodyTypes = ["Delgado", "Normal", "Atlético", "Robusto"];
  const eyebrowStyles = ["Fino", "Normal", "Grueso"];

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
      false, // glasses
      bodyType,
      muscleDefinition,
      "Ninguna", // beardStyle
      "#2d1a0e", // beardColor
      eyebrowStyle,
      "Ninguno", // hatStyle
      "Basic", // shirtStyle
      tattooArm === "Brazo Izquierdo" ? true : false,
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
            bodyType={bodyType}
            muscleDefinition={muscleDefinition}
            eyebrowStyle={eyebrowStyle}
            tattooArm={tattooArm}
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
            </div>
          )}

          {/* ── CLOTHES TAB ── */}
          {activeTab === "clothes" && (
            <div className="space-y-7 animate-in fade-in slide-in-from-right-4 duration-300">

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
                <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2"><PenTool className="w-4 h-4"/> Tatuajes</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Ninguno", "Brazo Izquierdo", "Brazo Derecho"].map((opt) => (
                    <button key={opt} onClick={() => setTattooArm(opt)}
                      className={`py-2.5 font-bold rounded-xl border-2 text-xs transition-all ${tattooArm === opt
                        ? "bg-purple-50 dark:bg-purple-900/20 border-purple-600 text-purple-700"
                        : "border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:border-neutral-300"
                      }`}
                    >{opt}</button>
                  ))}
                </div>
                {tattooArm !== "Ninguno" && (
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
                  ["Tatuajes", tattooArm],
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


export function ParametricPants({
  color = "#1e3a8a",
  avatarScaleXZ = 1.0,
  avatarScaleY = 1.0,
  pantsScaleX = 1.0,
  pantsScaleY = 1.0,
  pantsFit = "Regular",
  isFemale = false,
}: {
  color?: string;
  avatarScaleXZ?: number;
  avatarScaleY?: number;
  pantsScaleX?: number;
  pantsScaleY?: number;
  pantsFit?: string;
  isFemale?: boolean;
}) {
  const [denimTex] = useTexture(["/textures/denim.png"]);
  if (denimTex) {
    denimTex.wrapS = THREE.RepeatWrapping;
    denimTex.wrapT = THREE.RepeatWrapping;
    denimTex.repeat.set(2, 2);
  }
  
  const deniMat = {
    color: color,
    map: denimTex,
    roughness: 0.82,
    metalness: 0.02,
  };

  let thighMod = 0, calfMod = 0, hipMod = 0;
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
      hipMod = 0.02; thighMod = -0.008; calfMod = -0.015; break;
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

  const hipR_base = isFemale ? 0.145 : 0.125;
  
  // We add an offset so it sits *outside* the skin.
  const offset = 0.008;
  const finalHipR = (hipR_base + hipMod + offset * 1.5) * pantsScaleX;
  const thighR = ((isFemale ? 0.068 : 0.062) + thighMod + offset) * pantsScaleX;
  const calfR = ((isFemale ? 0.046 : 0.05) + calfMod + offset) * pantsScaleX;
  
  const modelY = -0.9 + (0.111 * avatarScaleY);

  return (
    <group scale={[avatarScaleXZ, avatarScaleY, avatarScaleXZ]} position={[0, modelY, 0]}>
      {/* ── HIPS / PELVIS ── */}
      <mesh position={[0, 0.87, 0]}>
        <sphereGeometry args={[finalHipR, 32, 32]} />
        <meshStandardMaterial {...deniMat} />
      </mesh>

      {isSkirt && (
        <mesh position={[0, 0.65, 0]}>
          <cylinderGeometry args={[finalHipR * 1.02, finalHipR * 1.3, 0.45, 32]} />
          <meshStandardMaterial {...deniMat} />
        </mesh>
      )}

      {/* Belt */}
      <mesh position={[0, 0.90, 0]}>
        <cylinderGeometry args={[finalHipR * 1.03, finalHipR * 1.03, 0.04, 32]} />
        <meshStandardMaterial color="#111" roughness={0.9} />
      </mesh>
      {/* Belt buckle */}
      <mesh position={[0, 0.90, finalHipR * 1.05]}>
        <boxGeometry args={[0.04, 0.038, 0.01]} />
        <meshStandardMaterial color="#c0a060" roughness={0.2} metalness={0.85} />
      </mesh>

      {/* ── LEFT LEG ── */}
      {!isSkirt && (
        <group position={[isFemale ? -0.095 : -0.088, 0.82, 0]} scale={[1, pantsScaleY, 1]}>
          <mesh position={[0, -0.24, 0]}>
            <capsuleGeometry args={[thighR, 0.30, 16, 32]} />
            <meshStandardMaterial {...deniMat} />
          </mesh>
          {isBermuda && (
            <mesh position={[0, -0.4, 0]}>
              <cylinderGeometry args={[thighR * 1.05, thighR * 1.05, 0.03, 32]} />
              <meshStandardMaterial {...deniMat} />
            </mesh>
          )}
          {!isBermuda && (
            <>
              <mesh position={[0, -0.43, 0.018]}>
                <sphereGeometry args={[thighR * 0.88, 28, 28]} />
                <meshStandardMaterial {...deniMat} />
              </mesh>
              {pantsFit === "Relaxed" && (
                <mesh position={[-thighR * 0.85, -0.25, 0]} scale={[0.4, 0.5, 0.2]}>
                  <boxGeometry args={[0.1, 0.12, 0.04]} />
                  <meshStandardMaterial {...deniMat} />
                </mesh>
              )}
              <mesh position={[0, -0.64, 0]}>
                <capsuleGeometry args={[calfR, 0.28, 16, 32]} />
                <meshStandardMaterial {...deniMat} />
              </mesh>
              {isFlared && (
                <mesh position={[0, -0.72, 0]}>
                  <cylinderGeometry args={[calfR, calfR * 1.8, 0.35, 32]} />
                  <meshStandardMaterial {...deniMat} />
                </mesh>
              )}
            </>
          )}
        </group>
      )}

      {/* ── RIGHT LEG ── */}
      {!isSkirt && (
        <group position={[isFemale ? 0.095 : 0.088, 0.82, 0]} scale={[1, pantsScaleY, 1]}>
          <mesh position={[0, -0.24, 0]}>
            <capsuleGeometry args={[thighR, 0.30, 16, 32]} />
            <meshStandardMaterial {...deniMat} />
          </mesh>
          {isBermuda && (
            <mesh position={[0, -0.4, 0]}>
              <cylinderGeometry args={[thighR * 1.05, thighR * 1.05, 0.03, 32]} />
              <meshStandardMaterial {...deniMat} />
            </mesh>
          )}
          {!isBermuda && (
            <>
              <mesh position={[0, -0.43, 0.018]}>
                <sphereGeometry args={[thighR * 0.88, 28, 28]} />
                <meshStandardMaterial {...deniMat} />
              </mesh>
              {pantsFit === "Relaxed" && (
                <mesh position={[thighR * 0.85, -0.25, 0]} scale={[0.4, 0.5, 0.2]}>
                  <boxGeometry args={[0.1, 0.12, 0.04]} />
                  <meshStandardMaterial {...deniMat} />
                </mesh>
              )}
              <mesh position={[0, -0.64, 0]}>
                <capsuleGeometry args={[calfR, 0.28, 16, 32]} />
                <meshStandardMaterial {...deniMat} />
              </mesh>
              {isFlared && (
                <mesh position={[0, -0.72, 0]}>
                  <cylinderGeometry args={[calfR, calfR * 1.8, 0.35, 32]} />
                  <meshStandardMaterial {...deniMat} />
                </mesh>
              )}
            </>
          )}
        </group>
      )}
    </group>
  );
}
