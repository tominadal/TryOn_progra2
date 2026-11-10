/**
 * Shared helpers for the user's saved avatars and the Unified Anthropometric
 * Centimeter (cm) System used across Avatar Creation, Brand Garment Creation,
 * and 3D Virtual Try-On Fit Diagnostics.
 */

/** Same limit as the backend (MAX_AVATARS_PER_USER). */
export const MAX_AVATARS = 10;

/**
 * Body morph multipliers (1.0 = standard anatomical base) + optional explicit
 * centimeter measurements for full transparency and backward compatibility.
 */
export interface BodyMorphs {
  chestWidth?: number;
  bellyWidth?: number;
  bellyDepth?: number;
  hipWidth?: number;
  armThickness?: number;
  legThickness?: number;
  breastSize?: number;
  neckThickness?: number;
  // Explicit centimeter snapshots (optional, auto-derived when absent)
  chestCm?: number;
  waistCm?: number;
  bellyDepthCm?: number;
  hipCm?: number;
  thighCm?: number;
  armCm?: number;
  neckCm?: number;
  bustCm?: number;
  inseamCm?: number;
}

export type MorphKey =
  | "chestWidth"
  | "breastSize"
  | "bellyWidth"
  | "bellyDepth"
  | "hipWidth"
  | "legThickness"
  | "armThickness"
  | "neckThickness";

export interface AnthropometricSpec {
  key: MorphKey;
  label: string;
  unit: "cm";
  kind: "contorno" | "diametro";
  baseMaleCm: number;
  baseFemaleCm: number;
  minCm: number;
  maxCm: number;
  stepCm: number;
  minFactor: number;
  maxFactor: number;
  helpText: string;
}

/**
 * Standard real-world human anthropometric specifications in centimeters (cm).
 * Keeps the exact proportional morph ranges (~0.75x to ~1.45x) while allowing
 * any person to measure themselves with a tape measure.
 */
export const ANTHROPOMETRIC_SPECS: Record<MorphKey, AnthropometricSpec> = {
  chestWidth: {
    key: "chestWidth",
    label: "Contorno de Pecho / Torso",
    unit: "cm",
    kind: "contorno",
    baseMaleCm: 98,
    baseFemaleCm: 88,
    minCm: 74,
    maxCm: 136,
    stepCm: 1,
    minFactor: 0.75,
    maxFactor: 1.42,
    helpText: "Medido alrededor de la parte más amplia del tórax.",
  },
  breastSize: {
    key: "breastSize",
    label: "Contorno de Busto",
    unit: "cm",
    kind: "contorno",
    baseMaleCm: 96,
    baseFemaleCm: 92,
    minCm: 76,
    maxCm: 118,
    stepCm: 1,
    minFactor: 0.7,
    maxFactor: 1.35,
    helpText: "Proyección y contorno sobre la línea media del busto.",
  },
  bellyWidth: {
    key: "bellyWidth",
    label: "Contorno de Cintura",
    unit: "cm",
    kind: "contorno",
    baseMaleCm: 82,
    baseFemaleCm: 70,
    minCm: 58,
    maxCm: 122,
    stepCm: 1,
    minFactor: 0.74,
    maxFactor: 1.45,
    helpText: "Circunferencia a la altura natural de la cintura / cinturón.",
  },
  bellyDepth: {
    key: "bellyDepth",
    label: "Diámetro Abdominal (Profundidad)",
    unit: "cm",
    kind: "diametro",
    baseMaleCm: 22,
    baseFemaleCm: 19,
    minCm: 15,
    maxCm: 34,
    stepCm: 0.5,
    minFactor: 0.74,
    maxFactor: 1.48,
    helpText: "Espesor anteroposterior del abdomen visto de perfil.",
  },
  hipWidth: {
    key: "hipWidth",
    label: "Contorno de Cadera",
    unit: "cm",
    kind: "contorno",
    baseMaleCm: 96,
    baseFemaleCm: 100,
    minCm: 80,
    maxCm: 136,
    stepCm: 1,
    minFactor: 0.78,
    maxFactor: 1.42,
    helpText: "Circunferencia horizontal sobre la parte más prominente de cadera y glúteos.",
  },
  legThickness: {
    key: "legThickness",
    label: "Contorno de Muslo",
    unit: "cm",
    kind: "contorno",
    baseMaleCm: 56,
    baseFemaleCm: 57,
    minCm: 42,
    maxCm: 74,
    stepCm: 1,
    minFactor: 0.75,
    maxFactor: 1.35,
    helpText: "Circunferencia de la parte superior del muslo.",
  },
  armThickness: {
    key: "armThickness",
    label: "Contorno de Brazo (Bíceps)",
    unit: "cm",
    kind: "contorno",
    baseMaleCm: 32,
    baseFemaleCm: 27,
    minCm: 22,
    maxCm: 45,
    stepCm: 0.5,
    minFactor: 0.75,
    maxFactor: 1.42,
    helpText: "Circunferencia media del brazo relajado.",
  },
  neckThickness: {
    key: "neckThickness",
    label: "Contorno de Cuello",
    unit: "cm",
    kind: "contorno",
    baseMaleCm: 39,
    baseFemaleCm: 33,
    minCm: 29,
    maxCm: 48,
    stepCm: 0.5,
    minFactor: 0.8,
    maxFactor: 1.32,
    helpText: "Circunferencia en la base media del cuello.",
  },
};

