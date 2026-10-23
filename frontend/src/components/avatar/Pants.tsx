import * as THREE from "three";
import { useTexture } from "@react-three/drei";

export interface ParametricPantsProps {
  color?: string;
  accentColor?: string;
  avatarScaleXZ?: number;
  avatarScaleY?: number;
  pantsScaleX?: number;
  pantsScaleY?: number;
  pantsFit?: string;
  isFemale?: boolean;
  roughness?: number;
  taper?: number;
  waistRise?: number;
  hasCuff?: boolean;
  legThickness?: number;
  hipWidth?: number;
  fitTightness?: number; // < -0.2 = Demasiado chico / ajustado, > 0.2 = Demasiado grande / holgado
}

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
  fitTightness = 0.0,
}: ParametricPantsProps) {
  const [denimTex] = useTexture(["/textures/denim.png"]);
  if (denimTex) {
    denimTex.wrapS = THREE.RepeatWrapping;
    denimTex.wrapT = THREE.RepeatWrapping;
    denimTex.repeat.set(2, 2);
  }

  const accent = accentColor ?? color;

  // Fit calculations:
  // fitTightness:
  // -1.0 .. -0.3 = Demasiado chica / Ajustada
  // -0.3 .. 0.3  = Calce perfecto
  //  0.3 .. 1.0  = Demasiado grande / Holgada
  const isTooSmall = fitTightness < -0.25;
  const isTooBig = fitTightness > 0.25;

  // Visual modifications from fitTightness
  // If too small: tighter radius, higher waist constriction, tension wrinkles, hem rides up
  // If too big: loose gap, extra baggy circumference, hem puddles at ankles
  const tightnessRadiusOffset = fitTightness * 0.018; // Positive adds girth, negative reduces
  const hemRideUp = isTooSmall ? Math.abs(fitTightness) * 0.035 : 0; // Short/tight hem rides up
  const puddleAmount = isTooBig ? fitTightness * 0.04 : 0; // Stacking / bunching fabric

  const adjustedRoughness = isTooSmall
    ? Math.max(0.65, roughness - 0.12) // Taut fabric has subtle stretch sheen
    : isTooBig
    ? Math.min(0.92, roughness + 0.05) // Baggy fabric has soft diffuse matte
    : roughness;

  const deniMat = {
    color: color,
    map: denimTex,
    roughness: adjustedRoughness,
    metalness: 0.02,
  };

  const rivetMat = { color: "#d97706", roughness: 0.3, metalness: 0.85 }; // Copper rivets
  const buttonMat = { color: "#cbd5e1", roughness: 0.25, metalness: 0.9 }; // Metal button
  const stitchMat = { color: "#d97706", roughness: 0.8, metalness: 0.0 }; // Gold denim thread

  const taperFactor = taper * 0.04;
  const waistRiseOffset = (waistRise - 0.5) * 0.06;

  let thighMod = 0,
    calfMod = 0,
    hipMod = 0;
  switch (pantsFit) {
    case "Skinny":
      thighMod = -0.015 - taperFactor;
      calfMod = -0.018 - taperFactor;
      break;
    case "Slim":
      thighMod = -0.008 - taperFactor * 0.5;
      calfMod = -0.01 - taperFactor * 0.5;
      break;
    case "Wide Leg":
      thighMod = 0.03 - taperFactor;
      calfMod = 0.038 - taperFactor;
      break;
    case "Relaxed":
      thighMod = 0.02 - taperFactor;
      calfMod = 0.025 - taperFactor;
      break;
    case "Mom Fit":
      hipMod = 0.025;
      thighMod = 0.012 - taperFactor;
      calfMod = -0.005 - taperFactor;
      break;
    case "Skinny-Mom":
      hipMod = 0.02;
      thighMod = -0.008 - taperFactor;
      calfMod = -0.015 - taperFactor;
      break;
    case "Bermuda":
      thighMod = 0.01 - taperFactor;
      break;
    case "Flared":
      hipMod = 0.01;
      thighMod = -0.01 - taperFactor;
      calfMod = -0.015 - taperFactor;
      break;
    case "Skirt":
      hipMod = 0.01;
      thighMod = -0.01;
      calfMod = -0.01;
      break;
    default:
      thighMod = -taperFactor * 0.5;
      calfMod = -taperFactor;
      break;
  }

  const fitLower = pantsFit.toLowerCase();
  const isBermuda = fitLower.includes("bermuda") || fitLower.includes("short");
  const isSkirt = fitLower.includes("skirt") || fitLower.includes("pollera");
  const isFlared = fitLower.includes("flare");

  const hipR_base = isFemale ? 0.142 * hipWidth : 0.126 * hipWidth;
  const offset = isTooSmall ? 0.003 : isTooBig ? 0.022 : 0.009;

  const minHipR = hipR_base + 0.004;
  const minThighR = (isFemale ? 0.068 : 0.062) * legThickness + 0.003;
  const minCalfR = (isFemale ? 0.046 : 0.05) * legThickness + 0.003;

  const finalHipR = Math.max(
    minHipR,
    (hipR_base + hipMod) * pantsScaleX + offset * 1.5 + tightnessRadiusOffset
  );
  const thighR = Math.max(
    minThighR,
    ((isFemale ? 0.068 : 0.062) * legThickness + thighMod) * pantsScaleX +
      offset +
      tightnessRadiusOffset
  );
  const calfR = Math.max(
    minCalfR,
    ((isFemale ? 0.046 : 0.05) * legThickness + calfMod) * pantsScaleX +
      offset +
      tightnessRadiusOffset * 0.8
  );

  const modelY = -0.9 + 0.111 * avatarScaleY;
  const beltY = 0.9 + waistRiseOffset * 3;

  return (
    <group scale={[avatarScaleXZ, avatarScaleY, avatarScaleXZ]} position={[0, modelY, 0]}>
      {/* ── HIPS & WAISTBAND & GLUTEAL FIT ── */}
      <group position={[0, 0.87, 0]}>
        {/* Main pelvis cover */}
        <mesh scale={[1.12, 0.9, 0.96]}>
          <sphereGeometry args={[finalHipR * 0.95, 32, 32]} />
          <meshStandardMaterial {...deniMat} />
        </mesh>

        {/* Dual gluteal pocket mounds on the back */}
        {[-1, 1].map((side) => (
          <group key={`back-pocket-${side}`} position={[side * (finalHipR * 0.42), 0.01, -finalHipR * 0.44]}>
            {/* Glute contour denim patch */}
            <mesh scale={[1.05, 1.15, 1.08]} rotation={[-0.15, side * 0.12, 0]}>
              <sphereGeometry args={[finalHipR * 0.56, 24, 24]} />
              <meshStandardMaterial {...deniMat} />
            </mesh>
            {/* Back Pocket Shield with V-Stitch */}
            <mesh position={[0, -0.015, -0.015]} rotation={[-0.2, side * 0.1, 0]}>
              <boxGeometry args={[finalHipR * 0.38, finalHipR * 0.45, 0.008]} />
              <meshStandardMaterial {...deniMat} roughness={0.88} />
            </mesh>
            {/* Pocket decorative rivet top-outer corner */}
            <mesh position={[side * (finalHipR * 0.18), finalHipR * 0.18, -0.016]}>
              <sphereGeometry args={[0.004, 8, 8]} />
              <meshStandardMaterial {...rivetMat} />
            </mesh>
          </group>
        ))}

        {/* Front Fly J-Stitch seam (Bragueta) */}
        <mesh position={[0.008, 0.02, finalHipR * 0.92]} rotation={[0.08, 0, 0]}>
          <boxGeometry args={[0.004, 0.13, 0.006]} />
          <meshStandardMaterial {...stitchMat} />
        </mesh>

        {/* Curved Front Pockets with Rivets */}
        {[-1, 1].map((side) => (
          <group key={`front-pocket-${side}`} position={[side * (finalHipR * 0.58), 0.06, finalHipR * 0.65]}>
            {/* Curved pocket slit */}
            <mesh rotation={[0, 0, side * -0.45]}>
              <boxGeometry args={[0.045, 0.005, 0.008]} />
              <meshStandardMaterial {...stitchMat} />
            </mesh>
            {/* Copper Rivet */}
            <mesh position={[side * 0.02, -0.008, 0.005]}>
              <sphereGeometry args={[0.0042, 8, 8]} />
              <meshStandardMaterial {...rivetMat} />
            </mesh>
          </group>
        ))}

        {/* ── TENSION WRINKLES (ONLY WHEN TOO SMALL / TIGHT) ── */}
        {isTooSmall && (
          <group position={[0, -0.02, finalHipR * 0.88]}>
            {/* Horizontal pull lines where fabric stretches across the hips */}
            {[-0.03, 0.0, 0.03].map((yOffset, i) => (
              <mesh
                key={`tension-${i}`}
                position={[0, yOffset, (1 - Math.abs(yOffset) * 15) * 0.006]}
                rotation={[0, 0, (i - 1) * 0.06]}
                scale={[finalHipR * 1.5, 0.006, 0.008]}
              >
                <cylinderGeometry args={[1, 1, 1, 16]} />
                <meshStandardMaterial color={color} roughness={0.6} metalness={0.05} />
              </mesh>
            ))}
          </group>
        )}

        {/* ── BAGGY EXCESS FABRIC FOLDS (ONLY WHEN TOO BIG / LOOSE) ── */}
        {isTooBig && (
          <group position={[0, -0.05, 0]}>
            {/* Loose drape folds hanging from waist */}
            {[-1, 1].map((side) => (
              <mesh
                key={`loose-fold-${side}`}
                position={[side * (finalHipR * 0.72), -0.04, finalHipR * 0.4]}
                rotation={[0, 0, side * 0.15]}
                scale={[0.015, 0.12, 0.025]}
              >
                <capsuleGeometry args={[1, 1, 8, 8]} />
                <meshStandardMaterial {...deniMat} />
              </mesh>
            ))}
          </group>
        )}
      </group>

      {/* Skirt option */}
      {isSkirt && (
        <mesh position={[0, 0.65, 0]}>
          <cylinderGeometry args={[finalHipR * 1.02, finalHipR * 1.35, 0.45, 32]} />
          <meshStandardMaterial {...deniMat} />
        </mesh>
      )}

      {/* ── CONTOURED WAISTBAND & HARDWARE ── */}
      <group position={[0, beltY, 0]}>
        {/* Main Waistband Ring */}
        <mesh>
          <cylinderGeometry
            args={[
              finalHipR * (isTooBig ? 1.06 : 1.02),
              finalHipR * (isTooBig ? 1.06 : 1.02),
              0.045,
              32,
            ]}
          />
          <meshStandardMaterial {...deniMat} />
        </mesh>

        {/* Metal Shank Button (Center front) */}
        <mesh position={[0, 0.005, finalHipR * (isTooBig ? 1.07 : 1.03)]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.006, 16]} />
          <meshStandardMaterial {...buttonMat} />
        </mesh>

        {/* Belt Loops (5 classic positions) */}
        {[
          -0.12,
          0.12,
          Math.PI * 0.5,
          Math.PI * 0.82,
          -Math.PI * 0.82,
        ].map((angle, i) => (
          <mesh
            key={`beltloop-${i}`}
            position={[
              Math.sin(angle) * (finalHipR * (isTooBig ? 1.07 : 1.03)),
              0,
              Math.cos(angle) * (finalHipR * (isTooBig ? 1.07 : 1.03)),
            ]}
            rotation={[0, angle, 0]}
          >
            <boxGeometry args={[0.012, 0.046, 0.005]} />
            <meshStandardMaterial {...deniMat} />
          </mesh>
        ))}
      </group>

      {/* High-Rise Abdomen Fill */}
      {waistRiseOffset > 0 && (
        <mesh position={[0, 0.87 + (beltY - 0.87) / 2, 0]}>
          <cylinderGeometry args={[finalHipR * 1.01, finalHipR * 1.01, beltY - 0.87, 32]} />
          <meshStandardMaterial {...deniMat} />
        </mesh>
      )}

      {/* ── LEGS GENERATOR ── */}
      {!isSkirt &&
        [-1, 1].map((legSide) => {
          const isLeft = legSide === -1;
          const posX = isLeft ? (isFemale ? -0.095 : -0.088) : isFemale ? 0.095 : 0.088;
          const legYOffset = hemRideUp; // Shifts up if too small

          return (
            <group
              key={`leg-${legSide}`}
              position={[posX, 0.82 + legYOffset, 0]}
              scale={[1, pantsScaleY, 1]}
            >
              {/* Thigh */}
              <mesh position={[0, -0.24, 0]}>
                <capsuleGeometry args={[thighR, 0.3, 16, 32]} />
                <meshStandardMaterial {...deniMat} />
              </mesh>

              {/* Bermuda Hem */}
              {isBermuda && (
                <mesh position={[0, -0.4, 0]}>
                  <cylinderGeometry args={[thighR * 1.06, thighR * 1.06, 0.035, 32]} />
                  <meshStandardMaterial {...deniMat} />
                </mesh>
              )}

              {!isBermuda && (
                <>
                  {/* Knee transition */}
                  <mesh position={[0, -0.43, 0.018]}>
                    <sphereGeometry args={[thighR * 0.88, 28, 28]} />
                    <meshStandardMaterial {...deniMat} />
                  </mesh>

                  {/* Cargo pocket (Relaxed fit) */}
                  {pantsFit === "Relaxed" && (
                    <mesh position={[legSide * thighR * 0.85, -0.25, 0]} scale={[0.4, 0.5, 0.2]}>
                      <boxGeometry args={[0.1, 0.12, 0.04]} />
                      <meshStandardMaterial {...deniMat} />
                    </mesh>
                  )}

                  {/* Calf */}
                  <mesh position={[0, -0.64, 0]}>
                    <capsuleGeometry args={[calfR, 0.28, 16, 32]} />
                    <meshStandardMaterial {...deniMat} />
                  </mesh>

                  {/* Flared extension */}
                  {isFlared && (
                    <mesh position={[0, -0.72, 0]}>
                      <cylinderGeometry args={[calfR, calfR * 1.8, 0.35, 32]} />
                      <meshStandardMaterial {...deniMat} />
                    </mesh>
                  )}

                  {/* Cuff (Turn-up hem) */}
                  {hasCuff && !isFlared && (
                    <mesh position={[0, -0.79, 0]}>
                      <cylinderGeometry args={[calfR * 1.08, calfR * 1.08, 0.04, 32]} />
                      <meshStandardMaterial color={accent} roughness={roughness * 0.9} />
                    </mesh>
                  )}

                  {/* ── ACCORDION STACKING WRINKLES (WHEN TOO BIG / LONG) ── */}
                  {isTooBig && !isFlared && (
                    <group position={[0, -0.77, 0.005]}>
                      {/* Puddling fold 1 */}
                      <mesh rotation={[0.08, 0, 0]}>
                        <torusGeometry args={[calfR * 1.14, 0.014 * puddleAmount * 25, 10, 24]} />
                        <meshStandardMaterial {...deniMat} />
                      </mesh>
                      {/* Puddling fold 2 */}
                      <mesh position={[0, -0.035, 0.008]} rotation={[-0.1, 0, 0]}>
                        <torusGeometry args={[calfR * 1.18, 0.016 * puddleAmount * 25, 10, 24]} />
                        <meshStandardMaterial {...deniMat} />
                      </mesh>
                      {/* Puddling drape over shoe instep */}
                      <mesh position={[0, -0.065, 0.02]} scale={[calfR * 1.25, 0.025, calfR * 1.3]}>
                        <sphereGeometry args={[1, 16, 12]} />
                        <meshStandardMaterial {...deniMat} />
                      </mesh>
                    </group>
                  )}

                  {/* Bottom Hem seam ring */}
                  <mesh position={[0, -0.805, 0]}>
                    <cylinderGeometry args={[calfR * 1.04, calfR * 1.04, 0.018, 32]} />
                    <meshStandardMaterial {...deniMat} />
                  </mesh>
                  {/* Hem gold stitch line */}
                  <mesh position={[0, -0.80, 0]}>
                    <torusGeometry args={[calfR * 1.045, 0.0018, 8, 32]} />
                    <meshStandardMaterial {...stitchMat} />
                  </mesh>
                </>
              )}
            </group>
          );
        })}
    </group>
  );
}
