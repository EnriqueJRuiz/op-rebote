import { TierLevel, ExitRule } from '../models/trading';
import { APP_CONFIG, DIVIDEND_TIERS, DividendTier } from "@/domain/constants";

export const TRADING_RULES = {
  OVERSOLD_THRESHOLD: 30,
  MIN_DAILY_VOLUME: 500_000,
  TIME_STOP_DAYS: 5,
  MAX_STOP_LOSS_PCT: 7,
  MAX_MA_DEVIATION_PCT: 10,
  PROFIT_TARGET_PCT: 8,
  MIN_CURRENT_RATIO: 1.0, 
  MAX_DEBT_TO_EQUITY: 2.5,     
  MIN_ROE: 0,
} as const;

export interface EvaluationContext {
  rsi: number;
  esValido: boolean;
  dividendTier: DividendTier | undefined;
  origenCategoria?: typeof APP_CONFIG.CATEGORIES.TOP | typeof APP_CONFIG.CATEGORIES.MID;
}

export interface EvaluationResult {
  tier: TierLevel;
  reglaSalida: ExitRule;
}

/**
 * Aplica la hoja de ruta oficial para determinar el Tier y la regla de salida de un candidato
 */
export function evaluateCandidateTierAndExit(input: {
  rsi: number;
  esValido: boolean;
  dividendTier: DividendTier | undefined;
  origenCategoria?: typeof APP_CONFIG.CATEGORIES.TOP | typeof APP_CONFIG.CATEGORIES.MID;
}): EvaluationResult {
  const { rsi, esValido, dividendTier, origenCategoria } = input;

  // 1. TIER 0: Dividend Kings / Inquebrantables
  if (dividendTier === DIVIDEND_TIERS.KING) {
    return {
      tier: 'TIER_0',
      reglaSalida: 'HOLD_DIVIDEND',
    };
  }

  // 2. TIER 1: candidatos no-King que superan los filtros más exigentes
  if (esValido && rsi <= 25) {
    return {
      tier: 'TIER_1',
      reglaSalida: origenCategoria === APP_CONFIG.CATEGORIES.MID
        ? 'FULL_SELL_100'
        : 'PARTIAL_80_20',
    };
  }

  // 3. TOP / MID estándar
  if (origenCategoria === APP_CONFIG.CATEGORIES.TOP) {
    return {
      tier: 'TOP',
      reglaSalida: 'PARTIAL_80_20',
    };
  }

  return {
    tier: 'MID',
    reglaSalida: 'PARTIAL_80_20',
  };
}