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
  { loading: () => <div className="h-[300px] animate-pulse rounded-lg bg-slate-100" /> }
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getCompanyHistoryAction(companyId)
      .then((result) => {
        if (!active) return;
        if (result.error) {
          setError(result.error);
        } else {
          setPoints(result.points ?? []);
        }
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
  });
  const metricPoints = validPoints?.filter((point) => {
    const value = getCompanyHistoryMetricValue(point, initialMetric);
    return typeof value === "number" && Number.isFinite(value);
  }) ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="company-history-title"
        className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{ticker}</p>
            <h2 id="company-history-title" className="mt-1 truncate text-lg font-bold text-slate-900">
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

        <div className="p-5">
          <p className="text-sm font-semibold text-slate-700">{selectedMetric.label}</p>

          {error ? (
            <p role="alert" className="py-16 text-center text-sm text-rose-700">{error}</p>
          ) : points === null ? (
            <p role="status" className="py-16 text-center text-sm text-slate-500">
              {UI_TEXT.table.history.loading}
            </p>
          ) : metricPoints.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-500">{UI_TEXT.table.history.noData}</p>
          ) : (
            <>
              <div className="mt-5 rounded-xl border border-slate-100 bg-white p-2">
                <CompanyHistoryChart
                  points={metricPoints}
                  metric={initialMetric}
                  currency={currency}
                  unit={selectedMetric.unit}
                />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                {UI_TEXT.table.history.sampleCount(metricPoints.length)}
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
