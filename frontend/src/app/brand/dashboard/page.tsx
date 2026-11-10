"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";
import {
  Upload,
  Package,
  Box,
  Trash2,
  Pencil,
  Copy,
  X,
  ExternalLink,
  FileSpreadsheet,
  Search,
  RefreshCw,
  AlertTriangle,
  Bell,
  Plus,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { getDefaultGarmentPatternCm } from "@/lib/avatars";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import { ParametricPants } from "@/components/avatar";

interface GarmentColor {
  name: string;
  hex: string;
}

interface GarmentMetadata {
  color_hex?: string;
  waist_rise_label?: string;
  texture?: string;
  elasticity?: string;
  fabric_weight?: string;
  distress_level?: number;
  distress?: number;
  has_cuffs?: boolean;
  has_cuff?: boolean;
  has_pleats?: boolean;
  waist_cm?: number;
  hip_cm?: number;
  thigh_cm?: number;
  inseam_cm?: number;
  hem_width_cm?: number;
  rise_cm?: number;
}

interface Garment {
  id: number;
  sku: string;
  name: string;
  price: number;
  fit?: string;
  color?: string;
  material?: string;
  description?: string;
  available_sizes?: string[];
  available_colors?: GarmentColor[];
  is_processed: boolean;
  image: string | null;
  metadata_json?: GarmentMetadata;
}

interface JobStatusResponse {
  job_id: number;
  status: "UPLOADED" | "PROCESSING" | "READY" | "FAILED";
  total_items: number;
  processed_items: number;
  error_log?: { error?: string } | null;
}

interface ObserverNotification {
  job_id: number;
  old_status: string;
  new_status: string;
  level: "SUCCESS" | "ERROR";
  message: string;
  timestamp: string;
}

interface ObserverFeed {
  stats: {
    jobs_completed: number;
    jobs_failed: number;
    total_garments_processed: number;
  };
  notifications: ObserverNotification[];
}

export default function BrandDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const [isUploading, setIsUploading] = useState(false);
  const [editingGarment, setEditingGarment] = useState<Garment | null>(null);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productFit, setProductFit] = useState("Regular");
  const [productColor, setProductColor] = useState("Azul");
  const [productColorHex, setProductColorHex] = useState("#1e3a8a");
  const [additionalColors, setAdditionalColors] = useState<GarmentColor[]>([]);
  const [newVariantName, setNewVariantName] = useState("");
  const [newVariantHex, setNewVariantHex] = useState("#4b5563");
  const [showLive3DPreview, setShowLive3DPreview] = useState(true);
  const [previewColorHex, setPreviewColorHex] = useState<string | null>(null);
  const [productSize, setProductSize] = useState("S, M, L, XL");
  const [productMaterial, setProductMaterial] = useState("100% Algodón");
  const [productWaistRise, setProductWaistRise] = useState("Tiro Medio");
  const [productTexture, setProductTexture] = useState("Denim Clásico");
  const [productElasticity, setProductElasticity] = useState("Rígido");
  const [productFabricWeight, setProductFabricWeight] = useState("Medio");
  const [productDistressLevel, setProductDistressLevel] = useState("0");
  const [productHasCuffs, setProductHasCuffs] = useState(false);
  const [productHasPleats, setProductHasPleats] = useState(false);
  const [productWaistCm, setProductWaistCm] = useState(82);
  const [productHipCm, setProductHipCm] = useState(100);
  const [productThighCm, setProductThighCm] = useState(58);
  const [productInseamCm, setProductInseamCm] = useState(78);
  const [productHemWidthCm, setProductHemWidthCm] = useState(20);
  const [productRiseCm, setProductRiseCm] = useState(25.5);
  const [productDescription, setProductDescription] = useState("");
  const [productFile, setProductFile] = useState<File | null>(null);
  const [presetImageUrl, setPresetImageUrl] = useState<string>("");
  const [generate3D, setGenerate3D] = useState(true);
  const [garments, setGarments] = useState<Garment[]>([]);
  const [loadingGarments, setLoadingGarments] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [fitFilter, setFitFilter] = useState("Todos");
  const [garmentToDelete, setGarmentToDelete] = useState<Garment | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Carga masiva por Excel + Feed de Observers
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isUploadingExcel, setIsUploadingExcel] = useState(false);
  const [activeJob, setActiveJob] = useState<JobStatusResponse | null>(null);
  const [observerFeed, setObserverFeed] = useState<ObserverFeed | null>(null);

  const loadGarments = useCallback(() => {
    fetchApi("/catalog/brand")
      .then((data) => setGarments(data))
      .catch((err) => {
        console.error("Failed to load garments", err);
        toast.error("Error al cargar los productos.");
      })
      .finally(() => setLoadingGarments(false));

    fetchApi("/catalog/notifications")
      .then((feed: ObserverFeed) => setObserverFeed(feed))
      .catch(() => {
        // Silencioso si no hay notificaciones aún
      });
  }, []);

  useEffect(() => {
    if (user && user.role_id !== 2) {
      router.push("/");
    } else if (user) {
      loadGarments();
    }
  }, [user, router, loadGarments]);

  // Polling de estado de carga masiva Excel
  useEffect(() => {
    if (!activeJob || activeJob.status === "READY" || activeJob.status === "FAILED") {
      return;
    }
    const timer = setInterval(() => {
      fetchApi(`/catalog/jobs/${activeJob.job_id}`)
        .then((jobData: JobStatusResponse) => {
          setActiveJob(jobData);
          if (jobData.status === "READY") {
            toast.success(`¡Catálogo Excel procesado! (${jobData.processed_items} prendas importadas)`);
            loadGarments();
          } else if (jobData.status === "FAILED") {
            toast.error(jobData.error_log?.error || "Error al procesar el archivo Excel.");
            loadGarments();
          }
        })
        .catch((err) => {
          console.error("Error polling job status", err);
        });
    }, 2000);
    return () => clearInterval(timer);
  }, [activeJob, loadGarments]);

  const applyFitPatternDefaults = (fitVal: string, riseVal: string) => {
    const defaults = getDefaultGarmentPatternCm(fitVal, riseVal);
    setProductWaistCm(defaults.waistCm);
    setProductHipCm(defaults.hipCm);
    setProductThighCm(defaults.thighCm);
    setProductInseamCm(defaults.inseamCm);
    setProductHemWidthCm(defaults.hemWidthCm);
    setProductRiseCm(defaults.riseCm);
  };

  const resetForm = () => {
    setEditingGarment(null);
    setProductName("");
    setProductPrice("");
    setProductFit("Regular");
    setProductColor("Azul");
    setProductColorHex("#1e3a8a");
    setAdditionalColors([]);
    setNewVariantName("");
    setNewVariantHex("#4b5563");
    setPreviewColorHex(null);
    setProductSize("S, M, L, XL");
    setProductMaterial("100% Algodón");
    setProductWaistRise("Tiro Medio");
    setProductTexture("Denim Clásico");
    setProductElasticity("Rígido");
    setProductFabricWeight("Medio");
    setProductDistressLevel("0");
    setProductHasCuffs(false);
    setProductHasPleats(false);
    applyFitPatternDefaults("Regular", "Tiro Medio");
    setProductDescription("");
    setProductFile(null);
    setPresetImageUrl("");
    setGenerate3D(true);
  };

  const handleDuplicateGarment = (garment: Garment) => {
    const meta = garment.metadata_json || {};
    const primaryHex =
      meta.color_hex ||
      garment.available_colors?.[0]?.hex ||
      "#1e3a8a";
    const distressPct =
      meta.distress_level !== undefined
        ? meta.distress_level
        : Math.round((meta.distress || 0) * 100);
    const fitVal = garment.fit || "Regular";
    const riseVal = meta.waist_rise_label || "Tiro Medio";
    const defaults = getDefaultGarmentPatternCm(fitVal, riseVal);

    setEditingGarment(null);
    setProductName(`${garment.name} (Variante)`);
    setProductPrice(String(garment.price || ""));
    setProductFit(fitVal);
    setProductColor(garment.color || garment.available_colors?.[0]?.name || "Azul");
    setProductColorHex(primaryHex);
    setAdditionalColors(garment.available_colors ? garment.available_colors.slice(1) : []);
    setPreviewColorHex(null);
    setProductSize(
      garment.available_sizes && garment.available_sizes.length > 0
        ? garment.available_sizes.join(", ")
        : "S, M, L, XL"
    );
    setProductMaterial(garment.material || "100% Algodón");
    setProductWaistRise(riseVal);
    setProductTexture(meta.texture || "Denim Clásico");
    setProductElasticity(meta.elasticity || "Rígido");
    setProductFabricWeight(meta.fabric_weight || "Medio");
    setProductDistressLevel(String(distressPct));
    setProductHasCuffs(Boolean(meta.has_cuffs ?? meta.has_cuff));
    setProductHasPleats(Boolean(meta.has_pleats));
    setProductWaistCm(meta.waist_cm ?? defaults.waistCm);
    setProductHipCm(meta.hip_cm ?? defaults.hipCm);
    setProductThighCm(meta.thigh_cm ?? defaults.thighCm);
    setProductInseamCm(meta.inseam_cm ?? defaults.inseamCm);
    setProductHemWidthCm(meta.hem_width_cm ?? defaults.hemWidthCm);
    setProductRiseCm(meta.rise_cm ?? defaults.riseCm);
    setProductDescription(garment.description || "");
    setProductFile(null);
    setPresetImageUrl(garment.image || "/products/jean_classic.png");
    setGenerate3D(false);

    toast.info(`Datos de "${garment.name}" cargados para crear una nueva variante.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStartEdit = (garment: Garment) => {
    const meta = garment.metadata_json || {};
    const primaryHex =
      meta.color_hex ||
      garment.available_colors?.[0]?.hex ||
      "#1e3a8a";
    const distressPct =
      meta.distress_level !== undefined
        ? meta.distress_level
        : Math.round((meta.distress || 0) * 100);
    const fitVal = garment.fit || "Regular";
    const riseVal = meta.waist_rise_label || "Tiro Medio";
    const defaults = getDefaultGarmentPatternCm(fitVal, riseVal);

    setEditingGarment(garment);
    setProductName(garment.name || "");
    setProductPrice(String(garment.price || ""));
    setProductFit(fitVal);
    setProductColor(garment.color || garment.available_colors?.[0]?.name || "Azul");
    setProductColorHex(primaryHex);
    setAdditionalColors(garment.available_colors ? garment.available_colors.slice(1) : []);
    setPreviewColorHex(null);
    setProductSize(
      garment.available_sizes && garment.available_sizes.length > 0
        ? garment.available_sizes.join(", ")
        : "S, M, L, XL"
    );
    setProductMaterial(garment.material || "100% Algodón");
    setProductWaistRise(riseVal);
    setProductTexture(meta.texture || "Denim Clásico");
    setProductElasticity(meta.elasticity || "Rígido");
    setProductFabricWeight(meta.fabric_weight || "Medio");
    setProductDistressLevel(String(distressPct));
    setProductHasCuffs(Boolean(meta.has_cuffs ?? meta.has_cuff));
    setProductHasPleats(Boolean(meta.has_pleats));
    setProductWaistCm(meta.waist_cm ?? defaults.waistCm);
    setProductHipCm(meta.hip_cm ?? defaults.hipCm);
    setProductThighCm(meta.thigh_cm ?? defaults.thighCm);
    setProductInseamCm(meta.inseam_cm ?? defaults.inseamCm);
    setProductHemWidthCm(meta.hem_width_cm ?? defaults.hemWidthCm);
    setProductRiseCm(meta.rise_cm ?? defaults.riseCm);
    setProductDescription(garment.description || "");
    setProductFile(null);
    setPresetImageUrl(garment.image || "");
    setGenerate3D(false);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteGarment = async (garment: Garment) => {
    setDeletingId(garment.id);
    try {
      await fetchApi(`/catalog/garments/${garment.id}`, {
        method: "DELETE",
      });
      setGarments((prev) => prev.filter((item) => item.id !== garment.id));
      if (editingGarment?.id === garment.id) {
        resetForm();
      }
      setGarmentToDelete(null);
      toast.success(`Prenda "${garment.name}" eliminada correctamente.`);
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "No se pudo eliminar la prenda.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleExcelUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excelFile) {
      toast.error("Selecciona un archivo Excel (.xlsx o .xls).");
      return;
    }
    setIsUploadingExcel(true);
    try {
      const formData = new FormData();
      formData.append("file", excelFile);
      const data = await fetchApi("/catalog/upload", {
        method: "POST",
        body: formData,
      });
      setExcelFile(null);
      setActiveJob({
        job_id: data.job_id,
        status: "PROCESSING",
        total_items: data.total_items || 0,
        processed_items: 0,
      });
      toast.info(`Procesando ${data.total_items || 0} prendas en segundo plano...`);
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Error al subir el catálogo Excel.");
    } finally {
      setIsUploadingExcel(false);
    }
  };

  const filteredGarments = garments.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.color || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFit =
      fitFilter === "Todos" ||
      (g.fit || "").toLowerCase() === fitFilter.toLowerCase();
    return matchesSearch && matchesFit;
  });

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !productPrice) {
      toast.error("Por favor completa el nombre y el precio.");
      return;
    }
    if (!editingGarment && !productFile && !presetImageUrl) {
      toast.error("Por favor selecciona una imagen o elige una plantilla de estudio.");
      return;
    }

    setIsUploading(true);
    try {
      let imageUrl: string | undefined = presetImageUrl || undefined;
      if (productFile) {
        const formData = new FormData();
        formData.append("file", productFile);
        const uploadData = await fetchApi("/catalog/upload-image", {
          method: "POST",
          body: formData,
        });
        imageUrl = uploadData.url;
      }

      const sizesList = productSize
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const allColors: GarmentColor[] = [
        { name: productColor || "Azul", hex: productColorHex || "#1e3a8a" },
        ...additionalColors,
      ];

      if (editingGarment) {
        const updatedGarment: Garment = await fetchApi(
          `/catalog/garments/${editingGarment.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: productName,
              price: parseFloat(productPrice),
              fit: productFit,
              color: productColor,
              color_hex: productColorHex,
              colors: allColors,
              sizes: sizesList,
              image_url: imageUrl,
              material: productMaterial,
              waist_rise: productWaistRise,
              description: productDescription,
              texture: productTexture,
              elasticity: productElasticity,
              fabric_weight: productFabricWeight,
              distress_level: parseInt(productDistressLevel),
              has_cuffs: productHasCuffs,
              has_pleats: productHasPleats,
              waist_cm: productWaistCm,
              hip_cm: productHipCm,
              thigh_cm: productThighCm,
              inseam_cm: productInseamCm,
              hem_width_cm: productHemWidthCm,
              rise_cm: productRiseCm,
              regenerate_3d: generate3D,
            }),
          }
        );

        setGarments((prev) =>
          prev.map((item) => (item.id === updatedGarment.id ? updatedGarment : item))
        );
        resetForm();
        toast.success("Prenda actualizada correctamente.");
      } else {
        await fetchApi("/catalog/garment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: productName,
            price: parseFloat(productPrice),
            fit: productFit,
            color: productColor,
            color_hex: productColorHex,
            colors: allColors,
            sizes: sizesList,
            image_url: imageUrl,
            generate_3d: generate3D,
            material: productMaterial,
            waist_rise: productWaistRise,
            description: productDescription,
            texture: productTexture,
            elasticity: productElasticity,
            fabric_weight: productFabricWeight,
            distress_level: parseInt(productDistressLevel),
            has_cuffs: productHasCuffs,
            has_pleats: productHasPleats,
            waist_cm: productWaistCm,
            hip_cm: productHipCm,
            thigh_cm: productThighCm,
            inseam_cm: productInseamCm,
            hem_width_cm: productHemWidthCm,
            rise_cm: productRiseCm,
          }),
        });

        resetForm();
        toast.success(
          generate3D
            ? "¡Producto subido! El gemelo digital 3D se ha generado exitosamente."
            : "¡Producto subido exitosamente!"
        );
        loadGarments();
      }
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Error al guardar la prenda.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!user || user.role_id !== 2) return null;

  return (
    <div className="min-h-screen liquid-bg text-neutral-900 dark:text-neutral-50 font-sans selection:bg-blue-500/30 transition-colors duration-300">
      <Navbar />

      <main className="pt-28 md:pt-24 pb-12 px-4 sm:px-6 max-w-7xl mx-auto min-h-screen">
        <div className="flex justify-between items-end mb-8 border-b border-neutral-200/70 dark:border-white/10 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard de Marca</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1 text-sm sm:text-base">Gestiona tus productos, ediciones y gemelos digitales</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="liquid-glass-card p-5 sm:p-6 rounded-3xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/15 dark:bg-blue-500/25 border border-blue-400/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{garments.length}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">Productos Activos</p>
            </div>
          </div>
          <div className="liquid-glass-card p-5 sm:p-6 rounded-3xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 dark:bg-emerald-500/25 border border-emerald-400/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Box className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{garments.filter((g) => g.is_processed).length}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">Modelos 3D Generados</p>
            </div>
          </div>
          <div className="liquid-glass-card p-5 sm:p-6 rounded-3xl flex items-center gap-4 sm:col-span-2 lg:col-span-1">
            <div className="w-12 h-12 rounded-full bg-purple-500/15 dark:bg-purple-500/25 border border-purple-400/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold">
                {observerFeed?.stats.jobs_completed ?? 0} Lotes / {observerFeed?.notifications.length ?? 0} Alertas
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">Monitor Observer (Tiempo Real)</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Subida / Edición de Producto */}
          <div className="w-full lg:w-1/3">
            <div className="liquid-glass-panel p-5 sm:p-6 rounded-3xl relative overflow-hidden">
              {editingGarment && (
                <div className="mb-4 p-3 rounded-2xl bg-amber-500/15 border border-amber-400/40 backdrop-blur-md flex items-center justify-between gap-2">
                  <div className="text-xs min-w-0">
                    <span className="font-bold text-amber-800 dark:text-amber-300 block truncate">
                      Editando: {editingGarment.name}
                    </span>
                    <span className="text-amber-700 dark:text-amber-400 font-mono">
                      SKU: {editingGarment.sku}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="p-1.5 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-200 hover:bg-amber-500/30 transition-colors shrink-0"
                    title="Cancelar edición"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-xl font-bold">
                  {editingGarment ? "Editar Prenda" : "Subir Nuevo Producto"}
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {editingGarment
                    ? "Modifica los atributos comerciales o físicos de la prenda seleccionada."
                    : "Nuestra IA generará automáticamente el gemelo digital 3D basado en la foto."}
                </p>
              </div>

              <form onSubmit={handleSubmitForm} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Nombre de la Prenda</label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Ej. Jeans Rectos Clásicos"
                    className="w-full p-3 rounded-xl liquid-glass-input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Precio (ARS)</label>
                  <input
                    type="number"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    placeholder="Ej. 89900"
                    className="w-full p-3 rounded-xl liquid-glass-input text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Fit</label>
                    <select
                      value={productFit}
                      onChange={(e) => {
                        const newFit = e.target.value;
                        setProductFit(newFit);
                        applyFitPatternDefaults(newFit, productWaistRise);
                      }}
                      className="w-full p-3 rounded-xl liquid-glass-input text-sm"
                    >
                      <option>Skinny</option>
                      <option>Regular</option>
                      <option>Straight</option>
                      <option>Mom Fit</option>
                      <option>Relaxed</option>
                      <option>Wide Leg</option>
                      <option>Flared</option>
                      <option>Bermuda</option>
                      <option>Skirt</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Color Principal (Nombre)</label>
                    <input
                      type="text"
                      value={productColor}
                      onChange={(e) => setProductColor(e.target.value)}
                      placeholder="Ej. Azul Oscuro"
                      className="w-full p-3 rounded-xl liquid-glass-input text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold mb-1">Color Hex (Tinte 3D Principal)</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={productColorHex}
                        onChange={(e) => {
                          setProductColorHex(e.target.value);
                          setPreviewColorHex(e.target.value);
                        }}
                        className="w-12 h-12 rounded-xl cursor-pointer liquid-glass-card p-1 shrink-0"
                      />
                      <input
                        type="text"
                        value={productColorHex}
                        onChange={(e) => {
                          setProductColorHex(e.target.value);
                          setPreviewColorHex(e.target.value);
                        }}
                        className="w-full p-3 rounded-xl liquid-glass-input text-sm font-mono"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[
                        { name: "Azul Clásico", hex: "#1e3a8a" },
                        { name: "Negro Carbón", hex: "#111827" },
                        { name: "Celeste Vintage", hex: "#93c5fd" },
                        { name: "Azul Lavado", hex: "#3b82f6" },
                        { name: "Gris Acero", hex: "#4b5563" },
                        { name: "Beige Crudo", hex: "#d4b896" },
                      ].map((preset) => (
                        <button
                          key={preset.hex}
                          type="button"
                          onClick={() => {
                            setProductColor(preset.name);
                            setProductColorHex(preset.hex);
                            setPreviewColorHex(preset.hex);
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                            productColorHex.toLowerCase() === preset.hex
                              ? "border-blue-500 bg-blue-500/15 text-blue-700 dark:text-blue-300"
                              : "liquid-glass-btn-secondary text-neutral-600 dark:text-neutral-300"
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-white/50 shrink-0"
                            style={{ backgroundColor: preset.hex }}
                          />
                          {preset.name}
                        </button>
                      ))}
                    </div>

                    {/* Variantes de Color Secundarias */}
                    <div className="mt-3 p-3 rounded-xl liquid-glass-card space-y-2 border border-white/20 dark:border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                          Variantes de Color ({1 + additionalColors.length})
                        </span>
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                          Haz clic en un color para previsualizar en 3D
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewColorHex(productColorHex)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                            (previewColorHex || productColorHex) === productColorHex
                              ? "border-blue-500 bg-blue-500/15 text-blue-700 dark:text-blue-300"
                              : "liquid-glass-pill text-neutral-700 dark:text-neutral-300"
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-white/50"
                            style={{ backgroundColor: productColorHex }}
                          />
                          <span>{productColor || "Principal"}</span>
                        </button>

                        {additionalColors.map((col, idx) => (
                          <div
                            key={`${col.name}-${idx}`}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                              previewColorHex === col.hex
                                ? "border-blue-500 bg-blue-500/15 text-blue-700 dark:text-blue-300"
                                : "liquid-glass-pill text-neutral-700 dark:text-neutral-300"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setPreviewColorHex(col.hex)}
                              className="inline-flex items-center gap-1.5"
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-white/50"
                                style={{ backgroundColor: col.hex }}
                              />
                              <span>{col.name}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAdditionalColors((prev) => prev.filter((_, i) => i !== idx));
                                if (previewColorHex === col.hex) setPreviewColorHex(null);
                              }}
                              className="text-neutral-400 hover:text-red-500 ml-0.5"
                              title="Quitar variante"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5 pt-1">
                        <input
                          type="color"
                          value={newVariantHex}
                          onChange={(e) => setNewVariantHex(e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer liquid-glass-card p-0.5 shrink-0"
                        />
                        <input
                          type="text"
                          value={newVariantName}
                          onChange={(e) => setNewVariantName(e.target.value)}
                          placeholder="Añadir otro color (ej. Gris Acero)"
                          className="flex-1 px-2.5 py-1.5 rounded-lg liquid-glass-input text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newVariantName.trim()) {
                              toast.error("Ingresa un nombre para la variante de color.");
                              return;
                            }
                            setAdditionalColors((prev) => [
                              ...prev,
                              { name: newVariantName.trim(), hex: newVariantHex },
                            ]);
                            setPreviewColorHex(newVariantHex);
                            setNewVariantName("");
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold liquid-glass-btn-secondary text-blue-600 dark:text-blue-400 hover:bg-blue-500/15 inline-flex items-center gap-1 shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" /> Añadir
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                    <label className="block text-sm font-semibold">Talles (separados por coma)</label>
                    <div className="flex gap-1">
                      {[
                        { label: "Letras", value: "XS, S, M, L, XL" },
                        { label: "US", value: "28, 30, 32, 34, 36" },
                        { label: "AR/EU", value: "38, 40, 42, 44, 46" },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setProductSize(preset.value)}
                          className="px-2 py-0.5 rounded-md text-[11px] font-semibold liquid-glass-btn-secondary text-blue-600 dark:text-blue-400 hover:bg-blue-500/15"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={productSize}
                    onChange={(e) => setProductSize(e.target.value)}
                    placeholder="Ej. S, M, L, XL"
                    className="w-full p-3 rounded-xl liquid-glass-input text-sm"
                  />
                </div>

                <div className="mt-6 mb-2 flex items-center justify-between border-b border-neutral-200/70 dark:border-white/10 pb-2">
                  <h3 className="text-lg font-bold">Propiedades Físicas (IA 3D)</h3>
                  <button
                    type="button"
                    onClick={() => setShowLive3DPreview((v) => !v)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold liquid-glass-pill text-blue-600 dark:text-blue-400 hover:bg-blue-500/15 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {showLive3DPreview ? "Ocultar Vista 3D" : "Ver Prenda 3D"}
                  </button>
                </div>

                {/* Vista Previa 3D en Tiempo Real de la Prenda */}
                {showLive3DPreview && (
                  <div className="w-full h-56 rounded-2xl liquid-glass-card overflow-hidden relative border border-blue-500/25 shadow-inner">
                    <Canvas dpr={[1, 1.5]} camera={{ position: [0, -0.05, 1.65], fov: 42 }}>
                      <ambientLight intensity={0.65} />
                      <directionalLight position={[4, 6, 4]} intensity={1.5} />
                      <directionalLight position={[-3, 3, -3]} intensity={0.45} />
                      <Environment preset="city" />
                      <group position={[0, 0.35, 0]}>
                        <ParametricPants
                          color={previewColorHex || productColorHex || "#1e3a8a"}
                          accentColor={previewColorHex || productColorHex || "#1e3a8a"}
                          avatarScaleXZ={1.0}
                          avatarScaleY={1.0}
                          pantsScaleX={
                            (productHipCm / getDefaultGarmentPatternCm(productFit, productWaistRise).hipCm) * 0.55 +
                            (productThighCm / getDefaultGarmentPatternCm(productFit, productWaistRise).thighCm) * 0.45
                          }
                          pantsScaleY={
                            productInseamCm / Math.max(1, getDefaultGarmentPatternCm(productFit, productWaistRise).inseamCm)
                          }
                          pantsFit={productFit}
                          isFemale={false}
                          waistRise={
                            productWaistRise.toLowerCase().includes("alto")
                              ? 0.85
                              : productWaistRise.toLowerCase().includes("bajo")
                              ? 0.2
                              : 0.5
                          }
                          hasCuff={productHasCuffs}
                          hasPleats={productHasPleats}
                          distress={parseInt(productDistressLevel || "0") / 100}
                          texture={productTexture}
                          garmentPatternCm={{
                            waistCm: productWaistCm,
                            hipCm: productHipCm,
                            thighCm: productThighCm,
                            inseamCm: productInseamCm,
                            hemWidthCm: productHemWidthCm,
                            riseCm: productRiseCm,
                          }}
                        />
                      </group>
                      <ContactShadows position={[0, -0.58, 0]} opacity={0.45} scale={3} blur={1.8} far={2} />
                      <OrbitControls
                        enablePan={false}
                        minDistance={1.1}
                        maxDistance={2.8}
                        target={[0, -0.05, 0]}
                      />
                    </Canvas>
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-md border border-white/15">
                      Vista Previa 3D · {productFit} · {productTexture}
                    </div>
                    <div className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/80 dark:bg-slate-900/80 text-neutral-700 dark:text-neutral-300 backdrop-blur-md">
                      Arrastra para rotar 360°
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Textura Base</label>
                    <select
                      value={productTexture}
                      onChange={(e) => setProductTexture(e.target.value)}
                      className="w-full p-3 rounded-xl liquid-glass-input text-sm"
                    >
                      <option>Denim Clásico</option>
                      <option>Denim Crudo (Rígido)</option>
                      <option>Cuero/Ecocuero</option>
                      <option>Algodón Suave</option>
                      <option>Lino/Fresco</option>
                      <option>Gabardina</option>
                      <option>Corderoy</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Elasticidad</label>
                    <select
                      value={productElasticity}
                      onChange={(e) => setProductElasticity(e.target.value)}
                      className="w-full p-3 rounded-xl liquid-glass-input text-sm"
                    >
                      <option>Rígido</option>
                      <option>Confort (Leve elastano)</option>
                      <option>Súper Elástico (Spandex)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Peso de Tela</label>
                    <select
                      value={productFabricWeight}
                      onChange={(e) => setProductFabricWeight(e.target.value)}
                      className="w-full p-3 rounded-xl liquid-glass-input text-sm"
                    >
                      <option>Liviano</option>
                      <option>Medio</option>
                      <option>Pesado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Tiro (Waist Rise)</label>
                    <select
                      value={productWaistRise}
                      onChange={(e) => {
                        const newRise = e.target.value;
                        setProductWaistRise(newRise);
                        const riseDefaults = getDefaultGarmentPatternCm(productFit, newRise);
                        setProductRiseCm(riseDefaults.riseCm);
                      }}
                      className="w-full p-3 rounded-xl liquid-glass-input text-sm"
                    >
                      <option>Tiro Alto</option>
                      <option>Tiro Medio</option>
                      <option>Tiro Bajo</option>
                    </select>
                  </div>
                </div>

                {/* Medidas de Moldería Base en Centímetros (cm) */}
                <div className="p-4 rounded-2xl liquid-glass-card space-y-3.5 border border-blue-500/20">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                        Moldería Base en Centímetros (Talle M / 32 US / 42 AR)
                      </h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Define las medidas reales de la prenda en cm; los demás talles escalan proporcionalmente.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => applyFitPatternDefaults(productFit, productWaistRise)}
                      className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                    >
                      Restablecer {productFit}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">Contorno Cintura</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={64}
                            max={112}
                            step={0.5}
                            value={productWaistCm}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (!Number.isNaN(v)) setProductWaistCm(Math.max(64, Math.min(112, v)));
                            }}
                            className="w-14 px-1.5 py-0.5 text-right text-xs font-bold text-blue-600 dark:text-blue-400 rounded-md liquid-glass-input"
                          />
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">cm</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="64"
                        max="112"
                        step="1"
                        value={productWaistCm}
                        onChange={(e) => setProductWaistCm(parseFloat(e.target.value))}
                        className="w-full h-2 bg-neutral-200/80 dark:bg-neutral-800/80 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">Contorno Cadera</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={84}
                            max={132}
                            step={0.5}
                            value={productHipCm}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (!Number.isNaN(v)) setProductHipCm(Math.max(84, Math.min(132, v)));
                            }}
                            className="w-14 px-1.5 py-0.5 text-right text-xs font-bold text-blue-600 dark:text-blue-400 rounded-md liquid-glass-input"
                          />
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">cm</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="84"
                        max="132"
                        step="1"
                        value={productHipCm}
                        onChange={(e) => setProductHipCm(parseFloat(e.target.value))}
                        className="w-full h-2 bg-neutral-200/80 dark:bg-neutral-800/80 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">Contorno Muslo</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={46}
                            max={76}
                            step={0.5}
                            value={productThighCm}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (!Number.isNaN(v)) setProductThighCm(Math.max(46, Math.min(76, v)));
                            }}
                            className="w-14 px-1.5 py-0.5 text-right text-xs font-bold text-blue-600 dark:text-blue-400 rounded-md liquid-glass-input"
                          />
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">cm</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="46"
                        max="76"
                        step="1"
                        value={productThighCm}
                        onChange={(e) => setProductThighCm(parseFloat(e.target.value))}
                        className="w-full h-2 bg-neutral-200/80 dark:bg-neutral-800/80 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">Largo Entrepierna</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={20}
                            max={92}
                            step={0.5}
                            value={productInseamCm}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (!Number.isNaN(v)) setProductInseamCm(Math.max(20, Math.min(92, v)));
                            }}
                            className="w-14 px-1.5 py-0.5 text-right text-xs font-bold text-blue-600 dark:text-blue-400 rounded-md liquid-glass-input"
                          />
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">cm</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="92"
                        step="1"
                        value={productInseamCm}
                        onChange={(e) => setProductInseamCm(parseFloat(e.target.value))}
                        className="w-full h-2 bg-neutral-200/80 dark:bg-neutral-800/80 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">Ancho Botamanga</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={13}
                            max={56}
                            step={0.5}
                            value={productHemWidthCm}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (!Number.isNaN(v)) setProductHemWidthCm(Math.max(13, Math.min(56, v)));
                            }}
                            className="w-14 px-1.5 py-0.5 text-right text-xs font-bold text-blue-600 dark:text-blue-400 rounded-md liquid-glass-input"
                          />
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">cm</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="13"
                        max="56"
                        step="0.5"
                        value={productHemWidthCm}
                        onChange={(e) => setProductHemWidthCm(parseFloat(e.target.value))}
                        className="w-full h-2 bg-neutral-200/80 dark:bg-neutral-800/80 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">Altura de Tiro</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={20}
                            max={34}
                            step={0.5}
                            value={productRiseCm}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (!Number.isNaN(v)) setProductRiseCm(Math.max(20, Math.min(34, v)));
                            }}
                            className="w-14 px-1.5 py-0.5 text-right text-xs font-bold text-blue-600 dark:text-blue-400 rounded-md liquid-glass-input"
                          />
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">cm</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="34"
                        step="0.5"
                        value={productRiseCm}
                        onChange={(e) => setProductRiseCm(parseFloat(e.target.value))}
                        className="w-full h-2 bg-neutral-200/80 dark:bg-neutral-800/80 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Composición / Material</label>
                  <input
                    type="text"
                    value={productMaterial}
                    onChange={(e) => setProductMaterial(e.target.value)}
                    placeholder="Ej. 98% Algodón, 2% Elastano"
                    className="w-full p-3 rounded-xl liquid-glass-input text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1 mt-4">Desgaste: {productDistressLevel}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={productDistressLevel}
                    onChange={(e) => setProductDistressLevel(e.target.value)}
                    className="w-full h-2 bg-neutral-200/80 dark:bg-neutral-800/80 rounded-lg appearance-none cursor-pointer mt-1 accent-blue-600"
                  />
                </div>

                <div className="flex flex-wrap gap-4 sm:gap-6 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={productHasCuffs}
                      onChange={(e) => setProductHasCuffs(e.target.checked)}
                      className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
                    />
                    Tiene Dobladillos (Cuff)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={productHasPleats}
                      onChange={(e) => setProductHasPleats(e.target.checked)}
                      className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
                    />
                    Tiene Pinzas
                  </label>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-semibold mb-1">Descripción y Detalles</label>
                  <textarea
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    placeholder="Ej. Diseño con roturas vintage en las rodillas y dobladillo deshilachado..."
                    rows={2}
                    className="w-full p-3 rounded-xl liquid-glass-input text-sm resize-none"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-semibold">
                      {editingGarment ? "Foto Principal (Opcional: reemplazar)" : "Foto Principal (Frente y Espalda)"}
                    </label>
                    {(productFile || presetImageUrl) && (
                      <button
                        type="button"
                        onClick={() => {
                          setProductFile(null);
                          setPresetImageUrl(editingGarment?.image || "");
                        }}
                        className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" /> Quitar selección
                      </button>
                    )}
                  </div>
                  <div className="border-2 border-dashed border-neutral-300/80 dark:border-neutral-700/80 rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer liquid-glass-input hover:border-blue-500/60 transition-all relative group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setProductFile(file);
                        if (file) setPresetImageUrl("");
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    {productFile ? (
                      <div className="flex items-center gap-3">
                        <Upload className="w-6 h-6 text-blue-500 shrink-0" />
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 break-all">{productFile.name}</p>
                      </div>
                    ) : presetImageUrl ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={presetImageUrl}
                          alt="Vista previa"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/products/jean_classic.png";
                          }}
                          className="w-14 h-14 rounded-xl object-cover border border-white/40 dark:border-white/15 shadow-sm"
                        />
                        <div className="text-left">
                          <p className="text-xs font-bold text-blue-600 dark:text-blue-400">Imagen seleccionada</p>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Haz clic para subir otro archivo</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-neutral-400 group-hover:text-blue-500 transition-colors mb-2" />
                        <p className="text-sm font-medium">Arrastra o haz clic para subir</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">PNG, JPG, WEBP (Max 5MB)</p>
                      </>
                    )}
                  </div>
                  <div className="mt-2">
                    <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
                      O elegir fotografía de estudio predefinida:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: "Straight", url: "/products/jean_classic.png" },
                        { label: "Skinny Black", url: "/products/jean_black.png" },
                        { label: "Mom Vintage", url: "/products/jean_vintage.png" },
                        { label: "Bermuda", url: "/products/bermuda_front.png" },
                        { label: "Pollera", url: "/products/skirt_front.png" },
                        { label: "Flared", url: "/products/flared_front.png" },
                      ].map((preset) => (
                        <button
                          key={preset.url}
                          type="button"
                          onClick={() => {
                            setProductFile(null);
                            setPresetImageUrl(preset.url);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                            !productFile && presetImageUrl === preset.url
                              ? "border-blue-500 bg-blue-500/15 text-blue-700 dark:text-blue-300"
                              : "liquid-glass-btn-secondary text-neutral-600 dark:text-neutral-300"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-3 p-4 bg-blue-500/10 dark:bg-blue-500/15 border border-blue-400/40 backdrop-blur-md rounded-2xl cursor-pointer hover:bg-blue-500/15 dark:hover:bg-blue-500/25 transition-all">
                  <input
                    type="checkbox"
                    checked={generate3D}
                    onChange={(e) => setGenerate3D(e.target.checked)}
                    className="w-5 h-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500 accent-blue-600 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-blue-900 dark:text-blue-300">
                      {editingGarment ? "Re-analizar con IA (Gemini Vision)" : "Activar Probador Virtual 3D"}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                      {editingGarment
                        ? "Si está desactivado, actualiza instantáneamente los parámetros 3D sin consumir IA."
                        : "Generar automáticamente el gemelo digital paramétrico para este producto."}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                      generate3D
                        ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-400/40"
                        : "liquid-glass-pill text-neutral-600 dark:text-neutral-400"
                    }`}
                  >
                    {generate3D ? "Activado" : "Instantáneo"}
                  </span>
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-3 rounded-xl font-semibold liquid-glass-btn-secondary text-neutral-700 dark:text-neutral-300 transition-all text-sm"
                  >
                    {editingGarment ? "Cancelar" : "Limpiar"}
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className={`flex-1 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                      isUploading
                        ? "liquid-glass-btn-secondary text-neutral-500"
                        : editingGarment
                        ? "bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/25"
                        : "liquid-glass-btn-primary"
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin"></div>
                        {editingGarment ? "Guardando Cambios..." : "Procesando Producto..."}
                      </>
                    ) : editingGarment ? (
                      "Guardar Cambios"
                    ) : generate3D ? (
                      "Subir y Generar 3D"
                    ) : (
                      "Publicar Producto"
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Carga Masiva por Excel */}
            <div className="mt-6 liquid-glass-panel p-5 sm:p-6 rounded-3xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/25 border border-emerald-400/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Carga Masiva por Excel</h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Columnas requeridas: SKU, Name, Fit, Size, Color, Price</p>
                </div>
              </div>

              <form onSubmit={handleExcelUpload} className="space-y-3">
                <div className="border-2 border-dashed border-neutral-300/80 dark:border-neutral-700/80 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer liquid-glass-input hover:border-emerald-500/60 transition-all relative">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {excelFile ? (
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 break-all">{excelFile.name}</p>
                  ) : (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Seleccionar archivo .xlsx o .xls</p>
                  )}
                </div>

                {activeJob && (
                  <div className="p-3 rounded-xl liquid-glass-card text-xs space-y-1.5">
                    <div className="flex justify-between font-semibold">
                      <span>Job #{activeJob.job_id} — {activeJob.status}</span>
                      <span>{activeJob.processed_items} / {activeJob.total_items}</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-200/80 dark:bg-neutral-800/80 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          activeJob.status === "FAILED"
                            ? "bg-red-500"
                            : activeJob.status === "READY"
                            ? "bg-emerald-500"
                            : "bg-blue-600"
                        }`}
                        style={{
                          width: `${
                            activeJob.total_items > 0
                              ? Math.round((activeJob.processed_items / activeJob.total_items) * 100)
                              : 100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isUploadingExcel || !excelFile}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    isUploadingExcel || !excelFile
                      ? "liquid-glass-btn-secondary text-neutral-400 cursor-not-allowed opacity-60"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/25"
                  }`}
                >
                  {isUploadingExcel ? "Subiendo Excel..." : "Importar Catálogo Excel"}
                </button>
              </form>

              {observerFeed && observerFeed.notifications.length > 0 && (
                <div className="mt-4 pt-4 border-t border-neutral-200/70 dark:border-white/10 space-y-2">
                  <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Últimas Notificaciones (Patrón Observer)
                  </p>
                  {observerFeed.notifications.slice(0, 3).map((notif, idx) => (
                    <div
                      key={`${notif.job_id}-${idx}`}
                      className={`p-2.5 rounded-xl text-xs border backdrop-blur-md ${
                        notif.level === "SUCCESS"
                          ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-900 dark:text-emerald-300"
                          : "bg-red-500/15 border-red-400/40 text-red-900 dark:text-red-300"
                      }`}
                    >
                      {notif.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tabla de Productos de la Marca */}
          <div className="flex-1 min-w-0">
            <div className="liquid-glass-panel rounded-3xl overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-neutral-200/70 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Catálogo de tu Marca</h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Mostrando {filteredGarments.length} de {garments.length} prendas
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar por nombre, SKU..."
                      className="w-full sm:w-48 pl-9 pr-3 py-2 text-xs rounded-xl liquid-glass-input"
                    />
                  </div>
                  <select
                    value={fitFilter}
                    onChange={(e) => setFitFilter(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl liquid-glass-input"
                  >
                    <option value="Todos">Todos los Fits</option>
                    <option value="Skinny">Skinny</option>
                    <option value="Regular">Regular</option>
                    <option value="Straight">Straight</option>
                    <option value="Mom Fit">Mom Fit</option>
                    <option value="Relaxed">Relaxed</option>
                    <option value="Wide Leg">Wide Leg</option>
                    <option value="Flared">Flared</option>
                    <option value="Bermuda">Bermuda</option>
                    <option value="Skirt">Skirt</option>
                  </select>
                  <button
                    type="button"
                    onClick={loadGarments}
                    title="Actualizar catálogo"
                    className="p-2 rounded-xl liquid-glass-btn-secondary transition-all"
                  >
                    <RefreshCw className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[680px]">
                  <thead className="bg-white/40 dark:bg-white/5 border-b border-neutral-200/70 dark:border-white/10">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Prenda</th>
                      <th className="px-4 py-4 font-semibold">Fit / Color</th>
                      <th className="px-4 py-4 font-semibold">Talles / Moldería (cm)</th>
                      <th className="px-4 py-4 font-semibold">SKU</th>
                      <th className="px-4 py-4 font-semibold">Precio</th>
                      <th className="px-4 py-4 font-semibold">Estado 3D</th>
                      <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingGarments ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-neutral-500">Cargando productos...</td>
                      </tr>
                    ) : filteredGarments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-neutral-500">
                          {garments.length === 0
                            ? "No hay productos subidos. ¡Sube tu primer producto!"
                            : "No se encontraron prendas con los filtros seleccionados."}
                        </td>
                      </tr>
                    ) : (
                      filteredGarments.map((g) => {
                        const primaryHex = g.available_colors?.[0]?.hex;
                        const isBeingEdited = editingGarment?.id === g.id;
                        return (
                          <tr
                            key={g.id}
                            className={`border-b border-neutral-200/50 dark:border-white/5 transition-colors ${
                              isBeingEdited
                                ? "bg-amber-500/15"
                                : "hover:bg-white/40 dark:hover:bg-white/5"
                            }`}
                          >
                            <td className="px-6 py-4 font-medium flex items-center gap-3">
                              <div className="w-10 h-10 bg-neutral-200/70 dark:bg-neutral-800/70 rounded-lg overflow-hidden shrink-0 border border-white/40 dark:border-white/10">
                                {g.image ? (
                                  <img
                                    src={g.image}
                                    alt={g.name}
                                    onError={(e) => {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = "/products/jean_classic.png";
                                    }}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Box className="w-5 h-5 m-2.5 text-neutral-400" />
                                )}
                              </div>
                              <span className="truncate max-w-[180px]">{g.name}</span>
                            </td>
                            <td className="px-4 py-4 text-xs">
                              <div className="font-semibold text-neutral-700 dark:text-neutral-200">
                                {g.fit || "Regular"}
                              </div>
                              {g.available_colors && g.available_colors.length > 0 ? (
                                <div className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400 mt-0.5 flex-wrap">
                                  {g.available_colors.map((c, idx) => (
                                    <span
                                      key={`${c.name}-${idx}`}
                                      title={c.name}
                                      className="w-2.5 h-2.5 rounded-full border border-neutral-300 dark:border-neutral-600 inline-block"
                                      style={{ backgroundColor: c.hex }}
                                    />
                                  ))}
                                  <span className="ml-0.5">
                                    {g.available_colors[0].name}
                                    {g.available_colors.length > 1 ? ` +${g.available_colors.length - 1}` : ""}
                                  </span>
                                </div>
                              ) : g.color ? (
                                <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 mt-0.5">
                                  {primaryHex && (
                                    <span
                                      className="w-2.5 h-2.5 rounded-full border border-neutral-300 dark:border-neutral-600 inline-block"
                                      style={{ backgroundColor: primaryHex }}
                                    />
                                  )}
                                  <span>{g.color}</span>
                                </div>
                              ) : null}
                            </td>
                            <td className="px-4 py-4 text-xs text-neutral-500 dark:text-neutral-400">
                              <div className="font-medium text-neutral-700 dark:text-neutral-300">
                                {g.available_sizes && g.available_sizes.length > 0
                                  ? g.available_sizes.join(", ")
                                  : "S, M, L, XL"}
                              </div>
                              {g.metadata_json?.waist_cm && (
                                <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                                  {g.metadata_json.waist_cm}/{g.metadata_json.hip_cm}/{g.metadata_json.inseam_cm} cm
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4 text-xs text-neutral-500 dark:text-neutral-400 font-mono">{g.sku}</td>
                            <td className="px-4 py-4 font-semibold">{formatPrice(g.price)}</td>
                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                                  g.is_processed
                                    ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-800 dark:text-emerald-300"
                                    : "bg-amber-500/15 border-amber-400/40 text-amber-800 dark:text-amber-300"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    g.is_processed ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                                  }`}
                                ></span>
                                {g.is_processed ? "Completado" : "Procesando"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  href={`/product/${g.id}`}
                                  title="Ver en tienda"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/15 border border-blue-400/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/25 transition-colors"
                                >
                                  <span>Ver</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateGarment(g)}
                                  title="Duplicar prenda como variante"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold liquid-glass-btn-secondary text-neutral-700 dark:text-neutral-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Duplicar</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(g)}
                                  title="Editar prenda"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 border border-amber-400/30 text-amber-800 dark:text-amber-300 hover:bg-amber-500/25 transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>Editar</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setGarmentToDelete(g)}
                                  disabled={deletingId === g.id}
                                  title="Eliminar prenda"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-500/15 border border-red-400/30 text-red-700 dark:text-red-300 hover:bg-red-500/25 transition-colors disabled:opacity-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Eliminar</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Confirmación de Eliminación */}
        {garmentToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-md p-4">
            <div className="liquid-glass-panel liquid-glass-refract rounded-3xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-red-500/15 border border-red-400/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Eliminar Prenda</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">SKU: {garmentToDelete.sku}</p>
                </div>
              </div>

              <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                ¿Estás seguro de que deseas eliminar <strong>{garmentToDelete.name}</strong>? Esta acción eliminará la prenda del catálogo de tu marca, su gemelo digital 3D y la quitará de los carritos activos.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={deletingId === garmentToDelete.id}
                  onClick={() => setGarmentToDelete(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold liquid-glass-btn-secondary text-neutral-700 dark:text-neutral-300 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={deletingId === garmentToDelete.id}
                  onClick={() => handleDeleteGarment(garmentToDelete)}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25 flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {deletingId === garmentToDelete.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Eliminar definitivamente</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
