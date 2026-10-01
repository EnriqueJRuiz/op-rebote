import { TierLevel, ExitRule, StockCandidate } from '../models/trading';
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
 * Evalúa las reglas de negocio para determinar si un candidato supera los filtros de rebote y fundamentales.
 */
export function evaluateStockCandidateValidity(stockData: StockCandidate): StockCandidate {
  const { MIN_DAILY_VOLUME, OVERSOLD_THRESHOLD, MIN_CURRENT_RATIO, MAX_DEBT_TO_EQUITY, MIN_ROE } = TRADING_RULES;
  const cumpleVolumen = stockData.volumen >= MIN_DAILY_VOLUME;
  const cumpleRsi = stockData.rsi <= OVERSOLD_THRESHOLD;
  const cumpleLiquidez = stockData.currentRatio !== undefined && stockData.currentRatio >= MIN_CURRENT_RATIO;
  const cumpleDeuda = stockData.debtToEquity !== undefined && stockData.debtToEquity <= MAX_DEBT_TO_EQUITY;
  const cumpleRentabilidad = stockData.returnOnEquity !== undefined && stockData.returnOnEquity > MIN_ROE;

  const reasons: string[] = [];
  if (!cumpleVolumen) reasons.push(`Volumen insuficiente (< ${MIN_DAILY_VOLUME.toLocaleString()}).`);
  if (!cumpleRsi) reasons.push(`RSI fuera de rango (> ${OVERSOLD_THRESHOLD}).`);
  if (!cumpleLiquidez) reasons.push(`Liquidez baja (Current Ratio < ${MIN_CURRENT_RATIO}).`);
  if (!cumpleDeuda) reasons.push(`Endeudamiento excesivo (Debt/Equity > ${MAX_DEBT_TO_EQUITY}).`);
  if (!cumpleRentabilidad) reasons.push(`Rentabilidad insuficiente (ROE <= ${MIN_ROE}).`);

  return {
    ...stockData,
    esValido: cumpleVolumen && cumpleRsi && cumpleLiquidez && cumpleDeuda && cumpleRentabilidad,
    motivoDescarte: reasons.length > 0 ? reasons.join(" ") : undefined,
  };
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