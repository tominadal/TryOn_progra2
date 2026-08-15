import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { RealisticFace } from './Face';
import { HairComponent } from './Hair';

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

  const skinMat = { color: skinColor, map: null, roughness: 0.5, metalness: 0.05 };
  const shirtMat = { color: shirtColor, map: cottonTex, roughness: 0.88, metalness: 0.0 };
  const deniMat = {
    color: pantsColor || "#1e3a8a",
    map: denimTex,
    roughness: 0.82,
    metalness: 0.02,
  };

  const shoulderMat = shirtSleeve === "Sin Mangas" ? skinMat : shirtMat;
  const upperArmMat = shirtSleeve === "Sin Mangas" ? skinMat : shirtMat;
  const foreArmMat = shirtSleeve === "Manga Larga" ? shirtMat : skinMat;

  const shoeMat = { color: shoesColor, map: leatherTex, roughness: 0.4, metalness: 0.25 };
  const glassMat = { color: "#222222", roughness: 0.05, metalness: 0.9, transparent: true, opacity: 0.45 };
  const frameMat = { color: "#0a0a0a", roughness: 0.2, metalness: 0.9 };

  const isFemale = gender === "Mujer";

  // -- Body type modifiers --
  const muscFactor = 1 + (muscleDefinition || 0) * 0.22;
  const chestFat = chestWidth || 1.0;
  const armMod   = armThickness || 1.0;
  const hipFat   = hipWidth || 1.0;
  const neckMod  = neckThickness || 1.0;
  const breastMod= breastSize || 1.0;

  // -- Chest / torso dims --
  const baseChestR = isFemale ? 0.112 : 0.115 * muscFactor;
  const chestR     = baseChestR * chestFat;
  const waistR     = isFemale ? 0.092 * (bellyWidth || 1.0) : 0.098 * (bellyWidth || 1.0);

  let bellyScaleX = bellyWidth || 1.0;
  let bellyScaleZ = (bellyDepth || 1.0) * (isFemale ? 1.0 : 1.3);
  
  const hipR_base = isFemale ? 0.145 * hipFat   : 0.125 * hipFat;
  const shoulderX = isFemale ? 0.115 * chestFat : 0.128 * chestFat * muscFactor;
  const breastR   = isFemale ? 0.060 * chestFat * breastMod : 0;
  
  // Calculate adjusted capsule length to prevent height growth when chest fat increases
  const deltaChestR = chestR - baseChestR;
  const chestLength = Math.max(0.1, (isFemale ? 0.27 : 0.22) - (2 * deltaChestR));

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
  const thighR = (isFemale ? 0.068 : 0.062) * (legThickness || 1.0) + thighMod;
  const calfR = (isFemale ? 0.046 : 0.05) * (legThickness || 1.0) + calfMod;

  const actualDeniMat = isNakedBottom ? skinMat : deniMat;
  const thighMat = isSkirt && !isNakedBottom ? skinMat : actualDeniMat;
  const kneeMat = (isSkirt || isBermuda) && !isNakedBottom ? skinMat : actualDeniMat;
  const lowerLegMat = (isSkirt || isBermuda) && !isNakedBottom ? skinMat : actualDeniMat;


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
        <mesh scale={[neckMod, 1, neckMod]}>
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
        <mesh position={[0, isFemale ? 0.152 : 0.12, 0]}>
          <capsuleGeometry args={[chestR, chestLength, 32, 32]} />
          <meshStandardMaterial {...shirtMat} />
        </mesh>

        {/* Basic shirt style only */}

        {/* Female bust */}
        {isFemale && breastR > 0 && (
          <group position={[0, 0.225, 0.12]}>
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
          <meshStandardMaterial key={shirtSleeve} {...shoulderMat} />
        </mesh>
        <group rotation={[0, 0, -0.14]}>
          {/* Upper arm */}
          <mesh position={[0, -0.13, 0]}>
            <capsuleGeometry args={[upperArmR, 0.20, 16, 32]} />
            <meshStandardMaterial key={shirtSleeve} {...upperArmMat} />
          </mesh>
          <group position={[0, -0.27, 0]} rotation={[-0.12, 0, -0.04]}>
            {/* Elbow */}
            <mesh>
              <sphereGeometry args={[foreArmR * 0.95, 24, 24]} />
              <meshStandardMaterial key={shirtSleeve} {...foreArmMat} />
            </mesh>
            {/* Forearm */}
            <mesh position={[0, -0.12, 0]}>
              <capsuleGeometry args={[foreArmR, 0.23, 16, 32]} />
              <meshStandardMaterial key={shirtSleeve} {...foreArmMat} />
            </mesh>
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
          <meshStandardMaterial key={shirtSleeve} {...shoulderMat} />
        </mesh>
        <group rotation={[0, 0, 0.14]}>
          <mesh position={[0, -0.13, 0]}>
            <capsuleGeometry args={[upperArmR, 0.20, 16, 32]} />
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
        <meshStandardMaterial {...(isNakedBottom ? skinMat : actualDeniMat)} />
      </mesh>

      {/* Skirt Cone */}
      {isSkirt && !isNakedBottom && (
        <mesh position={[0, 0.65, 0]}>
          <cylinderGeometry args={[finalHipR * 1.02, finalHipR * 1.3, 0.45, 32]} />
          <meshStandardMaterial {...deniMat} />
        </mesh>
      )}

      {/* Belt */}
      {!isNakedBottom && (
        <mesh position={[0, 0.90, 0]}>
          <cylinderGeometry args={[finalHipR * 1.03, finalHipR * 1.03, 0.04, 32]} />
          <meshStandardMaterial color="#111" roughness={0.9} />
        </mesh>
      )}
      {/* Belt buckle */}
      {!isNakedBottom && (
        <mesh position={[0, 0.90, finalHipR * 1.05]}>
          <boxGeometry args={[0.04, 0.038, 0.01]} />
          <meshStandardMaterial color={shoeMat.color} roughness={0.2} metalness={0.85} />
        </mesh>
      )}

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
