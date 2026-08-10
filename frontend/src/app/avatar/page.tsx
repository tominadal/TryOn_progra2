"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AvatarCreatorNative } from "@/components/AvatarCreatorNative";

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
  const [avatarHairStyle, setAvatarHairStyle] = useState<string>("Short");
  const [avatarHairColor, setAvatarHairColor] = useState<string>("#000000");

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
        }
      })
      .catch(() => {
        // No avatar found, use defaults
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user, router]);

  const handleAvatarExported = async (url: string, skinColor: string, height: number, weight: number, shirtColor: string, shoesColor: string, hairStyle: string, hairColor: string) => {
    setAvatarSkinColor(skinColor);
    setAvatarHeight(height);
    setAvatarWeight(weight);
    setAvatarShirtColor(shirtColor);
    setAvatarShoesColor(shoesColor);
    setAvatarHairStyle(hairStyle);
    setAvatarHairColor(hairColor);
    
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
          body_type: "parametric"
        })
      });
      alert("Avatar saved successfully!");
      router.push("/");
    } catch (err) {
      console.error("Failed to save avatar configuration", err);
      alert("Failed to save avatar.");
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center text-neutral-900 dark:text-white transition-colors duration-300">Loading Profile...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 font-sans selection:bg-blue-500/30 transition-colors duration-300">
      <nav className="fixed w-full z-50 top-0 border-b border-neutral-200 dark:border-neutral-900 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tighter flex items-center gap-2 hover:opacity-80 transition-opacity text-black dark:text-white">
            <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
              <span className="text-white text-xs">V</span>
            </div>
            TryOn <span className="text-neutral-500">Hub</span>
          </Link>
          <div className="flex gap-4 items-center">
            <ThemeToggle />
            <Link href="/" className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">&larr; Back to Marketplace</Link>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-6 max-w-5xl mx-auto min-h-screen">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">My Digital Twin</h1>
          <p className="text-neutral-500 max-w-xl mx-auto">Customize your 3D avatar. These settings will be applied automatically whenever you try on garments in the Virtual Studio.</p>
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
          />
        </div>
      </main>
    </div>
  );
}
