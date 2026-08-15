import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

export function ParametricPants({
  color = "#1e3a8a",
  accentColor,
  avatarScaleXZ = 1.0,
  avatarScaleY = 1.0,
  pantsScaleX = 1.0,
  pantsScaleY = 1.0,
  pantsFit = "Regular",
  isFemale = false,
  roughness = 0.82,
  taper = 0.0,
  waistRise = 0.5,
  hasCuff = false,
  legThickness = 1.0,
  hipWidth = 1.0,
}: {
  color?: string;
  accentColor?: string;
  avatarScaleXZ?: number;
  avatarScaleY?: number;
  pantsScaleX?: number;
  pantsScaleY?: number;
  pantsFit?: string;
  isFemale?: boolean;
  roughness?: number;
  taper?: number;       // -0.5 = wide leg, 0 = straight, 0.5 = skinny
  waistRise?: number;   // 0 = low-rise, 0.5 = mid, 1.0 = high-waist
  hasCuff?: boolean;
  legThickness?: number;
  hipWidth?: number;
}) {
  const [denimTex] = useTexture(["/textures/denim.png"]);
  if (denimTex) {
    denimTex.wrapS = THREE.RepeatWrapping;
    denimTex.wrapT = THREE.RepeatWrapping;
    denimTex.repeat.set(2, 2);
  }

  const accent = accentColor ?? color;
  
  const deniMat = {
    color: color,
    map: denimTex,
    roughness: roughness,
    metalness: 0.02,
  };

  // taper: positive = skinny (smaller calf), negative = wide leg (larger calf)
  // waistRise: shifts the entire garment vertically on the avatar
  const taperFactor = taper * 0.04; // scale taper param to geometry units
  const waistRiseOffset = (waistRise - 0.5) * 0.06; // shift up/down from mid-rise baseline

  let thighMod = 0, calfMod = 0, hipMod = 0;
  switch (pantsFit) {
    case "Skinny":
      thighMod = -0.015 - taperFactor; calfMod = -0.018 - taperFactor; break;
    case "Slim":
      thighMod = -0.008 - taperFactor * 0.5; calfMod = -0.010 - taperFactor * 0.5; break;
    case "Wide Leg":
      thighMod = 0.03 - taperFactor; calfMod = 0.038 - taperFactor; break;
    case "Relaxed":
      thighMod = 0.02 - taperFactor; calfMod = 0.025 - taperFactor; break;
    case "Mom Fit":
      hipMod = 0.025; thighMod = 0.012 - taperFactor; calfMod = -0.005 - taperFactor; break;
    case "Skinny-Mom":
      hipMod = 0.02; thighMod = -0.008 - taperFactor; calfMod = -0.015 - taperFactor; break;
    case "Bermuda":
      thighMod = 0.01 - taperFactor; break;
    case "Flared":
      hipMod = 0.01; thighMod = -0.01 - taperFactor; calfMod = -0.015 - taperFactor; break;
    case "Skirt":
      hipMod = 0.01; thighMod = -0.01; calfMod = -0.01; break;
    default: // Generic: apply raw taper directly
      thighMod = -taperFactor * 0.5; calfMod = -taperFactor; break;
  }

  const fitLower = pantsFit.toLowerCase();
  const isBermuda = fitLower.includes("bermuda") || fitLower.includes("short");
  const isSkirt = fitLower.includes("skirt") || fitLower.includes("pollera");
  const isFlared = fitLower.includes("flare");

  const hipR_base = isFemale ? 0.145 * hipWidth : 0.125 * hipWidth;
  const offset = 0.008;
  
  // We must ensure the pants radius is never smaller than the mannequin's skin radius
  const minHipR = hipR_base + 0.005;
  const minThighR = (isFemale ? 0.068 : 0.062) * legThickness + 0.005;
  const minCalfR = (isFemale ? 0.046 : 0.05) * legThickness + 0.005;

  const finalHipR = Math.max(minHipR, (hipR_base + hipMod) * pantsScaleX + offset * 1.5);
  const thighR = Math.max(minThighR, ((isFemale ? 0.068 : 0.062) * legThickness + thighMod) * pantsScaleX + offset);
  const calfR = Math.max(minCalfR, ((isFemale ? 0.046 : 0.05) * legThickness + calfMod) * pantsScaleX + offset);
  
  // Cancel out the root avatarScaleY for the legs, so pants "quedan cortos" on tall avatars
  const legScaleY = pantsScaleY / (avatarScaleY || 1.0);
  
  const modelY = -0.9 + (0.111 * avatarScaleY) + waistRiseOffset;

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
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.85} />
      </mesh>

      {/* ── LEFT LEG ── */}
      {!isSkirt && (
        <group position={[isFemale ? -0.095 : -0.088, 0.82, 0]} scale={[1, legScaleY, 1]}>
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
              {/* AI-detected cuff */}
              {hasCuff && !isFlared && (
                <mesh position={[0, -0.79, 0]}>
                  <cylinderGeometry args={[calfR * 1.08, calfR * 1.08, 0.04, 32]} />
                  <meshStandardMaterial color={accent} roughness={roughness * 0.9} />
                </mesh>
              )}
            </>
          )}
        </group>
      )}

      {/* ── RIGHT LEG ── */}
      {!isSkirt && (
        <group position={[isFemale ? 0.095 : 0.088, 0.82, 0]} scale={[1, legScaleY, 1]}>
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
              {/* AI-detected cuff */}
              {hasCuff && !isFlared && (
                <mesh position={[0, -0.79, 0]}>
                  <cylinderGeometry args={[calfR * 1.08, calfR * 1.08, 0.04, 32]} />
                  <meshStandardMaterial color={accent} roughness={roughness * 0.9} />
                </mesh>
              )}
            </>
          )}
        </group>
      )}
    </group>
  );
}
