import { memo, useMemo } from "react";
import * as THREE from "three";
import {
  buildLoftedGeometry,
  evaluateRingPoint,
  getProceduralFabricTexture,
  LoftRing,
  sampleLoftRings,
} from "./loftGeometry";
import { normalizeMorphFactor } from "@/lib/avatars";

const RIVET_MAT = { color: "#b45309", roughness: 0.32, metalness: 0.82 };
const BUTTON_MAT = { color: "#cbd5e1", roughness: 0.25, metalness: 0.9 };
const STITCH_MAT = { color: "#b45309", roughness: 0.85, metalness: 0.05 };

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
  hasPleats?: boolean;
  distress?: number; // 0.0 to 1.0 (0% to 100% vintage wear / distressing)
  texture?: string; // "Denim Clásico" | "Denim Crudo (Rígido)" | "Cuero/Ecocuero" | "Algodón Suave" | "Lino/Fresco" | "Gabardina"
  garmentPatternCm?: {
    waistCm?: number;
    hipCm?: number;
    thighCm?: number;
    inseamCm?: number;
    hemWidthCm?: number;
    riseCm?: number;
  };
  legThickness?: number;
  hipWidth?: number;
  bellyWidth?: number;
  bellyDepth?: number;
  chestWidth?: number;
  fitTightness?: number; // < -0.22 = Talla chica / ajustada, > 0.22 = Talla grande / holgada
}

/**
 * Builds a curved 3D patch mesh that conforms 100% to the lofted pelvis surface
 * (used for back pockets, front fly J-stitch, and curved pocket seams so nothing ever floats).
 */
