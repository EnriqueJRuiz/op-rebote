// domain/rules/backtest.rules.ts
import { RSI, SMA } from "technicalindicators";
import { SMA_PERIOD } from "@/domain/constants";
import { STRATEGY_CONFIG } from "@/domain/config/strategy.config";
import { TRADING_RULES } from "@/domain/rules/trading.rules";
import {
  HistoricalCandle,
  RsiSeriesPoint,
  BacktestSummary,
  BacktestGroup,
  PendingSignal,
} from "@/domain/models/backtest";

export function buildRsiSeries(candles: HistoricalCandle[]): RsiSeriesPoint[] {
  const period = STRATEGY_CONFIG.YAHOO.RSI_PERIOD;
  if (candles.length <= period) return [];

  const closes = candles.map((c) => c.precio);
  const rsiValues = RSI.calculate({ values: closes, period });
  const offset = candles.length - rsiValues.length;

  // SMA200 de cada vela (las primeras SMA_PERIOD - 1 velas no tienen valor)
  const smaValues = candles.length >= SMA_PERIOD
    ? SMA.calculate({ values: closes, period: SMA_PERIOD })
    : [];
  const smaOffset = candles.length - smaValues.length;

  return rsiValues.map((rsi, i) => {
    const indiceVela = offset + i;
    const indiceSma = indiceVela - smaOffset;
    const sma = smaValues.length > 0 && indiceSma >= 0 ? smaValues[indiceSma] : null;

    return {
      fecha: candles[indiceVela].fecha,
      precio: candles[indiceVela].precio,
      volumen: candles[indiceVela].volumen,
      rsi: Number(rsi.toFixed(2)),
      sma200: sma === null ? null : Number(sma.toFixed(4)),
    };
  });
}

type Resultado = "GANADA" | "PERDIDA" | "ESTANCADA";

function esSobreSma(precio: number, sma200: number | null | undefined): boolean | null {
  if (sma200 === null || sma200 === undefined || !Number.isFinite(sma200)) return null;
  return precio >= sma200;
}

function emptyGroup(): BacktestGroup {
  return { casos: 0, ganados: 0, perdidos: 0, estancados: 0, diasSuma: 0 };
}

function copyGroup(group: BacktestGroup | undefined): BacktestGroup {
  return group ? { ...group } : emptyGroup();
}

/** Suma un resultado resuelto a los totales y, si se conoce, al grupo sobre/bajo SMA200. */
function registrar(
  acc: Omit<BacktestSummary, "pendientes">,
  resultado: Resultado,
  dias: number,
  sobreSma: boolean | null
): void {
  const grupos: BacktestGroup[] = [];
  if (sobreSma === true) grupos.push(acc.sobreSma);
  if (sobreSma === false) grupos.push(acc.bajoSma);

  acc.casosTotales++;
  acc.diasSuma += dias;
  if (resultado === "GANADA") acc.ganados++;
  else if (resultado === "PERDIDA") acc.perdidos++;
  else acc.estancados++;

  for (const g of grupos) {
    g.casos++;
    g.diasSuma += dias;
    if (resultado === "GANADA") g.ganados++;
    else if (resultado === "PERDIDA") g.perdidos++;
    else g.estancados++;
  }
}

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

  const acc: Omit<BacktestSummary, "pendientes"> = {
    casosTotales: 0, ganados: 0, perdidos: 0, estancados: 0, diasSuma: 0,
    sobreSma: emptyGroup(), bajoSma: emptyGroup(),
  };
  const pendientes: PendingSignal[] = [];

  for (let i = 0; i < serie.length; i++) {
    const punto = serie[i];

    const esSenal = punto.rsi <= TRADING_RULES.OVERSOLD_THRESHOLD && punto.volumen >= TRADING_RULES.MIN_DAILY_VOLUME;
    if (!esSenal) continue; // este día no es señal, pasamos al siguiente

    const sobreSma = esSobreSma(punto.precio, punto.sma200);
    const salida = simulateOutcome(serie, i);
    if (!salida) {
      pendientes.push({ fecha: punto.fecha, precio: punto.precio, sobreSma });
      continue;
    }

    registrar(acc, salida.resultado, salida.dias, sobreSma);
  }

  return { ...acc, pendientes };
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
  const acc: Omit<BacktestSummary, "pendientes"> = {
    casosTotales: previo.casosTotales,
    ganados: previo.ganados,
    perdidos: previo.perdidos,
    estancados: previo.estancados,
    diasSuma: previo.diasSuma,
    sobreSma: copyGroup(previo.sobreSma),
    bajoSma: copyGroup(previo.bajoSma),
  };
  let pendientes: PendingSignal[] = [...previo.pendientes];

  for (const fila of nuevasFilas) {
    // 1. ¿Alguna señal pendiente se resuelve con este día nuevo?
    const siguientesPendientes: PendingSignal[] = [];
    for (const pendiente of pendientes) {
      const dias = diasEntre(pendiente.fecha, fila.fecha);
      const precioStop = pendiente.precio * (1 - TRADING_RULES.MAX_STOP_LOSS_PCT / 100);
      const precioObjetivo = pendiente.precio * (1 + TRADING_RULES.PROFIT_TARGET_PCT / 100);
      const sobreSma = pendiente.sobreSma ?? null;

      if (fila.precio <= precioStop) {
        registrar(acc, "PERDIDA", dias, sobreSma);
      } else if (fila.precio >= precioObjetivo) {
        registrar(acc, "GANADA", dias, sobreSma);
      } else if (dias >= TRADING_RULES.TIME_STOP_DAYS) {
        registrar(acc, "ESTANCADA", dias, sobreSma);
      } else {
        siguientesPendientes.push(pendiente); // sigue sin resolverse
      }
    }
    pendientes = siguientesPendientes;

    // 2. ¿Este día nuevo es a su vez una señal?
    const esSenal = fila.rsi <= TRADING_RULES.OVERSOLD_THRESHOLD
      && fila.volumen >= TRADING_RULES.MIN_DAILY_VOLUME;
    if (esSenal) {
      pendientes.push({
        fecha: fila.fecha,
        precio: fila.precio,
        sobreSma: esSobreSma(fila.precio, fila.sma200),
      });
    }
  }

  return { ...acc, pendientes };
}