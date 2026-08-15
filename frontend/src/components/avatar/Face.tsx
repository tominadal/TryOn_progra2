import * as THREE from "three";

export function RealisticFace({ skinColor, isFemale, eyebrowStyle }: {
  skinColor: string;
  isFemale: boolean;
  eyebrowStyle: string;
}) {
  const skinMat = { color: skinColor, roughness: 0.5, metalness: 0.05 };
  const eyebrowThick = eyebrowStyle === "Grueso" ? 0.025 : eyebrowStyle === "Fino" ? 0.003 : 0.009;
  // Base sphere radius — the OVAL is achieved via scale on the parent group
  const headR = isFemale ? 0.128 : 0.134;
  // Oval scale: narrower X (0.86), taller Y (1.0), slightly shallow Z (0.93)
  const headScaleX = isFemale ? 0.84 : 0.86;
  const headScaleZ = isFemale ? 0.91 : 0.93;

  return (
    // The outer scale makes the whole head oval (taller than wide)
    <group scale={[headScaleX, 1.0, headScaleZ]}>

      {/* ── SKULL BASE ── */}
      <mesh>
        <sphereGeometry args={[headR, 48, 48]} />
        <meshStandardMaterial {...skinMat} />
      </mesh>

      {/* ── JAW / CHIN — tapers downward ── */}
      <mesh position={[0, -headR * 0.72, headR * 0.12]} scale={[0.85, 0.52, 0.78]}>
        <sphereGeometry args={[headR * 0.58, 32, 24]} />
        <meshStandardMaterial {...skinMat} />
      </mesh>


      {/* ── EARS — single flat ellipsoid, close to skull ── */}
      {[-1, 1].map((side) => (
        // position: pushed to the side of the skull; scale makes it a flat oval disc
        <mesh
          key={side}
          position={[side * headR * 0.96, -headR * 0.05, 0]}
          scale={[0.18, 0.38, 0.28]}
        >
          <sphereGeometry args={[headR * 0.78, 24, 20]} />
          <meshStandardMaterial {...skinMat} />
        </mesh>
      ))}

      {/* ── NOSE ── */}
      <group position={[0, -headR * 0.13, headR * 0.94]}>
        {/* Tip */}
        <mesh scale={[1.0, 1.3, 0.9]}>
          <sphereGeometry args={[isFemale ? 0.017 : 0.021, 16, 16]} />
          <meshStandardMaterial {...skinMat} />
        </mesh>
        {/* Nasal bridge — runs up toward forehead */}
        <mesh position={[0, 0.028, -0.006]}>
          <capsuleGeometry args={[isFemale ? 0.0075 : 0.009, 0.036, 8, 16]} />
          <meshStandardMaterial {...skinMat} />
        </mesh>
        {/* Nostrils */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.015, -0.008, 0.004]} scale={[0.9, 0.7, 0.7]}>
            <sphereGeometry args={[0.009, 12, 12]} />
            <meshStandardMaterial {...skinMat} />
          </mesh>
        ))}
      </group>

      {/* ── EYES — whites + iris + pupil + upper lid ── */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * headR * 0.36, headR * 0.07, headR * 0.90]}>
          {/* Eye white */}
          <mesh scale={[1.35, 0.85, 0.45]}>
            <sphereGeometry args={[0.021, 24, 24]} />
            <meshStandardMaterial color="#f4ede8" roughness={0.25} />
          </mesh>
          {/* Iris */}
          <mesh position={[0, 0, 0.011]} scale={[1.05, 1.0, 0.28]}>
            <sphereGeometry args={[0.013, 20, 20]} />
            <meshStandardMaterial color="#3b2507" roughness={0.2} />
          </mesh>
          {/* Pupil */}
          <mesh position={[0, 0, 0.014]} scale={[1.05, 1.0, 0.18]}>
            <sphereGeometry args={[0.007, 16, 16]} />
            <meshStandardMaterial color="#060606" roughness={0.1} />
          </mesh>
          {/* Upper eyelid crease */}
          <mesh position={[0, 0.013, 0.009]} scale={[1.55, 0.42, 0.42]} rotation={[0.28, 0, 0]}>
            <sphereGeometry args={[0.020, 16, 8]} />
            <meshStandardMaterial {...skinMat} />
          </mesh>
        </group>
      ))}

      {/* ── EYEBROWS ── */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * headR * 0.355, headR * 0.26, headR * 0.88]}
          rotation={[0, 0, side * -0.18]}
        >
          <boxGeometry args={[0.036, eyebrowThick, 0.007]} />
          <meshStandardMaterial color="#2d1a0e" roughness={0.9} />
        </mesh>
      ))}

      {/* ── MOUTH ── */}
      <group position={[0, -headR * 0.40, headR * 0.92]}>
        {/* Upper lip */}
        <mesh position={[0, 0.007, 0]} scale={[1.7, 0.48, 0.48]}>
          <sphereGeometry args={[0.017, 20, 10]} />
          <meshStandardMaterial color={isFemale ? "#c46e6e" : "#b06050"} roughness={0.65} />
        </mesh>
        {/* Lower lip — slightly fuller */}
        <mesh position={[0, -0.01, 0.001]} scale={[1.9, 0.65, 0.62]}>
          <sphereGeometry args={[0.015, 20, 10]} />
          <meshStandardMaterial color={isFemale ? "#c46e6e" : "#b06050"} roughness={0.65} />
        </mesh>
        {/* Mouth line separator */}
        <mesh position={[0, -0.001, 0.005]} scale={[1.5, 0.18, 0.3]}>
          <sphereGeometry args={[0.012, 12, 8]} />
          <meshStandardMaterial color="#7a3a30" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}
