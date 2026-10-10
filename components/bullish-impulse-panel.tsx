"use client";

import { useEffect, useState, useTransition } from "react";
import { Activity, ChevronDown, RefreshCw, ShieldCheck } from "lucide-react";
import { Column, DataTable } from "@/components/tables/core/DataTable";
import { CompanyHistoryTrigger } from "@/components/tables/common/company-history-trigger";
import { UI_STYLES } from "@/styles/ui-styles";
import { UI_TEXT } from "@/domain/literales.constantes";
import { BullishSignal } from "@/domain/models/bullish-impulse";
import {
  getBullishImpulseSignals,
  scanBullishImpulseAction,
} from "@/app/actions/search-bullish-impulses";

const SIGNAL_COLUMNS: Column<BullishSignal>[] = [
  {
    header: UI_TEXT.pages.bullishImpulse.columns.company,
    sortValue: (signal) => signal.ticker,
    render: (signal) => (
      <div>
        <div className="font-semibold text-slate-900">{signal.ticker}</div>
        <div className="max-w-48 truncate text-xs text-slate-500">{signal.nombre}</div>
      </div>
    ),
  },
  {
    header: UI_TEXT.pages.bullishImpulse.columns.price,
    sortValue: (signal) => signal.precio,
    render: (signal) => (
      <CompanyHistoryTrigger
        companyId={signal.companyId}
        ticker={signal.ticker}
        companyName={signal.nombre}
        metric="precio"
      >
        {signal.precio.toLocaleString("es-ES", { maximumFractionDigits: 3 })}
      </CompanyHistoryTrigger>
    ),
    cellClassName: "whitespace-nowrap tabular-nums",
  },
  {
    header: UI_TEXT.pages.bullishImpulse.columns.sample,
    sortValue: (signal) => signal.variacionBarraPct,
    render: (signal) => (
      <CompanyHistoryTrigger
        companyId={signal.companyId}
        ticker={signal.ticker}
        companyName={signal.nombre}
        metric="precio"
      >
        <span className={signal.variacionBarraPct >= 0 ? "text-emerald-700" : "text-rose-700"}>
          {signal.variacionBarraPct.toFixed(2)}%
        </span>
      </CompanyHistoryTrigger>
    ),
  },
  {
    header: UI_TEXT.pages.bullishImpulse.columns.relativeVolume,
    sortValue: (signal) => signal.volumenRelativo,
    render: (signal) => signal.volumenRelativo == null ? "—" : `${signal.volumenRelativo.toFixed(2)}×`,
  },
  {
    header: UI_TEXT.pages.bullishImpulse.columns.detected,
    sortValue: (signal) => signal.detectadaEn,
    render: (signal) => new Date(signal.detectadaEn).toLocaleString("es-ES", {
      dateStyle: "short",
      timeStyle: "short",
    }),
    cellClassName: "whitespace-nowrap",
  },
];

