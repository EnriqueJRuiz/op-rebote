import { APP_CONFIG } from "../constants";

export type TierLevel = 'TIER_0' | 'TIER_1' | typeof APP_CONFIG.CATEGORIES.TOP | typeof APP_CONFIG.CATEGORIES.MID;
export type ExitRule = 'HOLD_DIVIDEND' | 'FULL_SELL_100' | 'PARTIAL_80_20';

export interface Company {
  ticker: string;
  nombre: string;
  precio: number;
  volumen: number;
}

export interface StockCandidate extends Company {
  rsi: number;
  capitalizacion?: number;
  esValido: boolean;
  motivoDescarte?: string;
  categoria?: typeof APP_CONFIG.CATEGORIES.TOP | typeof APP_CONFIG.CATEGORIES.MID;
  tier?: TierLevel;
  esDividendKing?: boolean;
  reglaSalida?: ExitRule;
  currentRatio?: number;
  debtToEquity?: number;
  returnOnEquity?: number;
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
}

export interface MarketScanResult {
  tier0: StockCandidate[]; // Dividend Kings / Inquebrantables
  tier1: StockCandidate[]; // Máximos estándares
  top: StockCandidate[];   // Radar TOP
  mid: StockCandidate[];   // Radar MID
}