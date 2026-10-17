"use client";

import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  HistogramSeries,
  LineSeries,
  TickMarkType,
  type AutoscaleInfoProvider,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import type { CompanyHistoryPoint } from "@/domain/models/company-history";
import type { IntradayBar } from "@/domain/models/intraday";
import { UI_TEXT } from "@/domain/literales.constantes";
import { CompanyHistoryMetric, getCompanyHistoryMetricValue } from "./company-history.types";

type Props = {
  points: CompanyHistoryPoint[];
  bars?: IntradayBar[];
  metric: CompanyHistoryMetric;
  sessions: 1 | 5;
  className?: string;
  onPriceAnalysis?: (analysis: PriceAnalysis | null) => void;
};

export type PriceAnalysis = {
  direction: "alcista" | "bajista" | "indefinida";
  directionLabel: string;
  directionDetail: string;
  currentPrice: number;
  upper1: number;
  upper2: number;
  distanceUpper1Pct: number;
  distanceUpper2Pct: number;
  sma50: number | null;
  sma50SlopePct: number | null;
  structure: "creciente" | "decreciente" | "mixta";
};

type Candle = {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  session: string;
  volume?: number;
  extended?: boolean;
};

function makePriceCandles(points: CompanyHistoryPoint[]): Candle[] {
  const sorted = [...points].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  const byInterval = new Map<number, { session: string; prices: number[] }>();

  for (const point of sorted) {
    const price = Number(point.precio);
    const timestamp = Date.parse(point.timestamp);
    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(timestamp)) continue;

    const interval = Math.floor(timestamp / 1_800_000) * 1_800_000;
    const session = new Date(timestamp).toISOString().slice(0, 10);
    const bucket = byInterval.get(interval);
    if (bucket) bucket.prices.push(price);
    else byInterval.set(interval, { session, prices: [price] });
  }

  const candles: Candle[] = [];
  let previousClose: number | undefined;
  let previousSession: string | undefined;

  for (const [interval, bucket] of byInterval) {
    const close = bucket.prices[bucket.prices.length - 1];
    const open = previousSession === bucket.session ? previousClose ?? bucket.prices[0] : bucket.prices[0];
    candles.push({
      time: Math.floor(interval / 1000) as UTCTimestamp,
      open,
      high: Math.max(...bucket.prices, open),
      low: Math.min(...bucket.prices, open),
      close,
      session: bucket.session,
    });
    previousClose = close;
    previousSession = bucket.session;
  }

  return candles;
}

// Los niveles (máx./mín. de sesión, sesión anterior y 5 días) incluyen las velas de pre-market y after-hours.
// Poner a false para calcularlos solo con la sesión regular (lo que muestra el gráfico de TradingView).
const LEVELS_INCLUDE_EXTENDED_HOURS = true;

type ChartLevel = {
  title: string;
  value: number;
  color: string;
  includeInOneSessionScale: boolean;
  lineStyle?: number;
};

const EMA_LINES = [
  { length: 20, color: "#38bdf8" },
  { length: 50, color: "#f472b6" },
];

const EXTENDED_UP = "rgba(34, 197, 94, 0.45)";
const EXTENDED_DOWN = "rgba(239, 68, 68, 0.45)";

function makeBarCandles(bars: IntradayBar[]): Candle[] {
  return [...bars]
    .sort((a, b) => a.time - b.time)
    .map((bar) => ({
      time: bar.time as UTCTimestamp,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
      session: bar.day,
      volume: bar.volume,
      extended: bar.extended,
    }));
}

// Las velas de pre-market y after-hours se pintan más claras.
function toCandleData(candle: Candle) {
  if (!candle.extended) return candle;
  const color = candle.close >= candle.open ? EXTENDED_UP : EXTENDED_DOWN;
  return { ...candle, color, wickColor: color, borderColor: color };
}

