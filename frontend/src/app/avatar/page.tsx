"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  
  // Avatar Parameters
  const [avatarSkinColor, setAvatarSkinColor] = useState<string>("#f1c27d");
  const [avatarHeight, setAvatarHeight] = useState<number>(170);
  const [avatarWeight, setAvatarWeight] = useState<number>(70);
  const [avatarShirtColor, setAvatarShirtColor] = useState<string>("#ffffff");
  const [avatarShoesColor, setAvatarShoesColor] = useState<string>("#000000");
  const [avatarHairStyle, setAvatarHairStyle] = useState<string>("Corto");
  const [avatarHairColor, setAvatarHairColor] = useState<string>("#000000");
  const [avatarGender, setAvatarGender] = useState<string>("Hombre");
  const [avatarGlasses, setAvatarGlasses] = useState<boolean>(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    fetchApi("/tryon/avatar")
      .then((avatarData) => {
        if (avatarData) {
          if (avatarData.skin_color) setAvatarSkinColor(avatarData.skin_color);
          if (avatarData.height_cm) setAvatarHeight(avatarData.height_cm);
          if (avatarData.weight_kg) setAvatarWeight(avatarData.weight_kg);
          if (avatarData.shirt_color) setAvatarShirtColor(avatarData.shirt_color);
          if (avatarData.shoes_color) setAvatarShoesColor(avatarData.shoes_color);
          if (avatarData.hair_style) setAvatarHairStyle(avatarData.hair_style);
          if (avatarData.hair_color) setAvatarHairColor(avatarData.hair_color);
          if (avatarData.gender) setAvatarGender(avatarData.gender);
          if (avatarData.glasses !== undefined) setAvatarGlasses(Boolean(avatarData.glasses));
        }
      })
      .catch(() => {
        // No avatar found, use defaults
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user, router]);

  const handleAvatarExported = async (url: string, skinColor: string, height: number, weight: number, shirtColor: string, shoesColor: string, hairStyle: string, hairColor: string, gender: string, glasses: boolean) => {
    setAvatarSkinColor(skinColor);
    setAvatarHeight(height);
    setAvatarWeight(weight);
    setAvatarShirtColor(shirtColor);
    setAvatarShoesColor(shoesColor);
    setAvatarHairStyle(hairStyle);
    setAvatarHairColor(hairColor);
    setAvatarGender(gender);
    setAvatarGlasses(glasses);
    
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
          shoes_color: shoesColor,
          hair_style: hairStyle,
          hair_color: hairColor,
          gender: gender,
          glasses: glasses,
          body_type: "parametric"
        })
      });
      toast.success("¡Gemelo digital guardado con éxito!");
      router.push("/");
    } catch (err) {
      console.error("Failed to save avatar configuration", err);
      toast.error("Error al guardar el avatar.");
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center text-neutral-900 dark:text-white transition-colors duration-300">Cargando Perfil...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 font-sans selection:bg-blue-500/30 transition-colors duration-300">
      <Navbar />

      <main className="pt-24 pb-12 px-6 max-w-5xl mx-auto min-h-screen">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Mi Gemelo Digital</h1>
          <p className="text-neutral-500 max-w-xl mx-auto">Personaliza tu avatar 3D. Estos ajustes se aplicarán automáticamente cada vez que te pruebes prendas en el Probador Virtual.</p>
        </div>

        <div className="bg-white dark:bg-neutral-900/40 p-4 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xl transition-colors duration-300">
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
          />
        </div>
      </main>
    </div>
  );
}
