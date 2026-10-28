"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, User as UserIcon } from "lucide-react";
import { fetchApi } from "@/lib/api";
import {
  MAX_AVATARS,
  SavedAvatar,
  getStoredAvatarId,
  parseMorphs,
  pickAvatar,
  storeAvatarId,
} from "@/lib/avatars";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { AvatarCreatorNative } from "@/components/AvatarCreatorNative";
import { toast } from "sonner";

const FIRST_AVATAR_NAME = "Mi avatar";

export default function AvatarPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // A user can keep several avatars (e.g. one per child). `selectedId === null` means
  // "creating a new one".
  const [avatars, setAvatars] = useState<SavedAvatar[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [name, setName] = useState(FIRST_AVATAR_NAME);

  const selected = avatars.find((a) => a.id === selectedId) ?? null;
  const morphs = parseMorphs(selected?.body_type);
  const atLimit = avatars.length >= MAX_AVATARS;

  useEffect(() => {
    // Wait for the session restore (token -> /users/me) before deciding to redirect
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    fetchApi("/tryon/avatars")
      .then((list: SavedAvatar[]) => {
        setAvatars(list);
        const initial = pickAvatar(list, getStoredAvatarId());
        setSelectedId(initial?.id ?? null);
        setName(initial?.name ?? FIRST_AVATAR_NAME);
      })
      .catch((err) => {
        console.error("Failed to load avatars", err);
        toast.error("No se pudieron cargar tus avatares.");
      })
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const handleSelect = (avatar: SavedAvatar) => {
    setSelectedId(avatar.id);
    setName(avatar.name);
    storeAvatarId(avatar.id);
  };

  const handleNew = () => {
    setSelectedId(null);
    setName(avatars.length === 0 ? FIRST_AVATAR_NAME : "");
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!window.confirm(`¿Eliminar el avatar "${selected.name}"? Esta acción no se puede deshacer.`)) return;

    try {
      await fetchApi(`/tryon/avatars/${selected.id}`, { method: "DELETE" });
      const remaining = avatars.filter((a) => a.id !== selected.id);
      setAvatars(remaining);
      const next = remaining[0] ?? null;
      setSelectedId(next?.id ?? null);
      setName(next?.name ?? FIRST_AVATAR_NAME);
      storeAvatarId(next?.id ?? null);
      toast.success("Avatar eliminado");
    } catch (err) {
      console.error("Failed to delete avatar", err);
      toast.error("No se pudo eliminar el avatar.");
    }
  };

  const handleAvatarExported = async (
    url: string,
    skinColor: string,
    height: number,
    weight: number,
    shirtColor: string,
    shoesColor: string,
    hairStyle: string,
    hairColor: string,
    gender: string,
    muscleDefinition?: number,
    eyebrowStyle?: string,
    shirtSleeve?: string,
    chestWidth?: number,
    bellyWidth?: number,
    bellyDepth?: number,
    hipWidth?: number,
    armThickness?: number,
    legThickness?: number,
    breastSize?: number,
    neckThickness?: number,
  ) => {
    const cleanName = name.trim();
    if (!cleanName) {
      toast.error("Ponele un nombre al avatar antes de guardarlo.");
      return;
    }

    const payload = {
      name: cleanName,
      avatar_3d_url: url,
      skin_color: skinColor,
      height_cm: height,
      weight_kg: weight,
      shirt_color: shirtColor,
      shoes_color: shoesColor,
      hair_style: hairStyle,
      hair_color: hairColor,
      gender,
      muscle_definition: muscleDefinition,
      eyebrow_style: eyebrowStyle,
      body_type: {
        chestWidth, bellyWidth, bellyDepth, hipWidth,
        armThickness, legThickness, breastSize, neckThickness,
      },
    };

    setSaving(true);
    try {
      const isUpdate = selectedId !== null;
      const saved: SavedAvatar = await fetchApi(
        isUpdate ? `/tryon/avatars/${selectedId}` : "/tryon/avatars",
        { method: isUpdate ? "PUT" : "POST", body: JSON.stringify(payload) },
      );
      setAvatars((prev) =>
        isUpdate ? prev.map((a) => (a.id === saved.id ? saved : a)) : [...prev, saved],
      );
      setSelectedId(saved.id);
      setName(saved.name);
      storeAvatarId(saved.id);
      toast.success(isUpdate ? `¡${saved.name} actualizado!` : `¡${saved.name} creado con éxito!`);
    } catch (err) {
      console.error("Failed to save avatar configuration", err);
      toast.error((err as Error).message || "Error al guardar el avatar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center text-neutral-900 dark:text-white transition-colors duration-300">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 font-sans selection:bg-blue-500/30 transition-colors duration-300">
      <Navbar />

      <main className="pt-24 pb-12 px-6 max-w-6xl mx-auto min-h-screen">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-semibold mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse inline-block" />
            Editor 3D en tiempo real
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">Mis Gemelos Digitales</h1>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto text-sm leading-relaxed">
            Creá un avatar para vos y uno para cada persona a la que le comprás ropa. En el Probador Virtual
            elegís con cuál probarte cada prenda.
          </p>
        </div>

        {/* Avatar picker */}
        <div className="mb-4 flex flex-wrap items-center gap-2" role="tablist" aria-label="Mis avatares">
          {avatars.map((avatar) => {
            const active = avatar.id === selectedId;
            return (
              <button
                key={avatar.id}
                role="tab"
                aria-selected={active}
                onClick={() => handleSelect(avatar)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                  active
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-600 text-blue-700 dark:text-blue-400"
                    : "bg-white dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-600"
                }`}
              >
                <UserIcon className="w-4 h-4" />
                {avatar.name}
              </button>
            );
          })}

          {!atLimit && (
            <button
              onClick={handleNew}
              aria-pressed={selectedId === null}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed text-sm font-semibold transition-colors ${
                selectedId === null
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-600 text-blue-700 dark:text-blue-400"
                  : "border-neutral-300 dark:border-neutral-700 text-neutral-500 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
              }`}
            >
              <Plus className="w-4 h-4" />
              Nuevo avatar
            </button>
          )}

          <span className="ml-auto text-xs text-neutral-400">
            {avatars.length}/{MAX_AVATARS}
          </span>
        </div>

        {/* Name + delete */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <label htmlFor="avatar-name" className="block text-sm font-semibold mb-1">
              {selected ? "Nombre del avatar" : "Nombre del nuevo avatar"}
            </label>
            <input
              id="avatar-name"
              type="text"
              value={name}
              maxLength={50}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Mateo"
              className="w-full p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          {selected && (
            <button
              onClick={handleDelete}
              className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar avatar
            </button>
          )}
        </div>

        {/* `key` remounts the editor so it starts from the selected avatar's values */}
        <div
          className={`bg-white dark:bg-neutral-900/40 p-3 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl transition-all duration-300 ${
            saving ? "opacity-60 pointer-events-none" : ""
          }`}
        >
          <AvatarCreatorNative
            key={selectedId ?? "new"}
            onAvatarExported={handleAvatarExported}
            initialSkinColor={selected?.skin_color ?? undefined}
            initialHeight={selected?.height_cm ?? undefined}
            initialWeight={selected?.weight_kg ?? undefined}
            initialShirtColor={selected?.shirt_color ?? undefined}
            initialShoesColor={selected?.shoes_color ?? undefined}
            initialHairStyle={selected?.hair_style ?? undefined}
            initialHairColor={selected?.hair_color ?? undefined}
            initialGender={selected?.gender ?? undefined}
            initialMuscleDefinition={selected?.muscle_definition ?? undefined}
            initialEyebrowStyle={selected?.eyebrow_style ?? undefined}
            initialChestWidth={morphs.chestWidth}
            initialBellyWidth={morphs.bellyWidth}
            initialBellyDepth={morphs.bellyDepth}
            initialHipWidth={morphs.hipWidth}
            initialArmThickness={morphs.armThickness}
            initialLegThickness={morphs.legThickness}
            initialBreastSize={morphs.breastSize}
            initialNeckThickness={morphs.neckThickness}
          />
        </div>
      </main>
    </div>
  );
}