// Una vela por sesión: apertura, máximo, mínimo y cierre del día (cierre regular, salvo en la sesión en curso).
function aggregateSessions(candles: Candle[]): Candle[] {
  const bySession = new Map<string, Candle[]>();
  for (const candle of candles) {
    const list = bySession.get(candle.session);
    if (list) list.push(candle);
    else bySession.set(candle.session, [candle]);
  }
  const sessions = [...bySession.entries()];
  return sessions.map(([session, list], index) => {
    const regular = list.filter((candle) => !candle.extended);
    const closeSource = index === sessions.length - 1 || regular.length === 0 ? list : regular;
    return {
      time: list[0].time,
      open: list[0].open,
      high: Math.max(...list.map((candle) => candle.high)),
      low: Math.min(...list.map((candle) => candle.low)),
      close: closeSource[closeSource.length - 1].close,
      session,
    };
  });
}

// EMA clásica: se inicia con la media simple de las primeras "length" velas.
function computeEma(candles: Candle[], length: number): Map<number, number> {
  const values = new Map<number, number>();
  if (candles.length < length) return values;
  const alpha = 2 / (length + 1);
  let ema = candles.slice(0, length).reduce((sum, candle) => sum + candle.close, 0) / length;
  values.set(Number(candles[length - 1].time), ema);
  for (let index = length; index < candles.length; index++) {
    ema = candles[index].close * alpha + ema * (1 - alpha);
    values.set(Number(candles[index].time), ema);
  }
  return values;
}