export function getBaseCm(key: MorphKey, gender?: string | null): number {
  const spec = ANTHROPOMETRIC_SPECS[key];
  return gender === "Mujer" ? spec.baseFemaleCm : spec.baseMaleCm;
}

/**
 * Normalizes a morph value (which could be a multiplier ~1.0 from legacy DB
 * or a centimeter value > 5.0) into a safe 3D multiplier around 1.0.
 */
export function normalizeMorphFactor(
  value: number | undefined | null,
  key: MorphKey,
  gender?: string | null
): number {
  const spec = ANTHROPOMETRIC_SPECS[key];
  if (value === undefined || value === null || Number.isNaN(value)) {
    return 1.0;
  }
  const baseCm = getBaseCm(key, gender);
  const rawFactor = value > 4.5 ? value / baseCm : value;
  return Math.max(spec.minFactor, Math.min(spec.maxFactor, rawFactor));
}

/**
 * Converts a stored morph multiplier (or raw cm) into real-world centimeters (cm).
 */
export function morphToCm(
  value: number | undefined | null,
  key: MorphKey,
  gender?: string | null
): number {
  const spec = ANTHROPOMETRIC_SPECS[key];
  const baseCm = getBaseCm(key, gender);
  if (value === undefined || value === null || Number.isNaN(value)) {
    return baseCm;
  }
  const rawCm = value > 4.5 ? value : value * baseCm;
  const clamped = Math.max(spec.minCm, Math.min(spec.maxCm, rawCm));
  return spec.stepCm < 1 ? Math.round(clamped * 2) / 2 : Math.round(clamped);
}

/**
 * Converts a user-selected centimeter (cm) measurement into the normalized
 * morph factor used by the 3D engine and stored in `body_type`.
 */
export function cmToMorphFactor(
  cm: number,
  key: MorphKey,
  gender?: string | null
): number {
  const spec = ANTHROPOMETRIC_SPECS[key];
  const baseCm = getBaseCm(key, gender);
  const clampedCm = Math.max(spec.minCm, Math.min(spec.maxCm, cm));
  const factor = clampedCm / baseCm;
  return Number(Math.max(spec.minFactor, Math.min(spec.maxFactor, factor)).toFixed(3));
}

/**
 * Estimates anatomical inseam (crotch to ankle bone in cm) from total height in cm.
 */
export function estimateInseamCm(heightCm: number = 170): number {
  return Math.round(Math.max(140, Math.min(210, heightCm)) * 0.455);
}

/**
 * Complete anthropometric profile in centimeters (cm) for an avatar.
 */
export interface AvatarMeasurementsCm {
  heightCm: number;
  inseamCm: number;
  chestCm: number;
  bustCm: number;
  waistCm: number;
  bellyDepthCm: number;
  hipCm: number;
  thighCm: number;
  armCm: number;
  neckCm: number;
}

export function getAvatarMeasurementsCm(
  heightCm: number = 170,
  gender: string = "Hombre",
  morphs: BodyMorphs = {}
): AvatarMeasurementsCm {
  const baseWaist = morphToCm(morphs.bellyWidth, "bellyWidth", gender);
  const baseDepth = getBaseCm("bellyDepth", gender);
  const actualDepth = morphToCm(morphs.bellyDepth, "bellyDepth", gender);
  // Elliptical perimeter adjustment: prominent abdomen adds real circumference to waist tape measure
  const depthPerimeterDelta = Math.round((actualDepth - baseDepth) * 1.15);
  const effectiveWaistCm = Math.max(56, Math.min(130, baseWaist + depthPerimeterDelta));

  return {
    heightCm: Math.round(heightCm || 170),
    inseamCm: morphs.inseamCm ?? estimateInseamCm(heightCm || 170),
    chestCm: morphToCm(morphs.chestWidth, "chestWidth", gender),
    bustCm: morphToCm(morphs.breastSize, "breastSize", gender),
    waistCm: effectiveWaistCm,
    bellyDepthCm: actualDepth,
    hipCm: morphToCm(morphs.hipWidth, "hipWidth", gender),
    thighCm: morphToCm(morphs.legThickness, "legThickness", gender),
    armCm: morphToCm(morphs.armThickness, "armThickness", gender),
    neckCm: morphToCm(morphs.neckThickness, "neckThickness", gender),
  };
}

