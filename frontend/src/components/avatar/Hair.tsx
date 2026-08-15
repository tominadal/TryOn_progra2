import * as THREE from "three";

// ──────────────────────────────────────────────────────────────────────────────
//  HAIR COMPONENT — single-shell approach, face always open
// ──────────────────────────────────────────────────────────────────────────────
export function HairComponent({ hairStyle, hairColor, isFemale }: {
  hairStyle: string; hairColor: string; isFemale: boolean;
}) {
  const mat = { color: hairColor, roughness: 0.82, metalness: 0.06 };
  const headR  = isFemale ? 0.128 : 0.134;
  // Same oval scale as the face so hair matches the skull exactly
  const hsx = isFemale ? 0.84 : 0.86;
  const hsz = isFemale ? 0.91 : 0.93;

  if (hairStyle === "Calvo") return null;

  // The key trick: shift every hair cap slightly BACK (-Z) so it never
  // drapes in front of the face. The sphere's leading edge sits roughly
  // at the hairline without covering the forehead.
  const backZ = -headR * 0.08; // small backward offset in pre-scale space

  // ── CORTO — tight close crop, covers crown + sides + nape ──
  if (hairStyle === "Corto") return (
    <group scale={[hsx, 1.0, hsz]}>
      {/* Single shell: from crown down 108° (just past ear level) */}
      <mesh position={[0, headR * 0.04, backZ]}>
        <sphereGeometry args={[headR * 1.055, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
        <meshStandardMaterial {...mat} />
      </mesh>
    </group>
  );

  // ── LARGO — long hair: continuous drape, face completely open ──
  if (hairStyle === "Largo") return (
    <group scale={[hsx, 1.0, hsz]}>
      {/* Crown shell */}
      <mesh position={[0, headR * 0.04, backZ]}>
        <sphereGeometry args={[headR * 1.06, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      {/* Continuous drape around back and sides */}
      <mesh position={[0, -headR * 0.45, -headR * 0.05]} scale={[1.02, 1.4, 0.9]}>
        <cylinderGeometry args={[headR * 1.02, headR * 1.15, headR * 0.8, 32, 1, true, Math.PI * 0.35, Math.PI * 1.3]} />
        <meshStandardMaterial {...mat} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );

  // ── RECOGIDO — updo bun, smooth sides, face open ──
  if (hairStyle === "Recogido") return (
    <group scale={[hsx, 1.0, hsz]}>
      {/* Tight cap */}
      <mesh position={[0, headR * 0.04, backZ]}>
        <sphereGeometry args={[headR * 1.042, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.60]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      {/* Bun at nape (back of neck) */}
      <mesh position={[0, -headR * 0.35, -headR * 0.85]} scale={[1.2, 0.95, 0.95]}>
        <sphereGeometry args={[headR * 0.35, 24, 24]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      {/* Hair tie */}
      <mesh position={[0, -headR * 0.25, -headR * 0.70]} rotation={[0.4, 0, 0]}>
        <torusGeometry args={[headR * 0.25, 0.012, 8, 24]} />
        <meshStandardMaterial color="#111111" roughness={0.8} />
      </mesh>
    </group>
  );

  return null;
}
