import { memo, useMemo } from "react";
import * as THREE from "three";
import {
  buildLoftedGeometry,
  evaluateRingPoint,
  LoftRing,
  sampleLoftRings,
} from "./loftGeometry";

/**
 * Shared craniofacial LoftRings used by both RealisticFace and HairComponent
 * so hair and eyebrows conform 100% to the exact 3D skull surface without gaps or floating.
 */
export function getHeadLoftRings(headR: number, isFemale: boolean): LoftRing[] {
  const jawWidth = isFemale ? 0.64 : 0.70;
  const chinWidth = isFemale ? 0.44 : 0.50;
  return [
    // 0: Submental / Neck junction base (aligned smoothly with top of neck)
    { y: -headR * 0.96, rx: headR * 0.30, rzFront: headR * 0.38, rzBack: headR * 0.34, cz: headR * 0.03 },
    // 1: Mentalis / Smooth lower chin & jaw curve (zero shadow bump)
    { y: -headR * 0.83, rx: headR * chinWidth, rzFront: headR * 0.62, rzBack: headR * 0.48, cz: headR * 0.06 },
    // 2: Mandible / Jawline & Upper Nape
    { y: -headR * 0.62, rx: headR * jawWidth, rzFront: headR * 0.76, rzBack: headR * 0.62, cz: headR * 0.05 },
    // 3: Lower cheek / Oral level & Occipital base
    { y: -headR * 0.38, rx: headR * (isFemale ? 0.80 : 0.84), rzFront: headR * 0.85, rzBack: headR * 0.78, cz: headR * 0.025 },
    // 4: Sub-zygomatic / Mid-face (Nose base)
    { y: -headR * 0.14, rx: headR * 0.92, rzFront: headR * 0.91, rzBack: headR * 0.90, cz: 0.001 },
    // 5: Zygomatic arch (Cheekbones / Eye socket plane)
    { y: headR * 0.08, rx: headR * 0.97, rzFront: headR * 0.92, rzBack: headR * 0.96, cz: 0 },
    // 6: Supraorbital / Brow ridge
    { y: headR * 0.28, rx: headR * 0.95, rzFront: headR * 0.91, rzBack: headR * 0.97, cz: 0 },
    // 7: Forehead
    { y: headR * 0.56, rx: headR * 0.86, rzFront: headR * 0.84, rzBack: headR * 0.89, cz: 0 },
    // 8: Upper cranium dome
    { y: headR * 0.82, rx: headR * 0.64, rzFront: headR * 0.63, rzBack: headR * 0.66, cz: -headR * 0.02 },
    // 9: Crown apex
    { y: headR * 0.98, rx: headR * 0.26, rzFront: headR * 0.26, rzBack: headR * 0.28, cz: -headR * 0.03 },
  ];
}

/**
 * Generates a curved 3D eyebrow mesh that conforms 100% to the forehead surface
 * (zero vertical cross, zero floating in side profile).
 */
