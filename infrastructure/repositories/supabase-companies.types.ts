import { APP_CONFIG, DividendTier } from "@/domain/constants";
export interface SupabaseCompanyRow {
  id: number;
  ticker: string;
  nombre: string;
  tipo_activo?: string;
  es_dividendo?: boolean;
  dividend_tier?: DividendTier;
  dividend_rate?: number;
  dividend_yield?: number;
  sector?: string;
  industria?: string;
  pais?: string;
  bolsa?: string;
  moneda?: string;
  web?: string;
  categoria?: typeof APP_CONFIG.CATEGORIES.TOP | typeof APP_CONFIG.CATEGORIES.MID;
  capitalizacion?: number;
  current_ratio?: number;
  debt_to_equity?: number;
  return_on_equity?: number;
  profit_margin?: number;
  free_cash_flow?: number;
  total_cash?: number;
  total_debt?: number;
  fundamentales_actualizados_en?: string;
}