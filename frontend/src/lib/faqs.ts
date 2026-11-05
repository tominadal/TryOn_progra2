/**
 * Preguntas frecuentes del Centro de Ayuda (/ayuda).
 *
 * Para agregar una pregunta, sumá un objeto a `FAQ_ITEMS`. La página se arma sola:
 * agrupa por `category` (en el orden en que aparece la primera de cada una) y las
 * preguntas sin categoría van bajo "General".
 *
 * La respuesta admite varios párrafos: separalos con una línea en blanco ("\n\n").
 *
 * Ejemplo:
 *
 *   {
 *     id: "crear-avatar",
 *     category: "Avatares",
 *     question: "¿Cómo creo un avatar?",
 *     answer: "Entrá a Gemelo Digital, ajustá tus medidas y tocá Guardar.\n\nPodés crear hasta 10.",
 *   },
 */
export interface FaqItem {
  /** Identificador único y estable (sirve de `key` y para enlazar a una pregunta). */
  id: string;
  /** Sección donde se agrupa, por ejemplo "Avatares" o "Compras". Opcional. */
  category?: string;
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "crear-avatar",
    category: "Gemelos Digitales (Avatares)",
    question: "¿Cómo creo y personalizo mi Gemelo Digital 3D?",
    answer:
      "Iniciá sesión en tu cuenta y accedé a la sección 'Mi Avatar 3D' desde el menú superior o desde 'Gemelo Digital' en el pie de página.\n\nAllí podés configurar tu altura, complexión corporal (ancho de pecho, cintura, cadera, piernas y brazos), tono de piel, estilo de cabello y vestimenta base. Al tocar 'Guardar Avatar', tus parámetros quedan asociados a tu cuenta para usarlos en todo el catálogo.",
  },
  {
    id: "multiples-avatares",
    category: "Gemelos Digitales (Avatares)",
    question: "¿Puedo tener más de un avatar en mi cuenta?",
    answer:
      "Sí. Cada cuenta puede crear y administrar hasta 10 gemelos digitales con nombre propio (por ejemplo, para comprar ropa para tus hijos, pareja o familiares).\n\nDentro del Probador Virtual 3D de cualquier prenda podés alternar al instante entre tus avatares guardados con el selector 'Probar en'.",
  },
  {
    id: "como-funciona-probador",
    category: "Probador Virtual 3D",
    question: "¿Cómo funciona el diagnóstico inteligente de calce?",
    answer:
      "Cuando activás 'Probarse en 3D' en la página de un producto, nuestro motor WebGL adapta la malla paramétrica de la prenda sobre las proporciones reales de tu avatar seleccionado.\n\nAl cambiar de talle (S, M, L, XL o talles numéricos AR/EU y US), el sistema compara el contorno de la prenda con tu morfología y te indica en tiempo real si el calce es Ideal, Ajustado o Holgado, mostrando visualmente la caída o tensión de la tela.",
  },
  {
    id: "variantes-carrito",
    category: "Compras y Carrito",
    question: "¿Puedo agregar la misma prenda en distintos talles o colores?",
    answer:
      "Por supuesto. Si elegís el mismo pantalón en otro talle o color, se agrega como una línea independiente en tu carrito para que puedas revisar, ajustar cantidades (+/−) o quitar cada variante por separado.\n\nAl confirmar tu compra, el pedido registra el talle, color y precio exacto vigente al momento del checkout.",
  },
  {
    id: "publicar-prendas-marca",
    category: "Marcas (B2B)",
    question: "Soy una marca, ¿cómo subo mis prendas con modelado 3D?",
    answer:
      "Registrate seleccionando el tipo de cuenta 'Marca'. Desde el 'Brand Dashboard' podés subir la fotografía de cada prenda junto con sus propiedades físicas (fit, tiro, elasticidad, textura y desgaste).\n\nNuestro pipeline con Google Gemini Vision analiza la imagen para generar los descriptores paramétricos 3D automáticamente, o bien podés publicar con parámetros manuales.",
  },
];

export const DEFAULT_FAQ_CATEGORY = "General";

export interface FaqGroup {
  category: string;
  items: FaqItem[];
}

/** Groups the questions by category, keeping the order in which they were written. */
export function groupFaqs(items: FaqItem[]): FaqGroup[] {
  const groups = new Map<string, FaqItem[]>();
  for (const item of items) {
    const category = item.category?.trim() || DEFAULT_FAQ_CATEGORY;
    groups.set(category, [...(groups.get(category) ?? []), item]);
  }
  return [...groups].map(([category, groupItems]) => ({ category, items: groupItems }));
}