function buildSurfacePatch(
  rings: LoftRing[],
  uMin: number,
  uMax: number,
  thetaMin: number,
  thetaMax: number,
  normalOffset: number,
  uSteps = 10,
  tSteps = 10,
  radialDisplacement?: (theta: number, y: number, u: number) => { drx?: number; drz?: number; dy?: number }
): THREE.BufferGeometry {
  const stride = tSteps + 1;
  const positions = new Float32Array((uSteps + 1) * stride * 3);
  const uvs = new Float32Array((uSteps + 1) * stride * 2);
  const indices: number[] = [];

  for (let i = 0; i <= uSteps; i++) {
    const uFrac = i / uSteps;
    const u = uMin + (uMax - uMin) * uFrac;
    const ring = sampleLoftRings(rings, u);

    for (let j = 0; j <= tSteps; j++) {
      const tFrac = j / tSteps;
      const theta = thetaMin + (thetaMax - thetaMin) * tFrac;
      const mod = radialDisplacement ? radialDisplacement(theta, ring.y, u) : undefined;
      const offsetRing: LoftRing = {
        ...ring,
        rx: ring.rx + (mod?.drx ?? 0) + normalOffset,
        rzFront: ring.rzFront + (mod?.drz ?? 0) + normalOffset,
        rzBack: ring.rzBack + (mod?.drz ?? 0) + normalOffset,
      };
      const pt = evaluateRingPoint(offsetRing, theta);
      const idx = i * stride + j;
      positions[idx * 3] = pt.x;
      positions[idx * 3 + 1] = pt.y + (mod?.dy ?? 0);
      positions[idx * 3 + 2] = pt.z;
      uvs[idx * 2] = tFrac;
      uvs[idx * 2 + 1] = uFrac;
    }
  }

  for (let i = 0; i < uSteps; i++) {
    for (let j = 0; j < tSteps; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + (j + 1);
      const d = i * stride + (j + 1);
      indices.push(a, d, b);
      indices.push(b, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export const ParametricPants = memo(function ParametricPants({
  color = "#1e3a8a",
  accentColor,
  avatarScaleXZ = 1.0,
  avatarScaleY = 1.0,
  pantsScaleX = 1.0,
  pantsScaleY = 1.0,
  pantsFit = "Regular",
  isFemale = false,
  roughness = 0.80,
  taper = 0.0,
  waistRise = 0.5,
  hasCuff = false,
  hasPleats = false,
  distress = 0.0,
  texture = "Denim Clásico",
  garmentPatternCm,
  legThickness = 1.0,
  hipWidth = 1.0,
  bellyWidth = 1.0,
  bellyDepth = 1.0,
  chestWidth = 1.0,
  fitTightness = 0.0,
}: ParametricPantsProps) {
  const texLower = (texture || "Denim Clásico").toLowerCase();
  const isLeather = texLower.includes("cuero");
  const isCottonOrChino =
    texLower.includes("algod") || texLower.includes("gabardina") || texLower.includes("lino");

  const fabricTex = useMemo(
    () =>
      getProceduralFabricTexture(
        isLeather ? "leather" : isCottonOrChino ? "cotton" : "denim",
        4,
        4
      ),
    [isLeather, isCottonOrChino]
  );

  const accent = accentColor ?? color;
  const genderLabel = isFemale ? "Mujer" : "Hombre";

  const isTooSmall = fitTightness < -0.22;
  const isTooBig = fitTightness > 0.22;

  const clampedTightness = Math.max(-0.85, Math.min(0.85, fitTightness));
  const tightnessRadiusOffset = clampedTightness * 0.013;
  const hemRideUp = isTooSmall ? Math.min(0.038, Math.abs(clampedTightness) * 0.030) : 0;
  const puddleAmount = isTooBig ? Math.min(0.034, clampedTightness * 0.026) : 0;

  const baseTexRoughness = isLeather
    ? 0.26
    : texLower.includes("gabardina")
    ? 0.68
    : texLower.includes("lino")
    ? 0.90
    : roughness;
  const baseTexMetalness = isLeather ? 0.34 : 0.02;

  const adjustedRoughness = isTooSmall
    ? Math.max(0.22, baseTexRoughness - 0.08)
    : isTooBig
    ? Math.min(0.94, baseTexRoughness + 0.05)
    : baseTexRoughness;

  const deniMat = useMemo(
    () => ({
      color: color,
      map: fabricTex,
      bumpMap: fabricTex,
      bumpScale: isLeather ? 0.0038 : 0.0065,
      roughness: adjustedRoughness,
      metalness: baseTexMetalness,
    }),
    [color, fabricTex, isLeather, adjustedRoughness, baseTexMetalness]
  );

  const pocketMat = useMemo(
    () => ({
      color: color,
      map: fabricTex,
      bumpMap: fabricTex,
      bumpScale: isLeather ? 0.0042 : 0.0075,
      roughness: Math.min(0.94, adjustedRoughness + 0.04),
      metalness: baseTexMetalness * 0.8,
      side: THREE.DoubleSide,
    }),
    [color, fabricTex, isLeather, adjustedRoughness, baseTexMetalness]
  );

  const taperFactor = Math.max(-0.6, Math.min(0.6, taper)) * 0.026;
  const effectiveRise =
    garmentPatternCm?.riseCm !== undefined
      ? Math.max(0, Math.min(1, (garmentPatternCm.riseCm - 20) / 12))
      : Math.max(0, Math.min(1, waistRise));
  const waistRiseOffset = (effectiveRise - 0.5) * 0.055;

  const fitLower = pantsFit.toLowerCase();
  const isBermuda = fitLower.includes("bermuda") || fitLower.includes("short");
  const isSkirt = fitLower.includes("skirt") || fitLower.includes("pollera");
  const isFlared = fitLower.includes("flare");

  let thighMod = 0,
    calfMod = 0,
    hipMod = 0;

  if (fitLower.includes("skinny-mom")) {
    hipMod = 0.012;
    thighMod = -0.005 - taperFactor;
    calfMod = -0.010 - taperFactor;
  } else if (fitLower.includes("skinny")) {
    thighMod = -0.010 - taperFactor;
    calfMod = -0.012 - taperFactor;
  } else if (fitLower.includes("slim")) {
    thighMod = -0.005 - taperFactor * 0.5;
    calfMod = -0.007 - taperFactor * 0.5;
  } else if (fitLower.includes("wide") || fitLower.includes("baggy")) {
    hipMod = 0.009;
    thighMod = 0.022 - taperFactor;
    calfMod = 0.028 - taperFactor;
  } else if (fitLower.includes("relaxed")) {
    hipMod = 0.007;
    thighMod = 0.016 - taperFactor;
    calfMod = 0.020 - taperFactor;
  } else if (fitLower.includes("mom")) {
    hipMod = 0.015;
    thighMod = 0.009 - taperFactor;
    calfMod = -0.004 - taperFactor;
  } else if (isBermuda) {
    thighMod = 0.009 - taperFactor;
  } else if (isFlared) {
    hipMod = 0.005;
    thighMod = -0.007 - taperFactor;
    calfMod = -0.009 - taperFactor;
  } else if (isSkirt) {
    hipMod = 0.007;
  } else {
    thighMod = -taperFactor * 0.5;
    calfMod = -taperFactor;
  }

  // Normalized anthropometric factors (identical to ParametricMannequin)
  const hipModVal = normalizeMorphFactor(hipWidth, "hipWidth", genderLabel);
  const legModVal = normalizeMorphFactor(legThickness, "legThickness", genderLabel);
  const bellyWMod = normalizeMorphFactor(bellyWidth, "bellyWidth", genderLabel);
  const bellyDMod = normalizeMorphFactor(bellyDepth, "bellyDepth", genderLabel);
  const chestMod = normalizeMorphFactor(chestWidth, "chestWidth", genderLabel);
  const clampedScaleX = Math.max(0.86, Math.min(1.20, pantsScaleX || 1.0));

  const baseChestRx = (isFemale ? 0.126 : 0.140) * chestMod;
  const baseChestRz = (isFemale ? 0.096 : 0.104) * (0.65 + 0.35 * chestMod);
  const rawWaistRx = (isFemale ? 0.102 : 0.116) * bellyWMod;
  const rawWaistRz = (isFemale ? 0.082 : 0.092) * bellyDMod;

  const hipRxBase = (isFemale ? 0.138 : 0.128) * hipModVal;
  const hipRzBase = (isFemale ? 0.104 : 0.098) * (0.68 + 0.32 * hipModVal);

  const waistRx = Math.max(rawWaistRx, Math.min(baseChestRx, hipRxBase) * 0.78);
  const waistRzFront =
    Math.max(rawWaistRz, baseChestRz * 0.74) *
    (bellyDMod > 1 ? 1 + (bellyDMod - 1) * 0.22 : 1);
  const waistRzBack = Math.max(rawWaistRz * 0.86, hipRzBase * 0.76);

  // Coupled iliac/waistband radii matching Mannequin.tsx so there is NEVER a shelf/cliff
  const coupledIliacRx = waistRx * 0.42 + hipRxBase * 0.58;
  const coupledIliacRzFront = waistRzFront * 0.58 + hipRzBase * 0.42;
  const coupledIliacRzBack = waistRzBack * 0.35 + hipRzBase * 0.65;

  const minHipRx = hipRxBase + 0.004;
  const minThighR = (isFemale ? 0.060 : 0.057) * legModVal + 0.004;
  const minCalfR = (isFemale ? 0.042 : 0.045) * legModVal + 0.004;

  const fitEase = isTooSmall ? 0.002 : isTooBig ? 0.014 : 0.006;

  const finalHipRx = Math.max(
    minHipRx,
    (hipRxBase + hipMod) * (0.68 + 0.32 * clampedScaleX) + fitEase + tightnessRadiusOffset
  );
  const finalHipRzFront = Math.max(
    hipRzBase * 0.92 + 0.003,
    coupledIliacRzFront * 0.94
  );
  const finalHipRzBack = Math.max(
    hipRzBase * 1.0 + 0.004,
    coupledIliacRzBack * 0.98
  );

  const thighR = Math.max(
    minThighR,
    ((isFemale ? 0.062 : 0.059) * legModVal + thighMod) * (0.62 + 0.38 * clampedScaleX) +
      fitEase +
      tightnessRadiusOffset * 0.82
  );
  const calfR = Math.max(
    minCalfR,
    ((isFemale ? 0.044 : 0.047) * legModVal + calfMod) * (0.62 + 0.38 * clampedScaleX) +
      fitEase +
      tightnessRadiusOffset * 0.72
  );

  const beltY = 0.896 + waistRiseOffset;

  // ── 1. CONTINUOUS LOFTED PELVIS / RISE / WAISTBAND RINGS ──────────────────
  const pelvisRings = useMemo<LoftRing[]>(() => {
    const wbEase = isTooSmall ? 0.001 : isTooBig ? 0.009 : 0.003;
    const wbRx = coupledIliacRx + wbEase;
    const wbRzFront = coupledIliacRzFront + wbEase;
    const wbRzBack = coupledIliacRzBack + wbEase;

    if (isSkirt) {
      const skirtHemRx = finalHipRx * 1.24;
      const skirtHemRz = finalHipRzFront * 1.20;
      return [
        { y: 0.46, rx: skirtHemRx, rzFront: skirtHemRz, rzBack: skirtHemRz * 1.04, cz: 0 },
        { y: 0.60, rx: finalHipRx * 1.12, rzFront: finalHipRzFront * 1.08, rzBack: finalHipRzBack * 1.06, cz: -0.002 },
        { y: 0.74, rx: finalHipRx * 1.03, rzFront: finalHipRzFront * 1.01, rzBack: finalHipRzBack * 1.03, cz: -0.003 },
        { y: 0.83, rx: finalHipRx, rzFront: finalHipRzFront, rzBack: finalHipRzBack, cz: -0.002 },
        { y: beltY - 0.022, rx: wbRx * 1.01, rzFront: wbRzFront, rzBack: wbRzBack, cz: 0 },
        { y: beltY + 0.012, rx: wbRx, rzFront: wbRzFront, rzBack: wbRzBack, cz: 0.001 },
      ];
    }

    return [
      // Deep crotch / sub-gluteal saddle base (merges smoothly into upper thighs)
      { y: 0.695, rx: finalHipRx * 0.86, rzFront: finalHipRzFront * 0.76, rzBack: finalHipRzBack * 0.82, cz: -0.002 },
      // Lower seat / hip curve
      { y: 0.765, rx: finalHipRx * 0.97, rzFront: finalHipRzFront * 0.94, rzBack: finalHipRzBack * 1.01, cz: -0.004 },
      // Mid-pelvis / Fullest hip & glute contour
      { y: 0.828, rx: finalHipRx, rzFront: finalHipRzFront, rzBack: finalHipRzBack * 1.02, cz: -0.002 },
      // Upper rise / Under-waistband transition
      { y: beltY - 0.024, rx: (finalHipRx * 0.4 + wbRx * 0.6), rzFront: (finalHipRzFront * 0.35 + wbRzFront * 0.65), rzBack: (finalHipRzBack * 0.35 + wbRzBack * 0.65), cz: 0 },
      // Top of waistband (coupled to torso iliac contour)
      { y: beltY + 0.012, rx: wbRx, rzFront: wbRzFront, rzBack: wbRzBack, cz: 0.001 },
    ];
  }, [
    isSkirt,
    finalHipRx,
    finalHipRzFront,
    finalHipRzBack,
    coupledIliacRx,
    coupledIliacRzFront,
    coupledIliacRzBack,
    isTooSmall,
    isTooBig,
    beltY,
  ]);

  const pelvisDisplacement = useMemo(
    () => (theta: number, y: number) => {
      let drz = 0;
      let drx = 0;

      // Subtle anatomical dual-glute contour in the back
      const backWeight = Math.max(0, -Math.cos(theta));
      if (backWeight > 0.1 && y > 0.72 && y < 0.86) {
        const yEnv = Math.sin(((y - 0.72) / 0.14) * Math.PI);
        const cheekSpread = Math.sin(Math.abs(Math.sin(theta)) * Math.PI * 1.4);
        drz += 0.007 * yEnv * Math.max(0, cheekSpread) * backWeight;
      }

      // Subtle horizontal fabric tension ripples when pants are too small
      if (isTooSmall && Math.cos(theta) > 0.2 && y > 0.75 && y < 0.88) {
        const frontW = Math.cos(theta);
        const ripple = Math.sin((y - 0.75) * 140) * 0.0016 * Math.abs(clampedTightness);
        drz += ripple * frontW;
      }

      // Subtle side drape folds when pants are too big
      if (isTooBig && y > 0.74 && y < 0.88) {
        const sideW = Math.abs(Math.sin(theta));
        drx += Math.sin(theta * 6) * 0.002 * clampedTightness * sideW;
      }

      return { drx, drz };
    },
    [isTooSmall, isTooBig, clampedTightness]
  );

  const pelvisGeometry = useMemo(
    () =>
      buildLoftedGeometry({
        rings: pelvisRings,
        heightSegments: 36,
        radialSegments: 52,
        capBottom: true,
        capTop: true,
        uRepeat: 3,
        vRepeat: 2,
        radialDisplacement: pelvisDisplacement,
      }),
    [pelvisRings, pelvisDisplacement]
  );

  // ── 2. SURFACE-SNAPPED DENIM DETAILS (0% FLOATING GUARANTEE) ──────────────
  const waistbandGeometry = useMemo(
    () =>
      buildSurfacePatch(
        pelvisRings,
        0.84,
        0.99,
        0,
        Math.PI * 2,
        0.0012,
        6,
        48,
        pelvisDisplacement
      ),
    [pelvisRings, pelvisDisplacement]
  );

  // Subtle, fine-thread Front Fly J-Stitch (no thick orange stripe)
  const flyStitchGeometry = useMemo(
    () =>
      buildSurfacePatch(
        pelvisRings,
        isSkirt ? 0.64 : 0.32,
        0.84,
        -0.004,
        0.006,
        0.0014,
        10,
        4,
        pelvisDisplacement
      ),
    [pelvisRings, isSkirt, pelvisDisplacement]
  );

  const frontPocketsGeometry = useMemo(() => {
    const uStart = isSkirt ? 0.72 : 0.56;
    const uEnd = 0.84;
    return [
      buildSurfacePatch(pelvisRings, uStart, uEnd, 0.36, 0.88, 0.0018, 8, 10, pelvisDisplacement),
      buildSurfacePatch(
        pelvisRings,
        uStart,
        uEnd,
        Math.PI * 2 - 0.88,
        Math.PI * 2 - 0.36,
        0.0018,
        8,
        10,
        pelvisDisplacement
      ),
    ];
  }, [pelvisRings, isSkirt, pelvisDisplacement]);

  const backPocketsGeometry = useMemo(() => {
    const uStart = isSkirt ? 0.58 : 0.28;
    const uEnd = isSkirt ? 0.80 : 0.68;
    return [
      buildSurfacePatch(
        pelvisRings,
        uStart,
        uEnd,
        Math.PI - 0.54,
        Math.PI - 0.16,
        0.002,
        10,
        10,
        pelvisDisplacement
      ),
      buildSurfacePatch(
        pelvisRings,
        uStart,
        uEnd,
        Math.PI + 0.16,
        Math.PI + 0.54,
        0.002,
        10,
        10,
        pelvisDisplacement
      ),
    ];
  }, [pelvisRings, isSkirt, pelvisDisplacement]);

  const beltLoopGeometries = useMemo(() => {
    const angles = [-0.32, 0.32, Math.PI * 0.5, Math.PI * 0.82, Math.PI * 1.18, Math.PI * 1.5];
    return angles.map((ang) =>
      buildSurfacePatch(
        pelvisRings,
        0.83,
        0.995,
        ang - 0.032,
        ang + 0.032,
        0.0028,
        6,
        4,
        pelvisDisplacement
      )
    );
  }, [pelvisRings, pelvisDisplacement]);

  // Front Pleats (Pinzas Frontales / Sastreras)
  const pleatGeometries = useMemo(() => {
    if (!hasPleats) return [];
    const uStart = isSkirt ? 0.34 : 0.42;
    const uEnd = 0.83;
    return [
      buildSurfacePatch(pelvisRings, uStart, uEnd, 0.24, 0.295, 0.0032, 10, 4, pelvisDisplacement),
      buildSurfacePatch(pelvisRings, uStart, uEnd, 0.36, 0.405, 0.0022, 10, 4, pelvisDisplacement),
      buildSurfacePatch(
        pelvisRings,
        uStart,
        uEnd,
        Math.PI * 2 - 0.295,
        Math.PI * 2 - 0.24,
        0.0032,
        10,
        4,
        pelvisDisplacement
      ),
      buildSurfacePatch(
        pelvisRings,
        uStart,
        uEnd,
        Math.PI * 2 - 0.405,
        Math.PI * 2 - 0.36,
        0.0022,
        10,
        4,
        pelvisDisplacement
      ),
    ];
  }, [hasPleats, pelvisRings, isSkirt, pelvisDisplacement]);

  // Vintage Distress / Whiskers on upper pelvis
  const pelvisWhiskerGeometries = useMemo(() => {
    if (distress <= 0.05) return [];
    const whiskers: THREE.BufferGeometry[] = [];
    const uPositions = isSkirt ? [0.58, 0.66] : [0.46, 0.54, 0.62];
    for (const uPos of uPositions) {
      whiskers.push(
        buildSurfacePatch(
          pelvisRings,
          uPos - 0.015,
          uPos + 0.015,
          0.18,
          0.68,
          0.0019,
          4,
          8,
          pelvisDisplacement
        ),
        buildSurfacePatch(
          pelvisRings,
          uPos - 0.015,
          uPos + 0.015,
          Math.PI * 2 - 0.68,
          Math.PI * 2 - 0.18,
          0.0019,
          4,
          8,
          pelvisDisplacement
        )
      );
    }
    return whiskers;
  }, [distress, pelvisRings, isSkirt, pelvisDisplacement]);

  const distressMat = useMemo(() => {
    const baseCol = new THREE.Color(color || "#1e3a8a");
    const fadedCol = baseCol.clone().lerp(new THREE.Color("#e2e8f0"), Math.min(0.68, 0.25 + distress * 0.48));
    return {
      color: `#${fadedCol.getHexString()}`,
      roughness: 0.95,
      metalness: 0.01,
      bumpMap: fabricTex || undefined,
      bumpScale: 0.006,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    };
  }, [color, distress, fabricTex]);

  const hardwarePositions = useMemo(() => {
    const topRing = sampleLoftRings(pelvisRings, 0.92);
    const buttonPt = evaluateRingPoint(topRing, 0, pelvisDisplacement, 0.92);

    const pocketU = isSkirt ? 0.76 : 0.64;
    const pocketRing = sampleLoftRings(pelvisRings, pocketU);
    const rivetR = evaluateRingPoint(pocketRing, 0.42, pelvisDisplacement, pocketU);
    const rivetL = evaluateRingPoint(pocketRing, Math.PI * 2 - 0.42, pelvisDisplacement, pocketU);

    return {
      button: [buttonPt.x, buttonPt.y, buttonPt.z + 0.0025] as [number, number, number],
      rivetR: [rivetR.x * 1.012, rivetR.y, rivetR.z * 1.012] as [number, number, number],
      rivetL: [rivetL.x * 1.012, rivetL.y, rivetL.z * 1.012] as [number, number, number],
    };
  }, [pelvisRings, isSkirt, pelvisDisplacement]);

  // ── 3. CONTINUOUS LOFTED PANT LEG GEOMETRY (Seamless medial thigh merge) ───
  const inseamCmMod = garmentPatternCm?.inseamCm
    ? Math.max(-0.07, Math.min(0.06, ((garmentPatternCm.inseamCm - (isBermuda ? 24 : 79)) / 79) * 0.42))
    : 0;
  const legBottomY = isBermuda ? -0.38 - inseamCmMod * 0.5 : -0.785 + hemRideUp - inseamCmMod;

  const baseHemR = isFlared
    ? calfR * 1.48
    : fitLower.includes("wide") || fitLower.includes("baggy")
    ? thighR * 0.96
    : fitLower.includes("skinny")
    ? calfR * 0.80
    : calfR * 0.90;

  const defaultHemCm = isFlared
    ? 25
    : fitLower.includes("wide")
    ? 26
    : fitLower.includes("baggy")
    ? 24
    : fitLower.includes("skinny")
    ? 15
    : fitLower.includes("slim")
    ? 17
    : 19.5;
  const hemCmScale = garmentPatternCm?.hemWidthCm
    ? Math.max(0.78, Math.min(1.45, garmentPatternCm.hemWidthCm / defaultHemCm))
    : 1.0;
  const hemR = Math.max(calfR * 0.76, baseHemR * hemCmScale);

  const legGeometries = useMemo(() => {
    if (isSkirt) return null;

    const buildLegForSide = (side: number) => {
      // Shift upper thigh rings medially toward the pelvis midline so there is zero gap
      const medialShift = -side * 0.011;

      if (isBermuda) {
        const rings: LoftRing[] = [
          { y: -0.38, rx: thighR * 0.95, rzFront: thighR * 0.94, rzBack: thighR * 0.96, cz: 0.002 },
          { y: -0.24, rx: thighR * 0.98, rzFront: thighR * 0.96, rzBack: thighR * 0.98, cz: 0.001 },
          { y: -0.08, rx: thighR * 1.04, rzFront: thighR, rzBack: thighR * 1.04, cx: medialShift * 0.5, cz: 0 },
          { y: 0.06, rx: thighR * 1.09, rzFront: thighR * 0.98, rzBack: thighR * 1.06, cx: medialShift, cz: -0.002 },
        ];
        return buildLoftedGeometry({
          rings,
          heightSegments: 24,
          radialSegments: 40,
          capBottom: true,
          capTop: true,
          uRepeat: 2,
          vRepeat: 1.5,
        });
      }

      const kneeR = fitLower.includes("wide")
        ? thighR * 0.96
        : fitLower.includes("relaxed")
        ? thighR * 0.92
        : thighR * 0.84;

      const rings: LoftRing[] = [
        { y: legBottomY, rx: hemR, rzFront: hemR * 0.96, rzBack: hemR * 0.98, cz: 0.004 },
        {
          y: -0.66 + hemRideUp * 0.6,
          rx: isFlared ? calfR * 1.24 : calfR * 0.94,
          rzFront: isFlared ? calfR * 1.22 : calfR * 0.92,
          rzBack: isFlared ? calfR * 1.24 : calfR * 0.98,
          cz: 0.001,
        },
        { y: -0.52, rx: calfR, rzFront: calfR * 0.95, rzBack: calfR * 1.05, cz: -0.003 },
        { y: -0.39, rx: kneeR, rzFront: kneeR * 1.02, rzBack: kneeR * 0.96, cz: 0.004 },
        { y: -0.22, rx: thighR * 0.97, rzFront: thighR * 0.96, rzBack: thighR * 0.98, cz: 0.002 },
        { y: -0.06, rx: thighR * 1.04, rzFront: thighR * 0.98, rzBack: thighR * 1.04, cx: medialShift * 0.55, cz: 0 },
        { y: 0.065, rx: thighR * 1.09, rzFront: thighR * 0.96, rzBack: thighR * 1.06, cx: medialShift, cz: -0.002 },
      ];

      return buildLoftedGeometry({
        rings,
        heightSegments: 44,
        radialSegments: 44,
        capBottom: true,
        capTop: true,
        uRepeat: 2,
        vRepeat: 3,
        radialDisplacement: (theta, y, u) => {
          let drx = 0;
          let drz = 0;

          if (isTooBig && !isFlared && u < 0.32) {
            const stackEnv = Math.sin((u / 0.32) * Math.PI);
            const wave = Math.sin(u * 55 + Math.cos(theta * 2) * 0.6);
            const amp = puddleAmount * 0.28 * stackEnv * (0.6 + 0.4 * wave);
            drx += amp;
            drz += amp * 1.15;
          }

          if (isTooSmall && y > -0.45 && y < -0.33) {
            const kneeEnv = Math.sin(((y + 0.45) / 0.12) * Math.PI);
            const ripple = Math.sin((y + 0.45) * 160) * 0.0014 * Math.abs(clampedTightness) * kneeEnv;
            drz += ripple;
          }

          return { drx, drz };
        },
      });
    };

    return {
      left: buildLegForSide(-1),
      right: buildLegForSide(1),
    };
  }, [
    isSkirt,
    isBermuda,
    isFlared,
    fitLower,
    thighR,
    calfR,
    hemR,
    legBottomY,
    hemRideUp,
    isTooBig,
    isTooSmall,
    puddleAmount,
    clampedTightness,
  ]);

  const modelY = -0.9 + 0.111 * avatarScaleY;
  const legPosX = (isFemale ? 0.072 : 0.074) * Math.max(0.90, hipModVal * 0.92);
  const clampedScaleY = Math.max(0.92, Math.min(1.08, pantsScaleY || 1.0));

  return (
    <group scale={[avatarScaleXZ, avatarScaleY, avatarScaleXZ]} position={[0, modelY, 0]}>
      {/* ── CONTINUOUS LOFTED PELVIS / RISE / SKIRT BODY ── */}
      <mesh geometry={pelvisGeometry}>
        <meshStandardMaterial {...deniMat} />
      </mesh>

      {/* Surface-Snapped Waistband Collar */}
      <mesh geometry={waistbandGeometry}>
        <meshStandardMaterial {...deniMat} roughness={Math.min(0.92, adjustedRoughness + 0.04)} />
      </mesh>

      {/* Surface-Snapped Belt Loops */}
      {beltLoopGeometries.map((geo, idx) => (
        <mesh key={`beltloop-${idx}`} geometry={geo}>
          <meshStandardMaterial {...deniMat} />
        </mesh>
      ))}

      {/* Surface-Snapped Front Pleats (Pinzas Sastreras) */}
      {pleatGeometries.map((geo, idx) => (
        <mesh key={`pleat-${idx}`} geometry={geo}>
          <meshStandardMaterial {...pocketMat} />
        </mesh>
      ))}

      {/* Surface-Snapped Vintage Whiskers (Desgaste Superior) */}
      {pelvisWhiskerGeometries.map((geo, idx) => (
        <mesh key={`whisker-${idx}`} geometry={geo}>
          <meshStandardMaterial {...distressMat} />
        </mesh>
      ))}

      {/* Surface-Snapped Front Fly J-Stitch */}
      <mesh geometry={flyStitchGeometry}>
        <meshStandardMaterial {...STITCH_MAT} side={THREE.DoubleSide} />
      </mesh>

      {/* Surface-Snapped Curved Front Pockets */}
      {frontPocketsGeometry.map((geo, idx) => (
        <mesh key={`front-pocket-${idx}`} geometry={geo}>
          <meshStandardMaterial {...pocketMat} />
        </mesh>
      ))}

      {/* Surface-Snapped Curved Back Patch Pockets */}
      {backPocketsGeometry.map((geo, idx) => (
        <mesh key={`back-pocket-${idx}`} geometry={geo}>
          <meshStandardMaterial {...pocketMat} />
        </mesh>
      ))}

      {/* Surface-Snapped Metal Shank Button & Copper Rivets */}
      <mesh position={hardwarePositions.button} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.0085, 0.0085, 0.0038, 18]} />
        <meshStandardMaterial {...BUTTON_MAT} />
      </mesh>
      <mesh position={hardwarePositions.rivetL}>
        <sphereGeometry args={[0.003, 10, 10]} />
        <meshStandardMaterial {...RIVET_MAT} />
      </mesh>
      <mesh position={hardwarePositions.rivetR}>
        <sphereGeometry args={[0.003, 10, 10]} />
        <meshStandardMaterial {...RIVET_MAT} />
      </mesh>

      {/* ── CONTINUOUS LOFTED PANT LEGS ── */}
      {!isSkirt &&
        legGeometries &&
        [-1, 1].map((legSide) => {
          const legGeo = legSide === -1 ? legGeometries.left : legGeometries.right;
          return (
            <group
              key={`pant-leg-${legSide}`}
              position={[legSide * legPosX, 0.81, 0]}
              scale={[1, clampedScaleY, 1]}
            >
              <mesh geometry={legGeo}>
                <meshStandardMaterial {...deniMat} />
              </mesh>

              {/* Vintage Thigh/Knee Distress Fade when distress > 0.12 */}
              {!isBermuda && distress > 0.12 && (
                <group position={[0, -0.37, 0.005]}>
                  <mesh scale={[1.015, 1, 1.02]}>
                    <cylinderGeometry
                      args={[thighR * 0.87, thighR * 0.86, 0.022 + distress * 0.035, 28, 1, true, -0.65, 1.3]}
                    />
                    <meshStandardMaterial {...distressMat} side={THREE.DoubleSide} />
                  </mesh>
                  {distress > 0.35 && (
                    <mesh position={[0, 0.14, -0.002]} scale={[1.015, 1, 1.02]}>
                      <cylinderGeometry
                        args={[thighR * 0.96, thighR * 0.93, 0.08 + distress * 0.06, 28, 1, true, -0.58, 1.16]}
                      />
                      <meshStandardMaterial {...distressMat} side={THREE.DoubleSide} />
                    </mesh>
                  )}
                </group>
              )}

              {/* Turn-up Cuff or Clean Bottom Hem Stitch */}
              {!isBermuda && hasCuff && !isFlared ? (
                <mesh position={[0, legBottomY + 0.018, 0.004]}>
                  <cylinderGeometry args={[hemR * 1.045, hemR * 1.045, 0.036, 36]} />
                  <meshStandardMaterial color={accent} roughness={adjustedRoughness * 0.9} />
                </mesh>
              ) : (
                <mesh
                  position={[0, legBottomY + 0.006, isBermuda ? 0.002 : 0.004]}
                  rotation={[Math.PI / 2, 0, 0]}
                >
                  <torusGeometry
                    args={[(isBermuda ? thighR * 0.95 : hemR) * 1.005, 0.0013, 8, 36]}
                  />
                  <meshStandardMaterial {...STITCH_MAT} />
                </mesh>
              )}
            </group>
          );
        })}
    </group>
  );
});