/**
 * Default garment measurements in centimeters (cm) for Reference Size M (US 32 / AR 42)
 * by Fit category. Used in Brand Dashboard creation and Product Try-On diagnostics.
 */
export interface GarmentPatternCm {
  waistCm: number;
  hipCm: number;
  thighCm: number;
  inseamCm: number;
  hemWidthCm: number;
  riseCm: number;
}

export function getDefaultGarmentPatternCm(
  fit: string = "Regular",
  waistRiseLabel: string = "Tiro Medio"
): GarmentPatternCm {
  const f = (fit || "Regular").toLowerCase();
  const r = (waistRiseLabel || "Tiro Medio").toLowerCase();
  const riseCm = r.includes("alto") ? 29 : r.includes("bajo") ? 22 : 25.5;

  if (f.includes("skinny")) {
    return { waistCm: 80, hipCm: 96, thighCm: 53, inseamCm: 77, hemWidthCm: 15, riseCm };
  }
  if (f.includes("slim")) {
    return { waistCm: 81, hipCm: 98, thighCm: 56, inseamCm: 78, hemWidthCm: 17, riseCm };
  }
  if (f.includes("mom")) {
    return { waistCm: 78, hipCm: 103, thighCm: 60, inseamCm: 74, hemWidthCm: 17.5, riseCm: Math.max(riseCm, 28.5) };
  }
  if (f.includes("wide") || f.includes("baggy")) {
    return { waistCm: 83, hipCm: 106, thighCm: 66, inseamCm: 80, hemWidthCm: 27, riseCm: Math.max(riseCm, 27) };
  }
  if (f.includes("relaxed")) {
    return { waistCm: 84, hipCm: 104, thighCm: 63, inseamCm: 79, hemWidthCm: 22.5, riseCm };
  }
  if (f.includes("flare")) {
    return { waistCm: 80, hipCm: 99, thighCm: 55, inseamCm: 81, hemWidthCm: 26, riseCm: Math.max(riseCm, 27) };
  }
  if (f.includes("bermuda") || f.includes("short")) {
    return { waistCm: 82, hipCm: 102, thighCm: 61, inseamCm: 24, hemWidthCm: 25, riseCm };
  }
  if (f.includes("skirt") || f.includes("pollera")) {
    return { waistCm: 78, hipCm: 101, thighCm: 64, inseamCm: 44, hemWidthCm: 52, riseCm: Math.max(riseCm, 27) };
  }
  // Regular / Straight
  return { waistCm: 82, hipCm: 100, thighCm: 58, inseamCm: 78, hemWidthCm: 20, riseCm };
}

/** Avatar as returned by the API (`/tryon/avatars`). */
export interface SavedAvatar {
  id: number;
  name: string;
  height_cm?: number | null;
  weight_kg?: number | null;
  /** Dict from the API. Older clients stored a JSON string, so both are tolerated. */
  body_type?: BodyMorphs | string | null;
  muscle_definition?: number | null;
  skin_color?: string | null;
  hair_color?: string | null;
  hair_style?: string | null;
  beard_style?: string | null;
  beard_color?: string | null;
  eyebrow_style?: string | null;
  glasses?: boolean | number | null;
  glasses_color?: string | null;
  watch?: boolean | number | null;
  watch_color?: string | null;
  hat_style?: string | null;
  shirt_color?: string | null;
  shirt_style?: string | null;
  shoes_color?: string | null;
  tattoo_left_arm?: boolean | null;
  gender?: string | null;
}

/** body_type can be a dict, a JSON string (legacy) or empty: always return a dict. */
export function parseMorphs(bodyType: SavedAvatar["body_type"]): BodyMorphs {
  if (!bodyType) return {};
  if (typeof bodyType === "object") return bodyType;
  try {
    const parsed = JSON.parse(bodyType);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {}; // legacy plain labels such as "Normal"
  }
}

const SELECTED_KEY = "tryon:selectedAvatarId";

/** Last avatar the user worked with / tried clothes on (per browser). */
export function getStoredAvatarId(): number | null {
  try {
    const raw = localStorage.getItem(SELECTED_KEY);
    const id = raw ? Number(raw) : NaN;
    return Number.isInteger(id) ? id : null;
  } catch {
    return null;
  }
}

export function storeAvatarId(id: number | null): void {
  try {
    if (id === null) localStorage.removeItem(SELECTED_KEY);
    else localStorage.setItem(SELECTED_KEY, String(id));
  } catch {
    // storage unavailable (private mode): the selection just won't persist
  }
}

/** Picks the avatar to use: the stored one if it still exists, otherwise the first. */
export function pickAvatar(avatars: SavedAvatar[], preferredId: number | null): SavedAvatar | null {
  return avatars.find((a) => a.id === preferredId) ?? avatars[0] ?? null;
}
