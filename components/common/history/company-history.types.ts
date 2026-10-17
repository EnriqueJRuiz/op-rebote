import { CompanyHistoryPoint } from "@/domain/models/company-history";

export const COMPANY_HISTORY_METRICS = [
  { key: "precio", label: "Precio", unit: "" },
  { key: "rsi", label: "RSI", unit: "" },
  { key: "volumen", label: "Volumen", unit: "" },
  { key: "volumen_relativo", label: "Volumen relativo (RVOL)", unit: "x" },
  { key: "rsi_anterior", label: "RSI anterior", unit: "" },
  { key: "capitalizacion", label: "Capitalización", unit: "" },
  { key: "minimo_reciente", label: "Mínimo reciente", unit: "" },
  { key: "distancia_suelo_pct", label: "Distancia al suelo reciente", unit: "%" },
  { key: "sma200", label: "SMA 200", unit: "" },
  { key: "dist_sma200_pct", label: "Distancia a SMA 200", unit: "%" },
  { key: "precio_anterior", label: "Precio anterior", unit: "" },
] as const;

export type CompanyHistoryMetric = (typeof COMPANY_HISTORY_METRICS)[number]["key"];

export type { CompanyHistoryPoint };

export function getCompanyHistoryMetricValue(
  point: CompanyHistoryPoint,
  metric: CompanyHistoryMetric
): number | null {
  if (metric === "distancia_suelo_pct") {
    if (
      point.precio === null ||
      point.precio <= 0 ||
      point.minimo_reciente === null ||
      point.minimo_reciente <= 0
    ) {
      return null;
    }

    return ((point.precio - point.minimo_reciente) / point.precio) * 100;
  }

  return point[metric];
}
