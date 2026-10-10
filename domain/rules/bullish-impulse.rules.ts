import { BullishSignal, IntradayCandle } from "@/domain/models/bullish-impulse";

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

/** Reglas iniciales y explícitas. Deben calibrarse con backtests antes de usarlas como órdenes. */
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
  const before = valid[valid.length - 3];
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

  // Aviso temprano: mejora de cierres consecutivos y volumen de muestra al menos normal.
  const early = last.close > prev.close && prev.close >= before.close && (relativeVolume === null || relativeVolume >= 0.8);
  if (early) {
    signals.push({
      companyId, ticker, nombre, tipo: "TEMPRANA", precio: last.close, variacionBarraPct: changePct,
      volumenRelativo: relativeVolume, detectadaEn: last.timestamp.toISOString(),
      motivo: "Dos cierres consecutivos al alza; vigilar si el impulso continúa.",
    });
  }

  // Confirmación: cierre por encima del máximo de las 10 muestras anteriores y RVOL >= 1.2.
  const priorHigh = Math.max(...previousBars.map((c) => c.high));
  const confirmed = last.close > priorHigh && (relativeVolume === null || relativeVolume >= 1.2);
  if (confirmed) {
    signals.push({
      companyId, ticker, nombre, tipo: "CONFIRMADA", precio: last.close, variacionBarraPct: changePct,
      volumenRelativo: relativeVolume, detectadaEn: last.timestamp.toISOString(),
      motivo: "Ruptura del máximo de las 10 muestras anteriores con volumen relativo suficiente.",
    });
  }
  return signals;
}
