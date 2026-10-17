"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getCompanyIntradayAction } from "@/app/actions/get-company-intraday";
import { UI_TEXT } from "@/domain/literales.constantes";
import type { CompanyHistoryPoint } from "@/domain/models/company-history";
import type { IntradayBar } from "@/domain/models/intraday";
import { TradingViewChart } from "../../../common/tradingview/tradingview-chart";

const CompanyHistoryChart = dynamic(
  () => import("@/components/common/history/company-history-chart").then((mod) => mod.CompanyHistoryChart),
  { loading: () => <div className="h-full w-full animate-pulse rounded-lg bg-slate-100" /> }
);

// Referencia estable: el gráfico se vuelve a crear cuando cambian sus props.
const NO_POINTS: CompanyHistoryPoint[] = [];
const SESSION_OPTIONS = [1, 5] as const;

interface CompanyCompareDialogProps {
  ticker: string;
  companyName: string;
  onClose: () => void;
}

// Vista solo de escritorio: gráfico de TradingView y gráfico propio (velas de Yahoo) lado a lado,
// con el mismo tamaño e intervalo (5 min) para contrastar niveles y medias de un vistazo.
export function CompanyCompareDialog({ ticker, companyName, onClose }: CompanyCompareDialogProps) {
  const [bars, setBars] = useState<IntradayBar[] | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [sessions, setSessions] = useState<1 | 5>(5);
  const copy = UI_TEXT.table.history;

  useEffect(() => {
    let active = true;
    getCompanyIntradayAction(ticker)
      .then((result) => {
        if (!active) return;
        if (result.bars && result.bars.length > 0) {
          setBars(result.bars);
          setStatus("ready");
        } else {
          setStatus("error");
        }
      })
      .catch((requestError: unknown) => {
        console.error("Falló la petición de velas de Yahoo:", requestError);
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [ticker]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="compare-dialog-title"
        className="flex h-[min(90dvh,920px)] w-full max-w-[110rem] flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-3">
          <h2 id="compare-dialog-title" className="min-w-0 flex-1 truncate text-2xl font-bold text-slate-900">
            {companyName} <span className="text-sm font-medium text-slate-500">({ticker})</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.close}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-2 gap-4 p-4">
          <div className="flex min-h-0 flex-col">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{copy.compare.tradingView}</p>
            <div className="min-h-0 flex-1 rounded-xl border border-slate-100 bg-white p-1">
              <TradingViewChart ticker={ticker} className="h-full w-full" />
            </div>
          </div>

          <div className="flex min-h-0 flex-col">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{copy.compare.own}</p>
            <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-100 bg-white p-1">
              <div className="min-h-0 flex-1">
                {status === "loading" && (
                  <p role="status" className="py-24 text-center text-sm text-slate-500">{copy.loading}</p>
                )}
                {status === "error" && (
                  <p role="alert" className="py-24 text-center text-sm text-rose-700">{copy.compare.error}</p>
                )}
                {status === "ready" && bars && (
                  <CompanyHistoryChart points={NO_POINTS} bars={bars} metric="precio" sessions={sessions} className="h-full w-full" />
                )}
              </div>
              {/* Botones de periodo con el estilo de los del widget de TradingView (1D, 5D). Misma altura que su barra inferior. */}
              <div
                role="group"
                aria-label={copy.compare.rangeLabel}
                className="flex h-8 shrink-0 items-center gap-1 px-1"
              >
                {SESSION_OPTIONS.map((count) => (
                  <button
                    key={count}
                    type="button"
                    aria-pressed={sessions === count}
                    onClick={() => setSessions(count)}
                    className={`rounded px-2 py-0.5 text-xs font-medium transition ${
                      sessions === count
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    {count}D
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {status === "ready" && (
          <footer className="flex flex-wrap gap-x-5 gap-y-1 border-t border-slate-200 px-5 py-2 text-xs leading-tight text-slate-600">
            <span><span className="font-semibold text-amber-600">SH / SL</span> {copy.priceAnalysis.legendSessionRange}</span>
            <span><span className="font-semibold text-teal-600">PH / PL</span> {copy.priceAnalysis.legendPrevSessionRange}</span>
            <span><span className="font-semibold text-violet-500">RH / RL</span> {copy.priceAnalysis.legendFiveSessionRange}</span>
            <span><span className="font-semibold text-slate-500">CA</span> / <span className="font-semibold text-blue-900">AP</span> {copy.priceAnalysis.legendPrevCloseOpen}</span>
            <span><span className="font-semibold text-sky-500">EMA 20</span> {copy.priceAnalysis.legendEma20}</span>
            <span><span className="font-semibold text-pink-500">EMA 50</span> {copy.priceAnalysis.legendEma50}</span>
          </footer>
        )}
      </section>
    </div>
  );
}
