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
  X,
  ExternalLink,
  FileSpreadsheet,
  Search,
  RefreshCw,
  AlertTriangle,
  Bell,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { formatPrice } from "@/lib/format";

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
  const [productSize, setProductSize] = useState("S, M, L, XL");
  const [productMaterial, setProductMaterial] = useState("100% Algodón");
  const [productWaistRise, setProductWaistRise] = useState("Tiro Medio");
  const [productTexture, setProductTexture] = useState("Denim Clásico");
  const [productElasticity, setProductElasticity] = useState("Rígido");
  const [productFabricWeight, setProductFabricWeight] = useState("Medio");
  const [productDistressLevel, setProductDistressLevel] = useState("0");
  const [productHasCuffs, setProductHasCuffs] = useState(false);
  const [productHasPleats, setProductHasPleats] = useState(false);
  const [productDescription, setProductDescription] = useState("");
  const [productFile, setProductFile] = useState<File | null>(null);
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

  const resetForm = () => {
    setEditingGarment(null);
    setProductName("");
    setProductPrice("");
    setProductFit("Regular");
    setProductColor("Azul");
    setProductColorHex("#1e3a8a");
    setProductSize("S, M, L, XL");
    setProductMaterial("100% Algodón");
    setProductWaistRise("Tiro Medio");
    setProductTexture("Denim Clásico");
    setProductElasticity("Rígido");
    setProductFabricWeight("Medio");
    setProductDistressLevel("0");
    setProductHasCuffs(false);
    setProductHasPleats(false);
    setProductDescription("");
    setProductFile(null);
    setGenerate3D(true);
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

    setEditingGarment(garment);
    setProductName(garment.name || "");
    setProductPrice(String(garment.price || ""));
    setProductFit(garment.fit || "Regular");
    setProductColor(garment.color || garment.available_colors?.[0]?.name || "Azul");
    setProductColorHex(primaryHex);
    setProductSize(
      garment.available_sizes && garment.available_sizes.length > 0
        ? garment.available_sizes.join(", ")
        : "S, M, L, XL"
    );
    setProductMaterial(garment.material || "100% Algodón");
    setProductWaistRise(meta.waist_rise_label || "Tiro Medio");
    setProductTexture(meta.texture || "Denim Clásico");
    setProductElasticity(meta.elasticity || "Rígido");
    setProductFabricWeight(meta.fabric_weight || "Medio");
    setProductDistressLevel(String(distressPct));
    setProductHasCuffs(Boolean(meta.has_cuffs ?? meta.has_cuff));
    setProductHasPleats(Boolean(meta.has_pleats));
    setProductDescription(garment.description || "");
    setProductFile(null);
    setGenerate3D(false); // En modo edición, no regenerar IA por defecto para rapidez

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
    if (!editingGarment && !productFile) {
      toast.error("Por favor selecciona una imagen para el nuevo producto.");
      return;
    }

    setIsUploading(true);
    try {
      let imageUrl: string | undefined = undefined;
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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 font-sans selection:bg-blue-500/30 transition-colors duration-300">
      <Navbar />

      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto min-h-screen">
        <div className="flex justify-between items-end mb-8 border-b border-neutral-200 dark:border-neutral-800 pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard de Marca</h1>
            <p className="text-neutral-500 mt-1">Gestiona tus productos, ediciones y gemelos digitales</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-neutral-900/40 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{garments.length}</p>
              <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Productos Activos</p>
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900/40 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
              <Box className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{garments.filter((g) => g.is_processed).length}</p>
              <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Modelos 3D Generados</p>
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900/40 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {observerFeed?.stats.jobs_completed ?? 0} Lotes / {observerFeed?.notifications.length ?? 0} Alertas
              </p>
              <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Monitor Observer (Tiempo Real)</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Subida / Edición de Producto */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white dark:bg-neutral-900/40 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm relative overflow-hidden">
              {editingGarment && (
                <div className="mb-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-2">
                  <div className="text-xs">
                    <span className="font-bold text-amber-800 dark:text-amber-300 block">
                      Editando: {editingGarment.name}
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 font-mono">
                      SKU: {editingGarment.sku}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 hover:bg-amber-200 transition-colors"
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
                <p className="text-sm text-neutral-500">
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
                    className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Precio (ARS)</label>
                  <input
                    type="number"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    placeholder="Ej. 89900"
                    className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Fit</label>
                    <select
                      value={productFit}
                      onChange={(e) => setProductFit(e.target.value)}
                      className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 outline-none focus:border-blue-500 transition-colors"
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
                      className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold mb-1">Color Hex (Tinte 3D)</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={productColorHex}
                        onChange={(e) => setProductColorHex(e.target.value)}
                        className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                      />
                      <input
                        type="text"
                        value={productColorHex}
                        onChange={(e) => setProductColorHex(e.target.value)}
                        className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Talles (separados por coma)</label>
                  <input
                    type="text"
                    value={productSize}
                    onChange={(e) => setProductSize(e.target.value)}
                    placeholder="Ej. S, M, L, XL"
                    className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="mt-6 mb-2">
                  <h3 className="text-lg font-bold border-b border-neutral-200 dark:border-neutral-800 pb-2">Propiedades Físicas (IA 3D)</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Textura Base</label>
                    <select
                      value={productTexture}
                      onChange={(e) => setProductTexture(e.target.value)}
                      className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 outline-none focus:border-blue-500 transition-colors"
                    >
                      <option>Denim Clásico</option>
                      <option>Denim Crudo (Rígido)</option>
                      <option>Cuero/Ecocuero</option>
                      <option>Algodón Suave</option>
                      <option>Lino/Fresco</option>
                      <option>Gabardina</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Elasticidad</label>
                    <select
                      value={productElasticity}
                      onChange={(e) => setProductElasticity(e.target.value)}
                      className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 outline-none focus:border-blue-500 transition-colors"
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
                      className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 outline-none focus:border-blue-500 transition-colors"
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
                      onChange={(e) => setProductWaistRise(e.target.value)}
                      className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 outline-none focus:border-blue-500 transition-colors"
                    >
                      <option>Tiro Alto</option>
                      <option>Tiro Medio</option>
                      <option>Tiro Bajo</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Composición / Material</label>
                  <input
                    type="text"
                    value={productMaterial}
                    onChange={(e) => setProductMaterial(e.target.value)}
                    placeholder="Ej. 98% Algodón, 2% Elastano"
                    className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 outline-none focus:border-blue-500 transition-colors"
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
                    className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer mt-1"
                  />
                </div>

                <div className="flex gap-6 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={productHasCuffs}
                      onChange={(e) => setProductHasCuffs(e.target.checked)}
                      className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                    />
                    Tiene Dobladillos (Cuff)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={productHasPleats}
                      onChange={(e) => setProductHasPleats(e.target.checked)}
                      className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
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
                    className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 outline-none focus:border-blue-500 transition-colors resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    {editingGarment ? "Foto Principal (Opcional: reemplazar)" : "Foto Principal (Frente y Espalda)"}
                  </label>
                  <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors relative group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setProductFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-8 h-8 text-neutral-400 group-hover:text-blue-500 transition-colors mb-2" />
                    {productFile ? (
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{productFile.name}</p>
                    ) : editingGarment ? (
                      <p className="text-xs text-neutral-500">
                        Se conservará la imagen actual si no seleccionas un archivo nuevo
                      </p>
                    ) : (
                      <>
                        <p className="text-sm font-medium">Arrastra o haz clic para subir</p>
                        <p className="text-xs text-neutral-500 mt-1">PNG, JPG (Max 5MB)</p>
                      </>
                    )}
                  </div>
                </div>

                <label className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={generate3D}
                    onChange={(e) => setGenerate3D(e.target.checked)}
                    className="w-5 h-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
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
                        ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                        : "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                    }`}
                  >
                    {generate3D ? "Activado" : "Instantáneo"}
                  </span>
                </label>

                <div className="flex gap-2">
                  {editingGarment && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-3 rounded-xl font-semibold bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isUploading}
                    className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                      isUploading
                        ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-500"
                        : editingGarment
                        ? "bg-amber-600 hover:bg-amber-700 text-white shadow-lg"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
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
            <div className="mt-6 bg-white dark:bg-neutral-900/40 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Carga Masiva por Excel</h2>
                  <p className="text-xs text-neutral-500">Columnas requeridas: SKU, Name, Fit, Size, Color, Price</p>
                </div>
              </div>

              <form onSubmit={handleExcelUpload} className="space-y-3">
                <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors relative">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {excelFile ? (
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{excelFile.name}</p>
                  ) : (
                    <p className="text-xs text-neutral-500">Seleccionar archivo .xlsx o .xls</p>
                  )}
                </div>

                {activeJob && (
                  <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs space-y-1.5">
                    <div className="flex justify-between font-semibold">
                      <span>Job #{activeJob.job_id} — {activeJob.status}</span>
                      <span>{activeJob.processed_items} / {activeJob.total_items}</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
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
                      ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                  }`}
                >
                  {isUploadingExcel ? "Subiendo Excel..." : "Importar Catálogo Excel"}
                </button>
              </form>

              {observerFeed && observerFeed.notifications.length > 0 && (
                <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    Últimas Notificaciones (Patrón Observer)
                  </p>
                  {observerFeed.notifications.slice(0, 3).map((notif, idx) => (
                    <div
                      key={`${notif.job_id}-${idx}`}
                      className={`p-2.5 rounded-xl text-xs border ${
                        notif.level === "SUCCESS"
                          ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                          : "bg-red-50/70 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
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
          <div className="flex-1">
            <div className="bg-white dark:bg-neutral-900/40 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Catálogo de tu Marca</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Mostrando {filteredGarments.length} de {garments.length} prendas
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar por nombre, SKU..."
                      className="pl-9 pr-3 py-2 text-xs rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <select
                    value={fitFilter}
                    onChange={(e) => setFitFilter(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="Todos">Todos los Fits</option>
                    <option value="Skinny">Skinny</option>
                    <option value="Regular">Regular</option>
                    <option value="Straight">Straight</option>
                    <option value="Mom Fit">Mom Fit</option>
                    <option value="Relaxed">Relaxed</option>
                    <option value="Wide Leg">Wide Leg</option>
                    <option value="Flared">Flared</option>
                  </select>
                  <button
                    type="button"
                    onClick={loadGarments}
                    title="Actualizar catálogo"
                    className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Prenda</th>
                      <th className="px-4 py-4 font-semibold">Fit / Color</th>
                      <th className="px-4 py-4 font-semibold">Talles</th>
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
                            className={`border-b border-neutral-100 dark:border-neutral-800/50 transition-colors ${
                              isBeingEdited
                                ? "bg-amber-50/60 dark:bg-amber-950/20"
                                : "hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                            }`}
                          >
                            <td className="px-6 py-4 font-medium flex items-center gap-3">
                              <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-800 rounded-lg overflow-hidden shrink-0">
                                {g.image ? (
                                  <img src={g.image} alt={g.name} className="w-full h-full object-cover" />
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
                              {g.color && (
                                <div className="flex items-center gap-1.5 text-neutral-500 mt-0.5">
                                  {primaryHex && (
                                    <span
                                      className="w-2.5 h-2.5 rounded-full border border-neutral-300 dark:border-neutral-600 inline-block"
                                      style={{ backgroundColor: primaryHex }}
                                    />
                                  )}
                                  <span>{g.color}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4 text-xs text-neutral-500">
                              {g.available_sizes && g.available_sizes.length > 0
                                ? g.available_sizes.join(", ")
                                : "S, M, L, XL"}
                            </td>
                            <td className="px-4 py-4 text-xs text-neutral-500 font-mono">{g.sku}</td>
                            <td className="px-4 py-4 font-semibold">{formatPrice(g.price)}</td>
                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                  g.is_processed
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    g.is_processed ? "bg-green-500" : "bg-amber-500 animate-pulse"
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
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                                >
                                  <span>Ver</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(g)}
                                  title="Editar prenda"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>Editar</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setGarmentToDelete(g)}
                                  disabled={deletingId === g.id}
                                  title="Eliminar prenda"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Eliminar Prenda</h3>
                  <p className="text-xs text-neutral-500">SKU: {garmentToDelete.sku}</p>
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
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={deletingId === garmentToDelete.id}
                  onClick={() => handleDeleteGarment(garmentToDelete)}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg flex items-center gap-2 transition-colors disabled:opacity-50"
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
