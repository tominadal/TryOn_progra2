import * as THREE from "three";

export interface LoftRing {
  /** Vertical position Y */
  y: number;
  /** Lateral half-width (X radius) */
  rx: number;
  /** Anterior half-depth (+Z radius) */
  rzFront: number;
  /** Posterior half-depth (-Z radius) */
  rzBack: number;
  /** Center X offset (default 0) */
  cx?: number;
  /** Center Z offset (default 0) */
  cz?: number;
}

/**
 * Smooth Catmull-Rom spline interpolation for scalar values.
 */
function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

/**
 * Evaluates an array of LoftRings at normalized parameter u in [0, 1]
 * using smooth Catmull-Rom interpolation across control rings.
 */
export function sampleLoftRings(rings: LoftRing[], u: number): LoftRing {
  const n = rings.length;
  if (n === 0) {
    return { y: 0, rx: 0.1, rzFront: 0.1, rzBack: 0.1, cx: 0, cz: 0 };
  }
  if (n === 1 || u <= 0) {
    const r = rings[0];
    return { ...r, cx: r.cx ?? 0, cz: r.cz ?? 0 };
  }
  if (u >= 1) {
    const r = rings[n - 1];
    return { ...r, cx: r.cx ?? 0, cz: r.cz ?? 0 };
  }

  const scaled = u * (n - 1);
  const idx = Math.min(n - 2, Math.floor(scaled));
  const t = scaled - idx;

  const r0 = rings[Math.max(0, idx - 1)];
  const r1 = rings[idx];
  const r2 = rings[idx + 1];
  const r3 = rings[Math.min(n - 1, idx + 2)];

  // Linear Y to preserve monotonic vertical ordering, smooth Catmull-Rom for radii and offsets
  const y = r1.y + (r2.y - r1.y) * t;
  const rx = Math.max(0.0005, catmullRom(r0.rx, r1.rx, r2.rx, r3.rx, t));
  const rzFront = Math.max(0.0005, catmullRom(r0.rzFront, r1.rzFront, r2.rzFront, r3.rzFront, t));
  const rzBack = Math.max(0.0005, catmullRom(r0.rzBack, r1.rzBack, r2.rzBack, r3.rzBack, t));
  const cx = catmullRom(r0.cx ?? 0, r1.cx ?? 0, r2.cx ?? 0, r3.cx ?? 0, t);
  const cz = catmullRom(r0.cz ?? 0, r1.cz ?? 0, r2.cz ?? 0, r3.cz ?? 0, t);

  return { y, rx, rzFront, rzBack, cx, cz };
}

/**
 * Evaluates the exact 3D point on a lofted surface for a given ring state and angle theta.
 * theta = 0 is Front (+Z), theta = PI/2 is Right (+X), theta = PI is Back (-Z), theta = 3*PI/2 is Left (-X).
 */
export function evaluateRingPoint(
  ring: LoftRing,
  theta: number,
  radialDisplacement?: (theta: number, y: number, u: number) => { drx?: number; drz?: number; dy?: number },
  u = 0.5
): THREE.Vector3 {
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);

  // Smooth C-infinity blend between front (+Z) and back (-Z) radii
  const baseRz = 0.5 * (ring.rzFront + ring.rzBack) + 0.5 * (ring.rzFront - ring.rzBack) * cosT;
  const baseRx = ring.rx;

  const mod = radialDisplacement ? radialDisplacement(theta, ring.y, u) : undefined;
  const rx = Math.max(0.0002, baseRx + (mod?.drx ?? 0));
  const rz = Math.max(0.0002, baseRz + (mod?.drz ?? 0));
  const y = ring.y + (mod?.dy ?? 0);

  const x = (ring.cx ?? 0) + rx * sinT;
  const z = (ring.cz ?? 0) + rz * cosT;

  return new THREE.Vector3(x, y, z);
}

export interface BuildLoftOptions {
  rings: LoftRing[];
  heightSegments?: number;
  radialSegments?: number;
  capBottom?: boolean;
  capTop?: boolean;
  uRepeat?: number;
  vRepeat?: number;
  radialDisplacement?: (theta: number, y: number, u: number) => { drx?: number; drz?: number; dy?: number };
}

/**
 * Builds a smooth, continuous THREE.BufferGeometry from anatomical LoftRings,
 * with welded seam normals so there is zero lighting discontinuity at theta = 0 / 2*PI.
 */
