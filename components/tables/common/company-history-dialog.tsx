"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getCompanyHistoryAction } from "@/app/actions/get-company-history";
import { UI_TEXT } from "@/domain/literales.constantes";
import {
  COMPANY_HISTORY_METRICS,
  CompanyHistoryMetric,
  getCompanyHistoryMetricValue,
} from "./company-history.types";
import { CompanyHistoryPoint } from "@/domain/models/company-history";

const CompanyHistoryChart = dynamic(
  () => import("./company-history-chart").then((module) => module.CompanyHistoryChart),
  { loading: () => <div className="h-[min(65vh,620px)] min-h-[320px] animate-pulse rounded-lg bg-slate-100" /> }
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
  initialMetric,
  onClose,
}: CompanyHistoryDialogProps) {
  const [points, setPoints] = useState<CompanyHistoryPoint[] | null>(null);
  const [sessionCount, setSessionCount] = useState<1 | 5>(5);
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
  const validPoints = points?.filter((point) => {
    const weekday = new Date(point.timestamp).getUTCDay();
    return weekday !== 0 && weekday !== 6;
  }) ?? [];
  const metricPoints = validPoints.filter((point) => {
    const value = getCompanyHistoryMetricValue(point, initialMetric);
    return typeof value === "number" && Number.isFinite(value);
  });
  const sessionDates = [...new Set(metricPoints.map((point) => point.timestamp.slice(0, 10)))];
  const visibleSessionDates = new Set(sessionDates.slice(-sessionCount));
  const visiblePoints = metricPoints.filter((point) => visibleSessionDates.has(point.timestamp.slice(0, 10)));
  const estimatedCandleCount = new Set(
    visiblePoints.map((point) => Math.floor(Date.parse(point.timestamp) / 1_800_000))
  ).size;
  const priceSessionCount = new Set(
    validPoints
      .filter((point) => typeof point.precio === "number" && point.precio > 0)
      .map((point) => point.timestamp.slice(0, 10))
  ).size;

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
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{ticker}</p>
            <h2 id="company-history-title" className="mt-1 truncate text-xl font-bold text-slate-900 sm:text-2xl">
              {companyName}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{UI_TEXT.table.history.sessionsDescription}</p>
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-base font-semibold text-slate-700">{selectedMetric.label}</p>
            {initialMetric === "precio" && (
              <label className="flex items-center gap-2 text-sm text-slate-600">
                Periodo
                <select
                  value={sessionCount}
                  onChange={(event) => setSessionCount(event.target.value === "1" ? 1 : 5)}
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-700"
                >
                  <option value={1}>1 sesión</option>
                  <option value={5}>5 sesiones</option>
                </select>
              </label>
            )}
          </div>

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
              <div className="mt-5 rounded-xl border border-slate-100 bg-white p-2">
                <CompanyHistoryChart
                  points={metricPoints}
                  metric={initialMetric}
                  sessions={sessionCount}
                  className="h-[min(65vh,620px)] min-h-[320px] w-full"
                />
              </div>
              {initialMetric === "precio" && (
                <>
                  <p role="status" className="mt-4 text-sm text-amber-700">
                    Velas aproximadas a partir de las muestras del escaneo; los máximos y mínimos ocurridos entre escaneos no están disponibles.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                    <span><span className="font-semibold text-amber-600">SH / SL</span> Máximo / mínimo de la sesión</span>
                    <span><span className="font-semibold text-violet-500">RH / RL</span> Máximo / mínimo de 5 sesiones</span>
                    <span><span className="font-semibold text-sky-500">SMA 50</span> Media sobre la última muestra de cada sesión</span>
                  </div>
                  {priceSessionCount < 50 && (
                    <p role="status" className="mt-2 text-sm text-amber-700">
                      La SMA 50 aparecerá cuando haya 50 sesiones con datos; ahora hay {priceSessionCount}.
                    </p>
                  )}
                  {sessionCount === 1 && (
                    <p className="mt-2 text-sm text-slate-500">
                      En la vista de 1 sesión, el eje de precio se ajusta al movimiento del día; RH/RL quedan fuera del autoajuste si están lejos del rango diario.
                    </p>
                  )}
                  <p className="mt-4 text-sm text-slate-500">
                    {estimatedCandleCount} velas aproximadas · {UI_TEXT.table.history.sampleCount(visiblePoints.length)}
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
