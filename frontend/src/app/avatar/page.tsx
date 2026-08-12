"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { AvatarCreatorNative } from "@/components/AvatarCreatorNative";
import { toast } from "sonner";

export default function AvatarPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);

  // ── Avatar parameters (all persisted to DB) ─────────────────────────────
  const [avatarSkinColor, setAvatarSkinColor] = useState("#f1c27d");
  const [avatarHeight, setAvatarHeight] = useState(170);
  const [avatarWeight, setAvatarWeight] = useState(70);
  const [avatarShirtColor, setAvatarShirtColor] = useState("#f8f8f8");
  const [avatarShoesColor, setAvatarShoesColor] = useState("#0f0f0f");
  const [avatarHairStyle, setAvatarHairStyle] = useState("Corto");
  const [avatarHairColor, setAvatarHairColor] = useState("#1a0a00");
  const [avatarGender, setAvatarGender] = useState("Hombre");
  const [avatarGlasses, setAvatarGlasses] = useState(false);
  // New fields
  const [avatarBodyType, setAvatarBodyType] = useState("Normal");
  const [avatarMuscle, setAvatarMuscle] = useState(0.3);
  const [avatarBeardStyle, setAvatarBeardStyle] = useState("Ninguna");
  const [avatarBeardColor, setAvatarBeardColor] = useState("#2d1a0e");
  const [avatarEyebrowStyle, setAvatarEyebrowStyle] = useState("Normal");
  const [avatarHatStyle, setAvatarHatStyle] = useState("Ninguno");
  const [avatarShirtStyle, setAvatarShirtStyle] = useState("Basic");
  const [avatarTattoo, setAvatarTattoo] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    fetchApi("/tryon/avatar")
      .then((d: any) => {
        if (!d) return;
        if (d.skin_color) setAvatarSkinColor(d.skin_color);
        if (d.height_cm) setAvatarHeight(d.height_cm);
        if (d.weight_kg) setAvatarWeight(d.weight_kg);
        if (d.shirt_color) setAvatarShirtColor(d.shirt_color);
        if (d.shoes_color) setAvatarShoesColor(d.shoes_color);
        if (d.hair_style) setAvatarHairStyle(d.hair_style);
        if (d.hair_color) setAvatarHairColor(d.hair_color);
        if (d.gender) setAvatarGender(d.gender);
        if (d.glasses !== undefined) setAvatarGlasses(Boolean(d.glasses));
        if (d.body_type) setAvatarBodyType(d.body_type);
        if (d.muscle_definition !== undefined) setAvatarMuscle(d.muscle_definition);
        if (d.beard_style) setAvatarBeardStyle(d.beard_style);
        if (d.beard_color) setAvatarBeardColor(d.beard_color);
        if (d.eyebrow_style) setAvatarEyebrowStyle(d.eyebrow_style);
        if (d.hat_style) setAvatarHatStyle(d.hat_style);
        if (d.shirt_style) setAvatarShirtStyle(d.shirt_style);
        if (d.tattoo_left_arm !== undefined) setAvatarTattoo(Boolean(d.tattoo_left_arm));
      })
      .catch(() => {
        // No avatar yet — use defaults
      })
      .finally(() => setLoading(false));
  }, [user, router]);

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
    glasses: boolean,
    bodyType?: string,
    muscleDefinition?: number,
    beardStyle?: string,
    beardColor?: string,
    eyebrowStyle?: string,
    hatStyle?: string,
    shirtStyle?: string,
    tattooLeftArm?: boolean,
  ) => {
    // Update local state
    setAvatarSkinColor(skinColor);
    setAvatarHeight(height);
    setAvatarWeight(weight);
    setAvatarShirtColor(shirtColor);
    setAvatarShoesColor(shoesColor);
    setAvatarHairStyle(hairStyle);
    setAvatarHairColor(hairColor);
    setAvatarGender(gender);
    setAvatarGlasses(glasses);
    if (bodyType) setAvatarBodyType(bodyType);
    if (muscleDefinition !== undefined) setAvatarMuscle(muscleDefinition);
    if (beardStyle) setAvatarBeardStyle(beardStyle);
    if (beardColor) setAvatarBeardColor(beardColor);
    if (eyebrowStyle) setAvatarEyebrowStyle(eyebrowStyle);
    if (hatStyle) setAvatarHatStyle(hatStyle);
    if (shirtStyle) setAvatarShirtStyle(shirtStyle);
    if (tattooLeftArm !== undefined) setAvatarTattoo(tattooLeftArm);

    try {
      await fetchApi("/tryon/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatar_3d_url: url,
          skin_color: skinColor,
          height_cm: height,
          weight_kg: weight,
          shirt_color: shirtColor,
          shirt_style: shirtStyle,
          shoes_color: shoesColor,
          hair_style: hairStyle,
          hair_color: hairColor,
          gender,
          glasses,
          body_type: bodyType,
          muscle_definition: muscleDefinition,
          beard_style: beardStyle,
          beard_color: beardColor,
          eyebrow_style: eyebrowStyle,
          hat_style: hatStyle,
          tattoo_left_arm: tattooLeftArm,
        }),
      });
      toast.success("¡Gemelo digital guardado con éxito!");
      router.push("/");
    } catch (err) {
      console.error("Failed to save avatar configuration", err);
      toast.error("Error al guardar el avatar.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center text-neutral-900 dark:text-white transition-colors duration-300">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 font-sans selection:bg-violet-500/30 transition-colors duration-300">
      <Navbar />

      <main className="pt-24 pb-12 px-6 max-w-6xl mx-auto min-h-screen">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-sm font-semibold mb-4">
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse inline-block" />
            Editor 3D en tiempo real
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">Mi Gemelo Digital</h1>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto text-sm leading-relaxed">
            Personaliza cada detalle de tu avatar. Los cambios se reflejan instantáneamente en el maniquí 3D
            y se aplicarán al Probador Virtual cuando te pruebes jeans.
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900/40 p-3 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl transition-colors duration-300">
          <AvatarCreatorNative
            onAvatarExported={handleAvatarExported}
            initialSkinColor={avatarSkinColor}
            initialHeight={avatarHeight}
            initialWeight={avatarWeight}
            initialShirtColor={avatarShirtColor}
            initialShoesColor={avatarShoesColor}
            initialHairStyle={avatarHairStyle}
            initialHairColor={avatarHairColor}
            initialGender={avatarGender}
            initialGlasses={avatarGlasses}
            initialBodyType={avatarBodyType}
            initialMuscleDefinition={avatarMuscle}
            initialBeardStyle={avatarBeardStyle}
            initialBeardColor={avatarBeardColor}
            initialEyebrowStyle={avatarEyebrowStyle}
            initialHatStyle={avatarHatStyle}
            initialShirtStyle={avatarShirtStyle}
            initialTattooLeftArm={avatarTattoo}
          />
        </div>
      </main>
    </div>
  );
}
