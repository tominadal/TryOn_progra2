import { memo } from "react";
import * as THREE from "three";

interface ModernShoeProps {
  isLeft: boolean;
  shoeMat: {
    color: string;
    map?: THREE.Texture | null;
    bumpMap?: THREE.Texture | null;
    bumpScale?: number;
    roughness: number;
    metalness: number;
  };
  isFemale: boolean;
  calfR: number;
  yOffset?: number;
}

const SOLE_MAT = { color: "#f4f4f5", roughness: 0.55, metalness: 0.04 };
const TREAD_MAT = { color: "#27272a", roughness: 0.88, metalness: 0.08 };
const LACE_MAT = { color: "#ffffff", roughness: 0.7, metalness: 0.0 };

export const ModernShoe = memo(function ModernShoe({
  isLeft,
  shoeMat,
  isFemale,
  calfR,
  yOffset = 0,
}: ModernShoeProps) {
  const sideX = isLeft ? -1 : 1;
  const shoeWidth = isFemale ? 0.046 : 0.051;
  const shoeLength = isFemale ? 0.132 : 0.146;

  return (
    <group position={[0, -0.845 + yOffset, 0.028]} rotation={[0, sideX * 0.035, 0]}>
      {/* ── PADDED ANKLE COLLAR ── */}
      <mesh position={[0, 0.038, -0.022]} rotation={[0.06, 0, 0]}>
        <cylinderGeometry args={[calfR * 0.86, calfR * 0.95, 0.06, 28]} />
        <meshStandardMaterial {...shoeMat} />
      </mesh>

      {/* ── SCULPTED SNEAKER UPPER (Rounded Capsule Vamp + Heel) ── */}
      <mesh
        position={[0, 0.008, 0.006]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[1.0, 1.0, 0.68]}
      >
        <capsuleGeometry args={[shoeWidth * 0.92, shoeLength * 0.44, 16, 28]} />
        <meshStandardMaterial {...shoeMat} />
      </mesh>

      {/* ── TONGUE & LACES ── */}
      <mesh
        position={[0, 0.036, 0.002]}
        rotation={[-0.38, 0, 0]}
        scale={[shoeWidth * 0.54, 0.048, 0.012]}
      >
        <sphereGeometry args={[1, 16, 14]} />
        <meshStandardMaterial {...shoeMat} roughness={0.88} />
      </mesh>

      {[-0.006, 0.008, 0.022].map((_, i) => (
        <mesh
          key={`lace-${i}`}
          position={[0, 0.024 + i * 0.0065, 0.026 - i * 0.011]}
          rotation={[-0.35, 0, 0]}
        >
          <boxGeometry args={[shoeWidth * 0.72, 0.0032, 0.0045]} />
          <meshStandardMaterial {...LACE_MAT} />
        </mesh>
      ))}

      {/* ── UNIFIED ROUNDED MIDSOLE (Flush with upper) ── */}
      <mesh
        position={[0, -0.014, 0.006]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[1.05, 1.04, 0.32]}
      >
        <capsuleGeometry args={[shoeWidth * 0.94, shoeLength * 0.46, 14, 28]} />
        <meshStandardMaterial {...SOLE_MAT} />
      </mesh>

      {/* ── FLUSH RUBBER OUTSOLE TREAD (No floating gap) ── */}
      <mesh
        position={[0, -0.024, 0.006]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[1.02, 1.02, 0.14]}
      >
        <capsuleGeometry args={[shoeWidth * 0.92, shoeLength * 0.45, 10, 24]} />
        <meshStandardMaterial {...TREAD_MAT} />
      </mesh>
    </group>
  );
});
