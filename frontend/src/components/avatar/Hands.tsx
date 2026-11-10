import { memo, useMemo } from "react";
import { buildLoftedGeometry, LoftRing } from "./loftGeometry";

interface RealisticHandProps {
  isLeft: boolean;
  skinMat: {
    color: string;
    roughness: number;
    metalness: number;
  };
  foreArmR: number;
  watch?: boolean;
  watchColor?: string;
}

/**
 * Builds a single continuous, smooth lofted finger mesh from knuckle base (y=0)
 * to rounded fingertip (y=-length), with natural anatomical taper and gentle palmar curl.
 */
function buildLoftedFingerGeometry(
  length: number,
  baseRadius: number,
  curlAmount: number
): ReturnType<typeof buildLoftedGeometry> {
  const r0 = baseRadius;
  const r1 = baseRadius * 0.90;
  const r2 = baseRadius * 0.80;
  const rTip = baseRadius * 0.64;

  const rings: LoftRing[] = [
    // Rounded distal fingertip pad
    {
      y: -length,
      rx: rTip * 0.85,
      rzFront: rTip * 0.82,
      rzBack: rTip * 0.78,
      cz: curlAmount,
    },
    // Distal phalanx / DIP joint
    {
      y: -length * 0.74,
      rx: r2,
      rzFront: r2 * 0.92,
      rzBack: r2 * 0.90,
      cz: curlAmount * 0.62,
    },
    // Middle phalanx / PIP joint
    {
      y: -length * 0.42,
      rx: r1,
      rzFront: r1 * 0.95,
      rzBack: r1 * 0.94,
      cz: curlAmount * 0.25,
    },
    // Proximal phalanx base (tucks inside metacarpal palm arch)
    {
      y: 0.004,
      rx: r0 * 1.04,
      rzFront: r0 * 0.96,
      rzBack: r0 * 0.96,
      cz: 0,
    },
  ];

  return buildLoftedGeometry({
    rings,
    heightSegments: 16,
    radialSegments: 18,
    capBottom: true,
    capTop: true,
  });
}

