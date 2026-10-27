/**
 * Shared helpers for the user's saved avatars. A user can keep several
 * (e.g. a parent shopping for their children) and picks one in the fitting room.
 */

/** Same limit as the backend (MAX_AVATARS_PER_USER). */
export const MAX_AVATARS = 10;

/** Body morph multipliers, 1.0 = default proportions. */
export interface BodyMorphs {
  chestWidth?: number;
  bellyWidth?: number;
  bellyDepth?: number;
  hipWidth?: number;
  armThickness?: number;
  legThickness?: number;
  breastSize?: number;
  neckThickness?: number;
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
