/**
 * Formats a price in Argentine pesos, e.g. 89900 -> "$ 89.900".
 * Prices are stored in pesos (ARS), so no conversion is needed here.
 */
const priceFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function formatPrice(value: number | string | null | undefined): string {
  return priceFormatter.format(Number(value) || 0);
}
