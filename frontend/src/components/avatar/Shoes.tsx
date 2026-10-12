import * as THREE from "three";

interface ModernShoeProps {
  isLeft: boolean;
  shoeMat: {
    color: string;
    map?: THREE.Texture | null;
    roughness: number;
    metalness: number;
  };
  isFemale: boolean;
  calfR: number;
}

export function ModernShoe({ isLeft, shoeMat, isFemale, calfR }: ModernShoeProps) {
  const sideX = isLeft ? -1 : 1;
  const shoeWidth = isFemale ? 0.048 : 0.054;
  const shoeLength = isFemale ? 0.14 : 0.155;
  const soleColor = "#f4f4f4"; // Crisp modern sneaker midsole
  const soleMat = { color: soleColor, roughness: 0.6, metalness: 0.05 };
  const treadMat = { color: "#1e293b", roughness: 0.9, metalness: 0.1 };
  const laceMat = { color: "#ffffff", roughness: 0.7, metalness: 0.0 };

  return (
    <group position={[0, -0.86, 0.035]} rotation={[0, sideX * 0.04, 0]}>
      {/* ── HIGH/MID PADDED ANKLE COLLAR ── */}
      <mesh position={[0, 0.045, -0.025]} rotation={[0.08, 0, 0]}>
        <cylinderGeometry args={[calfR * 0.88, calfR * 0.96, 0.065, 24]} />
        <meshStandardMaterial {...shoeMat} />
      </mesh>
      {/* Collar soft cushion ring */}
      <mesh position={[0, 0.075, -0.025]} rotation={[0.08, 0, 0]}>
        <torusGeometry args={[calfR * 0.90, 0.009, 12, 24]} />
        <meshStandardMaterial {...shoeMat} roughness={0.9} />
      </mesh>

      {/* ── HEEL COUNTER (Sturdy back cup) ── */}
      <mesh position={[0, 0.02, -0.042]} scale={[shoeWidth * 0.95, 0.055, 0.04]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial {...shoeMat} />
      </mesh>

      {/* ── UPPER MAIN BODY (Vamp & Quarter) ── */}
      <mesh position={[0, 0.015, 0.012]} scale={[shoeWidth, 0.042, shoeLength * 0.58]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial {...shoeMat} />
      </mesh>

      {/* ── ROUNDED TOE BOX (Contoured front) ── */}
      <mesh position={[0, 0.008, shoeLength * 0.34]} scale={[shoeWidth * 0.94, 0.032, 0.042]}>
        <sphereGeometry args={[1, 20, 16]} />
        <meshStandardMaterial {...shoeMat} />
      </mesh>

      {/* ── TONGUE & LACE EYELETS (Sneaker Details) ── */}
      {/* Padded Tongue */}
      <mesh position={[0, 0.048, 0.005]} rotation={[-0.42, 0, 0]} scale={[shoeWidth * 0.52, 0.065, 0.012]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial {...shoeMat} roughness={0.9} />
      </mesh>

      {/* 4 Laces Bars */}
      {[-0.01, 0.008, 0.025, 0.042].map((yOffset, i) => (
        <mesh
          key={`lace-${i}`}
          position={[0, 0.028 + i * 0.007, 0.035 - i * 0.012]}
          rotation={[-0.38, 0, 0]}
        >
          <boxGeometry args={[shoeWidth * 0.65, 0.0035, 0.005]} />
          <meshStandardMaterial {...laceMat} />
        </mesh>
      ))}

      {/* ── MODERN MIDSOLE (Sculpted Cushion Layer) ── */}
      {/* Upper midsole border */}
      <mesh position={[0, -0.018, 0.012]} scale={[shoeWidth * 1.06, 0.024, shoeLength * 0.7]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial {...soleMat} />
      </mesh>

      {/* Heel wedge lift (Modern athletic thick heel) */}
      <mesh position={[0, -0.012, -0.036]} scale={[shoeWidth * 1.05, 0.032, 0.045]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial {...soleMat} />
      </mesh>

      {/* ── OUTSOLE (Rubber Grip Tread Layer) ── */}
      <mesh position={[0, -0.035, 0.012]} scale={[shoeWidth * 1.08, 0.012, shoeLength * 0.72]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial {...treadMat} />
      </mesh>

      {/* Toe bumper tip wrap */}
      <mesh position={[0, -0.015, shoeLength * 0.38]} scale={[shoeWidth * 0.85, 0.022, 0.015]}>
        <sphereGeometry args={[1, 14, 14]} />
        <meshStandardMaterial {...soleMat} />
      </mesh>
    </group>
  );
}
