"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";
import { Upload, Plus, Package, Box, Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";

interface Garment {
  id: number;
  sku: string;
  name: string;
  price: number;
  is_processed: boolean;
  image: string;
}

export default function BrandDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [isUploading, setIsUploading] = useState(false);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productFit, setProductFit] = useState("Regular");
  const [productColor, setProductColor] = useState("Azul");
  const [productSize, setProductSize] = useState("S, M, L, XL");
  const [productFile, setProductFile] = useState<File | null>(null);
  const [garments, setGarments] = useState<Garment[]>([]);
  const [loadingGarments, setLoadingGarments] = useState(true);

  // Redirigir si no es rol de marca
  useEffect(() => {
    if (user && user.role_id !== 2) {
      router.push("/");
    } else if (user) {
      loadGarments();
    }
  }, [user, router]);

  const loadGarments = async () => {
    try {
      setLoadingGarments(true);
      const data = await fetchApi("/catalog/brand");
      setGarments(data);
    } catch (err) {
      console.error("Failed to load garments", err);
      toast.error("Error al cargar los productos.");
    } finally {
      setLoadingGarments(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !productPrice || !productFile) {
      toast.error("Por favor completa todos los campos y selecciona una imagen.");
      return;
    }

    setIsUploading(true);
    toast.info("Iniciando subida y generación 3D...");
    
    try {
      // 1. Upload actual image file
      const formData = new FormData();
      formData.append("file", productFile);

      const uploadToken = localStorage.getItem("token") || "";
      const uploadRes = await fetch("http://localhost:8000/api/v1/catalog/upload-image", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${uploadToken}`
        },
        body: formData
      });

      if (!uploadRes.ok) {
        throw new Error("Error al subir la imagen al servidor.");
      }
      
      const uploadData = await uploadRes.json();
      const realImageUrl = uploadData.url;

      // 2. Create garment entry with real image url
      await fetchApi("/catalog/garment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: productName,
          price: parseFloat(productPrice),
          fit: productFit,
          color: productColor,
          sizes: productSize.split(",").map(s => s.trim()),
          image_url: realImageUrl
        })
      });

      setProductName("");
      setProductPrice("");
      setProductFile(null);
      toast.success("¡Producto subido! El gemelo digital 3D se ha generado exitosamente.");
      loadGarments();
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Error al subir el producto.");
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
            <p className="text-neutral-500 mt-1">Gestiona tus productos y gemelos digitales</p>
          </div>
          <button className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-xl font-medium text-sm hover:scale-105 transition-transform shadow-lg flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
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
              <p className="text-2xl font-bold">{garments.filter(g => g.is_processed).length}</p>
              <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Modelos 3D Generados</p>
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900/40 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">+45%</p>
              <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Interacción Try-On</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Subida de Producto */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white dark:bg-neutral-900/40 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm relative overflow-hidden">
              <div className="mb-6">
                <h2 className="text-xl font-bold">Subir Nuevo Producto</h2>
                <p className="text-sm text-neutral-500">Nuestra IA generará automáticamente el gemelo digital 3D basado en la foto.</p>
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
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
                  <label className="block text-sm font-semibold mb-1">Precio ($)</label>
                  <input 
                    type="number" 
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    placeholder="Ej. 89.99"
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
                      <option>Relaxed</option>
                      <option>Wide Leg</option>
                      <option>Flared</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Color Principal</label>
                    <input 
                      type="text" 
                      value={productColor}
                      onChange={(e) => setProductColor(e.target.value)}
                      placeholder="Ej. Azul Oscuro"
                      className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 outline-none focus:border-blue-500 transition-colors"
                    />
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
                <div>
                  <label className="block text-sm font-semibold mb-1">Foto Principal (Frente y Espalda)</label>
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
                    ) : (
                      <>
                        <p className="text-sm font-medium">Arrastra o haz clic para subir</p>
                        <p className="text-xs text-neutral-500 mt-1">PNG, JPG (Max 5MB)</p>
                      </>
                    )}
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isUploading}
                  className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isUploading ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'}`}
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin"></div>
                      Procesando Modelo 3D...
                    </>
                  ) : (
                    <>Subir y Generar 3D</>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Tabla de Productos Recientes */}
          <div className="flex-1">
            <div className="bg-white dark:bg-neutral-900/40 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
                <h2 className="text-xl font-bold">Subidas Recientes</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Prenda</th>
                      <th className="px-6 py-4 font-semibold">SKU</th>
                      <th className="px-6 py-4 font-semibold">Precio</th>
                      <th className="px-6 py-4 font-semibold">Estado 3D</th>
                      <th className="px-6 py-4 font-semibold">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingGarments ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">Cargando productos...</td>
                      </tr>
                    ) : garments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">No hay productos subidos. ¡Sube tu primer producto!</td>
                      </tr>
                    ) : garments.map((g) => (
                      <tr key={g.id} className="border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                        <td className="px-6 py-4 font-medium flex items-center gap-3">
                          <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-800 rounded-lg overflow-hidden">
                            {g.image ? <img src={g.image} className="w-full h-full object-cover" /> : <Box className="w-5 h-5 m-2 text-neutral-400" />}
                          </div>
                          {g.name}
                        </td>
                        <td className="px-6 py-4 text-neutral-500">{g.sku}</td>
                        <td className="px-6 py-4 font-semibold">${g.price}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            {g.is_processed ? "Completado" : "Procesando"}
                          </span>
                        </td>
                        <td className="px-6 py-4"><button className="text-blue-600 hover:underline">Editar</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