// lightweight-charts pinta en UTC; se formatea en hora de Madrid para que coincida con TradingView.
const CHART_TIME_ZONE = "Europe/Madrid";
const crosshairTimeFormat = new Intl.DateTimeFormat("es-ES", {
  timeZone: CHART_TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const tickYearFormat = new Intl.DateTimeFormat("es-ES", { timeZone: CHART_TIME_ZONE, year: "numeric" });
const tickMonthFormat = new Intl.DateTimeFormat("es-ES", { timeZone: CHART_TIME_ZONE, month: "short" });
const tickDayFormat = new Intl.DateTimeFormat("es-ES", { timeZone: CHART_TIME_ZONE, day: "numeric" });
const tickTimeFormat = new Intl.DateTimeFormat("es-ES", {
  timeZone: CHART_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function formatCrosshairTime(time: Time): string {
  const parts: Record<string, string> = {};
  for (const part of crosshairTimeFormat.formatToParts(new Date(Number(time) * 1000))) {
    parts[part.type] = part.value;
  }
  return `${parts.day} ${parts.month} '${parts.year} ${parts.hour}:${parts.minute}`;
}

function formatTickMark(time: Time, type: TickMarkType): string {
  const date = new Date(Number(time) * 1000);
  switch (type) {
    case TickMarkType.Year:
      return tickYearFormat.format(date);
    case TickMarkType.Month:
      return tickMonthFormat.format(date);
    case TickMarkType.DayOfMonth:
      return tickDayFormat.format(date);
    default:
      return tickTimeFormat.format(date);
  }
}

function makeIndicatorData(points: CompanyHistoryPoint[], metric: CompanyHistoryMetric) {
  return points
    .map((point) => {
      const timestamp = Math.floor(Date.parse(point.timestamp) / 1000);
      const rawValue = getCompanyHistoryMetricValue(point, metric);
      const value = rawValue === null ? NaN : Number(rawValue);
      return Number.isFinite(timestamp) && Number.isFinite(value)
        ? { time: timestamp as UTCTimestamp, value }
        : null;
    })
    .filter((point): point is { time: UTCTimestamp; value: number } => point !== null)
    .sort((a, b) => Number(a.time) - Number(b.time));
}

function analyzePrice(candles: Candle[], dailyCloses: Candle[], visibleSessions: string[]): PriceAnalysis | null {
  if (dailyCloses.length === 0) return null;

  const recentDaily = dailyCloses.slice(-Math.max(1, visibleSessions.length));
  const current = recentDaily[recentDaily.length - 1].close;
  const recentFive = candles.filter((candle) => visibleSessions.includes(candle.session));
  if (!Number.isFinite(current) || recentFive.length === 0) return null;

  const sessionHighs = recentDaily.map((candle) => candle.high);
  const sessionLows = recentDaily.map((candle) => candle.low);
  const firstHigh = sessionHighs[0];
  const lastHigh = sessionHighs[sessionHighs.length - 1];
  const firstLow = sessionLows[0];
  const lastLow = sessionLows[sessionLows.length - 1];
  const higherHighs = sessionHighs.length < 2 || lastHigh > firstHigh;
  const lowerHighs = sessionHighs.length >= 2 && lastHigh < firstHigh;
  const higherLows = sessionLows.length < 2 || lastLow > firstLow;
  const lowerLows = sessionLows.length >= 2 && lastLow < firstLow;

  const firstHalf = recentDaily.slice(0, Math.max(1, Math.floor(recentDaily.length / 2)));
  const lastHalf = recentDaily.slice(Math.max(1, Math.floor(recentDaily.length / 2)));
  const firstAvg = firstHalf.reduce((sum, candle) => sum + candle.close, 0) / firstHalf.length;
  const lastAvg = lastHalf.reduce((sum, candle) => sum + candle.close, 0) / lastHalf.length;
  const structure: PriceAnalysis["structure"] = higherHighs && higherLows
    ? "creciente"
    : lowerHighs && lowerLows
      ? "decreciente"
      : "mixta";

  const sessionHigh = Math.max(...recentDaily.slice(-1).map((candle) => candle.high));
  const fiveSessionHigh = Math.max(...recentFive.map((candle) => candle.high));

  const dailyWithSma = dailyCloses.map((candle, index) => {
    if (index < 49) return null;
    const window = dailyCloses.slice(index - 49, index + 1);
    return window.reduce((sum, item) => sum + item.close, 0) / 50;
  });
  const currentSma = dailyWithSma[dailyWithSma.length - 1] ?? null;
  const priorSmaIndex = Math.max(0, dailyWithSma.length - 6);
  const priorSma = dailyWithSma[priorSmaIndex] ?? null;
  const sma50SlopePct = currentSma !== null && priorSma !== null && priorSma !== 0
    ? ((currentSma - priorSma) / priorSma) * 100
    : null;

  const priceTrendUp = lastAvg > firstAvg;
  const priceTrendDown = lastAvg < firstAvg;
  const bullishVotes = Number(priceTrendUp) + Number(structure === "creciente") + Number(sma50SlopePct !== null && sma50SlopePct > 0);
  const bearishVotes = Number(priceTrendDown) + Number(structure === "decreciente") + Number(sma50SlopePct !== null && sma50SlopePct < 0);
  const direction: PriceAnalysis["direction"] = bullishVotes >= 2 && bullishVotes > bearishVotes
    ? "alcista"
    : bearishVotes >= 2 && bearishVotes > bullishVotes
      ? "bajista"
      : "indefinida";

  const copy = UI_TEXT.table.history.priceAnalysis;
  const directionLabel = direction === "alcista"
    ? copy.directions.bullish
    : direction === "bajista"
      ? copy.directions.bearish
      : copy.directions.neutral;
  const directionDetail = direction === "alcista"
    ? copy.directionDetails.bullish
    : direction === "bajista"
      ? copy.directionDetails.bearish
      : copy.directionDetails.neutral;

  return {
    direction,
    directionLabel,
    directionDetail,
    currentPrice: current,
    upper1: sessionHigh,
    upper2: fiveSessionHigh,
    distanceUpper1Pct: ((sessionHigh - current) / current) * 100,
    distanceUpper2Pct: ((fiveSessionHigh - current) / current) * 100,
    sma50: currentSma,
    sma50SlopePct,
    structure,
  };
}

export function CompanyHistoryChart({ points, bars, metric, sessions, className, onPriceAnalysis }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const useBars = metric === "precio" && !!bars && bars.length > 0;
    if (!container || (points.length === 0 && !useBars)) return;

    const mobileViewport = window.matchMedia("(max-width: 639px)");
    // Con velas de Yahoo hay panel de volumen debajo, así que se deja más margen inferior.
    const getScaleMargins = () => mobileViewport.matches
      ? { top: 0.05, bottom: useBars ? 0.25 : 0.05 }
      : { top: 0.2, bottom: useBars ? 0.28 : 0.1 };
    const scaleMargins = getScaleMargins();
    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#94a3b8",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.08)" },
        horzLines: { color: "rgba(148, 163, 184, 0.12)" },
      },
      rightPriceScale: {
        borderColor: "rgba(148, 163, 184, 0.2)",
        scaleMargins,
      },
      localization: { timeFormatter: formatCrosshairTime },
      timeScale: {
        borderColor: "rgba(148, 163, 184, 0.2)",
        timeVisible: true,
        tickMarkFormatter: formatTickMark,
      },
      crosshair: { vertLine: { labelBackgroundColor: "#475569" }, horzLine: { labelBackgroundColor: "#475569" } },
    });
    if (metric === "precio") {
      const allCandles = useBars && bars ? makeBarCandles(bars) : makePriceCandles(points);
      const allSessions = [...new Set(allCandles.map((candle) => candle.session))];
      const visibleSessions = allSessions.slice(-sessions);
      const visibleCandles = allCandles.filter((candle) => visibleSessions.includes(candle.session));

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#22c55e",
        downColor: "#ef4444",
        borderVisible: false,
        wickUpColor: "#22c55e",
        wickDownColor: "#ef4444",
        priceLineVisible: false,
        lastValueVisible: false,
      });
      candleSeries.setData(useBars ? visibleCandles.map(toCandleData) : visibleCandles);

      if (visibleCandles.length > 0) {
        const recentSession = visibleCandles[visibleCandles.length - 1].session;
        // Con velas de Yahoo, los niveles pueden calcularse solo con la sesión regular (ver LEVELS_INCLUDE_EXTENDED_HOURS).
        const levelCandles = useBars && !LEVELS_INCLUDE_EXTENDED_HOURS
          ? allCandles.filter((candle) => !candle.extended)
          : allCandles;
        const candlesOf = (sessionIds: string[]) => levelCandles.filter((candle) => sessionIds.includes(candle.session));
        const recentSessionCandles = candlesOf([recentSession]);
        const recentFiveSessionCandles = candlesOf(allSessions.slice(-5));
        const previousSession = allSessions.length >= 2 ? allSessions[allSessions.length - 2] : undefined;
        const previousSessionCandles = previousSession ? candlesOf([previousSession]) : [];

        const lastBySession = new Map<string, Candle>();
        for (const candle of allCandles) lastBySession.set(candle.session, candle);

        const dailyCloses = useBars ? aggregateSessions(allCandles) : [...lastBySession.values()];
        const analysis = analyzePrice(allCandles, dailyCloses, visibleSessions);
        onPriceAnalysis?.(analysis);
        const dailyCloseIndexes = new Map(dailyCloses.map((candle, index) => [candle.session, index]));
        const makeLevelData = (value: number) => visibleCandles.map(({ time }) => ({ time, value }));

        // Cierre anterior (cierre regular de la sesión previa) y apertura de hoy (primera vela regular), solo con velas de Yahoo.
        // La etiqueta del eje muestra cuánto se aleja el precio actual de cada uno.
        const lastClose = visibleCandles[visibleCandles.length - 1].close;
        const previousClose = useBars && dailyCloses.length >= 2 ? dailyCloses[dailyCloses.length - 2].close : undefined;
        const todayRegularCandles = useBars
          ? allCandles.filter((candle) => candle.session === recentSession && !candle.extended)
          : [];
        const openPrice = todayRegularCandles.length > 0 ? todayRegularCandles[0].open : undefined;
        const changeFrom = (reference: number) => {
          const change = ((lastClose - reference) / reference) * 100;
          return `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`;
        };

        const levels: ChartLevel[] = [
          { title: "SH", value: Math.max(...recentSessionCandles.map((candle) => candle.high)), color: "#f59e0b", includeInOneSessionScale: true },
          { title: "SL", value: Math.min(...recentSessionCandles.map((candle) => candle.low)), color: "#f59e0b", includeInOneSessionScale: true },
          ...(useBars && previousSessionCandles.length > 0
            ? [
                { title: "PH", value: Math.max(...previousSessionCandles.map((candle) => candle.high)), color: "#14b8a6", includeInOneSessionScale: false },
                { title: "PL", value: Math.min(...previousSessionCandles.map((candle) => candle.low)), color: "#14b8a6", includeInOneSessionScale: false },
              ]
            : []),
          { title: "RH", value: Math.max(...recentFiveSessionCandles.map((candle) => candle.high)), color: "#a78bfa", includeInOneSessionScale: false },
          { title: "RL", value: Math.min(...recentFiveSessionCandles.map((candle) => candle.low)), color: "#a78bfa", includeInOneSessionScale: false },
          ...(previousClose !== undefined
            ? [{ title: `CA ${changeFrom(previousClose)}`, value: previousClose, color: "#64748b", includeInOneSessionScale: true, lineStyle: 1 }]
            : []),
          ...(openPrice !== undefined
            ? [{ title: `AP ${changeFrom(openPrice)}`, value: openPrice, color: "#1e3a8a", includeInOneSessionScale: true, lineStyle: 1 }]
            : []),
        ];

        for (const level of levels) {
          const autoscaleInfoProvider: AutoscaleInfoProvider = (getAutoscaleInfo) =>
            sessions === 1 && !level.includeInOneSessionScale ? null : getAutoscaleInfo();
          const line = chart.addSeries(LineSeries, {
            color: level.color,
            lineWidth: 1,
            lineStyle: level.lineStyle ?? 2,
            title: useBars ? level.title : "",
            priceLineVisible: false,
            lastValueVisible: useBars,
            autoscaleInfoProvider,
          });
          line.setData(makeLevelData(level.value));
        }

        if (useBars) {
          // Tendencias: EMA 20 y EMA 50 sobre todas las velas descargadas (el calentamiento no se ve en pantalla).
          for (const ema of EMA_LINES) {
            const values = computeEma(allCandles, ema.length);
            const data = visibleCandles.flatMap(({ time }) => {
              const value = values.get(Number(time));
              return value === undefined ? [] : [{ time, value }];
            });
            if (data.length === 0) continue;
            const line = chart.addSeries(LineSeries, {
              color: ema.color,
              lineWidth: 2,
              priceLineVisible: false,
              lastValueVisible: false,
            });
            line.setData(data);
          }

          const volumeSeries = chart.addSeries(HistogramSeries, {
            priceFormat: { type: "volume" },
            priceScaleId: "volume",
            priceLineVisible: false,
            lastValueVisible: false,
          });
          chart.priceScale("volume").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
          volumeSeries.setData(
            visibleCandles.map((candle) => ({
              time: candle.time,
              value: candle.volume ?? 0,
              color: candle.close >= candle.open ? "rgba(34, 197, 94, 0.35)" : "rgba(239, 68, 68, 0.35)",
            })),
          );
        } else {
          const smaData = visibleCandles.flatMap(({ time, session, close }) => {
            const sessionIndex = dailyCloseIndexes.get(session);
            if (sessionIndex === undefined || sessionIndex < 49) return [];
            const previous49Closes = dailyCloses
              .slice(sessionIndex - 49, sessionIndex)
              .reduce((sum, candle) => sum + candle.close, 0);
            return [{ time, value: (previous49Closes + close) / 50 }];
          });
          if (smaData.length > 0) {
            const sma = chart.addSeries(LineSeries, {
              color: "#38bdf8",
              lineWidth: 2,
              title: UI_TEXT.table.history.priceAnalysis.sma50Title,
              priceLineVisible: false,
              lastValueVisible: false,
            });
            sma.setData(smaData);
          }
        }
      }
    } else {
      onPriceAnalysis?.(null);
      const series = chart.addSeries(LineSeries, {
        color: metric === "rsi" ? "#a78bfa" : metric === "volumen_relativo" ? "#38bdf8" : "#22c55e",
        lineWidth: 2,
        priceLineVisible: false,
      });
      const data = makeIndicatorData(points, metric);
      const dates = [...new Set(data.map((item) => new Date(Number(item.time) * 1000).toISOString().slice(0, 10)))];
      const visibleDates = dates.slice(-sessions);
      series.setData(data.filter((item) => visibleDates.includes(new Date(Number(item.time) * 1000).toISOString().slice(0, 10))));
    }

    chart.timeScale().fitContent();
    const updateScaleMargins = () => {
      chart.priceScale("right").applyOptions({ scaleMargins: getScaleMargins() });
    };
    mobileViewport.addEventListener("change", updateScaleMargins);
    const resizeObserver = new ResizeObserver(() => {
      if (container.clientWidth > 0 && container.clientHeight > 0) {
        chart.applyOptions({ width: container.clientWidth, height: container.clientHeight });
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      mobileViewport.removeEventListener("change", updateScaleMargins);
      chart.remove();
    };
  }, [points, bars, metric, sessions, onPriceAnalysis]);

  return <div ref={containerRef} className={className ?? "h-90 w-full"} />;
}