export const RealisticHand = memo(function RealisticHand({
  isLeft,
  skinMat,
  foreArmR,
  watch = false,
  watchColor = "#18181b",
}: RealisticHandProps) {
  const sideX = isLeft ? -1 : 1;
  const handScale = foreArmR / 0.034;

  // 1. Continuous Lofted Wrist + Palm + Thenar Contour (Zero boxes, zero protruding balls, zero wrist gap)
  const palmGeometry = useMemo(() => {
    const rings: LoftRing[] = [
      // Distal metacarpal knuckle arch (where the 4 fingers emerge)
      {
        y: -0.056,
        rx: 0.025,
        rzFront: 0.0095,
        rzBack: 0.0095,
        cx: -sideX * 0.001,
        cz: 0.002,
      },
      // Mid-palm (wider laterally, subtly fuller on thumb/thenar side)
      {
        y: -0.036,
        rx: 0.0275,
        rzFront: 0.0125,
        rzBack: 0.0115,
        cx: sideX * 0.002,
        cz: 0.001,
      },
      // Proximal palm / Carpal base
      {
        y: -0.016,
        rx: 0.0260,
        rzFront: 0.0168,
        rzBack: 0.0158,
        cx: sideX * 0.001,
        cz: 0,
      },
      // Wrist joint (matches distal forearm radius 1:1 with zero step)
      {
        y: 0.002,
        rx: 0.0258,
        rzFront: 0.0226,
        rzBack: 0.0226,
        cx: 0,
        cz: 0,
      },
      // Upper wrist overlap collar (extends 22mm into distal forearm without cap shadow)
      {
        y: 0.022,
        rx: 0.0262,
        rzFront: 0.0230,
        rzBack: 0.0230,
        cx: 0,
        cz: 0,
      },
    ];

    return buildLoftedGeometry({
      rings,
      heightSegments: 20,
      radialSegments: 28,
      capBottom: true,
      capTop: false,
    });
  }, [sideX]);

  // Lofted elliptical watch strap conformed 100% to the wrist cross-section
  const watchStrapGeometry = useMemo(() => {
    const strapRings: LoftRing[] = [
      { y: 0.001, rx: 0.0276, rzFront: 0.0244, rzBack: 0.0244, cx: 0, cz: 0 },
      { y: 0.009, rx: 0.0280, rzFront: 0.0248, rzBack: 0.0248, cx: 0, cz: 0 },
      { y: 0.017, rx: 0.0276, rzFront: 0.0244, rzBack: 0.0244, cx: 0, cz: 0 },
    ];
    return buildLoftedGeometry({
      rings: strapRings,
      heightSegments: 8,
      radialSegments: 32,
      capBottom: true,
      capTop: true,
    });
  }, []);

  // 2. Continuous Lofted Fingers (Index, Middle, Ring, Pinky, and Thumb)
  const fingerGeos = useMemo(
    () => ({
      index: buildLoftedFingerGeometry(0.044, 0.0056, 0.006),
      middle: buildLoftedFingerGeometry(0.049, 0.0059, 0.007),
      ring: buildLoftedFingerGeometry(0.045, 0.0055, 0.007),
      pinky: buildLoftedFingerGeometry(0.036, 0.0048, 0.006),
      thumb: buildLoftedFingerGeometry(0.038, 0.0068, 0.005),
    }),
    []
  );

  return (
    <group scale={[handScale, handScale, handScale]}>
      {/* ── CONTINUOUS SCULPTED WRIST & PALM ── */}
      <mesh geometry={palmGeometry}>
        <meshStandardMaterial {...skinMat} />
      </mesh>

      {/* ── PRECISION 3D WRISTWATCH (RELOJ DE PULSERA CONFORME A LA MUÑECA) ── */}
      {isLeft && watch && (
        <group>
          {/* Conformed Elliptical Wrist Strap */}
          <mesh geometry={watchStrapGeometry}>
            <meshStandardMaterial
              color={watchColor || "#18181b"}
              roughness={0.42}
              metalness={0.28}
            />
          </mesh>

          {/* Watch Case, Bezel, Sapphire Dial & Hands (positioned on front-lateral wrist face) */}
          <group position={[-0.006, 0.009, 0.0242]} rotation={[Math.PI / 2, 0, -0.22]}>
            {/* Watch Lugs (Asas de anclaje a la correa) */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.015, 0.0045, 0.027]} />
              <meshStandardMaterial
                color={watchColor || "#18181b"}
                roughness={0.28}
                metalness={0.65}
              />
            </mesh>
            {/* Main Watch Case Body */}
            <mesh>
              <cylinderGeometry args={[0.0165, 0.0175, 0.0062, 32]} />
              <meshStandardMaterial
                color={watchColor || "#18181b"}
                roughness={0.24}
                metalness={0.78}
              />
            </mesh>
            {/* Metallic Outer Bezel Ring */}
            <mesh position={[0, 0.0032, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.0155, 0.0018, 14, 36]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.20} metalness={0.92} />
            </mesh>
            {/* Watch Dial (Esfera / Cuadrante) */}
            <mesh position={[0, 0.0033, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.0145, 32]} />
              <meshStandardMaterial color="#0f172a" roughness={0.30} metalness={0.40} />
            </mesh>
            {/* Hour Hand */}
            <mesh position={[-0.0028, 0.0038, -0.0022]} rotation={[0, 0.65, 0]}>
              <boxGeometry args={[0.0016, 0.0006, 0.0082]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.15} metalness={0.90} />
            </mesh>
            {/* Minute Hand */}
            <mesh position={[0.0032, 0.0039, -0.0032]} rotation={[0, -0.78, 0]}>
              <boxGeometry args={[0.0013, 0.0006, 0.0112]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.15} metalness={0.90} />
            </mesh>
            {/* Center Pin & 12-o'clock Marker */}
            <mesh position={[0, 0.0040, 0]}>
              <cylinderGeometry args={[0.0014, 0.0014, 0.0008, 12]} />
              <meshStandardMaterial color="#fbbf24" roughness={0.20} metalness={0.95} />
            </mesh>
            {/* Side Crown (Corona a las 3 en punto) */}
            <mesh position={[0.0178, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.0024, 0.0024, 0.0032, 14]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.22} metalness={0.92} />
            </mesh>
          </group>

          {/* Metallic Clasp Buckle on Opposite Wrist Side */}
          <mesh position={[0.004, 0.009, -0.0246]} rotation={[0, 0.15, 0]}>
            <boxGeometry args={[0.012, 0.010, 0.0025]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.25} metalness={0.88} />
          </mesh>
        </group>
      )}

      {/* ── CONTINUOUS SCULPTED THUMB (Natural anatomical opposition) ── */}
      <group
        position={[sideX * 0.021, -0.022, 0.004]}
        rotation={[0.18, -sideX * 0.35, sideX * 0.42]}
      >
        <mesh geometry={fingerGeos.thumb}>
          <meshStandardMaterial {...skinMat} />
        </mesh>
      </group>

      {/* ── 4 CONTINUOUS SCULPTED FINGERS ── */}
      {/* Index */}
      <group
        position={[sideX * 0.0165, -0.052, 0.002]}
        rotation={[0.08, 0, sideX * 0.03]}
      >
        <mesh geometry={fingerGeos.index}>
          <meshStandardMaterial {...skinMat} />
        </mesh>
      </group>

      {/* Middle */}
      <group
        position={[sideX * 0.0055, -0.054, 0.0022]}
        rotation={[0.10, 0, sideX * 0.005]}
      >
        <mesh geometry={fingerGeos.middle}>
          <meshStandardMaterial {...skinMat} />
        </mesh>
      </group>

      {/* Ring */}
      <group
        position={[-sideX * 0.0055, -0.053, 0.002]}
        rotation={[0.12, 0, -sideX * 0.02]}
      >
        <mesh geometry={fingerGeos.ring}>
          <meshStandardMaterial {...skinMat} />
        </mesh>
      </group>

      {/* Pinky */}
      <group
        position={[-sideX * 0.0165, -0.050, 0.0015]}
        rotation={[0.14, 0, -sideX * 0.05]}
      >
        <mesh geometry={fingerGeos.pinky}>
          <meshStandardMaterial {...skinMat} />
        </mesh>
      </group>
    </group>
  );
});
