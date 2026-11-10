import { memo, useMemo } from "react";
import * as THREE from "three";
import { getHeadLoftRings } from "./Face";
import {
  evaluateRingPoint,
  getProceduralFabricTexture,
  LoftRing,
  sampleLoftRings,
} from "./loftGeometry";

/**
 * Smooth cubic Hermite step between edge0 and edge1.
 */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Generates a single continuous, skull-conformed 3D hair cap directly from the
 * craniofacial `headRings` of `Face.tsx`:
 * - Forehead hairline stays high (`u ≈ 0.76`, `y ≈ +0.53 * headR`), well above eyebrows
 * - Temples/sideburns dip smoothly in front of the ear (`a ≈ 1.18 rad`) so there are zero bald patches
 * - Arches cleanly over the top rim of the ear (`a ≈ 1.54 rad`)
 * - Nape of the neck (`a > 1.8 rad`) follows the exact inward occipital taper down to `u = 0.24`
 *   and tapers hair thickness down to 1.5mm at the skin edge so there is ZERO helmet overhang!
 */
function buildSkullConformedHairCap(
  headR: number,
  style: "Corto" | "Largo" | "Recogido",
  isFemale: boolean
): THREE.BufferGeometry {
  const headRings = getHeadLoftRings(headR, isFemale);
  const sSegs = 36; // 0 = crown apex, 1 = hairline/nape edge
  const tSegs = 72; // 0..2*PI around the skull
  const stride = tSegs + 1;

  const positions = new Float32Array((sSegs + 1) * stride * 3);
  const uvs = new Float32Array((sSegs + 1) * stride * 2);
  const indices: number[] = [];

  const crownHeightBoost =
    style === "Corto" ? 0.015 : style === "Largo" ? 0.013 : 0.010;
  const maxVolumeThickness =
    style === "Corto" ? 0.012 : style === "Largo" ? 0.011 : 0.0085;

  for (let i = 0; i <= sSegs; i++) {
    const s = i / sSegs; // 0 at top crown pole, 1 at hairline boundary

    for (let j = 0; j <= tSegs; j++) {
      const v = j / tSegs;
      const theta = v * Math.PI * 2;
      const cosT = Math.cos(theta);
      // Angle from front center (0 = forehead center, PI/2 = ear plane, PI = back nape center)
      const a = Math.acos(Math.max(-1, Math.min(1, cosT)));

      // Base uMin curve from forehead (0.76) -> temple (0.53) -> behind ear / nape (0.24)
      const frontToSide = smoothstep(0.55, 1.25, a);
      const sideToBack = smoothstep(1.52, 2.25, a);

      let uMin =
        0.765 * (1 - frontToSide) +
        0.535 * frontToSide * (1 - sideToBack) +
        0.24 * sideToBack;

      // Subtle sideburn dip right in front of the ear (a ≈ 1.18 rad)
      const sideburnEnv = Math.exp(-Math.pow((a - 1.18) / 0.18, 2));
      uMin -= sideburnEnv * (isFemale ? 0.035 : 0.055);

      // Clean arch over the upper ear attachment (a ≈ 1.54 rad)
      const earArchEnv = Math.exp(-Math.pow((a - 1.54) / 0.16, 2));
      uMin += earArchEnv * 0.055;

      // Subtle natural side-part contour on the forehead for Corto & Largo
      if (a < 0.85 && style !== "Recogido") {
        uMin += Math.sin(theta - 0.35) * 0.018 * (1 - a / 0.85);
      }

      if (s === 0) {
        // Exact watertight crown apex
        const topRing = headRings[headRings.length - 1];
        const idx = i * stride + j;
        positions[idx * 3] = 0;
        positions[idx * 3 + 1] = topRing.y + crownHeightBoost;
        positions[idx * 3 + 2] = (topRing.cz ?? 0) - 0.002;
        uvs[idx * 2] = v * 4;
        uvs[idx * 2 + 1] = 0;
        continue;
      }

      const u = 1.0 - s * (1.0 - uMin);
      const baseRing = sampleLoftRings(headRings, u);

      // Smooth thickness envelope:
      // Full volume across the crown & mid-scalp, tapering smoothly to 1.2mm right at s=1
      // so the hairline and nape sit 100% flush against the skin without a helmet step!
      const edgeTaper = 1.0 - Math.pow(s, 3.2);
      const strandGroove =
        Math.sin(theta * (style === "Corto" ? 24 : 18) + s * 2.5) *
        0.0012 *
        Math.sin(s * Math.PI);

      // Extra front-crown quiff lift integrated smoothly into Corto (zero detached oval button!)
      const frontQuiff =
        style === "Corto" && cosT > 0.2
          ? Math.sin(s * Math.PI) * Math.pow(cosT, 1.6) * 0.0085
          : 0;

      const radialThick = 0.0012 + maxVolumeThickness * edgeTaper + frontQuiff + strandGroove;
      const verticalLift = crownHeightBoost * Math.pow(1.0 - s, 1.5) + frontQuiff * 0.65;

      const hairRing: LoftRing = {
        ...baseRing,
        y: baseRing.y + verticalLift,
        rx: baseRing.rx + radialThick,
        rzFront: baseRing.rzFront + radialThick,
        rzBack: baseRing.rzBack + radialThick * (a > 1.8 ? 0.85 : 1.0),
      };

      const pt = evaluateRingPoint(hairRing, theta);
      const idx = i * stride + j;
      positions[idx * 3] = pt.x;
      positions[idx * 3 + 1] = pt.y;
      positions[idx * 3 + 2] = pt.z;

      uvs[idx * 2] = v * 4;
      uvs[idx * 2 + 1] = s * 2.5;
    }
  }

  for (let i = 0; i < sSegs; i++) {
    for (let j = 0; j < tSegs; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + (j + 1);
      const d = i * stride + (j + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates a closed, volumetric 3D long-hair drape that starts high inside the
 * cranial cap (`y = +0.52 * headR`) and flows smoothly behind the ears (`theta`
 * from `0.48*PI` to `1.52*PI`) down over the shoulders (`y = -1.52 * headR`),
 * with a solid inner wall so there are zero gaps, zero ear cutouts, and zero hollow shell.
 */
function buildLongHairVolume(headR: number, isFemale: boolean): THREE.BufferGeometry {
  const headRings = getHeadLoftRings(headR, isFemale);
  const hSegs = 32;
  const rSegs = 56; // closed loop around the cross-section (outer back arc + rounded side edges + inner neck-hugging arc)
  const stride = rSegs + 1;

  const positions = new Float32Array((hSegs + 1) * stride * 3);
  const uvs = new Float32Array((hSegs + 1) * stride * 2);
  const indices: number[] = [];

  // Angular span strictly behind the ear plane (0.47*PI to 1.53*PI) so ears sit cleanly in front
  const thetaStart = Math.PI * 0.47;
  const thetaEnd = Math.PI * 1.53;

  for (let i = 0; i <= hSegs; i++) {
    const u = i / hSegs; // 0 = upper crown integration, 1 = shoulder-length tips
    const y = headR * (0.52 - u * (isFemale ? 2.02 : 1.88));

    // Sample skull ring where available (uSkull in [0.22, 0.76]), then transition smoothly to shoulder drape
    const uSkull = Math.max(0.22, 0.76 - u * 0.82);
    const skullRing = sampleLoftRings(headRings, uSkull);

    const belowSkull = smoothstep(0.42, 1.0, u);
    const shoulderFlare = Math.pow(belowSkull, 1.6) * headR * 0.34;
    const tipTaper = u > 0.88 ? (1 - (u - 0.88) / 0.12) : 1.0;

    const baseRx = skullRing.rx * (1 - belowSkull * 0.12) + shoulderFlare;
    const baseRzBack = skullRing.rzBack * (1 - belowSkull * 0.15) + shoulderFlare * 0.68;
    const thickness = (0.011 + 0.012 * Math.sin(u * Math.PI * 0.85)) * tipTaper + 0.002;

    for (let j = 0; j <= rSegs; j++) {
      const loopFrac = j / rSegs; // 0..0.5 = outer hair surface, 0.5..1.0 = inner surface returning
      const isOuter = loopFrac <= 0.5;
      const arcFrac = isOuter ? loopFrac * 2.0 : (1.0 - loopFrac) * 2.0;

      const theta = thetaStart + (thetaEnd - thetaStart) * arcFrac;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);

      // Smooth rounded edge profile where outer and inner surfaces meet at arcFrac = 0 and 1
      const edgeRound = Math.sin(arcFrac * Math.PI);
      const layerOffset = isOuter
        ? thickness * (0.35 + 0.65 * edgeRound)
        : 0.0015 * edgeRound;

      const wave =
        isOuter
          ? Math.sin(arcFrac * Math.PI * 10 + u * 3.0) * 0.0025 * edgeRound * Math.sin(u * Math.PI)
          : 0;

      const rx = baseRx + layerOffset + wave;
      const rz = baseRzBack + layerOffset + wave;

      const x = rx * sinT;
      const z = (skullRing.cz ?? 0) + rz * cosT - belowSkull * 0.012;

      const idx = i * stride + j;
      positions[idx * 3] = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = z;

      uvs[idx * 2] = loopFrac * 4;
      uvs[idx * 2 + 1] = u * 2.5;
    }
  }

  for (let i = 0; i < hSegs; i++) {
    for (let j = 0; j < rSegs; j++) {
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

export const HairComponent = memo(function HairComponent({
  hairStyle,
  hairColor,
  isFemale,
}: {
  hairStyle: string;
  hairColor: string;
  isFemale: boolean;
}) {
  const hairTex = useMemo(() => getProceduralFabricTexture("hair", 4, 3), []);

  const mat = useMemo(
    () => ({
      color: hairColor,
      map: hairTex,
      bumpMap: hairTex,
      bumpScale: 0.0035,
      roughness: 0.74,
      metalness: 0.06,
    }),
    [hairColor, hairTex]
  );

  const headR = isFemale ? 0.126 : 0.132;
  const hsx = isFemale ? 0.85 : 0.88;
  const hsz = isFemale ? 0.92 : 0.95;

  const normalizedStyle: "Corto" | "Largo" | "Recogido" =
    hairStyle === "Largo"
      ? "Largo"
      : hairStyle === "Recogido"
      ? "Recogido"
      : "Corto";

  const capGeometry = useMemo(
    () => buildSkullConformedHairCap(headR, normalizedStyle, isFemale),
    [headR, normalizedStyle, isFemale]
  );

  const longVolumeGeometry = useMemo(
    () => (normalizedStyle === "Largo" ? buildLongHairVolume(headR, isFemale) : null),
    [headR, normalizedStyle, isFemale]
  );

  if (hairStyle === "Calvo") return null;

  return (
    <group scale={[hsx, 1.0, hsz]}>
      {/* ── SKULL-CONFORMED CRANIAL HAIR CAP (Zero helmet gap, zero bald temples) ── */}
      <mesh geometry={capGeometry}>
        <meshStandardMaterial {...mat} side={THREE.DoubleSide} />
      </mesh>

      {/* ── LARGO: Closed Volumetric Shoulder-Length Locks Behind Ears ── */}
      {normalizedStyle === "Largo" && longVolumeGeometry && (
        <mesh geometry={longVolumeGeometry}>
          <meshStandardMaterial {...mat} />
        </mesh>
      )}

      {/* ── RECOGIDO: Sculpted Crown Bun Seated Flush on Occipital Dome ── */}
      {normalizedStyle === "Recogido" && (
        <group position={[0, headR * 0.54, -headR * 0.78]} rotation={[0.42, 0, 0]}>
          <mesh scale={[1.08, 0.88, 1.02]}>
            <sphereGeometry args={[headR * 0.38, 28, 24]} />
            <meshStandardMaterial {...mat} />
          </mesh>
          <mesh position={[0, -0.026, -0.004]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[headR * 0.25, 0.010, 12, 28]} />
            <meshStandardMaterial color="#1f2937" roughness={0.78} />
          </mesh>
        </group>
      )}
    </group>
  );
});
