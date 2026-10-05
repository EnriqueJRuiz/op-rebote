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

type Props = {
  points: CompanyHistoryPoint[];
  metric: CompanyHistoryMetric;
  sessions: 1 | 5;
  className?: string;
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

export function CompanyHistoryChart({ points, metric, sessions, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || points.length === 0) return;

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
      rightPriceScale: { borderColor: "rgba(148, 163, 184, 0.2)" },
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
        const dailyCloseIndexes = new Map(dailyCloses.map((candle, index) => [candle.session, index]));
        const makeLevelData = (value: number) => visibleCandles.map(({ time }) => ({ time, value }));

        const levels = [
          { title: "SH · Máximo sesión", value: Math.max(...recentSessionCandles.map((candle) => candle.high)), color: "#f59e0b", includeInOneSessionScale: true },
          { title: "SL · Mínimo sesión", value: Math.min(...recentSessionCandles.map((candle) => candle.low)), color: "#f59e0b", includeInOneSessionScale: true },
          { title: "RH · Máximo 5 sesiones", value: Math.max(...recentFiveSessionCandles.map((candle) => candle.high)), color: "#a78bfa", includeInOneSessionScale: false },
          { title: "RL · Mínimo 5 sesiones", value: Math.min(...recentFiveSessionCandles.map((candle) => candle.low)), color: "#a78bfa", includeInOneSessionScale: false },
        ];

        for (const level of levels) {
          const autoscaleInfoProvider: AutoscaleInfoProvider = (getAutoscaleInfo) =>
            sessions === 1 && !level.includeInOneSessionScale ? null : getAutoscaleInfo();
          const line = chart.addSeries(LineSeries, {
            color: level.color,
            lineWidth: 1,
            lineStyle: 2,
            title: level.title,
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
            title: "SMA 50 · cierres muestreados",
            priceLineVisible: false,
            lastValueVisible: false,
          });
          sma.setData(smaData);
        }
      }
    } else {
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
    const resizeObserver = new ResizeObserver(() => {
      if (container.clientWidth > 0 && container.clientHeight > 0) {
        chart.applyOptions({ width: container.clientWidth, height: container.clientHeight });
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [points, metric, sessions]);

  return <div ref={containerRef} className={className ?? "h-[360px] w-full"} />;
}
