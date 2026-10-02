// domain/rules/backtest.rules.ts
import { RSI, SMA } from "technicalindicators";
import { SMA_PERIOD } from "@/domain/constants";
import { STRATEGY_CONFIG } from "@/domain/config/strategy.config";
import { TRADING_RULES } from "@/domain/rules/trading.rules";
import {
  BACKTEST_ALGORITHM_VERSION,
  HistoricalCandle,
  RsiSeriesPoint,
  BacktestSummary,
  BacktestGroup,
  BacktestFilterId,
  BacktestFilterStats,
  BacktestFilterComparisons,
  PendingSignal,
} from "@/domain/models/backtest";

const MAX_SUPPORT_DISTANCE_PCT = 2;
const TRAINING_FRACTION = 0.8;

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
    const vela = candles[indiceVela];
    const volumenPrevio = candles
      .slice(Math.max(0, indiceVela - 30), indiceVela)
      .map((candle) => candle.volumen)
      .filter((volume) => Number.isFinite(volume) && volume >= 0);
    const volumenMedio = volumenPrevio.length > 0
      ? volumenPrevio.reduce((total, volume) => total + volume, 0) / volumenPrevio.length
      : 0;
    const minimosPrevios = candles
      .slice(Math.max(0, indiceVela - 5), indiceVela)
      .map((candle) => candle.bajo)
      .filter((low) => Number.isFinite(low) && low > 0);
    const sueloPrevio = minimosPrevios.length > 0 ? Math.min(...minimosPrevios) : undefined;

    return {
      fecha: vela.fecha,
      precio: vela.precio,
      alto: vela.alto,
      bajo: vela.bajo,
      volumen: vela.volumen,
      rsi: Number(rsi.toFixed(2)),
      volumenRelativo: volumenMedio > 0
        ? Number((vela.volumen / volumenMedio).toFixed(2))
        : undefined,
      distanciaSueloPct: sueloPrevio !== undefined && vela.precio > 0
        ? Number((((vela.precio - sueloPrevio) / vela.precio) * 100).toFixed(2))
        : undefined,
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

function emptyFilterStats(): BacktestFilterStats {
  return { casos: 0, ganados: 0, perdidos: 0, estancados: 0, diasSuma: 0 };
}

/** Suma un resultado resuelto a los totales y, si se conoce, al grupo sobre/bajo SMA200. */
function registrar(
  acc: Omit<BacktestSummary, "pendientes" | "metodologiaVersion" | "comparativasFiltros">,
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
  indiceEntrada: number,
  ultimoIndice = serie.length - 1
): { resultado: Resultado; dias: number } | null {
  const entrada = serie[indiceEntrada];
  const precioStop = entrada.precio * (1 - TRADING_RULES.MAX_STOP_LOSS_PCT / 100);
  const precioObjetivo = entrada.precio * (1 + TRADING_RULES.PROFIT_TARGET_PCT / 100);

  for (let i = indiceEntrada + 1; i <= ultimoIndice && i < serie.length; i++) {
    const dias = i - indiceEntrada;
    const vela = serie[i];
    const maximo = vela.alto ?? vela.precio;
    const minimo = vela.bajo ?? vela.precio;

    // If both barriers trade within one daily candle, assume the stop was hit first.
    if (minimo <= precioStop) return { resultado: "PERDIDA", dias };
    if (maximo >= precioObjetivo) return { resultado: "GANADA", dias };
    if (dias >= TRADING_RULES.TIME_STOP_DAYS) return { resultado: "ESTANCADA", dias };
  }

  return null;
}

function getEntryIndices(
  serie: RsiSeriesPoint[],
  meetsAdditionalFilter: (point: RsiSeriesPoint, previous?: RsiSeriesPoint) => boolean = () => true
): number[] {
  const entries: number[] = [];
  let senalEnEpisodioSobreventa = false;

  for (let i = 0; i < serie.length; i++) {
    const punto = serie[i];
    if (punto.rsi > TRADING_RULES.OVERSOLD_THRESHOLD) {
      senalEnEpisodioSobreventa = false;
      continue;
    }
    if (senalEnEpisodioSobreventa || punto.volumen < TRADING_RULES.MIN_DAILY_VOLUME) continue;
    if (!meetsAdditionalFilter(punto, serie[i - 1])) continue;

    senalEnEpisodioSobreventa = true;
    entries.push(i);
  }

  return entries;
}

function addResult(stats: BacktestFilterStats, result: { resultado: Resultado; dias: number }): void {
  stats.casos++;
  stats.diasSuma += result.dias;
  if (result.resultado === "GANADA") stats.ganados++;
  else if (result.resultado === "PERDIDA") stats.perdidos++;
  else stats.estancados++;
}

function summarizeEntries(
  serie: RsiSeriesPoint[],
  entries: number[],
  startIndex: number,
  endIndex: number
): BacktestFilterStats {
  const stats = emptyFilterStats();
  for (const index of entries) {
    if (index < startIndex || index >= endIndex) continue;
    const result = simulateOutcome(serie, index, endIndex - 1);
    if (result) addResult(stats, result);
  }
  return stats;
}

function buildFilterComparisons(serie: RsiSeriesPoint[]): BacktestFilterComparisons {
  const baseEntries = getEntryIndices(serie);
  const entriesByFilter: Record<BacktestFilterId, number[]> = {
    rsi25: getEntryIndices(serie, (point) => point.rsi <= Math.min(25, TRADING_RULES.OVERSOLD_THRESHOLD)),
    rsiRising: getEntryIndices(serie, (point, previous) => previous !== undefined && point.rsi > previous.rsi),
    rvolAboveAverage: getEntryIndices(serie, (point) => (point.volumenRelativo ?? 0) >= 1),
    nearRecentLow: getEntryIndices(
      serie,
      (point) => point.distanciaSueloPct !== undefined &&
        point.distanciaSueloPct >= 0 &&
        point.distanciaSueloPct <= MAX_SUPPORT_DISTANCE_PCT
    ),
    aboveSma200: getEntryIndices(serie, (point) => point.sma200 !== null &&
      point.sma200 !== undefined && point.precio >= point.sma200),
    nearSma200: getEntryIndices(serie, (point) => {
      if (point.sma200 === null || point.sma200 === undefined || point.sma200 <= 0) return false;
      const distance = ((point.precio - point.sma200) / point.sma200) * 100;
      return distance >= -10 && distance < 0;
    }),
    belowSma200: getEntryIndices(serie, (point) => {
      if (point.sma200 === null || point.sma200 === undefined || point.sma200 <= 0) return false;
      return ((point.precio - point.sma200) / point.sma200) * 100 < -10;
    }),
  };

  const splitIndex = Math.floor(serie.length * TRAINING_FRACTION);
  const summarizePeriod = (startIndex: number, endIndex: number) => {
    const filtros = {} as Record<BacktestFilterId, BacktestFilterStats>;
    for (const filter of Object.keys(entriesByFilter) as BacktestFilterId[]) {
      filtros[filter] = summarizeEntries(serie, entriesByFilter[filter], startIndex, endIndex);
    }
    return {
      base: summarizeEntries(serie, baseEntries, startIndex, endIndex),
      filtros,
    };
  };

  return {
    fechaInicioValidacion: serie[splitIndex]?.fecha,
    entrenamiento: summarizePeriod(0, splitIndex),
    validacion: summarizePeriod(splitIndex, serie.length),
  };
}

export function runBacktest(candles: HistoricalCandle[]): BacktestSummary {
  const serie = buildRsiSeries(candles);

  const acc: Omit<BacktestSummary, "pendientes" | "metodologiaVersion" | "comparativasFiltros"> = {
    casosTotales: 0, ganados: 0, perdidos: 0, estancados: 0, diasSuma: 0,
    sobreSma: emptyGroup(), bajoSma: emptyGroup(),
  };
  const pendientes: PendingSignal[] = [];

  for (const i of getEntryIndices(serie)) {
    const punto = serie[i];
    const sobreSma = esSobreSma(punto.precio, punto.sma200);
    const salida = simulateOutcome(serie, i);
    if (!salida) {
      pendientes.push({ fecha: punto.fecha, precio: punto.precio, sobreSma });
      continue;
    }

    registrar(acc, salida.resultado, salida.dias, sobreSma);
  }

  return {
    ...acc,
    pendientes,
    metodologiaVersion: BACKTEST_ALGORITHM_VERSION,
    comparativasFiltros: buildFilterComparisons(serie),
  };
}