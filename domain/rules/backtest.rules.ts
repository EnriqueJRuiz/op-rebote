// domain/rules/backtest.rules.ts
import { RSI } from "technicalindicators";
import { STRATEGY_CONFIG } from "@/domain/config/strategy.config";
import { TRADING_RULES } from "@/domain/rules/trading.rules";
import { HistoricalCandle, RsiSeriesPoint, BacktestSummary } from "@/domain/models/backtest";

export function buildRsiSeries(candles: HistoricalCandle[]): RsiSeriesPoint[] {
  const period = STRATEGY_CONFIG.YAHOO.RSI_PERIOD;
  if (candles.length <= period) return [];

  const closes = candles.map((c) => c.precio);
  const rsiValues = RSI.calculate({ values: closes, period });
  const offset = candles.length - rsiValues.length;

  return rsiValues.map((rsi, i) => ({
    fecha: candles[offset + i].fecha,
    precio: candles[offset + i].precio,
    volumen: candles[offset + i].volumen,
    rsi: Number(rsi.toFixed(2)),
  }));
}

type Resultado = "GANADA" | "PERDIDA" | "ESTANCADA";

function simulateOutcome(
  serie: RsiSeriesPoint[],
  indiceEntrada: number
): { resultado: Resultado; dias: number } | null {
  const entrada = serie[indiceEntrada];
  const precioStop = entrada.precio * (1 - TRADING_RULES.MAX_STOP_LOSS_PCT / 100);
  const precioObjetivo = entrada.precio * (1 + TRADING_RULES.PROFIT_TARGET_PCT / 100);

  for (let i = indiceEntrada + 1; i < serie.length; i++) {
    const dias = i - indiceEntrada;
    const precioDia = serie[i].precio;

    if (precioDia <= precioStop) return { resultado: "PERDIDA", dias };
    if (precioDia >= precioObjetivo) return { resultado: "GANADA", dias };
    if (dias >= TRADING_RULES.TIME_STOP_DAYS) return { resultado: "ESTANCADA", dias };
  }

  return null;
}

export function runBacktest(candles: HistoricalCandle[]): BacktestSummary {
  const serie = buildRsiSeries(candles);

  let casosTotales = 0, ganados = 0, perdidos = 0, estancados = 0, diasSuma = 0;
  const pendientes: { fecha: string; precio: number }[] = [];

  for (let i = 0; i < serie.length; i++) {
    const punto = serie[i];

    const esSenal = punto.rsi <= TRADING_RULES.OVERSOLD_THRESHOLD && punto.volumen >= TRADING_RULES.MIN_DAILY_VOLUME;
    if (!esSenal) continue; // este día no es señal, pasamos al siguiente

    const salida = simulateOutcome(serie, i);
    if (!salida) {
      pendientes.push({ fecha: punto.fecha, precio: punto.precio });
      continue;
    }

    casosTotales++;
    diasSuma += salida.dias;
    if (salida.resultado === "GANADA") ganados++;
    else if (salida.resultado === "PERDIDA") perdidos++;
    else estancados++;
  }

  return { casosTotales, ganados, perdidos, estancados, diasSuma, pendientes };
}

function diasEntre(fechaInicio: string, fechaFin: string): number {
  const inicio = new Date(fechaInicio).getTime();
  const fin = new Date(fechaFin).getTime();
  return Math.round((fin - inicio) / 86_400_000);
}

export function continueBacktest(
  previo: BacktestSummary,
  nuevasFilas: RsiSeriesPoint[]
): BacktestSummary {
  let { casosTotales, ganados, perdidos, estancados, diasSuma } = previo;
  let pendientes = [...previo.pendientes];

  for (const fila of nuevasFilas) {
    // 1. ¿Alguna señal pendiente se resuelve con este día nuevo?
    const siguientesPendientes: typeof pendientes = [];
    for (const pendiente of pendientes) {
      const dias = diasEntre(pendiente.fecha, fila.fecha);
      const precioStop = pendiente.precio * (1 - TRADING_RULES.MAX_STOP_LOSS_PCT / 100);
      const precioObjetivo = pendiente.precio * (1 + TRADING_RULES.PROFIT_TARGET_PCT / 100);

      if (fila.precio <= precioStop) {
        casosTotales++; perdidos++; diasSuma += dias;
      } else if (fila.precio >= precioObjetivo) {
        casosTotales++; ganados++; diasSuma += dias;
      } else if (dias >= TRADING_RULES.TIME_STOP_DAYS) {
        casosTotales++; estancados++; diasSuma += dias;
      } else {
        siguientesPendientes.push(pendiente); // sigue sin resolverse
      }
    }
    pendientes = siguientesPendientes;

    // 2. ¿Este día nuevo es a su vez una señal?
    const esSenal = fila.rsi <= TRADING_RULES.OVERSOLD_THRESHOLD
      && fila.volumen >= TRADING_RULES.MIN_DAILY_VOLUME;
    if (esSenal) {
      pendientes.push({ fecha: fila.fecha, precio: fila.precio });
    }
  }

  return { casosTotales, ganados, perdidos, estancados, diasSuma, pendientes };
}