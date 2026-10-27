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

export const FAQ_ITEMS: FaqItem[] = [];

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
