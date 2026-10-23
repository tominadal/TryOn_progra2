import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { RealisticFace } from "./Face";
import { HairComponent } from "./Hair";
import { RealisticHand } from "./Hands";
import { ModernShoe } from "./Shoes";

// ──────────────────────────────────────────────────────────────────────────────
//  MAIN PARAMETRIC MANNEQUIN — High-Realism Humanoid with Full Anatomy
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
  muscleDefinition = 0.3,
  eyebrowStyle = "Normal",
  shirtSleeve = "Manga Corta",
  chestWidth = 1.0,
  bellyWidth = 1.0,
  bellyDepth = 1.0,
  hipWidth = 1.0,
  armThickness = 1.0,
  legThickness = 1.0,
  shoulderWidth = 1.0,
  breastSize = 1.0,
  neckThickness = 1.0,
  isNakedBottom = false,
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
  muscleDefinition?: number;
  eyebrowStyle?: string;
  shirtSleeve?: string;
  chestWidth?: number;
  bellyWidth?: number;
  bellyDepth?: number;
  hipWidth?: number;
  armThickness?: number;
  legThickness?: number;
  shoulderWidth?: number;
  breastSize?: number;
  neckThickness?: number;
  isNakedBottom?: boolean;
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

  const skinMat = { color: skinColor, roughness: 0.62, metalness: 0.03 };
  const shirtMat = { color: shirtColor, map: cottonTex, roughness: 0.88, metalness: 0.0 };
  const deniMat = {
    color: pantsColor || "#1e3a8a",
    map: denimTex,
    roughness: 0.82,
    metalness: 0.02,
  };

  const isFemale = gender === "Mujer";

  const shoulderMat = shirtSleeve === "Sin Mangas" ? skinMat : shirtMat;
  const upperArmMat = shirtSleeve === "Sin Mangas" ? skinMat : shirtMat;
  const foreArmMat = shirtSleeve === "Manga Larga" ? shirtMat : skinMat;

  const shoeMat = { color: shoesColor, map: leatherTex, roughness: 0.45, metalness: 0.15 };

  // ── Anatomical Modifiers ──────────────────────────────────────────────────
  const muscFactor = 1 + (muscleDefinition || 0) * 0.22;
  const chestFat = chestWidth || 1.0;
  const armMod = armThickness || 1.0;
  const hipFat = hipWidth || 1.0;
  const neckMod = neckThickness || 1.0;
  const breastMod = breastSize || 1.0;

  // Torso dimensions
  const baseChestR = isFemale ? 0.114 : 0.118 * muscFactor;
  const chestR = baseChestR * chestFat;
  const waistR = isFemale ? 0.092 * (bellyWidth || 1.0) : 0.098 * (bellyWidth || 1.0);

  const bellyScaleX = bellyWidth || 1.0;
  const bellyScaleZ = (bellyDepth || 1.0) * (isFemale ? 1.0 : 1.25);

  const hipR_base = isFemale ? 0.142 * hipFat : 0.126 * hipFat;
  const shoulderX = isFemale ? 0.125 * chestFat : 0.142 * chestFat * muscFactor;
  const breastR = isFemale ? 0.062 * chestFat * breastMod : 0;

  const deltaChestR = chestR - baseChestR;
  const chestLength = Math.max(0.12, (isFemale ? 0.26 : 0.23) - 2 * deltaChestR);

  // Arm & Leg segment dimensions
  const upperArmR = isFemale ? 0.034 : 0.038 * muscFactor * armMod;
  const foreArmR = isFemale ? 0.030 : 0.035 * armMod;

  // Pants fit modifiers
  let thighMod = 0,
    calfMod = 0,
    hipMod = 0;
  switch (pantsFit) {
    case "Skinny":
      thighMod = -0.015;
      calfMod = -0.018;
      break;
    case "Wide Leg":
      thighMod = 0.03;
      calfMod = 0.038;
      break;
    case "Relaxed":
      thighMod = 0.02;
      calfMod = 0.025;
      break;
    case "Mom Fit":
      hipMod = 0.025;
      thighMod = 0.012;
      calfMod = -0.005;
      break;
    case "Skinny-Mom":
      hipMod = 0.02;
      thighMod = -0.008;
      calfMod = -0.015;
      break;
    case "Bermuda":
      thighMod = 0.01;
      break;
    case "Flared":
      hipMod = 0.01;
      thighMod = -0.01;
      calfMod = -0.015;
      break;
    case "Skirt":
      hipMod = 0.01;
      thighMod = -0.01;
      calfMod = -0.01;
      break;
  }

  const isBermuda = pantsFit === "Bermuda";
  const isSkirt = pantsFit === "Skirt";
  const isFlared = pantsFit === "Flared";

  const finalHipR = hipR_base + hipMod;
  const thighR = (isFemale ? 0.068 : 0.062) * (legThickness || 1.0) + thighMod;
  const calfR = (isFemale ? 0.046 : 0.05) * (legThickness || 1.0) + calfMod;

  const actualDeniMat = isNakedBottom ? skinMat : deniMat;
  const thighMat = isSkirt && !isNakedBottom ? skinMat : actualDeniMat;
  const kneeMat = (isSkirt || isBermuda) && !isNakedBottom ? skinMat : actualDeniMat;
  const lowerLegMat = (isSkirt || isBermuda) && !isNakedBottom ? skinMat : actualDeniMat;

  const modelY = -0.9 + 0.111 * scaleY;

  return (
    <group scale={[scaleXZ, scaleY, scaleXZ]} position={[0, modelY, 0]}>
      {/* ── HEAD ── */}
      <group position={[0, 1.72, 0]}>
        <RealisticFace
          skinColor={skinColor}
          isFemale={isFemale}
          eyebrowStyle={eyebrowStyle || "Normal"}
        />
        <HairComponent hairStyle={hairStyle} hairColor={hairColor} isFemale={isFemale} />
      </group>

      {/* ── NECK & CLAVICLES & TRAPEZIUS ── */}
      <group position={[0, 1.585, 0]}>
        {/* Main neck column */}
        <mesh scale={[neckMod, 1, neckMod]}>
          <cylinderGeometry
            args={[
              isFemale ? 0.035 : 0.044,
              isFemale ? 0.044 : 0.055,
              0.13,
              32,
            ]}
          />
          <meshStandardMaterial {...skinMat} />
        </mesh>

        {/* Adam's apple (male) */}
        {!isFemale && (
          <mesh position={[0, 0.012, 0.038]} scale={[0.55, 0.45, 0.3]}>
            <sphereGeometry args={[0.032, 16, 12]} />
            <meshStandardMaterial {...skinMat} />
          </mesh>
        )}

        {/* Trapezius slope cushion (Connects neck smoothly to shoulders) */}
        <mesh position={[0, -0.045, -0.015]} scale={[shoulderX * 1.6, 0.065, 0.09]}>
          <coneGeometry args={[1, 1, 16]} />
          <meshStandardMaterial {...shoulderMat} />
        </mesh>

        {/* Clavicles (Collarbones) — Defined anatomical ridge */}
        {[-1, 1].map((side) => (
          <group key={`clavicle-${side}`} position={[side * 0.055, -0.062, 0.032]} rotation={[0, side * 0.18, side * -0.08]}>
            <mesh scale={[1.4, 0.35, 0.45]}>
              <capsuleGeometry args={[0.0075, 0.065, 8, 12]} />
              <meshStandardMaterial {...(shirtSleeve === "Sin Mangas" ? skinMat : shirtMat)} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ── TORSO & CHEST ── */}
      <group position={[0, 1.2, 0]}>
        {/* Crew-neck shirt collar ring */}
        <mesh position={[0, isFemale ? 0.325 : 0.315, 0.005]} rotation={[0.18, 0, 0]}>
          <torusGeometry args={[isFemale ? 0.052 : 0.060, 0.008, 12, 32]} />
          <meshStandardMaterial {...shirtMat} roughness={0.92} />
        </mesh>

        {/* Main Chest Capsule */}
        <mesh position={[0, isFemale ? 0.152 : 0.12, 0]}>
          <capsuleGeometry args={[chestR, chestLength, 32, 32]} />
          <meshStandardMaterial {...shirtMat} />
        </mesh>

        {/* Pectoral Muscle Plates (Male) */}
        {!isFemale && muscleDefinition > 0.05 && (
          <group position={[0, 0.165, 0.085]}>
            {[-1, 1].map((side) => (
              <mesh
                key={`pec-${side}`}
                position={[side * (0.052 * chestFat), 0, 0.018 * muscFactor]}
                rotation={[0.12, side * -0.15, 0]}
                scale={[1.15 * chestFat, 0.85, 0.55 * muscFactor]}
              >
                <boxGeometry args={[0.075, 0.065, 0.04]} />
                <meshStandardMaterial {...shirtMat} />
              </mesh>
            ))}
          </group>
        )}

        {/* Female Bust Contour */}
        {isFemale && breastR > 0 && (
          <group position={[0, 0.22, 0.11]}>
            {[-1, 1].map((side) => (
              <mesh
                key={`breast-${side}`}
                position={[side * 0.065, 0, 0]}
                rotation={[0.22, side * -0.12, 0]}
                scale={[1.05, 1.15, 1.25]}
              >
                <sphereGeometry args={[breastR, 32, 32]} />
                <meshStandardMaterial {...shirtMat} />
              </mesh>
            ))}
          </group>
        )}

        {/* Latissimus Dorsi (Lats / V-Taper back shape) */}
        <mesh position={[0, 0.12, -0.045]} scale={[chestR * 1.12, chestLength * 0.85, chestR * 0.65]}>
          <cylinderGeometry args={[1, 0.82, 1, 24]} />
          <meshStandardMaterial {...shirtMat} />
        </mesh>

        {/* Abdomen / Waist */}
        <group scale={[isFemale ? 1 : bellyScaleX, 1, isFemale ? 1 : bellyScaleZ]}>
          <mesh position={[0, -0.1, 0]}>
            <capsuleGeometry args={[waistR, 0.2, 32, 32]} />
            <meshStandardMaterial {...shirtMat} />
          </mesh>

          {/* Abs definition based on muscle slider */}
          {muscleDefinition > 0.1 && (
            <group position={[0, -0.1, 0]}>
              {[
                [-0.038, 0.07],
                [0.038, 0.07],
                [-0.038, 0.0],
                [0.038, 0.0],
                [-0.032, -0.07],
                [0.032, -0.07],
              ].map((pos, i) => {
                const zScale = 0.35 * muscleDefinition;
                return (
                  <mesh
                    key={`ab-${i}`}
                    position={[pos[0], pos[1], waistR * 0.94]}
                    scale={[isFemale ? 0.8 : 1, 1.25, zScale]}
                  >
                    <sphereGeometry args={[0.034, 16, 16]} />
                    <meshStandardMaterial {...shirtMat} />
                  </mesh>
                );
              })}
            </group>
          )}
        </group>
      </group>

      {/* ── LEFT SHOULDER & ARTICULATED ARM ── */}
      <group position={[-shoulderX, 1.5, 0]}>
        {/* Deltoid muscle cap (Shoulder roundness) */}
        <mesh scale={[1.15, 1.25, 1.05]}>
          <sphereGeometry args={[isFemale ? 0.038 : 0.044 * muscFactor * armMod, 32, 32]} />
          <meshStandardMaterial key={shirtSleeve} {...shoulderMat} />
        </mesh>

        {/* Upper arm (Biceps / Triceps) */}
        <group rotation={[0, 0, -0.12]}>
          <mesh position={[0, -0.13, 0]}>
            <capsuleGeometry args={[upperArmR, 0.2, 16, 32]} />
            <meshStandardMaterial key={shirtSleeve} {...upperArmMat} />
          </mesh>

          {/* Forearm & Articulated Hand */}
          <group position={[0, -0.27, 0]} rotation={[-0.12, 0, -0.04]}>
            {/* Elbow joint */}
            <mesh>
              <sphereGeometry args={[foreArmR * 0.95, 24, 24]} />
              <meshStandardMaterial key={shirtSleeve} {...foreArmMat} />
            </mesh>
            {/* Forearm */}
            <mesh position={[0, -0.12, 0]}>
              <capsuleGeometry args={[foreArmR, 0.23, 16, 32]} />
              <meshStandardMaterial key={shirtSleeve} {...foreArmMat} />
            </mesh>
            {/* Real Articulated Hand with 5 fingers */}
            <group position={[0, -0.25, 0]} rotation={[0, -0.35, 0]}>
              <RealisticHand isLeft={true} skinMat={skinMat} foreArmR={foreArmR} />
            </group>
          </group>
        </group>
      </group>

      {/* ── RIGHT SHOULDER & ARTICULATED ARM ── */}
      <group position={[shoulderX, 1.5, 0]}>
        {/* Deltoid muscle cap */}
        <mesh scale={[1.15, 1.25, 1.05]}>
          <sphereGeometry args={[isFemale ? 0.038 : 0.044 * muscFactor * armMod, 32, 32]} />
          <meshStandardMaterial key={shirtSleeve} {...shoulderMat} />
        </mesh>

        <group rotation={[0, 0, 0.12]}>
          <mesh position={[0, -0.13, 0]}>
            <capsuleGeometry args={[upperArmR, 0.2, 16, 32]} />
            <meshStandardMaterial key={shirtSleeve} {...upperArmMat} />
          </mesh>

          <group position={[0, -0.27, 0]} rotation={[-0.12, 0, 0.04]}>
            <mesh>
              <sphereGeometry args={[foreArmR * 0.95, 24, 24]} />
              <meshStandardMaterial key={shirtSleeve} {...foreArmMat} />
            </mesh>
            <mesh position={[0, -0.12, 0]}>
              <capsuleGeometry args={[foreArmR, 0.23, 16, 32]} />
              <meshStandardMaterial key={shirtSleeve} {...foreArmMat} />
            </mesh>
            {/* Real Articulated Hand with 5 fingers */}
            <group position={[0, -0.25, 0]} rotation={[0, 0.35, 0]}>
              <RealisticHand isLeft={false} skinMat={skinMat} foreArmR={foreArmR} />
            </group>
          </group>
        </group>
      </group>

      {/* ── PELVIS & DUAL CONTOURED GLUTES ── */}
      <group position={[0, 0.87, 0]}>
        {/* Central pelvis core */}
        <mesh scale={[1.1, 0.88, 0.95]}>
          <sphereGeometry args={[finalHipR * 0.92, 32, 32]} />
          <meshStandardMaterial {...(isNakedBottom ? skinMat : actualDeniMat)} />
        </mesh>

        {/* DUAL GLUTEAL CHEEKS (Left & Right anatomical curves) */}
        {[-1, 1].map((side) => (
          <mesh
            key={`glute-${side}`}
            position={[side * (finalHipR * 0.44), -0.018, -finalHipR * 0.32]}
            rotation={[-0.18, side * 0.12, 0]}
            scale={[1.05, 1.15, 1.12]}
          >
            <sphereGeometry args={[finalHipR * 0.58, 24, 24]} />
            <meshStandardMaterial {...(isNakedBottom ? skinMat : actualDeniMat)} />
          </mesh>
        ))}

        {/* Lower lumbar hollow (Sacrum) */}
        <mesh position={[0, 0.045, -finalHipR * 0.45]} scale={[0.65, 0.35, 0.45]}>
          <sphereGeometry args={[finalHipR * 0.4, 16, 16]} />
          <meshStandardMaterial {...(isNakedBottom ? skinMat : actualDeniMat)} />
        </mesh>
      </group>

      {/* Skirt option */}
      {isSkirt && !isNakedBottom && (
        <mesh position={[0, 0.65, 0]}>
          <cylinderGeometry args={[finalHipR * 1.02, finalHipR * 1.3, 0.45, 32]} />
          <meshStandardMaterial {...deniMat} />
        </mesh>
      )}

      {/* Belt & Buckle */}
      {!isNakedBottom && (
        <>
          <mesh position={[0, 0.9, 0]}>
            <cylinderGeometry args={[finalHipR * 1.03, finalHipR * 1.03, 0.04, 32]} />
            <meshStandardMaterial color="#111" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.9, finalHipR * 1.05]}>
            <boxGeometry args={[0.04, 0.038, 0.01]} />
            <meshStandardMaterial color={shoeMat.color} roughness={0.2} metalness={0.85} />
          </mesh>
        </>
      )}

      {/* ── LEFT LEG ── */}
      <group position={[isFemale ? -0.095 : -0.088, 0.82, 0]}>
        {/* Thigh (Quadriceps contour) */}
        <mesh position={[0, -0.24, 0]} rotation={[0.02, 0, 0.015]}>
          <capsuleGeometry args={[isSkirt ? thighR * 0.9 : thighR, 0.3, 16, 32]} />
          <meshStandardMaterial {...thighMat} />
        </mesh>

        {/* Bermuda Hem */}
        {isBermuda && (
          <mesh position={[0, -0.4, 0]}>
            <cylinderGeometry args={[thighR * 1.05, thighR * 1.05, 0.03, 32]} />
            <meshStandardMaterial {...deniMat} />
          </mesh>
        )}

        {/* Knee with Patella (Rótula) */}
        <group position={[0, -0.43, 0.018]}>
          <mesh>
            <sphereGeometry args={[isSkirt || isBermuda ? thighR * 0.8 : thighR * 0.88, 28, 28]} />
            <meshStandardMaterial {...kneeMat} />
          </mesh>
          {/* Patella bone plate */}
          <mesh position={[0, 0.005, thighR * 0.65]} scale={[0.85, 1.15, 0.35]}>
            <sphereGeometry args={[0.024, 16, 16]} />
            <meshStandardMaterial {...kneeMat} />
          </mesh>
        </group>

        {/* Cargo pocket */}
        {pantsFit === "Relaxed" && (
          <mesh position={[-thighR * 0.85, -0.25, 0]} scale={[0.4, 0.5, 0.2]}>
            <boxGeometry args={[0.1, 0.12, 0.04]} />
            <meshStandardMaterial {...deniMat} />
          </mesh>
        )}

        {/* Calf (Gastrocnemius anatomical bulge) */}
        <group position={[0, -0.64, 0]}>
          <mesh>
            <capsuleGeometry args={[isSkirt || isBermuda ? calfR * 0.9 : calfR, 0.28, 16, 32]} />
            <meshStandardMaterial {...lowerLegMat} />
          </mesh>
          {/* Outer calf curve bulge */}
          <mesh position={[-0.012, 0.05, -0.008]} scale={[0.8, 1.2, 0.9]}>
            <sphereGeometry args={[calfR * 0.92, 16, 16]} />
            <meshStandardMaterial {...lowerLegMat} />
          </mesh>
        </group>

        {/* Flared extension */}
        {isFlared && (
          <mesh position={[0, -0.72, 0]}>
            <cylinderGeometry args={[calfR, calfR * 1.8, 0.35, 32]} />
            <meshStandardMaterial {...deniMat} />
          </mesh>
        )}

        {/* Modern Sculpted Sneaker */}
        <ModernShoe isLeft={true} shoeMat={shoeMat} isFemale={isFemale} calfR={calfR} />
      </group>

      {/* ── RIGHT LEG ── */}
      <group position={[isFemale ? 0.095 : 0.088, 0.82, 0]}>
        {/* Thigh */}
        <mesh position={[0, -0.24, 0]} rotation={[0.02, 0, -0.015]}>
          <capsuleGeometry args={[isSkirt ? thighR * 0.9 : thighR, 0.3, 16, 32]} />
          <meshStandardMaterial {...thighMat} />
        </mesh>

        {/* Bermuda Hem */}
        {isBermuda && (
          <mesh position={[0, -0.4, 0]}>
            <cylinderGeometry args={[thighR * 1.05, thighR * 1.05, 0.03, 32]} />
            <meshStandardMaterial {...deniMat} />
          </mesh>
        )}

        {/* Knee with Patella */}
        <group position={[0, -0.43, 0.018]}>
          <mesh>
            <sphereGeometry args={[isSkirt || isBermuda ? thighR * 0.8 : thighR * 0.88, 28, 28]} />
            <meshStandardMaterial {...kneeMat} />
          </mesh>
          <mesh position={[0, 0.005, thighR * 0.65]} scale={[0.85, 1.15, 0.35]}>
            <sphereGeometry args={[0.024, 16, 16]} />
            <meshStandardMaterial {...kneeMat} />
          </mesh>
        </group>

        {/* Cargo pocket */}
        {pantsFit === "Relaxed" && (
          <mesh position={[thighR * 0.85, -0.25, 0]} scale={[0.4, 0.5, 0.2]}>
            <boxGeometry args={[0.1, 0.12, 0.04]} />
            <meshStandardMaterial {...deniMat} />
          </mesh>
        )}

        {/* Calf */}
        <group position={[0, -0.64, 0]}>
          <mesh>
            <capsuleGeometry args={[isSkirt || isBermuda ? calfR * 0.9 : calfR, 0.28, 16, 32]} />
            <meshStandardMaterial {...lowerLegMat} />
          </mesh>
          <mesh position={[0.012, 0.05, -0.008]} scale={[0.8, 1.2, 0.9]}>
            <sphereGeometry args={[calfR * 0.92, 16, 16]} />
            <meshStandardMaterial {...lowerLegMat} />
          </mesh>
        </group>

        {/* Flared extension */}
        {isFlared && (
          <mesh position={[0, -0.72, 0]}>
            <cylinderGeometry args={[calfR, calfR * 1.8, 0.35, 32]} />
            <meshStandardMaterial {...deniMat} />
          </mesh>
        )}

        {/* Modern Sculpted Sneaker */}
        <ModernShoe isLeft={false} shoeMat={shoeMat} isFemale={isFemale} calfR={calfR} />
      </group>
    </group>
  );
}