function buildSurfaceEyebrowGeometry(
  headRings: LoftRing[],
  side: -1 | 1,
  thickness: number
): THREE.BufferGeometry {
  const lengthSteps = 14;
  const heightSteps = 6;
  const stride = lengthSteps + 1;
  const positions = new Float32Array((heightSteps + 1) * stride * 3);
  const indices: number[] = [];

  // Angular span from inner brow (near nasal bridge) to outer temple arch
  const thetaInner = 0.14;
  const thetaOuter = 0.52;

  for (let i = 0; i <= heightSteps; i++) {
    const v = i / heightSteps; // 0 = bottom edge of brow, 1 = top edge of brow
    const vCentered = v - 0.5;

    for (let j = 0; j <= lengthSteps; j++) {
      const t = j / lengthSteps; // 0 = inner brow, 1 = outer tail
      const thetaAbs = thetaInner + (thetaOuter - thetaInner) * t;
      const theta = side * thetaAbs;

      // Natural anatomical brow arch: rises gently to peak at t ≈ 0.62, then tapers at outer tail
      const archLift = Math.sin(t * Math.PI * 0.88) * 0.024 - Math.pow(t, 2.2) * 0.012;
      // Taper thickness softly at the inner tip and outer tail
      const taperEnv = Math.sin(Math.pow(t, 0.7) * Math.PI) * 0.85 + 0.15;
      const localHalfU = (thickness * 0.36 * taperEnv);

      const u = 0.618 + archLift + vCentered * localHalfU;
      const ring = sampleLoftRings(headRings, u);

      // Gentle 3D relief: slightly thicker in the center of the brow strip, flush at edges
      const relief = Math.sin(v * Math.PI) * 0.0022 + 0.0006;
      const offsetRing: LoftRing = {
        ...ring,
        rx: ring.rx + relief,
        rzFront: ring.rzFront + relief,
        rzBack: ring.rzBack + relief,
      };

      const pt = evaluateRingPoint(offsetRing, theta);
      const idx = i * stride + j;
      positions[idx * 3] = pt.x;
      positions[idx * 3 + 1] = pt.y;
      positions[idx * 3 + 2] = pt.z;
    }
  }

  for (let i = 0; i < heightSteps; i++) {
    for (let j = 0; j < lengthSteps; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + (j + 1);
      const d = i * stride + (j + 1);
      if (side === 1) {
        indices.push(a, d, b);
        indices.push(b, d, c);
      } else {
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates a curved 3D temple arm (patilla de anteojo) that follows the exact
 * lateral contour of the head from the outer lens frame hinge back over the ear.
 */
function buildGlassesTempleGeometry(
  headRings: LoftRing[],
  headR: number,
  side: -1 | 1
): THREE.BufferGeometry {
  const ringMid = sampleLoftRings(headRings, 0.56);
  const xHinge = side * headR * 0.565;
  const xTemple = side * (ringMid.rx * 0.992);
  const xEar = side * (ringMid.rx * 0.985);

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(xHinge, headR * 0.115, headR * 0.885),
    new THREE.Vector3(xTemple * 0.88, headR * 0.112, headR * 0.62),
    new THREE.Vector3(xTemple, headR * 0.105, headR * 0.25),
    new THREE.Vector3(xEar, headR * 0.085, -headR * 0.04),
    new THREE.Vector3(xEar * 0.97, headR * 0.015, -headR * 0.16),
  ]);

  return new THREE.TubeGeometry(curve, 20, headR * 0.016, 10, false);
}

export const RealisticFace = memo(function RealisticFace({
  skinColor,
  isFemale,
  eyebrowStyle,
  glasses = false,
  glassesColor = "#111827",
}: {
  skinColor: string;
  isFemale: boolean;
  eyebrowStyle: string;
  glasses?: boolean;
  glassesColor?: string;
}) {
  const skinMat = useMemo(
    () => ({ color: skinColor, roughness: 0.54, metalness: 0.03 }),
    [skinColor]
  );

  const frameMat = useMemo(
    () => ({
      color: glassesColor || "#111827",
      roughness: 0.26,
      metalness: 0.35,
    }),
    [glassesColor]
  );

  // Normalized thickness parameter in u-space along forehead
  const eyebrowThickU =
    eyebrowStyle === "Grueso" ? 0.115 : eyebrowStyle === "Fino" ? 0.048 : 0.080;

  const headR = isFemale ? 0.126 : 0.132;
  const headScaleX = isFemale ? 0.85 : 0.88;
  const headScaleZ = isFemale ? 0.92 : 0.95;

  const headRings = useMemo(() => getHeadLoftRings(headR, isFemale), [headR, isFemale]);

  const headGeometry = useMemo(
    () =>
      buildLoftedGeometry({
        rings: headRings,
        heightSegments: 44,
        radialSegments: 48,
        capBottom: true,
        capTop: true,
      }),
    [headRings]
  );

  const eyebrowGeos = useMemo(
    () => ({
      left: buildSurfaceEyebrowGeometry(headRings, -1, eyebrowThickU),
      right: buildSurfaceEyebrowGeometry(headRings, 1, eyebrowThickU),
    }),
    [headRings, eyebrowThickU]
  );

  const templeGeos = useMemo(
    () => ({
      left: buildGlassesTempleGeometry(headRings, headR, -1),
      right: buildGlassesTempleGeometry(headRings, headR, 1),
    }),
    [headRings, headR]
  );

  // Smooth lofted nose geometry integrated into the mid-face
  const noseGeometry = useMemo(() => {
    const w = isFemale ? 0.012 : 0.014;
    const rings: LoftRing[] = [
      // Sub-nasale (base under nostrils, recessed into upper lip plane)
      { y: -0.008, rx: w * 0.72, rzFront: 0.006, rzBack: 0.004, cz: -0.004 },
      // Nose tip & alar wings
      { y: -0.001, rx: w, rzFront: 0.014, rzBack: 0.006, cz: 0.001 },
      // Mid nasal bridge
      { y: 0.015, rx: w * 0.62, rzFront: 0.009, rzBack: 0.005, cz: -0.003 },
      // Radix (between eyes, tucked into glabella)
      { y: 0.030, rx: w * 0.45, rzFront: 0.004, rzBack: 0.004, cz: -0.008 },
    ];
    return buildLoftedGeometry({
      rings,
      heightSegments: 14,
      radialSegments: 20,
      capBottom: true,
      capTop: true,
    });
  }, [isFemale]);

  return (
    <group scale={[headScaleX, 1.0, headScaleZ]}>
      {/* ── UNIFIED CRANIOFACIAL SCULPT ── */}
      <mesh geometry={headGeometry}>
        <meshStandardMaterial {...skinMat} />
      </mesh>

      {/* ── EARS — Smooth anatomical oval flush with temporal skull ── */}
      {[-1, 1].map((side) => (
        <group
          key={`ear-${side}`}
          position={[side * headR * 0.94, -headR * 0.04, -headR * 0.03]}
          rotation={[0, side * -0.14, side * 0.05]}
        >
          <mesh scale={[0.14, 0.34, 0.24]}>
            <sphereGeometry args={[headR * 0.68, 24, 20]} />
            <meshStandardMaterial {...skinMat} />
          </mesh>
        </group>
      ))}

      {/* ── CONTINUOUS LOFTED NOSE (Flush bridge & soft tip) ── */}
      <group position={[0, -headR * 0.09, headR * 0.895]}>
        <mesh geometry={noseGeometry}>
          <meshStandardMaterial {...skinMat} />
        </mesh>
      </group>

      {/* ── EYES — Recessed naturally into orbital sockets (Zero protrusion in profile) ── */}
      {[-1, 1].map((side) => (
        <group
          key={`eye-${side}`}
          position={[side * headR * 0.33, headR * 0.085, headR * 0.818]}
          rotation={[0, side * 0.20, 0]}
        >
          {/* Sclera */}
          <mesh scale={[1.22, 0.80, 0.38]}>
            <sphereGeometry args={[0.0185, 24, 24]} />
            <meshStandardMaterial color="#f9f7f5" roughness={0.18} />
          </mesh>
          {/* Iris */}
          <mesh position={[0, 0, 0.0072]} scale={[0.98, 0.96, 0.18]}>
            <sphereGeometry args={[0.0105, 24, 24]} />
            <meshStandardMaterial color="#3b2313" roughness={0.2} />
          </mesh>
          {/* Pupil */}
          <mesh position={[0, 0, 0.0090]} scale={[1.0, 1.0, 0.14]}>
            <sphereGeometry args={[0.0052, 18, 18]} />
            <meshStandardMaterial color="#09090b" roughness={0.08} />
          </mesh>
          {/* Specular catchlight */}
          <mesh position={[0.0028, 0.003, 0.010]}>
            <sphereGeometry args={[0.0018, 10, 10]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          {/* Flush upper lash/lid contour (no protruding sausage shelf) */}
          <mesh
            position={[0, 0.0085, 0.0035]}
            scale={[1.24, 0.22, 0.32]}
            rotation={[0.18, 0, side * -0.04]}
          >
            <sphereGeometry args={[0.018, 18, 12]} />
            <meshStandardMaterial color="#1f1209" roughness={0.82} />
          </mesh>
        </group>
      ))}

      {/* ── SURFACE-CONFORMED EYEBROWS (100% flush with forehead in all views) ── */}
      <mesh geometry={eyebrowGeos.left}>
        <meshStandardMaterial color="#23140b" roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={eyebrowGeos.right}>
        <meshStandardMaterial color="#23140b" roughness={0.85} side={THREE.DoubleSide} />
      </mesh>

      {/* ── MOUTH & LIPS — Recessed naturally on oral contour ── */}
      <group position={[0, -headR * 0.40, headR * 0.845]}>
        {/* Upper lip */}
        <mesh position={[0, 0.0038, 0]} scale={[1.75, 0.34, 0.34]}>
          <sphereGeometry args={[0.014, 20, 14]} />
          <meshStandardMaterial color={isFemale ? "#b85d5d" : "#a66356"} roughness={0.52} />
        </mesh>
        {/* Lower lip */}
        <mesh position={[0, -0.0048, -0.0008]} scale={[1.62, 0.40, 0.36]}>
          <sphereGeometry args={[0.0135, 20, 14]} />
          <meshStandardMaterial color={isFemale ? "#b85d5d" : "#a66356"} roughness={0.52} />
        </mesh>
        {/* Subtle lip parting line */}
        <mesh position={[0, -0.0005, 0.0032]} scale={[1.55, 0.09, 0.18]}>
          <sphereGeometry args={[0.011, 14, 8]} />
          <meshStandardMaterial color="#5c2820" roughness={0.9} />
        </mesh>
      </group>

      {/* ── PRECISION 3D EYEWEAR (ANTEOJOS CONFORMES AL CRÁNEO) ── */}
      {glasses && (
        <group>
          {/* Left & Right Lens Rims + Anti-Reflective Optical Lenses */}
          {[-1, 1].map((side) => (
            <group
              key={`glasses-rim-${side}`}
              position={[side * headR * 0.355, headR * 0.088, headR * 0.892]}
              rotation={[0, side * -0.09, 0]}
            >
              {/* Frame Rim */}
              <mesh scale={[1.18, 0.88, 0.72]}>
                <torusGeometry args={[headR * 0.182, headR * 0.017, 16, 40]} />
                <meshStandardMaterial {...frameMat} />
              </mesh>
              {/* Subtle Translucent Crystal Lens */}
              <mesh position={[0, 0, 0.001]} scale={[1.16, 0.86, 1]}>
                <circleGeometry args={[headR * 0.175, 32]} />
                <meshStandardMaterial
                  color="#bae6fd"
                  transparent
                  opacity={0.22}
                  roughness={0.08}
                  metalness={0.85}
                  side={THREE.DoubleSide}
                />
              </mesh>
              {/* Outer Corner Metallic Hinge Pin */}
              <mesh position={[side * headR * 0.215, headR * 0.032, 0.003]}>
                <boxGeometry args={[headR * 0.035, headR * 0.016, headR * 0.012]} />
                <meshStandardMaterial color="#cbd5e1" roughness={0.22} metalness={0.88} />
              </mesh>
            </group>
          ))}

          {/* Arched Nose Bridge over Radix */}
          <mesh
            position={[0, headR * 0.118, headR * 0.916]}
            rotation={[0.15, 0, 0]}
            scale={[1.0, 0.55, 0.65]}
          >
            <torusGeometry args={[headR * 0.142, headR * 0.014, 12, 24, Math.PI]} />
            <meshStandardMaterial {...frameMat} />
          </mesh>

          {/* Skull-Conformed Left & Right Temple Arms (Patillas) */}
          <mesh geometry={templeGeos.left}>
            <meshStandardMaterial {...frameMat} />
          </mesh>
          <mesh geometry={templeGeos.right}>
            <meshStandardMaterial {...frameMat} />
          </mesh>
        </group>
      )}
    </group>
  );
});
