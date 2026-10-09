import { BullishSignal, IntradayCandle } from "@/domain/models/bullish-impulse";

/** Reglas iniciales y explícitas. Deben calibrarse con backtests antes de usarlas como órdenes. */
export function detectBullishSignals(
  ticker: string,
  nombre: string,
  candles: IntradayCandle[],
): BullishSignal[] {
  const valid = candles.filter((c) =>
    Number.isFinite(c.close) && c.close > 0 && Number.isFinite(c.volume) && c.volume >= 0,
  );
  if (valid.length < 12) return [];

  const last = valid[valid.length - 1];
  const prev = valid[valid.length - 2];
  const before = valid[valid.length - 3];
  const previousBars = valid.slice(-11, -1);
  const averageVolume = previousBars.reduce((sum, c) => sum + c.volume, 0) / previousBars.length;
  const relativeVolume = averageVolume > 0 ? last.volume / averageVolume : null;
  const changePct = ((last.close - prev.close) / prev.close) * 100;
  const signals: BullishSignal[] = [];

  // Aviso temprano: mejora de cierres consecutivos y volumen al menos normal.
  const early = last.close > prev.close && prev.close >= before.close && (relativeVolume === null || relativeVolume >= 0.8);
  if (early) {
    signals.push({
      ticker, nombre, tipo: "TEMPRANA", precio: last.close, variacionBarraPct: changePct,
      volumenRelativo: relativeVolume, detectadaEn: last.timestamp.toISOString(),
      motivo: "Dos cierres consecutivos al alza; vigilar si el impulso continúa.",
    });
  }

  // Confirmación: cierre por encima del máximo de las 10 velas anteriores y RVOL >= 1.2.
  const priorHigh = Math.max(...previousBars.map((c) => c.high));
  const confirmed = last.close > priorHigh && (relativeVolume === null || relativeVolume >= 1.2);
  if (confirmed) {
    signals.push({
      ticker, nombre, tipo: "CONFIRMADA", precio: last.close, variacionBarraPct: changePct,
      volumenRelativo: relativeVolume, detectadaEn: last.timestamp.toISOString(),
      motivo: "Ruptura del máximo de las 10 velas anteriores con volumen relativo suficiente.",
    });
  }
  return signals;
}