export function BullishImpulsePanel() {
  const [signals, setSignals] = useState<BullishSignal[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    getBullishImpulseSignals()
      .then((result) => {
        if (!active) return;
        setSignals(result.signals);
        setMessage(result.error ?? "");
      })
      .catch((error: unknown) => {
        if (!active) return;
        console.error(UI_TEXT.pages.bullishImpulse.errors.loadConsole, error);
        setMessage(UI_TEXT.pages.bullishImpulse.errors.loadUi);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const early = signals.filter((s) => s.tipo === "TEMPRANA");
  const confirmed = signals.filter((s) => s.tipo === "CONFIRMADA");
  const runScan = () => startTransition(async () => {
    const result = await scanBullishImpulseAction();
    setMessage(result.message);
    if (result.success) setSignals(result.signals);
  });
  const fmt = (date: string) => new Date(date).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
  const panel = (title: string, subtitle: string, rows: BullishSignal[]) => (
    <DataTable
      title={title}
      subtitle={`${subtitle}.`}
      data={rows}
      columns={SIGNAL_COLUMNS}
      rowKey={(signal) => `${signal.ticker}-${signal.tipo}-${signal.detectadaEn}`}
      initialPageSize={10}
      pageSizeOptions={[10, 25, 50]}
      emptyMessage={isLoading ? UI_TEXT.pages.bullishImpulse.emptyLoading : UI_TEXT.pages.bullishImpulse.emptyNoSignals}
      mobileRow={(signal, expanded, toggle) => (
        <div className={UI_STYLES.table.mobileRow}>
          <div className="flex items-center justify-between gap-3 py-4">
            <button
              type="button"
              onClick={toggle}
              className="min-w-0 flex-1 text-left"
              aria-expanded={expanded}
            >
              <span className="min-w-0 flex-1">
                <span className={`${UI_STYLES.table.mobileRowTitle} block`}>{signal.ticker}</span>
                <span className="block truncate text-xs text-slate-500">{signal.nombre}</span>
              </span>
            </button>
            <CompanyHistoryTrigger
              companyId={signal.companyId}
              ticker={signal.ticker}
              companyName={signal.nombre}
              metric="precio"
            >
              <span className={`whitespace-nowrap font-medium ${signal.variacionBarraPct >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                {signal.variacionBarraPct.toFixed(2)}%
              </span>
            </CompanyHistoryTrigger>
            <button
              type="button"
              onClick={toggle}
              aria-label={expanded ? UI_TEXT.pages.bullishImpulse.aria.collapseSignal : UI_TEXT.pages.bullishImpulse.aria.expandSignal}
              aria-expanded={expanded}
            >
              <ChevronDown
                className={`${UI_STYLES.table.mobileRowIcon} ${expanded ? "rotate-180" : ""}`}
                size={18}
              />
            </button>
          </div>
          {expanded && (
            <div className={UI_STYLES.table.mobileDetails}>
              <div>
                <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.pages.bullishImpulse.labels.price}</p>
                <CompanyHistoryTrigger
                  companyId={signal.companyId}
                  ticker={signal.ticker}
                  companyName={signal.nombre}
                  metric="precio"
                >
                  {signal.precio.toLocaleString("es-ES", { maximumFractionDigits: 3 })}
                </CompanyHistoryTrigger>
              </div>
              <div>
                <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.pages.bullishImpulse.labels.sampleVariation}</p>
                <CompanyHistoryTrigger
                  companyId={signal.companyId}
                  ticker={signal.ticker}
                  companyName={signal.nombre}
                  metric="precio"
                >
                  <span className={signal.variacionBarraPct >= 0 ? "text-emerald-700" : "text-rose-700"}>
                    {signal.variacionBarraPct.toFixed(2)}%
                  </span>
                </CompanyHistoryTrigger>
              </div>
              <div>
                <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.pages.bullishImpulse.labels.relativeVolume}</p>
                <p className={UI_STYLES.table.mobileValue}>
                  {signal.volumenRelativo == null ? "—" : `${signal.volumenRelativo.toFixed(2)}×`}
                </p>
              </div>
              <div>
                <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.pages.bullishImpulse.labels.detected}</p>
                <p className={UI_STYLES.table.mobileValue}>{fmt(signal.detectadaEn)}</p>
              </div>
              <div className="col-span-2">
                <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.pages.bullishImpulse.labels.reason}</p>
                <p className={UI_STYLES.table.mobileValue}>{signal.motivo}</p>
              </div>
            </div>
          )}
        </div>
      )}
      showMobileSort
    />
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-700">
            <Activity size={16}/> {UI_TEXT.pages.bullishImpulse.badgeStrategy}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{UI_TEXT.pages.bullishImpulse.title}</h1>
          <p className="mt-2 max-w-3xl text-slate-600">{UI_TEXT.pages.bullishImpulse.description}</p>
        </div>
        <button onClick={runScan} disabled={isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"> 
          <RefreshCw size={16} className={isPending ? "animate-spin" : ""}/>
          {isPending ? UI_TEXT.pages.bullishImpulse.recalculating : UI_TEXT.pages.bullishImpulse.recalculateButton}
        </button>
      </header>

      {/* Grid adaptativo: 1 columna en móvil, 3 columnas en escritorio */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        
        {/* 1. Bloque Configuración (Acordeón colapsado en móvil, abierto en escritorio) */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 md:col-span-1">
          <button
            type="button"
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className="flex w-full items-center justify-between text-left md:cursor-default"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <ShieldCheck size={17} /> {UI_TEXT.pages.bullishImpulse.config.title}
            </div>
            <ChevronDown
              size={18}
              className={`text-slate-500 transition-transform md:hidden ${isConfigOpen ? "rotate-180" : ""}`}
            />
          </button>

          <div className={`mt-3 space-y-2 text-sm ${isConfigOpen ? "block" : "hidden md:block"}`}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">{UI_TEXT.pages.bullishImpulse.config.radarCapturesLabel}</span>
              <span className="font-semibold text-slate-900">{UI_TEXT.pages.bullishImpulse.config.radarCapturesValue}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">{UI_TEXT.pages.bullishImpulse.config.signalTypesLabel}</span>
              <span className="font-semibold text-slate-900">{UI_TEXT.pages.bullishImpulse.config.signalTypesValue}</span>
            </div>
          </div>
        </div>

        {/* 2 y 3. Tarjetas divididas 50%-50% en móvil (grid-cols-2), primero Verde y luego Amarilla */}
        <div className="col-span-1 grid grid-cols-2 gap-3 md:col-span-2">
          
          {/* Señales confirmadas (Verde) */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
            <div className="text-sm font-medium text-emerald-900">{UI_TEXT.pages.bullishImpulse.cards.confirmedTitle}</div>
            <div className="mt-2 text-3xl font-bold tabular-nums text-slate-900">{confirmed.length}</div>
          </div>

          {/* Señales tempranas (Amarilla) */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
            <div className="text-sm font-medium text-amber-900">{UI_TEXT.pages.bullishImpulse.cards.earlyTitle}</div>
            <div className="mt-2 text-3xl font-bold tabular-nums text-slate-900">{early.length}</div>
          </div>

        </div>

      </div>

      {message && <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">{message}</div>}
      {panel(UI_TEXT.pages.bullishImpulse.panels.confirmedTitle, UI_TEXT.pages.bullishImpulse.panels.confirmedSubtitle, confirmed)}
      {panel(UI_TEXT.pages.bullishImpulse.panels.earlyTitle, UI_TEXT.pages.bullishImpulse.panels.earlySubtitle, early)}
      <p className="text-xs leading-5 text-slate-500">{UI_TEXT.pages.bullishImpulse.footerNote}</p>
    </div>
  );
}