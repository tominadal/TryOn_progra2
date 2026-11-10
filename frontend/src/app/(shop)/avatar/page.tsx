"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash, Copy, Warning, User as UserIcon } from "@phosphor-icons/react";
import { fetchApi } from "@/lib/api";
import {
  MAX_AVATARS,
  SavedAvatar,
  getAvatarMeasurementsCm,
  getStoredAvatarId,
  parseMorphs,
  pickAvatar,
  storeAvatarId,
} from "@/lib/avatars";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
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
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

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

    try {
      await fetchApi(`/tryon/avatars/${selected.id}`, { method: "DELETE" });
      const remaining = avatars.filter((a) => a.id !== selected.id);
      setAvatars(remaining);
      const next = remaining[0] ?? null;
      setSelectedId(next?.id ?? null);
      setName(next?.name ?? FIRST_AVATAR_NAME);
      storeAvatarId(next?.id ?? null);
      setConfirmDeleteOpen(false);
      toast.success("Avatar eliminado");
    } catch (err) {
      console.error("Failed to delete avatar", err);
      toast.error("No se pudo eliminar el avatar.");
    }
  };

  const handleDuplicate = async () => {
    if (!selected || atLimit) return;
    setSaving(true);
    try {
      const payload = {
        name: `${selected.name} (Copia)`.slice(0, 50),
        avatar_3d_url: "native_3d_avatar",
        skin_color: selected.skin_color,
        height_cm: selected.height_cm,
        weight_kg: selected.weight_kg,
        shirt_color: selected.shirt_color,
        shirt_style: selected.shirt_style,
        shoes_color: selected.shoes_color,
        hair_style: selected.hair_style,
        hair_color: selected.hair_color,
        gender: selected.gender,
        muscle_definition: selected.muscle_definition,
        eyebrow_style: selected.eyebrow_style,
        glasses: Boolean(selected.glasses),
        glasses_color: selected.glasses_color,
        watch: Boolean(selected.watch),
        watch_color: selected.watch_color,
        body_type: parseMorphs(selected.body_type),
      };
      const created: SavedAvatar = await fetchApi("/tryon/avatars", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setAvatars((prev) => [...prev, created]);
      setSelectedId(created.id);
      setName(created.name);
      storeAvatarId(created.id);
      toast.success(`¡Avatar "${created.name}" duplicado!`);
    } catch (err) {
      console.error("Failed to duplicate avatar", err);
      toast.error((err as Error).message || "No se pudo duplicar el avatar.");
    } finally {
      setSaving(false);
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
    glasses?: boolean,
    glassesColor?: string,
    watch?: boolean,
    watchColor?: string,
  ) => {
    const cleanName = name.trim();
    if (!cleanName) {
      toast.error("Ponele un nombre al avatar antes de guardarlo.");
      return;
    }

    const measurementsCm = getAvatarMeasurementsCm(height, gender, {
      chestWidth,
      bellyWidth,
      bellyDepth,
      hipWidth,
      armThickness,
      legThickness,
      breastSize,
      neckThickness,
    });

    const payload = {
      name: cleanName,
      avatar_3d_url: url,
      skin_color: skinColor,
      height_cm: height,
      weight_kg: weight,
      shirt_color: shirtColor,
      shirt_style: shirtSleeve,
      shoes_color: shoesColor,
      hair_style: hairStyle,
      hair_color: hairColor,
      gender,
      muscle_definition: muscleDefinition,
      eyebrow_style: eyebrowStyle,
      glasses: Boolean(glasses),
      glasses_color: glassesColor,
      watch: Boolean(watch),
      watch_color: watchColor,
      body_type: {
        chestWidth,
        bellyWidth,
        bellyDepth,
        hipWidth,
        armThickness,
        legThickness,
        breastSize,
        neckThickness,
        ...measurementsCm,
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
      <div className="min-h-screen liquid-bg flex items-center justify-center text-neutral-900 dark:text-white transition-colors duration-300">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen liquid-bg text-neutral-900 dark:text-neutral-50 font-sans selection:bg-blue-500/30 transition-colors duration-300">
      <Navbar />

      <main className="pt-28 md:pt-24 pb-12 px-4 sm:px-6 max-w-6xl mx-auto min-h-screen">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full liquid-glass-pill liquid-glass-refract text-blue-700 dark:text-blue-400 text-xs sm:text-sm font-semibold mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse inline-block" />
            Editor 3D en tiempo real
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">Mis Gemelos Digitales</h1>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto text-sm leading-relaxed">
            Creá un avatar para vos y uno para cada persona a la que le comprás ropa. En el Probador Virtual
            elegís con cuál probarte cada prenda.
          </p>
        </div>

        {/* Avatar picker */}
        <div className="mb-4 flex flex-wrap items-center gap-2 p-2 rounded-2xl liquid-glass-panel" role="tablist" aria-label="Mis avatares">
          {avatars.map((avatar) => {
            const active = avatar.id === selectedId;
            return (
              <button
                key={avatar.id}
                role="tab"
                aria-selected={active}
                onClick={() => handleSelect(avatar)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
                  active
                    ? "bg-blue-500/15 dark:bg-blue-500/25 border-blue-500 text-blue-700 dark:text-blue-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)]"
                    : "liquid-glass-btn-secondary text-neutral-600 dark:text-neutral-300"
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
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl border border-dashed text-xs sm:text-sm font-semibold transition-all ${
                selectedId === null
                  ? "bg-blue-500/15 dark:bg-blue-500/25 border-blue-500 text-blue-700 dark:text-blue-300"
                  : "border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
              }`}
            >
              <Plus className="w-4 h-4" />
              Nuevo avatar
            </button>
          )}

          <span className="ml-auto px-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            {avatars.length}/{MAX_AVATARS}
          </span>
        </div>

        {/* Name + delete */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-end gap-3 liquid-glass-panel p-4 rounded-2xl">
          <div className="flex-1">
            <label htmlFor="avatar-name" className="block text-sm font-semibold mb-1.5">
              {selected ? "Nombre del avatar" : "Nombre del nuevo avatar"}
            </label>
            <input
              id="avatar-name"
              type="text"
              value={name}
              maxLength={50}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Mateo"
              className="w-full p-3 rounded-xl liquid-glass-input text-sm"
            />
          </div>
          {selected && (
            <div className="flex flex-wrap gap-2">
              {!atLimit && (
                <button
                  type="button"
                  onClick={handleDuplicate}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl liquid-glass-btn-secondary text-neutral-700 dark:text-neutral-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all disabled:opacity-50"
                >
                  <Copy className="w-4 h-4" />
                  Duplicar
                </button>
              )}
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400 border border-red-300/60 dark:border-red-900/50 rounded-xl bg-red-500/10 hover:bg-red-500/20 backdrop-blur-md transition-all"
              >
                <Trash className="w-4 h-4" />
                Eliminar avatar
              </button>
            </div>
          )}
        </div>

        {confirmDeleteOpen && selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-md p-4">
            <div className="liquid-glass-panel liquid-glass-refract rounded-3xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-red-500/15 border border-red-400/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                  <Warning className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Eliminar Gemelo Digital</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{selected.name}</p>
                </div>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                ¿Estás seguro de que deseas eliminar el avatar <strong>{selected.name}</strong>? Esta acción no se puede deshacer.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold liquid-glass-btn-secondary text-neutral-700 dark:text-neutral-300 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25 transition-all"
                >
                  Sí, Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* `key` remounts the editor so it starts from the selected avatar's values */}
        <div
          className={`liquid-glass-panel p-2 sm:p-3 rounded-3xl transition-all duration-300 ${
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
            initialShirtSleeve={selected?.shirt_style ?? undefined}
            initialChestWidth={morphs.chestWidth}
            initialBellyWidth={morphs.bellyWidth}
            initialBellyDepth={morphs.bellyDepth}
            initialHipWidth={morphs.hipWidth}
            initialArmThickness={morphs.armThickness}
            initialLegThickness={morphs.legThickness}
            initialBreastSize={morphs.breastSize}
            initialNeckThickness={morphs.neckThickness}
            initialGlasses={Boolean(selected?.glasses)}
            initialGlassesColor={selected?.glasses_color ?? undefined}
            initialWatch={Boolean(selected?.watch)}
            initialWatchColor={selected?.watch_color ?? undefined}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
