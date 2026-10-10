"use client";

import { useEffect, useState, useTransition } from "react";
import { Activity, ChevronDown, RefreshCw, ShieldCheck } from "lucide-react";
import { Column, DataTable } from "@/components/tables/core/DataTable";
import { CompanyHistoryTrigger } from "@/components/tables/common/company-history-trigger";
import { UI_STYLES } from "@/styles/ui-styles";
import { BullishSignal } from "@/domain/models/bullish-impulse";
import {
  getBullishImpulseSignals,
  scanBullishImpulseAction,
} from "@/app/actions/search-bullish-impulses";

const SIGNAL_COLUMNS: Column<BullishSignal>[] = [
  {
    header: "Empresa",
    sortValue: (signal) => signal.ticker,
    render: (signal) => (
      <div>
        <div className="font-semibold text-slate-900">{signal.ticker}</div>
        <div className="max-w-48 truncate text-xs text-slate-500">{signal.nombre}</div>
      </div>
    ),
  },
  {
    header: "Precio",
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
    header: "Muestra",
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
    header: "Volumen rel.",
    sortValue: (signal) => signal.volumenRelativo,
    render: (signal) => signal.volumenRelativo == null ? "—" : `${signal.volumenRelativo.toFixed(2)}×`,
  },
  {
    header: "Detectada",
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
        console.error("No se pudieron cargar las señales de Impulso Alcista:", error);
        setMessage("No se pudieron cargar las señales. Inténtalo de nuevo.");
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
      subtitle={`${subtitle} ${rows.length} señales recientes.`}
      data={rows}
      columns={SIGNAL_COLUMNS}
      rowKey={(signal) => `${signal.ticker}-${signal.tipo}-${signal.detectadaEn}`}
      initialPageSize={10}
      pageSizeOptions={[10, 25, 50]}
      emptyMessage={isLoading ? "Cargando señales…" : "No hay señales detectadas en las muestras recientes."}
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
              aria-label={expanded ? "Contraer señal" : "Ampliar señal"}
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
                <p className={UI_STYLES.table.mobileLabel}>Precio</p>
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
                <p className={UI_STYLES.table.mobileLabel}>Variación de la muestra</p>
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
                <p className={UI_STYLES.table.mobileLabel}>Volumen relativo</p>
                <p className={UI_STYLES.table.mobileValue}>
                  {signal.volumenRelativo == null ? "—" : `${signal.volumenRelativo.toFixed(2)}×`}
                </p>
              </div>
              <div>
                <p className={UI_STYLES.table.mobileLabel}>Detectada</p>
                <p className={UI_STYLES.table.mobileValue}>{fmt(signal.detectadaEn)}</p>
              </div>
              <div className="col-span-2">
                <p className={UI_STYLES.table.mobileLabel}>Motivo</p>
                <p className={UI_STYLES.table.mobileValue}>{signal.motivo}</p>
              </div>
            </div>
          )}
        </div>
      )}
      showMobileSort
    />
  );
  return <div className="space-y-6">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-700"><Activity size={16}/> Estrategia independiente</div><h1 className="text-3xl font-bold tracking-tight text-slate-900">Impulso Alcista</h1><p className="mt-2 max-w-3xl text-slate-600">Analiza las muestras intradía que ya guarda el escaneo de Empresas Radar. No realiza consultas adicionales a Yahoo ni modifica las reglas de Rebotes.</p></div><button onClick={runScan} disabled={isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"> <RefreshCw size={16} className={isPending ? "animate-spin" : ""}/>{isPending ? "Recalculando señales…" : "Recalcular señales"}</button></header>
    <div className="grid gap-3 md:grid-cols-3"><div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-sm text-slate-500">Frecuencia de muestras</div><div className="mt-1 text-xl font-semibold">Cada 10 minutos</div><div className="mt-1 text-xs text-slate-500">Se usan las horas reales de cada registro guardado.</div></div><div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-sm text-slate-500">Tipos de alerta</div><div className="mt-1 text-xl font-semibold">Temprana + confirmada</div><div className="mt-1 text-xs text-slate-500">Reglas independientes entre sí.</div></div><div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-sm text-slate-500">Historial compartido</div><div className="mt-1 flex items-center gap-2 text-xl font-semibold"><ShieldCheck size={20}/> Una sola consulta</div><div className="mt-1 text-xs text-slate-500">Las señales se calculan desde el historial del radar.</div></div></div>
    {message && <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">{message}</div>}
    {panel("Señales tempranas", "Primer indicio de impulso; mayor probabilidad de falsas señales.", early)}
    {panel("Señales confirmadas", "Ruptura de máximos recientes acompañada de volumen.", confirmed)}
    <p className="text-xs leading-5 text-slate-500">Las velas representan la variación entre muestras guardadas; no incluyen máximos o mínimos ocurridos entre escaneos. Las reglas son una primera versión técnica, no una recomendación automática de compra.</p>
  </div>;
}
