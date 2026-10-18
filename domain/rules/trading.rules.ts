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
  const { MIN_DAILY_VOLUME, MIN_CURRENT_RATIO, MAX_DEBT_TO_EQUITY, MIN_ROE } = TRADING_RULES;
  // Radar técnico flexible: la sobreventa puede haber ocurrido en cualquiera de las últimas 3 sesiones.
  // No exigimos que el RSI siga deprimido hoy, porque eso excluía rebotes que ya empezaban a girar.
  const recentRsi = stockData.rsiMinimoReciente ?? stockData.rsi;
  const cumpleRsiReciente = recentRsi <= 38;
  const cumpleVolumen = stockData.volumen >= MIN_DAILY_VOLUME;
  const cumpleRvol = typeof stockData.volumenRelativo === "number" && stockData.volumenRelativo >= 0.9;
  const cumpleGiro = stockData.reboteInicial === true;
  const cumpleLiquidez = stockData.currentRatio !== undefined && stockData.currentRatio >= MIN_CURRENT_RATIO;
  const cumpleDeuda = stockData.debtToEquity !== undefined && stockData.debtToEquity <= MAX_DEBT_TO_EQUITY;
  const cumpleRentabilidad = stockData.returnOnEquity !== undefined && stockData.returnOnEquity > MIN_ROE;
  const fundamentalesValidos = cumpleLiquidez && cumpleDeuda && cumpleRentabilidad;

  const reasons: string[] = [];
  if (!cumpleRsiReciente) reasons.push("No ha alcanzado RSI(14) ≤ 38 en las últimas 3 sesiones.");
  if (!cumpleGiro) reasons.push("Sin giro inicial: el precio no supera el mínimo de la sesión anterior.");
  if (!cumpleRvol) reasons.push("Volumen relativo insuficiente (RVOL < 0,9).");
  if (!cumpleVolumen) reasons.push(`Volumen insuficiente (< ${MIN_DAILY_VOLUME.toLocaleString()}).`);
  if (!cumpleLiquidez) reasons.push(`Current Ratio ausente o inferior a ${MIN_CURRENT_RATIO}.`);
  if (!cumpleDeuda) reasons.push(`Debt/Equity ausente o superior a ${MAX_DEBT_TO_EQUITY}.`);
  if (!cumpleRentabilidad) reasons.push(`ROE ausente o inferior a ${MIN_ROE}.`);

  // esValido indica elegibilidad para el radar técnico; los fundamentales se reservan para los tiers premium.
  return {
    ...stockData,
    fundamentalesValidos,
    esValido: cumpleVolumen && cumpleRvol && cumpleRsiReciente && cumpleGiro,
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
  fundamentalesValidos?: boolean;
  rsiMinimoReciente?: number;
  reboteConfirmado?: boolean;
}): EvaluationResult {
  const { rsi, esValido, dividendTier, origenCategoria } = input;

  // 1. TIER 0: Kings y Aristócratas solo si pasan radar técnico y fundamentales.
  // Evita que la etiqueta de dividendo, por sí sola, convierta una caída en oportunidad.
  if (esValido && input.fundamentalesValidos &&
      (dividendTier === DIVIDEND_TIERS.KING || dividendTier === DIVIDEND_TIERS.ARISTOCRAT)) {
    return { tier: APP_CONFIG.CATEGORIES.TIER_0, reglaSalida: 'HOLD_DIVIDEND' };
  }

  // 2. TIER 1: rebote confirmado, independientemente de si procede de TOP o MID.
  // La confirmación exige superar tanto el mínimo de ayer como el cierre de ayer.
  if (esValido && input.reboteConfirmado) {
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