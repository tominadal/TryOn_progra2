import * as THREE from "three";

interface RealisticHandProps {
  isLeft: boolean;
  skinMat: {
    color: string;
    roughness: number;
    metalness: number;
  };
  foreArmR: number;
}

export function RealisticHand({ isLeft, skinMat, foreArmR }: RealisticHandProps) {
  const sideX = isLeft ? -1 : 1;
  const handScale = foreArmR / 0.036; // Normalized against baseline forearm radius

  // Finger segment generator
  const renderFinger = (
    baseX: number,
    baseY: number,
    baseZ: number,
    length: number,
    thickness: number,
    curlAngle: number,
    spreadAngle: number
  ) => {
    const phalanx1 = length * 0.45;
    const phalanx2 = length * 0.35;
    const phalanx3 = length * 0.25;

    return (
      <group position={[baseX, baseY, baseZ]} rotation={[curlAngle, 0, spreadAngle * sideX]}>
        {/* Knuckle joint */}
        <mesh>
          <sphereGeometry args={[thickness * 1.05, 12, 12]} />
          <meshStandardMaterial {...skinMat} />
        </mesh>
        {/* Proximal phalanx */}
        <mesh position={[0, -phalanx1 / 2, 0]}>
          <capsuleGeometry args={[thickness, phalanx1, 8, 12]} />
          <meshStandardMaterial {...skinMat} />
        </mesh>

        {/* Middle joint & phalanx */}
        <group position={[0, -phalanx1, 0]} rotation={[curlAngle * 0.6, 0, 0]}>
          <mesh>
            <sphereGeometry args={[thickness * 0.95, 12, 12]} />
            <meshStandardMaterial {...skinMat} />
          </mesh>
          <mesh position={[0, -phalanx2 / 2, 0]}>
            <capsuleGeometry args={[thickness * 0.9, phalanx2, 8, 12]} />
            <meshStandardMaterial {...skinMat} />
          </mesh>

          {/* Distal joint & tip */}
          <group position={[0, -phalanx2, 0]} rotation={[curlAngle * 0.4, 0, 0]}>
            <mesh>
              <sphereGeometry args={[thickness * 0.85, 12, 12]} />
              <meshStandardMaterial {...skinMat} />
            </mesh>
            <mesh position={[0, -phalanx3 / 2, 0]}>
              <capsuleGeometry args={[thickness * 0.8, phalanx3, 8, 12]} />
              <meshStandardMaterial {...skinMat} />
            </mesh>
            {/* Fingertip soft pad */}
            <mesh position={[0, -phalanx3, 0.001]} scale={[0.9, 0.8, 1.1]}>
              <sphereGeometry args={[thickness * 0.75, 10, 10]} />
              <meshStandardMaterial {...skinMat} />
            </mesh>
          </group>
        </group>
      </group>
    );
  };

  return (
    <group scale={[handScale, handScale, handScale]}>
      {/* Wrist transition collar */}
      <mesh position={[0, -0.015, 0]}>
        <cylinderGeometry args={[0.024, 0.026, 0.025, 16]} />
        <meshStandardMaterial {...skinMat} />
      </mesh>

      {/* Main Palm Body — sculpted tapered shape */}
      <group position={[0, -0.052, 0]}>
        {/* Central palm mass */}
        <mesh scale={[1.1, 1.35, 0.62]}>
          <boxGeometry args={[0.042, 0.048, 0.022]} />
          <meshStandardMaterial {...skinMat} />
        </mesh>

        {/* Back of hand gentle dome */}
        <mesh position={[0, 0, -0.005]} scale={[1.0, 1.25, 0.55]}>
          <sphereGeometry args={[0.025, 16, 16]} />
          <meshStandardMaterial {...skinMat} />
        </mesh>

        {/* Thenar eminence (Thumb base muscle cushion) */}
        <mesh position={[sideX * 0.018, 0.008, 0.005]} scale={[1.1, 1.2, 0.9]}>
          <sphereGeometry args={[0.014, 14, 14]} />
          <meshStandardMaterial {...skinMat} />
        </mesh>

        {/* Hypothenar eminence (Pinky side cushion) */}
        <mesh position={[-sideX * 0.017, -0.004, 0.003]} scale={[0.8, 1.3, 0.8]}>
          <sphereGeometry args={[0.012, 12, 12]} />
          <meshStandardMaterial {...skinMat} />
        </mesh>

        {/* ── THUMB ── */}
        <group
          position={[sideX * 0.023, 0.012, 0.006]}
          rotation={[-0.22, sideX * 0.45, sideX * -0.38]}
        >
          {/* Thumb metacarpal */}
          <mesh position={[sideX * 0.007, -0.012, 0.004]}>
            <capsuleGeometry args={[0.0078, 0.022, 8, 12]} />
            <meshStandardMaterial {...skinMat} />
          </mesh>
          {/* Thumb proximal joint & tip */}
          <group position={[sideX * 0.012, -0.025, 0.008]} rotation={[0.2, 0, sideX * 0.15]}>
            <mesh>
              <sphereGeometry args={[0.0075, 12, 12]} />
              <meshStandardMaterial {...skinMat} />
            </mesh>
            <mesh position={[sideX * 0.003, -0.011, 0.002]}>
              <capsuleGeometry args={[0.007, 0.02, 8, 12]} />
              <meshStandardMaterial {...skinMat} />
            </mesh>
            {/* Thumb tip */}
            <mesh position={[sideX * 0.004, -0.023, 0.003]} scale={[1.1, 0.9, 1.1]}>
              <sphereGeometry args={[0.0068, 10, 10]} />
              <meshStandardMaterial {...skinMat} />
            </mesh>
          </group>
        </group>

        {/* ── 4 FINGERS (Relaxed curve) ── */}
        {/* Index Finger */}
        {renderFinger(sideX * 0.014, -0.025, 0.002, 0.046, 0.0058, 0.22, 0.04)}

        {/* Middle Finger (Longest) */}
        {renderFinger(sideX * 0.004, -0.026, 0.003, 0.051, 0.0060, 0.25, 0.01)}

        {/* Ring Finger */}
        {renderFinger(-sideX * 0.006, -0.025, 0.002, 0.047, 0.0057, 0.28, -0.03)}

        {/* Pinky Finger (Smallest) */}
        {renderFinger(-sideX * 0.016, -0.023, 0.001, 0.038, 0.0051, 0.32, -0.08)}
      </group>
    </group>
  );
}
