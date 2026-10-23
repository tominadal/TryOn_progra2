import * as THREE from "three";

export function HairComponent({
  hairStyle,
  hairColor,
  isFemale,
}: {
  hairStyle: string;
  hairColor: string;
  isFemale: boolean;
}) {
  const mat = { color: hairColor, roughness: 0.78, metalness: 0.08 };
  const shadowMat = { color: hairColor, roughness: 0.88, metalness: 0.04 };
  const headR = isFemale ? 0.126 : 0.132;
  const hsx = isFemale ? 0.83 : 0.86;
  const hsz = isFemale ? 0.90 : 0.93;

  if (hairStyle === "Calvo") return null;

  const backZ = -headR * 0.07;

  // ── CORTO — Modern Textured Crop / Fade ──
  if (hairStyle === "Corto") {
    return (
      <group scale={[hsx, 1.0, hsz]}>
        {/* Main cranium coverage cap */}
        <mesh position={[0, headR * 0.045, backZ]}>
          <sphereGeometry args={[headR * 1.06, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.60]} />
          <meshStandardMaterial {...mat} />
        </mesh>

        {/* Top volume lift (Pompadour / textured crown) */}
        <mesh position={[0, headR * 0.22, headR * 0.08]} scale={[0.88, 0.42, 0.85]}>
          <sphereGeometry args={[headR * 0.92, 24, 20]} />
          <meshStandardMaterial {...mat} />
        </mesh>

        {/* Textured fringe locks across forehead (Layered hair tufts) */}
        {[-0.038, -0.015, 0.012, 0.035].map((xOffset, i) => (
          <mesh
            key={`fringe-${i}`}
            position={[xOffset, headR * 0.28, headR * 0.72 - Math.abs(xOffset) * 0.6]}
            rotation={[0.32, (i - 1.5) * 0.14, 0]}
            scale={[0.7, 0.5, 1.1]}
          >
            <coneGeometry args={[0.018, 0.045, 8]} />
            <meshStandardMaterial {...mat} />
          </mesh>
        ))}

        {/* Sideburns (Left & Right) */}
        {[-1, 1].map((side) => (
          <mesh
            key={`sideburn-${side}`}
            position={[side * headR * 0.92, -headR * 0.12, headR * 0.20]}
            rotation={[0, 0, side * 0.08]}
            scale={[0.18, 0.45, 0.24]}
          >
            <cylinderGeometry args={[0.024, 0.018, 0.065, 12]} />
            <meshStandardMaterial {...mat} />
          </mesh>
        ))}
      </group>
    );
  }

  // ── LARGO — Flowing Layered Locks with Volume ──
  if (hairStyle === "Largo") {
    return (
      <group scale={[hsx, 1.0, hsz]}>
        {/* Volumetric crown shell */}
        <mesh position={[0, headR * 0.05, backZ]}>
          <sphereGeometry args={[headR * 1.07, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.54]} />
          <meshStandardMaterial {...mat} />
        </mesh>

        {/* Top center parted volume */}
        <mesh position={[0, headR * 0.24, -headR * 0.02]} scale={[0.92, 0.36, 0.90]}>
          <sphereGeometry args={[headR * 0.94, 24, 20]} />
          <meshStandardMaterial {...mat} />
        </mesh>

        {/* Front-framing side curtains (Left & Right) */}
        {[-1, 1].map((side) => (
          <group key={`front-curtain-${side}`} position={[side * headR * 0.78, -headR * 0.22, headR * 0.44]}>
            {/* Upper drape */}
            <mesh rotation={[0.12, 0, side * -0.15]} scale={[0.85, 1.8, 0.65]}>
              <capsuleGeometry args={[0.034, 0.14, 8, 16]} />
              <meshStandardMaterial {...mat} />
            </mesh>
            {/* Lower cascade lock */}
            <mesh position={[side * 0.012, -0.16, 0.01]} rotation={[-0.1, 0, side * -0.08]} scale={[0.72, 1.5, 0.55]}>
              <capsuleGeometry args={[0.030, 0.16, 8, 16]} />
              <meshStandardMaterial {...mat} />
            </mesh>
          </group>
        ))}

        {/* Back and side sweeping mantle */}
        <mesh position={[0, -headR * 0.62, -headR * 0.12]} scale={[1.06, 1.55, 0.96]}>
          <cylinderGeometry
            args={[headR * 1.06, headR * 1.25, headR * 1.15, 32, 1, true, Math.PI * 0.30, Math.PI * 1.4]}
          />
          <meshStandardMaterial {...mat} side={THREE.DoubleSide} />
        </mesh>
      </group>
    );
  }

  // ── RECOGIDO — Elegant High Updo / Bun ──
  if (hairStyle === "Recogido") {
    return (
      <group scale={[hsx, 1.0, hsz]}>
        {/* Sculpted swept-back cap */}
        <mesh position={[0, headR * 0.045, backZ]}>
          <sphereGeometry args={[headR * 1.055, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
          <meshStandardMaterial {...mat} />
        </mesh>

        {/* Volumetric crown lift */}
        <mesh position={[0, headR * 0.18, -headR * 0.12]} scale={[0.88, 0.35, 0.85]}>
          <sphereGeometry args={[headR * 0.88, 20, 20]} />
          <meshStandardMaterial {...mat} />
        </mesh>

        {/* Textured high bun */}
        <group position={[0, headR * 0.55, -headR * 0.68]} rotation={[0.42, 0, 0]}>
          {/* Main bun sphere */}
          <mesh scale={[1.18, 0.96, 1.05]}>
            <sphereGeometry args={[headR * 0.42, 24, 24]} />
            <meshStandardMaterial {...mat} />
          </mesh>
          {/* Bun texture swirls */}
          {[0, 1.2, 2.4, 3.6, 4.8].map((angle, i) => (
            <mesh
              key={`swirl-${i}`}
              position={[Math.cos(angle) * 0.022, Math.sin(angle) * 0.022, 0.012]}
              rotation={[0, 0, angle]}
              scale={[0.8, 0.4, 0.4]}
            >
              <torusGeometry args={[headR * 0.28, 0.015, 8, 16]} />
              <meshStandardMaterial {...shadowMat} />
            </mesh>
          ))}
          {/* Sleek Scrunchie / Hair Tie */}
          <mesh position={[0, -0.038, -0.015]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[headR * 0.26, 0.015, 12, 24]} />
            <meshStandardMaterial color="#1e1e1e" roughness={0.7} />
          </mesh>
        </group>
      </group>
    );
  }

  // ── RIZADO / ONDULADO (Bonus rich textured style) ──
  return (
    <group scale={[hsx, 1.0, hsz]}>
      {/* Base cap */}
      <mesh position={[0, headR * 0.045, backZ]}>
        <sphereGeometry args={[headR * 1.06, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      {/* Cluster of curly volume nodules around top and sides */}
      {[
        [0, headR * 0.32, 0.02, 0.052],
        [-0.045, headR * 0.28, 0.04, 0.046],
        [0.045, headR * 0.28, 0.04, 0.046],
        [-0.075, headR * 0.12, 0.01, 0.044],
        [0.075, headR * 0.12, 0.01, 0.044],
        [0, headR * 0.24, -0.06, 0.050],
        [-0.042, headR * 0.02, -0.05, 0.042],
        [0.042, headR * 0.02, -0.05, 0.042],
      ].map(([x, y, z, r], i) => (
        <mesh key={`curl-${i}`} position={[x as number, y as number, z as number]} scale={[1.1, 0.9, 1.0]}>
          <sphereGeometry args={[r as number, 16, 16]} />
          <meshStandardMaterial {...mat} />
        </mesh>
      ))}
    </group>
  );
}
