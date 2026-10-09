"use client";

import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  LineSeries,
  type AutoscaleInfoProvider,
  type UTCTimestamp,
} from "lightweight-charts";
import type { CompanyHistoryPoint } from "@/domain/models/company-history";
import { CompanyHistoryMetric, getCompanyHistoryMetricValue } from "./company-history.types";
import { UI_TEXT } from "@/domain/literales.constantes";

type Props = {
  points: CompanyHistoryPoint[];
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

export function CompanyHistoryChart({ points, metric, sessions, className, onPriceAnalysis }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || points.length === 0) return;

    const mobileViewport = window.matchMedia("(max-width: 639px)");
    const scaleMargins = mobileViewport.matches
      ? { top: 0.05, bottom: 0.05 }
      : { top: 0.2, bottom: 0.1 };
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
      timeScale: { borderColor: "rgba(148, 163, 184, 0.2)", timeVisible: true },
      crosshair: { vertLine: { labelBackgroundColor: "#475569" }, horzLine: { labelBackgroundColor: "#475569" } },
    });
    if (metric === "precio") {
      const allCandles = makePriceCandles(points);
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
      candleSeries.setData(visibleCandles);

      if (visibleCandles.length > 0) {
        const recentSession = visibleCandles[visibleCandles.length - 1].session;
        const recentSessionCandles = visibleCandles.filter((candle) => candle.session === recentSession);
        const recentFiveSessions = new Set(allSessions.slice(-5));
        const recentFiveSessionCandles = allCandles.filter((candle) => recentFiveSessions.has(candle.session));
        const lastBySession = new Map<string, Candle>();
        for (const candle of allCandles) lastBySession.set(candle.session, candle);

        const dailyCloses = [...lastBySession.values()];
        const analysis = analyzePrice(allCandles, dailyCloses, visibleSessions);
        onPriceAnalysis?.(analysis);
        const dailyCloseIndexes = new Map(dailyCloses.map((candle, index) => [candle.session, index]));
        const makeLevelData = (value: number) => visibleCandles.map(({ time }) => ({ time, value }));

        const levels = [
          { value: Math.max(...recentSessionCandles.map((candle) => candle.high)), color: "#f59e0b", includeInOneSessionScale: true },
          { value: Math.min(...recentSessionCandles.map((candle) => candle.low)), color: "#f59e0b", includeInOneSessionScale: true },
          { value: Math.max(...recentFiveSessionCandles.map((candle) => candle.high)), color: "#a78bfa", includeInOneSessionScale: false },
          { value: Math.min(...recentFiveSessionCandles.map((candle) => candle.low)), color: "#a78bfa", includeInOneSessionScale: false },
        ];

        for (const level of levels) {
          const autoscaleInfoProvider: AutoscaleInfoProvider = (getAutoscaleInfo) =>
            sessions === 1 && !level.includeInOneSessionScale ? null : getAutoscaleInfo();
          const line = chart.addSeries(LineSeries, {
            color: level.color,
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
            autoscaleInfoProvider,
          });
          line.setData(makeLevelData(level.value));
        }

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
      chart.priceScale("right").applyOptions({
        scaleMargins: mobileViewport.matches
          ? { top: 0.05, bottom: 0.05 }
          : { top: 0.2, bottom: 0.1 },
      });
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
  }, [points, metric, sessions, onPriceAnalysis]);

  return <div ref={containerRef} className={className ?? "h-[360px] w-full"} />;
}
