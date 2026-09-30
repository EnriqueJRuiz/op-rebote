import { APP_CONFIG, DividendTier } from "../constants";

export type ExitRule = 'HOLD_DIVIDEND' | 'FULL_SELL_100' | 'PARTIAL_80_20';

export interface Company {
  ticker: string;
  nombre: string;
  precio: number;
  volumen: number;
}

export type TierLevel =
  | typeof APP_CONFIG.CATEGORIES.TIER_0
  | typeof APP_CONFIG.CATEGORIES.TIER_1
  | typeof APP_CONFIG.CATEGORIES.TOP
  | typeof APP_CONFIG.CATEGORIES.MID;

export interface CompanyRecord extends Company {
  id: number;
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

export interface CompanyScanQuote {
  companyId: number;
  price: number;
  previousDayPrice?: number;
}

export interface BacktestGroupStats {
  casos: number;
  exitoPct: number;
}

export interface StockCandidate extends Company {
  rsi: number;
  capitalizacion?: number;
  esValido: boolean;
  motivoDescarte?: string;
  categoria?: typeof APP_CONFIG.CATEGORIES.TOP | typeof APP_CONFIG.CATEGORIES.MID;
  tier?: TierLevel;
  dividendTier?: DividendTier;
  reglaSalida?: ExitRule;
  currentRatio?: number;
  debtToEquity?: number;
  returnOnEquity?: number;
  volumenRelativo?: number;
  minimoReciente?: number;
  backtestCasos?: number;
  backtestExitoPct?: number;
  backtestPerdidoPct?: number;
  backtestEstancadoPct?: number;
  backtestDiasMedios?: number;
  sma200?: number;
  distSma200Pct?: number; // (precio - SMA200) / SMA200 * 100
  backtestSobreSma?: BacktestGroupStats; // señales con el precio >= SMA200
  backtestBajoSma?: BacktestGroupStats;  // señales con el precio < SMA200
}

export interface CompanyMetadata {
  tipoActivo: string;
  esDividendo: boolean;
  sector: string;
  dividendRate?: number;
  dividendYield?: number;
  industria?: string;
  pais?: string;
  bolsa?: string;
  moneda?: string;
  web?: string;
  capitalizacion?: number;
  currentRatio?: number;
  debtToEquity?: number;
  returnOnEquity?: number;
  profitMargin?: number;
  freeCashFlow?: number;
  totalCash?: number;
  totalDebt?: number;
}

export interface UniverseStock extends Company {
  pais?: string;
  sector?: string;
  industria?: string;
  marketCap: number;
  volumenMedio?: number;
  exchange?: string;
  quoteType?: string;
  tipoActivo?: string;
  moneda?: string;
  categoria?: typeof APP_CONFIG.CATEGORIES.TOP | typeof APP_CONFIG.CATEGORIES.MID;
  dividendTier?: DividendTier;
}

export interface MarketScanResult {
  tier0: StockCandidate[]; // Dividend Kings / Inquebrantables
  tier1: StockCandidate[]; // Máximos estándares
  top: StockCandidate[];   // Radar TOP
  mid: StockCandidate[];   // Radar MID
}
