import { TierLevel, ExitRule } from '../models/trading';
import { APP_CONFIG, DIVIDEND_TIERS, DividendTier } from "@/domain/constants";
import { STRATEGY_CONFIG } from "@/domain/config/strategy.config";

export const TRADING_RULES = STRATEGY_CONFIG.TRADING;

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
      tier: APP_CONFIG.CATEGORIES.TIER_0,
      reglaSalida: 'HOLD_DIVIDEND',
    };
  }

  // 2. TIER 1: candidatos no-King que superan los filtros más exigentes
  if (esValido && rsi <= TRADING_RULES.TIER1_RSI_THRESHOLD) {
    return {
      tier: APP_CONFIG.CATEGORIES.TIER_1,
      reglaSalida: origenCategoria === APP_CONFIG.CATEGORIES.MID
        ? 'FULL_SELL_100'
        : 'PARTIAL_80_20',
    };
  }

  // 3. TOP / MID estándar
  if (origenCategoria === APP_CONFIG.CATEGORIES.TOP) {
    return {
      tier: APP_CONFIG.CATEGORIES.TOP,
      reglaSalida: 'PARTIAL_80_20',
    };
  }

  return {
    tier: APP_CONFIG.CATEGORIES.MID,
    reglaSalida: 'PARTIAL_80_20',
  };
}