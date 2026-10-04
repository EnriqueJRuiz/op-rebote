"use client";

import { useEffect, useRef } from "react";
import {
  AreaSeries,
  ColorType,
  createChart,
  CrosshairMode,
  type AreaData,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import { CompanyHistoryMetric, getCompanyHistoryMetricValue } from "./company-history.types";
import { CompanyHistoryPoint } from "@/domain/models/company-history";

interface CompanyHistoryChartProps {
  points: CompanyHistoryPoint[];
  metric: CompanyHistoryMetric;
  currency?: string;
  unit: string;
}

export function CompanyHistoryChart({ points, metric, currency, unit }: CompanyHistoryChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const values = points
      .map((point) => ({
        time: (Date.parse(point.timestamp) / 1000) as UTCTimestamp,
        value: getCompanyHistoryMetricValue(point, metric),
      }))
      .filter((point): point is { time: UTCTimestamp; value: number } =>
        Number.isFinite(point.time) && typeof point.value === "number" && Number.isFinite(point.value)
      )
      .sort((first, second) => first.time - second.time);

    const uniqueValues = values.filter((point, index) => point.time !== values[index - 1]?.time);
    if (uniqueValues.length === 0) return;

    const positive = uniqueValues[uniqueValues.length - 1].value >= uniqueValues[0].value;
    const color = positive ? "#059669" : "#e11d48";
    const chart = createChart(container, {
      width: container.clientWidth,
      height: 300,
      layout: {
        background: { type: ColorType.Solid, color: "#ffffff" },
        textColor: "#64748b",
        fontFamily: "Arial, sans-serif",
        attributionLogo: true,
      },
      grid: {
        vertLines: { color: "#f1f5f9" },
        horzLines: { color: "#f1f5f9" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "#e2e8f0" },
      timeScale: { borderColor: "#e2e8f0", timeVisible: true, secondsVisible: false },
      localization: {
        locale: "es-ES",
        priceFormatter: (value: number) => {
          const formatted = value.toLocaleString("es-ES", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          const isCurrencyMetric = ["precio", "capitalizacion", "minimo_reciente", "sma200", "precio_anterior"].includes(metric);
          return currency && isCurrencyMetric
            ? `${formatted} ${currency}`
            : `${formatted}${unit}`;
        },
      },
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: color,
      topColor: positive ? "rgba(5, 150, 105, 0.28)" : "rgba(225, 29, 72, 0.28)",
      bottomColor: positive ? "rgba(5, 150, 105, 0.02)" : "rgba(225, 29, 72, 0.02)",
      lineWidth: 2,
      priceLineVisible: false,
    });
    series.setData(uniqueValues as AreaData<Time>[]);
    chart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver(() => {
      if (container.clientWidth > 0) chart.applyOptions({ width: container.clientWidth });
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [points, metric, currency, unit]);

  return <div ref={containerRef} className="h-[300px] w-full" />;
}
