import { BullishSignal, IntradayCandle } from "@/domain/models/bullish-impulse";
import { STRATEGY_CONFIG } from "@/domain/config/strategy.config";

/** Horas que se muestran las señales en pantalla. El historial completo sigue guardado en la base de datos. */
export const SIGNAL_WINDOW_HOURS = 6;

/**
 * Decide qué señal se enseña de cada empresa (una sola): la CONFIRMADA manda sobre la TEMPRANA,
 * y entre señales del mismo tipo gana la más reciente.
 */
export function isBetterSignal(candidate: BullishSignal, current: BullishSignal): boolean {
  if (candidate.tipo !== current.tipo) return candidate.tipo === "CONFIRMADA";
  return Date.parse(candidate.detectadaEn) > Date.parse(current.detectadaEn);
}

/**
 * Detecta impulsos alcistas basados en tendencias reales y sostenidas intradía,
 * filtrando el ruido temporal de 10 min y aplicando los umbrales de estrategia.
 */
export function detectBullishSignals(
  companyId: number,
  ticker: string,
  nombre: string,
  candles: IntradayCandle[],
): BullishSignal[] {
  const valid = candles.filter((c) =>
    Number.isFinite(c.close) && c.close > 0 &&
    (c.volume === null || (Number.isFinite(c.volume) && c.volume >= 0)),
  );
  if (valid.length < 12) return [];

  const last = valid[valid.length - 1];
  const prev = valid[valid.length - 2];
  const previousBars = valid.slice(-11, -1);
  const priorVolumes = previousBars.flatMap((candle) =>
    candle.volume !== null && candle.volume > 0 ? [candle.volume] : []
  );
  const averageVolume = priorVolumes.length > 0
    ? priorVolumes.reduce((sum, volume) => sum + volume, 0) / priorVolumes.length
    : 0;
  const relativeVolume = last.volume !== null && averageVolume > 0
    ? last.volume / averageVolume
    : null;
  const changePct = ((last.close - prev.close) / prev.close) * 100;
  const signals: BullishSignal[] = [];

  // Parámetros de la estrategia de impulso sostenido
  const minSustained = STRATEGY_CONFIG.BULLISH_IMPULSE.MIN_SUSTAINED_PERIODS;
  const minReturn = STRATEGY_CONFIG.BULLISH_IMPULSE.MIN_RETURN_THRESHOLD;
  const maxDrawdownLimit = STRATEGY_CONFIG.BULLISH_IMPULSE.MAX_DRAWDOWN_LIMIT;

  // 1. Validación de tendencia sostenida en bloques recientes (Filtro de ruido de 10 min)
  const recentSlice = valid.slice(-(minSustained + 1));
  let ascendingCount = 0;
  for (let i = 1; i < recentSlice.length; i++) {
    if (recentSlice[i].close >= recentSlice[i - 1].close) {
      ascendingCount++;
    }
  }

  const baselinePrice = recentSlice[0].close;
  const totalReturn = (last.close - baselinePrice) / baselinePrice;

  // Validación de retroceso máximo local (evitar falsos impulsos que ya están cayendo)
  const recentHigh = Math.max(...recentSlice.map((c) => c.high));
  const drawdownFromRecentHigh = (recentHigh - last.close) / recentHigh;
  const isValidDrawdown = drawdownFromRecentHigh < maxDrawdownLimit;

  // Estructura alcista firme y validada
  const isSustainedStructure = 
    ascendingCount >= minSustained && 
    totalReturn >= minReturn && 
    isValidDrawdown;

  // Aviso Temprano: Detecta que se ha consolidado una estructura alcista sostenida a lo largo de los bloques
  if (isSustainedStructure) {
    signals.push({
      companyId,
      ticker,
      nombre,
      tipo: "TEMPRANA",
      precio: last.close,
      variacionBarraPct: changePct,
      volumenRelativo: relativeVolume,
      detectadaEn: last.timestamp.toISOString(),
      motivo: "Tendencia alcista sostenida confirmada en bloques de 10 min; estructura firme.",
    });
  }

  // Confirmación: Ruptura limpia del máximo de las 10 muestras anteriores con volumen institucional y tendencia sólida
  const priorHigh = Math.max(...previousBars.map((c) => c.high));
  const confirmed = last.close > priorHigh && 
                    (relativeVolume === null || relativeVolume >= 1.2) && 
                    isSustainedStructure;

  if (confirmed) {
    signals.push({
      companyId,
      ticker,
      nombre,
      tipo: "CONFIRMADA",
      precio: last.close,
      variacionBarraPct: changePct,
      volumenRelativo: relativeVolume,
      detectadaEn: last.timestamp.toISOString(),
      motivo: "Ruptura de máximos previos con tendencia sostenida confirmada y volumen relativo suficiente.",
    });
  }

  return signals;
}