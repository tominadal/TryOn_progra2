import * as THREE from "three";

export function RealisticFace({
  skinColor,
  isFemale,
  eyebrowStyle,
}: {
  skinColor: string;
  isFemale: boolean;
  eyebrowStyle: string;
}) {
  const skinMat = { color: skinColor, roughness: 0.62, metalness: 0.03 };
  const shadowSkinMat = { color: skinColor, roughness: 0.75, metalness: 0.02 };
  
  const eyebrowThick = eyebrowStyle === "Grueso" ? 0.016 : eyebrowStyle === "Fino" ? 0.005 : 0.010;
  
  const headR = isFemale ? 0.126 : 0.132;
  const headScaleX = isFemale ? 0.83 : 0.86;
  const headScaleZ = isFemale ? 0.90 : 0.93;

  return (
    <group scale={[headScaleX, 1.0, headScaleZ]}>
      {/* ── CRANIUM / SKULL BASE ── */}
      <mesh>
        <sphereGeometry args={[headR, 48, 48]} />
        <meshStandardMaterial {...skinMat} />
      </mesh>

      {/* Forehead softening cushion */}
      <mesh position={[0, headR * 0.22, headR * 0.52]} scale={[0.82, 0.45, 0.52]}>
        <sphereGeometry args={[headR * 0.72, 32, 24]} />
        <meshStandardMaterial {...skinMat} />
      </mesh>

      {/* ── CHEEKBONES (Zygomatic Arches) ── */}
      {[-1, 1].map((side) => (
        <mesh
          key={`cheek-${side}`}
          position={[side * headR * 0.54, -headR * 0.05, headR * 0.62]}
          scale={[0.35, 0.42, 0.45]}
        >
          <sphereGeometry args={[headR * 0.62, 24, 20]} />
          <meshStandardMaterial {...skinMat} />
        </mesh>
      ))}

      {/* ── JAW / CHIN — Sculpted natural taper ── */}
      {/* Lower jaw body */}
      <mesh position={[0, -headR * 0.68, headR * 0.18]} scale={[isFemale ? 0.72 : 0.82, 0.46, 0.82]}>
        <sphereGeometry args={[headR * 0.62, 32, 24]} />
        <meshStandardMaterial {...skinMat} />
      </mesh>
      {/* Mentalis (Chin tip) */}
      <mesh position={[0, -headR * 0.82, headR * 0.52]} scale={[isFemale ? 0.42 : 0.54, 0.38, 0.46]}>
        <sphereGeometry args={[headR * 0.44, 24, 20]} />
        <meshStandardMaterial {...skinMat} />
      </mesh>

      {/* ── EARS — Sculpted with Helix and Lobe ── */}
      {[-1, 1].map((side) => (
        <group key={`ear-${side}`} position={[side * headR * 0.98, -headR * 0.08, -headR * 0.04]}>
          {/* Outer Helix rim */}
          <mesh rotation={[0, 0, side * 0.12]} scale={[0.16, 0.44, 0.30]}>
            <sphereGeometry args={[headR * 0.68, 24, 20]} />
            <meshStandardMaterial {...skinMat} />
          </mesh>
          {/* Inner concha cavity indentation */}
          <mesh position={[-side * 0.005, 0.005, 0.008]} scale={[0.1, 0.26, 0.20]}>
            <sphereGeometry args={[headR * 0.5, 16, 16]} />
            <meshStandardMaterial {...shadowSkinMat} color="#8a5540" />
          </mesh>
          {/* Earlobe */}
          <mesh position={[0, -headR * 0.20, 0.002]} scale={[0.18, 0.22, 0.22]}>
            <sphereGeometry args={[headR * 0.36, 16, 16]} />
            <meshStandardMaterial {...skinMat} />
          </mesh>
        </group>
      ))}

      {/* ── NOSE ── */}
      <group position={[0, -headR * 0.14, headR * 0.94]}>
        {/* Nasal Bridge (Tapered upper bone) */}
        <mesh position={[0, 0.038, -0.012]} rotation={[0.14, 0, 0]}>
          <cylinderGeometry args={[isFemale ? 0.0065 : 0.0085, isFemale ? 0.0085 : 0.011, 0.045, 16]} />
          <meshStandardMaterial {...skinMat} />
        </mesh>
        {/* Cartilage & Defined Nose Tip */}
        <mesh position={[0, 0.002, 0.008]} scale={[1.0, 1.15, 1.25]}>
          <sphereGeometry args={[isFemale ? 0.014 : 0.018, 20, 20]} />
          <meshStandardMaterial {...skinMat} />
        </mesh>
        {/* Alar wings (Nostrils contour) */}
        {[-1, 1].map((side) => (
          <group key={`nostril-${side}`} position={[side * (isFemale ? 0.013 : 0.016), -0.006, 0.002]}>
            <mesh scale={[0.95, 0.8, 0.85]}>
              <sphereGeometry args={[isFemale ? 0.0085 : 0.0105, 16, 16]} />
              <meshStandardMaterial {...skinMat} />
            </mesh>
            {/* Dark nostril hole suggestion */}
            <mesh position={[0, -0.004, -0.002]} scale={[0.5, 0.3, 0.4]}>
              <sphereGeometry args={[0.006, 10, 10]} />
              <meshStandardMaterial color="#2a1208" roughness={0.9} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ── EYES — Expressive & Lifelike ── */}
      {[-1, 1].map((side) => (
        <group key={`eye-${side}`} position={[side * headR * 0.36, headR * 0.065, headR * 0.89]}>
          {/* Eyeball Sclera (White) */}
          <mesh scale={[1.32, 0.88, 0.52]}>
            <sphereGeometry args={[0.021, 28, 28]} />
            <meshStandardMaterial color="#faf8f5" roughness={0.18} />
          </mesh>
          {/* Iris with deep warm hazel/chestnut tone */}
          <mesh position={[0, 0, 0.0115]} scale={[1.08, 1.05, 0.24]}>
            <sphereGeometry args={[0.0125, 24, 24]} />
            <meshStandardMaterial color="#422817" roughness={0.25} />
          </mesh>
          {/* Pupil */}
          <mesh position={[0, 0, 0.0142]} scale={[1.0, 1.0, 0.15]}>
            <sphereGeometry args={[0.0065, 20, 20]} />
            <meshStandardMaterial color="#080808" roughness={0.05} />
          </mesh>
          {/* Specular Catchlight (Gives soul and life to the gaze!) */}
          <mesh position={[0.004, 0.005, 0.0155]}>
            <sphereGeometry args={[0.0024, 12, 12]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>

          {/* Upper Eyelid / Lash Line */}
          <mesh position={[0, 0.012, 0.008]} scale={[1.42, 0.32, 0.42]} rotation={[0.22, 0, 0]}>
            <sphereGeometry args={[0.021, 20, 12]} />
            <meshStandardMaterial {...skinMat} />
          </mesh>
          {/* Dark Eyelash line contour */}
          <mesh position={[0, 0.011, 0.011]} scale={[1.36, 0.12, 0.28]} rotation={[0.18, 0, 0]}>
            <boxGeometry args={[0.032, 0.004, 0.01]} />
            <meshStandardMaterial color="#1a0f08" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* ── EYEBROWS — Arched & Sculpted ── */}
      {[-1, 1].map((side) => (
        <group
          key={`brow-${side}`}
          position={[side * headR * 0.35, headR * 0.22, headR * 0.88]}
          rotation={[0, 0, side * -0.16]}
        >
          {/* Inner brow arch */}
          <mesh position={[-side * 0.008, 0, 0]} rotation={[0, 0, side * 0.08]}>
            <boxGeometry args={[0.022, eyebrowThick, 0.006]} />
            <meshStandardMaterial color="#24140a" roughness={0.85} />
          </mesh>
          {/* Outer brow tail (slight downward taper) */}
          <mesh position={[side * 0.014, -0.004, -0.002]} rotation={[0, 0, side * -0.28]}>
            <boxGeometry args={[0.020, eyebrowThick * 0.75, 0.005]} />
            <meshStandardMaterial color="#24140a" roughness={0.85} />
          </mesh>
        </group>
      ))}

      {/* ── MOUTH & LIPS ── */}
      <group position={[0, -headR * 0.42, headR * 0.90]}>
        {/* Philtrum (groove between nose and upper lip) */}
        <mesh position={[0, 0.022, 0.003]} scale={[0.45, 0.8, 0.3]}>
          <cylinderGeometry args={[0.008, 0.008, 0.016, 12]} />
          <meshStandardMaterial {...skinMat} />
        </mesh>

        {/* Upper Lip — Cupid's Bow with dual crests */}
        {[-1, 1].map((crest) => (
          <mesh
            key={`cupid-${crest}`}
            position={[crest * 0.009, 0.006, 0.002]}
            rotation={[0, 0, crest * -0.12]}
            scale={[1.1, 0.52, 0.45]}
          >
            <sphereGeometry args={[0.012, 16, 12]} />
            <meshStandardMaterial
              color={isFemale ? "#b65656" : "#9e5548"}
              roughness={0.52}
            />
          </mesh>
        ))}

        {/* Lower Lip — Fuller curved pillow */}
        <mesh position={[0, -0.010, 0.003]} scale={[1.85, 0.68, 0.60]}>
          <sphereGeometry args={[0.014, 24, 16]} />
          <meshStandardMaterial
            color={isFemale ? "#b65656" : "#9e5548"}
            roughness={0.52}
          />
        </mesh>

        {/* Subtle oral fissure / shadow line between lips */}
        <mesh position={[0, -0.001, 0.006]} scale={[1.65, 0.12, 0.28]}>
          <boxGeometry args={[0.028, 0.006, 0.008]} />
          <meshStandardMaterial color="#4a1c14" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}
