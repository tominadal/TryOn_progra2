import { memo, useMemo } from "react";
import { RealisticFace } from "./Face";
import { HairComponent } from "./Hair";
import { RealisticHand } from "./Hands";
import { ModernShoe } from "./Shoes";
import {
  buildLoftedGeometry,
  getProceduralFabricTexture,
  LoftRing,
} from "./loftGeometry";
import { normalizeMorphFactor } from "@/lib/avatars";

// ──────────────────────────────────────────────────────────────────────────────
//  MAIN PARAMETRIC MANNEQUIN — Continuous Lofted Anatomical Humanoid (cm-driven)
// ──────────────────────────────────────────────────────────────────────────────
export const ParametricMannequin = memo(function ParametricMannequin({
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
  glasses = false,
  glassesColor = "#111827",
  watch = false,
  watchColor = "#18181b",
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
  glasses?: boolean;
  glassesColor?: string;
  watch?: boolean;
  watchColor?: string;
}) {
  const cottonTex = useMemo(() => getProceduralFabricTexture("cotton", 5, 5), []);
  const leatherTex = useMemo(() => getProceduralFabricTexture("leather", 3, 3), []);
  const denimTex = useMemo(() => getProceduralFabricTexture("denim", 4, 4), []);

  const skinMat = useMemo(
    () => ({ color: skinColor, roughness: 0.56, metalness: 0.03 }),
    [skinColor]
  );
  const shirtMat = useMemo(
    () => ({
      color: shirtColor,
      map: cottonTex,
      bumpMap: cottonTex,
      bumpScale: 0.0045,
      roughness: 0.84,
      metalness: 0.01,
    }),
    [shirtColor, cottonTex]
  );
  const deniMat = useMemo(
    () => ({
      color: pantsColor || "#1e3a8a",
      map: denimTex,
      bumpMap: denimTex,
      bumpScale: 0.006,
      roughness: 0.80,
      metalness: 0.02,
    }),
    [pantsColor, denimTex]
  );
  const shoeMat = useMemo(
    () => ({
      color: shoesColor,
      map: leatherTex,
      bumpMap: leatherTex,
      bumpScale: 0.0035,
      roughness: 0.42,
      metalness: 0.12,
    }),
    [shoesColor, leatherTex]
  );

  const isFemale = gender === "Mujer";
  const isSleeveless = shirtSleeve === "Sin Mangas";
  const isLongSleeve = shirtSleeve === "Manga Larga";

  // ── Normalized Anatomical Modifiers (supports both cm and normalized factors) ──
  const musc = Math.max(0, Math.min(1, muscleDefinition ?? 0.3));
  const muscFactor = 1 + musc * 0.14;
  const chestMod = normalizeMorphFactor(chestWidth, "chestWidth", gender);
  const bellyWMod = normalizeMorphFactor(bellyWidth, "bellyWidth", gender);
  const bellyDMod = normalizeMorphFactor(bellyDepth, "bellyDepth", gender);
  const hipModVal = normalizeMorphFactor(hipWidth, "hipWidth", gender);
  const armMod = normalizeMorphFactor(armThickness, "armThickness", gender);
  const legMod = normalizeMorphFactor(legThickness, "legThickness", gender);
  const neckMod = normalizeMorphFactor(neckThickness, "neckThickness", gender);
  const breastMod = normalizeMorphFactor(breastSize, "breastSize", gender);
  const shoulderMod = Math.max(0.85, Math.min(1.3, shoulderWidth || 1.0));

  // Core anatomical radii
  const baseChestRx = (isFemale ? 0.126 : 0.140 * muscFactor) * chestMod;
  const baseChestRz = (isFemale ? 0.096 : 0.104 * muscFactor) * (0.65 + 0.35 * chestMod);

  const rawWaistRx = (isFemale ? 0.102 : 0.116) * bellyWMod;
  const rawWaistRz = (isFemale ? 0.082 : 0.092) * bellyDMod;
  const hipRxBase = (isFemale ? 0.138 : 0.128) * hipModVal;
  const hipRzBase = (isFemale ? 0.104 : 0.098) * (0.68 + 0.32 * hipModVal);

  const waistRx = Math.max(rawWaistRx, Math.min(baseChestRx, hipRxBase) * 0.78);
  const waistRzFront =
    Math.max(rawWaistRz, baseChestRz * 0.74) *
    (bellyDMod > 1 ? 1 + (bellyDMod - 1) * 0.22 : 1);
  const waistRzBack = Math.max(rawWaistRz * 0.86, hipRzBase * 0.76);

  // Coupled iliac/waistband radii shared with ParametricPants so shirt hem & pants meet seamlessly
  const coupledIliacRx = waistRx * 0.42 + hipRxBase * 0.58;
  const coupledIliacRzFront = waistRzFront * 0.58 + hipRzBase * 0.42;
  const coupledIliacRzBack = waistRzBack * 0.35 + hipRzBase * 0.65;

  const upperArmR = (isFemale ? 0.036 : 0.042 * (1 + musc * 0.12)) * armMod;
  const foreArmR = (isFemale ? 0.029 : 0.034) * armMod;
  const wristR = foreArmR * (0.0258 / 0.034);

  const rawShoulderX =
    (isFemale ? 0.156 : 0.178 * (1 + musc * 0.08)) *
    (0.45 + 0.55 * chestMod) *
    shoulderMod;
  const shoulderLatX = Math.max(rawShoulderX, baseChestRx + upperArmR * 0.52);

  // ── 1. PROPORTIONAL LOFTED NECK GEOMETRY (Natural anatomical length) ────────
  const neckGeometry = useMemo(() => {
    const rTop = (isFemale ? 0.042 : 0.049) * neckMod;
    const rMid = (isFemale ? 0.046 : 0.054) * neckMod;
    const rBase = (isFemale ? 0.058 : 0.068) * neckMod;
    const rings: LoftRing[] = [
      { y: 1.488, rx: rBase * 1.16, rzFront: rBase * 0.95, rzBack: rBase * 1.04, cz: -0.003 },
      { y: 1.522, rx: rMid * 1.04, rzFront: rMid * 0.94, rzBack: rMid * 0.98, cz: -0.001 },
      { y: 1.562, rx: rTop, rzFront: rTop * 0.95, rzBack: rTop * 0.96, cz: 0 },
      { y: 1.605, rx: rTop * 0.96, rzFront: rTop * 0.92, rzBack: rTop * 0.92, cz: 0.002 },
    ];
    return buildLoftedGeometry({
      rings,
      heightSegments: 18,
      radialSegments: 36,
      capBottom: false,
      capTop: true,
    });
  }, [isFemale, neckMod]);

  // ── 2. CONTINUOUS LOFTED TORSO / SHIRT GEOMETRY ───────────────────────────
  // Spans continuously from y = 0.892 (smooth overlap with waistband) to y = 1.502 (collar)
  const torsoGeometry = useMemo(() => {
    const collarR = (isFemale ? 0.058 : 0.068) * neckMod;
    const hemRx = coupledIliacRx + 0.0035;
    const hemRzFront = coupledIliacRzFront + 0.0035;
    const hemRzBack = coupledIliacRzBack + 0.0035;

    const rings: LoftRing[] = [
      // Shirt bottom hem (drapes 3.5mm over the coupled waistband ring without ballooning)
      { y: 0.892, rx: hemRx, rzFront: hemRzFront, rzBack: hemRzBack, cz: 0.001 },
      // Iliac crest / Lower abdomen transition
      {
        y: 0.955,
        rx: hemRx * 0.62 + waistRx * 0.38,
        rzFront: hemRzFront * 0.56 + waistRzFront * 0.44,
        rzBack: hemRzBack * 0.60 + waistRzBack * 0.40,
        cz: 0.002,
      },
      // Natural anatomical waist
      { y: 1.055, rx: waistRx, rzFront: waistRzFront, rzBack: waistRzBack, cz: 0.003 },
      // Upper abdomen / Lower ribcage taper
      {
        y: 1.16,
        rx: waistRx * 0.42 + baseChestRx * 0.58,
        rzFront: waistRzFront * 0.42 + baseChestRz * 0.58,
        rzBack: waistRzBack * 0.45 + baseChestRz * 0.55,
        cz: 0.003,
      },
      // Mid-chest / Bust & Pectoral fullness line
      {
        y: 1.28,
        rx: baseChestRx,
        rzFront: baseChestRz * (isFemale ? 1.05 : 1.03),
        rzBack: baseChestRz * (0.94 + musc * 0.07),
        cz: 0.002,
      },
      // Upper chest / Sub-clavicular axillary line
      {
        y: 1.375,
        rx: baseChestRx * 0.45 + shoulderLatX * 0.55,
        rzFront: baseChestRz * 0.95,
        rzBack: baseChestRz * (0.96 + musc * 0.07),
        cz: -0.001,
      },
      // High anatomical acromion / broad shoulder line (where deltoids crown)
      {
        y: 1.446,
        rx: shoulderLatX * 0.96,
        rzFront: baseChestRz * 0.82,
        rzBack: baseChestRz * 0.88,
        cz: -0.003,
      },
      // Natural trapezius slope from acromion to neck base
      {
        y: 1.480,
        rx: shoulderLatX * 0.62 + collarR * 0.38,
        rzFront: baseChestRz * 0.64,
        rzBack: baseChestRz * 0.70,
        cz: -0.003,
      },
      // Crew-neck collar base
      {
        y: 1.502,
        rx: collarR,
        rzFront: collarR * 0.88,
        rzBack: collarR * 0.92,
        cz: -0.002,
      },
    ];

    return buildLoftedGeometry({
      rings,
      heightSegments: 48,
      radialSegments: 52,
      capBottom: true,
      capTop: true,
      uRepeat: 3,
      vRepeat: 3,
      radialDisplacement: (theta, y) => {
        let drz = 0;
        let drx = 0;

        if (Math.cos(theta) > 0.15) {
          const frontWeight = Math.max(0, Math.cos(theta));
          if (isFemale) {
            const yDist = (y - 1.28) / 0.085;
            if (Math.abs(yDist) < 1.3) {
              const verticalEnv = Math.exp(-yDist * yDist * 2.2);
              const leftAngle = theta - 0.35;
              const rightAngle = theta - (Math.PI * 2 - 0.35);
              const rightAlt = theta + 0.35;
              const lobeL = Math.exp(-(leftAngle * leftAngle) / 0.14);
              const lobeR = Math.max(
                Math.exp(-(rightAngle * rightAngle) / 0.14),
                Math.exp(-(rightAlt * rightAlt) / 0.14)
              );
              const bridge = 0.34 * Math.exp(-(Math.sin(theta) * Math.sin(theta)) / 0.18);
              drz += 0.024 * breastMod * chestMod * verticalEnv * Math.max(lobeL + lobeR, bridge);
            }
          } else if (musc > 0.05) {
            const yDist = (y - 1.305) / 0.08;
            if (Math.abs(yDist) < 1.25) {
              const verticalEnv = Math.exp(-yDist * yDist * 2.0);
              const pecSpread = Math.sin(Math.abs(Math.sin(theta)) * Math.PI * 0.85);
              drz += 0.013 * musc * chestMod * verticalEnv * pecSpread * frontWeight;
            }
            if (y > 0.98 && y < 1.20) {
              const abEnv = Math.sin(((y - 0.98) / 0.22) * Math.PI);
              const rectusRidge = Math.sin(Math.abs(Math.sin(theta)) * Math.PI * 2.2);
              const rowWave = 0.5 + 0.5 * Math.cos(((y - 1.0) / 0.065) * Math.PI * 2);
              drz += 0.0022 * musc * abEnv * Math.max(0, rectusRidge) * rowWave * (frontWeight * frontWeight);
            }
          }
        }

        if (y > 1.15 && y < 1.42) {
          const latEnv = Math.sin(((y - 1.15) / 0.27) * Math.PI);
          drx += 0.005 * musc * latEnv * Math.abs(Math.sin(theta));
        }

        return { drx, drz };
      },
    });
  }, [
    isFemale,
    neckMod,
    coupledIliacRx,
    coupledIliacRzFront,
    coupledIliacRzBack,
    waistRx,
    waistRzFront,
    waistRzBack,
    baseChestRx,
    baseChestRz,
    shoulderLatX,
    breastMod,
    chestMod,
    musc,
  ]);

  // ── 3. CONTINUOUS LOFTED ARM & SLEEVE GEOMETRIES (High anatomical shoulder origin, flush wrist) ──
  const shoulderJointX = shoulderLatX * 0.84;

  const armGeometries = useMemo(() => {
    const buildArmForSide = (side: number) => {
      const sleeveEase = 1.05;
      // Top deltoid cap tucks medially right into the y=1.446 acromion slope with zero step
      const topShiftX = -side * 0.024;

      if (isLongSleeve) {
        const sU = upperArmR * sleeveEase;
        const sE = foreArmR * 1.04;
        const sF = foreArmR * 1.02;
        const sW = wristR * 1.04;
        const rings: LoftRing[] = [
          { y: -0.515, rx: sW, rzFront: sW * 0.88, rzBack: sW * 0.88, cz: 0.012 },
          { y: -0.38, rx: sF, rzFront: sF * 0.95, rzBack: sF * 0.97, cz: 0.006 },
          { y: -0.26, rx: sE, rzFront: sE * 0.96, rzBack: sE * 1.02, cz: -0.002 },
          { y: -0.13, rx: sU, rzFront: sU * 0.98, rzBack: sU * 1.0, cz: 0 },
          { y: -0.03, rx: sU * 1.02, rzFront: sU * 0.98, rzBack: sU * 1.0, cx: topShiftX * 0.45, cz: -0.002 },
          { y: 0.020, rx: sU * 0.76, rzFront: sU * 0.76, rzBack: sU * 0.80, cx: topShiftX, cz: -0.003 },
        ];
        return {
          sleeveGeo: buildLoftedGeometry({
            rings,
            heightSegments: 32,
            radialSegments: 32,
            capBottom: false,
            capTop: true,
            uRepeat: 1.5,
            vRepeat: 2,
          }),
          skinGeo: null,
        };
      }

      if (isSleeveless) {
        const rings: LoftRing[] = [
          { y: -0.515, rx: wristR, rzFront: wristR * 0.875, rzBack: wristR * 0.875, cz: 0.012 },
          { y: -0.38, rx: foreArmR, rzFront: foreArmR * 0.95, rzBack: foreArmR * 0.98, cz: 0.006 },
          { y: -0.26, rx: foreArmR * 0.96, rzFront: foreArmR * 0.94, rzBack: foreArmR * 1.02, cz: -0.002 },
          { y: -0.13, rx: upperArmR, rzFront: upperArmR * 0.98, rzBack: upperArmR * 1.0, cz: 0 },
          { y: -0.03, rx: upperArmR * 1.02, rzFront: upperArmR * 0.98, rzBack: upperArmR * 1.0, cx: topShiftX * 0.45, cz: -0.002 },
          { y: 0.020, rx: upperArmR * 0.74, rzFront: upperArmR * 0.76, rzBack: upperArmR * 0.80, cx: topShiftX, cz: -0.003 },
        ];
        return {
          sleeveGeo: null,
          skinGeo: buildLoftedGeometry({
            rings,
            heightSegments: 32,
            radialSegments: 32,
            capBottom: false,
            capTop: true,
          }),
        };
      }

      // Manga Corta: continuous short sleeve + continuous bare forearm
      const sU = upperArmR * sleeveEase;
      const sleeveRings: LoftRing[] = [
        { y: -0.195, rx: sU * 0.97, rzFront: sU * 0.95, rzBack: sU * 0.97, cz: 0 },
        { y: -0.10, rx: sU * 1.01, rzFront: sU * 0.99, rzBack: sU * 1.01, cz: 0 },
        { y: -0.025, rx: sU * 1.02, rzFront: sU * 0.98, rzBack: sU * 1.0, cx: topShiftX * 0.45, cz: -0.002 },
        { y: 0.020, rx: sU * 0.76, rzFront: sU * 0.76, rzBack: sU * 0.80, cx: topShiftX, cz: -0.003 },
      ];
      const skinRings: LoftRing[] = [
        { y: -0.515, rx: wristR, rzFront: wristR * 0.875, rzBack: wristR * 0.875, cz: 0.012 },
        { y: -0.38, rx: foreArmR, rzFront: foreArmR * 0.95, rzBack: foreArmR * 0.98, cz: 0.006 },
        { y: -0.26, rx: foreArmR * 0.96, rzFront: foreArmR * 0.94, rzBack: foreArmR * 1.02, cz: -0.002 },
        { y: -0.180, rx: upperArmR * 0.93, rzFront: upperArmR * 0.92, rzBack: upperArmR * 0.94, cz: 0 },
      ];
      return {
        sleeveGeo: buildLoftedGeometry({
          rings: sleeveRings,
          heightSegments: 18,
          radialSegments: 32,
          capBottom: true,
          capTop: true,
          uRepeat: 1.5,
          vRepeat: 1,
        }),
        skinGeo: buildLoftedGeometry({
          rings: skinRings,
          heightSegments: 22,
          radialSegments: 32,
          capBottom: false,
          capTop: true,
        }),
      };
    };

    return {
      left: buildArmForSide(-1),
      right: buildArmForSide(1),
    };
  }, [isLongSleeve, isSleeveless, upperArmR, foreArmR, wristR]);

  // ── 4. LOWER BODY & BARE LEGS ──────────────────────────────────────────────
  const fitLower = pantsFit.toLowerCase();
  const isBermuda = fitLower.includes("bermuda") || fitLower.includes("short");
  const isSkirt = fitLower.includes("skirt") || fitLower.includes("pollera");
  const isFlared = fitLower.includes("flare");

  const baseSkinThighR = (isFemale ? 0.060 : 0.057) * legMod;
  const baseSkinCalfR = (isFemale ? 0.042 : 0.045) * legMod;

  const thighR = isNakedBottom ? baseSkinThighR : baseSkinThighR + 0.005;
  const calfR = isNakedBottom ? baseSkinCalfR : baseSkinCalfR + 0.004;
  const finalHipRx = hipRxBase;

  const legGeometry = useMemo(() => {
    const ankleR = calfR * 0.72;
    const kneeR = thighR * 0.80;
    const rings: LoftRing[] = [
      { y: -0.78, rx: ankleR, rzFront: ankleR * 0.95, rzBack: ankleR * 0.98, cz: 0 },
      { y: -0.68, rx: calfR * 0.86, rzFront: calfR * 0.84, rzBack: calfR * 0.95, cz: -0.003 },
      { y: -0.54, rx: calfR, rzFront: calfR * 0.92, rzBack: calfR * 1.08, cz: -0.005 },
      { y: -0.41, rx: kneeR, rzFront: kneeR * 1.02, rzBack: kneeR * 0.94, cz: 0.004 },
      { y: -0.26, rx: thighR * 0.92, rzFront: thighR * 0.96, rzBack: thighR * 0.96, cz: 0.002 },
      { y: -0.08, rx: thighR, rzFront: thighR * 0.98, rzBack: thighR * 1.02, cz: 0 },
      { y: 0.04, rx: thighR * 1.02, rzFront: thighR * 0.96, rzBack: thighR * 1.04, cz: -0.002 },
    ];
    return buildLoftedGeometry({
      rings,
      heightSegments: 32,
      radialSegments: 36,
      capBottom: true,
      capTop: true,
      uRepeat: 1,
      vRepeat: 2,
    });
  }, [thighR, calfR]);

  const pelvisGeometry = useMemo(() => {
    const rX = isNakedBottom ? hipRxBase * 0.94 : finalHipRx;
    const rZFront = isNakedBottom ? hipRzBase * 0.88 : hipRzBase * 0.94;
    const rZBack = isNakedBottom ? hipRzBase * 0.96 : hipRzBase * 1.02;
    const rings: LoftRing[] = [
      { y: 0.72, rx: rX * 0.82, rzFront: rZFront * 0.78, rzBack: rZBack * 0.84, cz: -0.003 },
      { y: 0.80, rx: rX * 0.98, rzFront: rZFront * 0.95, rzBack: rZBack * 1.04, cz: -0.004 },
      { y: 0.86, rx: rX, rzFront: rZFront, rzBack: rZBack, cz: -0.002 },
      { y: 0.905, rx: coupledIliacRx * 0.96, rzFront: coupledIliacRzFront * 0.95, rzBack: coupledIliacRzBack * 0.95, cz: 0.001 },
    ];
    return buildLoftedGeometry({
      rings,
      heightSegments: 24,
      radialSegments: 44,
      capBottom: true,
      capTop: true,
    });
  }, [isNakedBottom, hipRxBase, hipRzBase, finalHipRx, coupledIliacRx, coupledIliacRzFront, coupledIliacRzBack]);

  const actualDeniMat = isNakedBottom ? skinMat : deniMat;
  const legSurfaceMat = isNakedBottom ? skinMat : isSkirt ? skinMat : actualDeniMat;
  const modelY = -0.9 + 0.111 * scaleY;
  const legPosX = (isFemale ? 0.072 : 0.074) * Math.max(0.90, hipModVal * 0.92);

  // Inverse vertical compensation so the head stays naturally spherical at any height (140–210 cm)
  const clampedScaleY = Math.max(0.8, Math.min(1.25, scaleY || 1.0));
  const headCompY = Math.pow(clampedScaleY, -0.62);
  const headCompXZ = Math.pow(clampedScaleY, 0.16);

  return (
    <group scale={[scaleXZ, scaleY, scaleXZ]} position={[0, modelY, 0]}>
      {/* ── HEAD (Proportionally compensated across all heights) ── */}
      <group
        position={[0, 1.655, 0]}
        scale={[headCompXZ, headCompY, headCompXZ]}
      >
        <RealisticFace
          skinColor={skinColor}
          isFemale={isFemale}
          eyebrowStyle={eyebrowStyle || "Normal"}
          glasses={Boolean(glasses)}
          glassesColor={glassesColor}
        />
        <HairComponent hairStyle={hairStyle} hairColor={hairColor} isFemale={isFemale} />
      </group>

      {/* ── CONTINUOUS LOFTED NECK ── */}
      <mesh geometry={neckGeometry}>
        <meshStandardMaterial {...skinMat} />
      </mesh>

      {/* ── CONTINUOUS LOFTED TORSO / SHIRT ── */}
      <mesh geometry={torsoGeometry}>
        <meshStandardMaterial {...shirtMat} />
      </mesh>

      {/* Crew-neck collar ribbed trim — seated flush on the torso's y=1.502 collar ring */}
      <mesh
        position={[0, 1.498, -0.002]}
        rotation={[Math.PI / 2 + 0.02, 0, 0]}
        scale={[1.0, 0.90, 1.0]}
      >
        <torusGeometry args={[(isFemale ? 0.058 : 0.068) * neckMod, 0.007, 14, 36]} />
        <meshStandardMaterial {...shirtMat} roughness={0.90} />
      </mesh>

      {/* ── LEFT & RIGHT CONTINUOUS LOFTED ARMS (High anatomical shoulder origin) ── */}
      {[-1, 1].map((side) => {
        const isLeft = side === -1;
        const geos = isLeft ? armGeometries.left : armGeometries.right;
        return (
          <group
            key={`arm-${side}`}
            position={[side * shoulderJointX, 1.440, -0.004]}
            rotation={[0.01, 0, side * 0.08]}
          >
            {geos.sleeveGeo && (
              <mesh geometry={geos.sleeveGeo}>
                <meshStandardMaterial key={`sl-${shirtSleeve}`} {...shirtMat} />
              </mesh>
            )}
            {geos.skinGeo && (
              <mesh geometry={geos.skinGeo}>
                <meshStandardMaterial key={`sk-${shirtSleeve}`} {...skinMat} />
              </mesh>
            )}

            {/* Articulated Hand at Wrist — flush 1:1 with distal forearm (-0.515) */}
            <group position={[0, -0.514, 0.012]} rotation={[0, side * 0.16, 0]}>
              <RealisticHand
                isLeft={isLeft}
                skinMat={skinMat}
                foreArmR={foreArmR}
                watch={Boolean(watch)}
                watchColor={watchColor}
              />
            </group>
          </group>
        );
      })}

      {/* ── PELVIS BASE ── */}
      <mesh geometry={pelvisGeometry}>
        <meshStandardMaterial {...actualDeniMat} />
      </mesh>

      {!isNakedBottom && isSkirt && (
        <mesh position={[0, 0.65, 0]}>
          <cylinderGeometry args={[finalHipRx * 1.01, finalHipRx * 1.28, 0.44, 36]} />
          <meshStandardMaterial {...deniMat} />
        </mesh>
      )}

      {!isNakedBottom && (
        <mesh position={[0, 0.90, 0]}>
          <cylinderGeometry args={[coupledIliacRx * 0.98, coupledIliacRx * 0.98, 0.036, 36]} />
          <meshStandardMaterial color="#18181b" roughness={0.85} />
        </mesh>
      )}

      {/* ── LEFT & RIGHT CONTINUOUS LOFTED LEGS + SHOES ── */}
      {[-1, 1].map((side) => {
        const isLeft = side === -1;
        return (
          <group key={`leg-${side}`} position={[side * legPosX, 0.81, 0]}>
            <mesh geometry={legGeometry}>
              <meshStandardMaterial {...legSurfaceMat} />
            </mesh>

            {!isNakedBottom && isBermuda && (
              <mesh position={[0, -0.20, 0]}>
                <cylinderGeometry args={[thighR * 1.04, thighR * 1.02, 0.42, 32]} />
                <meshStandardMaterial {...deniMat} />
              </mesh>
            )}
            {!isNakedBottom && isFlared && (
              <mesh position={[0, -0.64, 0]}>
                <cylinderGeometry args={[calfR * 1.02, calfR * 1.65, 0.34, 32]} />
                <meshStandardMaterial {...deniMat} />
              </mesh>
            )}

            <ModernShoe isLeft={isLeft} shoeMat={shoeMat} isFemale={isFemale} calfR={baseSkinCalfR} />
          </group>
        );
      })}
    </group>
  );
});