export function buildLoftedGeometry({
  rings,
  heightSegments = 40,
  radialSegments = 48,
  capBottom = false,
  capTop = false,
  uRepeat = 1,
  vRepeat = 1,
  radialDisplacement,
}: BuildLoftOptions): THREE.BufferGeometry {
  const effectiveRings: LoftRing[] = [...rings];

  if (capBottom && effectiveRings.length > 0) {
    const first = effectiveRings[0];
    effectiveRings.unshift({
      y: first.y - 0.004,
      rx: 0.0005,
      rzFront: 0.0005,
      rzBack: 0.0005,
      cx: first.cx ?? 0,
      cz: first.cz ?? 0,
    });
  }

  if (capTop && effectiveRings.length > 0) {
    const last = effectiveRings[effectiveRings.length - 1];
    effectiveRings.push({
      y: last.y + 0.004,
      rx: 0.0005,
      rzFront: 0.0005,
      rzBack: 0.0005,
      cx: last.cx ?? 0,
      cz: last.cz ?? 0,
    });
  }

  const hSegs = heightSegments;
  const rSegs = radialSegments;
  const stride = rSegs + 1;
  const vertexCount = (hSegs + 1) * stride;

  const positions = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const indices: number[] = [];

  for (let i = 0; i <= hSegs; i++) {
    const u = i / hSegs;
    const sampled = sampleLoftRings(effectiveRings, u);

    for (let j = 0; j <= rSegs; j++) {
      const v = j / rSegs;
      const theta = v * Math.PI * 2;
      const pt = evaluateRingPoint(sampled, theta, radialDisplacement, u);

      const idx = i * stride + j;
      positions[idx * 3] = pt.x;
      positions[idx * 3 + 1] = pt.y;
      positions[idx * 3 + 2] = pt.z;

      uvs[idx * 2] = v * uRepeat;
      uvs[idx * 2 + 1] = u * vRepeat;
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

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  // Weld normals along the seam (j = 0 and j = rSegs) so lighting is 100% seamless
  const normalAttr = geometry.getAttribute("normal") as THREE.BufferAttribute;
  const n0 = new THREE.Vector3();
  const nLast = new THREE.Vector3();
  for (let i = 0; i <= hSegs; i++) {
    const idx0 = i * stride;
    const idxLast = i * stride + rSegs;
    n0.fromBufferAttribute(normalAttr, idx0);
    nLast.fromBufferAttribute(normalAttr, idxLast);
    n0.add(nLast).normalize();
    normalAttr.setXYZ(idx0, n0.x, n0.y, n0.z);
    normalAttr.setXYZ(idxLast, n0.x, n0.y, n0.z);
  }
  normalAttr.needsUpdate = true;

  return geometry;
}

const textureCache: Record<string, THREE.CanvasTexture> = {};

/**
 * Generates high-definition, neutral-luminance (88%–100% white) procedural PBR
 * weave/grain textures on a client canvas so any chosen hex color (including
 * pure white, pastel rose, light blue, or charcoal) renders with 100% color
 * fidelity plus crisp 3D bump relief.
 */
export function getProceduralFabricTexture(
  kind: "denim" | "cotton" | "leather" | "hair",
  repeatX = 4,
  repeatY = 4
): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;

  const cacheKey = `${kind}:${repeatX}:${repeatY}`;
  if (textureCache[cacheKey]) {
    return textureCache[cacheKey];
  }

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let lum = 242;

      if (kind === "denim") {
        // Classic 3x1 diagonal twill weave + vertical warp slub
        const diag = (x + y * 2) % 6;
        const twill = diag < 4 ? 250 : 216;
        const warpSlub = Math.sin(x * 0.45) * 6 + Math.cos(y * 0.18) * 4;
        const microGrain = ((x * 37 + y * 73) % 13) - 6;
        lum = Math.max(198, Math.min(255, twill + warpSlub + microGrain));
      } else if (kind === "cotton") {
        // Fine jersey/piqué interlocking knit loops
        const knitX = Math.sin(x * 0.9) * 7;
        const knitY = Math.cos(y * 0.9 + (x % 2) * 1.5) * 7;
        const micro = ((x * 19 + y * 43) % 9) - 4;
        lum = Math.max(218, Math.min(255, 242 + knitX + knitY + micro));
      } else if (kind === "leather") {
        // Subtle organic pebble grain
        const cellX = Math.sin(x * 0.35 + Math.cos(y * 0.25) * 1.8);
        const cellY = Math.cos(y * 0.35 + Math.sin(x * 0.25) * 1.8);
        const grain = (cellX * cellY) * 14;
        lum = Math.max(215, Math.min(255, 242 + grain));
      } else if (kind === "hair") {
        // Anisotropic vertical hair strand micro-grooves
        const strand = Math.sin(x * 1.35 + Math.sin(y * 0.12) * 0.8) * 16;
        const fine = Math.cos(x * 3.1) * 6;
        lum = Math.max(200, Math.min(255, 236 + strand + fine));
      }

      const idx = (y * size + x) * 4;
      data[idx] = lum;
      data[idx + 1] = lum;
      data[idx + 2] = lum;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.needsUpdate = true;

  textureCache[cacheKey] = tex;
  return tex;
}


