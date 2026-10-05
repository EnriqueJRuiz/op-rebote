"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { getCompanyHistoryAction } from "@/app/actions/get-company-history";
import { UI_TEXT } from "@/domain/literales.constantes";
import {
  COMPANY_HISTORY_METRICS,
  CompanyHistoryMetric,
  getCompanyHistoryMetricValue,
} from "./company-history.types";
import { CompanyHistoryPoint } from "@/domain/models/company-history";
import type { PriceAnalysis } from "./company-history-chart";

const CompanyHistoryChart = dynamic(
  () => import("./company-history-chart").then((module) => module.CompanyHistoryChart),
  { loading: () => <div className="h-[min(65vh,620px)] min-h-80 animate-pulse rounded-lg bg-slate-100" /> }
);

export interface CompanyHistoryDialogProps {
  companyId: number;
  ticker: string;
  companyName: string;
  currency?: string;
  initialMetric: CompanyHistoryMetric;
  onClose: () => void;
}

export function CompanyHistoryDialog({
  companyId,
  ticker,
  companyName,
  currency,
  initialMetric,
  onClose,
}: CompanyHistoryDialogProps) {
  const [points, setPoints] = useState<CompanyHistoryPoint[] | null>(null);
  const [sessionCount, setSessionCount] = useState<1 | 5>(5);
  const [priceAnalysis, setPriceAnalysis] = useState<PriceAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getCompanyHistoryAction(companyId)
      .then((result) => {
        if (!active) return;
        if (result.error) setError(result.error);
        else setPoints(result.points ?? []);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        console.error("Falló la petición del historial de la empresa:", requestError);
        setError("No se pudo cargar el historial. Inténtalo de nuevo.");
      });
    return () => {
      active = false;
    };
  }, [companyId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const selectedMetric = COMPANY_HISTORY_METRICS.find((item) => item.key === initialMetric)!;
  const validPoints = useMemo(
    () => points?.filter((point) => {
      const weekday = new Date(point.timestamp).getUTCDay();
      return weekday !== 0 && weekday !== 6;
    }) ?? [],
    [points]
  );
  const metricPoints = useMemo(
    () => validPoints.filter((point) => {
      const value = getCompanyHistoryMetricValue(point, initialMetric);
      return typeof value === "number" && Number.isFinite(value);
    }),
    [validPoints, initialMetric]
  );
  const sessionDates = [...new Set(metricPoints.map((point) => point.timestamp.slice(0, 10)))];
  const visibleSessionDates = new Set(sessionDates.slice(-sessionCount));
  const visiblePoints = metricPoints.filter((point) => visibleSessionDates.has(point.timestamp.slice(0, 10)));
  const latestPricePoint = [...validPoints]
    .reverse()
    .find((point) => typeof point.precio === "number" && point.precio > 0);
  const latestPrice = latestPricePoint?.precio;
  const formattedLatestPrice = latestPrice == null
    ? null
    : `${latestPrice.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${currency ? ` ${currency}` : ""}`;
  const latestPriceTime = latestPricePoint
    ? new Date(latestPricePoint.timestamp).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-2 backdrop-blur-sm sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="company-history-title"
        className="max-h-[calc(100dvh-1rem)] w-full max-w-6xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3">
            <h2 id="company-history-title" className="min-w-0 truncate text-xl font-bold text-slate-900 sm:text-2xl">
              {companyName} <span className="text-sm font-medium text-slate-500">({ticker})</span>
            </h2>
            {initialMetric === "precio" && (
              <label className="flex shrink-0 items-center gap-2 text-sm text-slate-600">
                {UI_TEXT.table.history.period}
                <select
                  value={sessionCount}
                  onChange={(event) => setSessionCount(event.target.value === "1" ? 1 : 5)}
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-700"
                >
                  <option value={1}>{UI_TEXT.table.history.oneSession}</option>
                  <option value={5}>{UI_TEXT.table.history.fiveSessions}</option>
                </select>
              </label>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={UI_TEXT.table.history.close}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="p-4 sm:p-7">
          {error ? (
            <p role="alert" className="py-16 text-center text-sm text-rose-700">{error}</p>
          ) : points === null ? (
            <p role="status" className="py-16 text-center text-sm text-slate-500">
              {UI_TEXT.table.history.loading}
            </p>
          ) : visiblePoints.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-500">{UI_TEXT.table.history.noData}</p>
          ) : (
            <>
              {initialMetric === "precio" && priceAnalysis && (
                <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                  <div className="flex w-full flex-wrap items-center gap-x-2 gap-y-1">
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      priceAnalysis.direction === "alcista"
                        ? "bg-emerald-100 text-emerald-700"
                        : priceAnalysis.direction === "bajista"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700"
                    }`}>
                      {priceAnalysis.directionLabel}
                    </span>
                    <span className="shrink-0 font-semibold text-slate-700">
                      {UI_TEXT.table.history.priceAnalysis.period(sessionCount)}
                    </span>
                    <span className="shrink-0 text-slate-500">
                      {UI_TEXT.table.history.priceAnalysis.structure}: <strong className="text-slate-700">{priceAnalysis.structure}</strong>
                    </span>
                    <span className="min-w-0 flex-1 basis-full text-left text-slate-500 sm:basis-auto sm:text-right">
                      {priceAnalysis.directionDetail}
                    </span>
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-md bg-white px-3 py-2">
                      <div className="flex items-baseline justify-between gap-2 whitespace-nowrap">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          {UI_TEXT.table.history.priceAnalysis.priceLastSearch}
                          {latestPriceTime && <span className="ml-1 font-normal normal-case">{UI_TEXT.table.history.priceAnalysis.lastSearchTime(latestPriceTime)}</span>}
                        </span>
                        <strong className="whitespace-nowrap text-xs text-slate-800">{formattedLatestPrice ?? priceAnalysis.currentPrice.toFixed(2)}</strong>
                      </div>
                    </div>
                    <div className="rounded-md bg-white px-3 py-2">
                      <div className="flex items-baseline justify-between gap-2 whitespace-nowrap">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{UI_TEXT.table.history.priceAnalysis.sessionRange}</span>
                        <strong className="whitespace-nowrap text-xs text-slate-800">
                          {priceAnalysis.distanceUpper1Pct >= 0 ? "+" : ""}{priceAnalysis.distanceUpper1Pct.toFixed(2)}%
                        </strong>
                      </div>
                    </div>
                    <div className="rounded-md bg-white px-3 py-2">
                      <div className="flex items-baseline justify-between gap-2 whitespace-nowrap">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{UI_TEXT.table.history.priceAnalysis.fiveSessionRange}</span>
                        <strong className="whitespace-nowrap text-xs text-slate-800">
                          {priceAnalysis.distanceUpper2Pct >= 0 ? "+" : ""}{priceAnalysis.distanceUpper2Pct.toFixed(2)}%
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {initialMetric !== "precio" && (
                <p className="mb-3 text-sm font-semibold text-slate-700">{selectedMetric.label}</p>
              )}
              <div className="mt-5 rounded-xl border border-slate-100 bg-white p-2">
                <CompanyHistoryChart
                  points={metricPoints}
                  metric={initialMetric}
                  sessions={sessionCount}
                  onPriceAnalysis={setPriceAnalysis}
                  className="h-[min(65vh,620px)] min-h-80 w-full"
                />
              </div>
              {initialMetric === "precio" && (
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                  <span><span className="font-semibold text-amber-600">SH / SL</span> {UI_TEXT.table.history.priceAnalysis.legendSessionRange}</span>
                  <span><span className="font-semibold text-violet-500">RH / RL</span> {UI_TEXT.table.history.priceAnalysis.legendFiveSessionRange}</span>
                  <span><span className="font-semibold text-sky-500">SMA 50</span> {UI_TEXT.table.history.priceAnalysis.legendSma50}</span>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
