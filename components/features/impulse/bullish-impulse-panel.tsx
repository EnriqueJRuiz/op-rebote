"use client";

import { useEffect, useState, useTransition } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { UI_TEXT } from "@/domain/literales.constantes";
import { BullishSignal } from "@/domain/models/bullish-impulse";
import {
  getBullishImpulseSignals,
  scanBullishImpulseAction,
} from "@/app/actions/search-bullish-impulses";
import { getBullishImpulseColumns } from "./bullish-impulse-columns";
import { renderBullishMobileRow } from "./bullish-impulse-mobile-row";
import { BullishImpulseConfig } from "./bullish-impulse-config";
import { DataTable } from "@/components/ui/core/data-table";

export function BullishImpulsePanel() {
  const [signals, setSignals] = useState<BullishSignal[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Cargar señales al montar el componente
  useEffect(() => {
    let active = true;
    getBullishImpulseSignals()
      .then((signalsResult) => {
        if (!active) return;
        setSignals(signalsResult.signals);
        setMessage(signalsResult.error ?? "");
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

  const runScan = () =>
    startTransition(async () => {
      const result = await scanBullishImpulseAction();
      setMessage(result.message);
      if (result.success) setSignals(result.signals);
    });

  const early = signals.filter((s) => s.tipo === "TEMPRANA");
  const confirmed = signals.filter((s) => s.tipo === "CONFIRMADA");
  const columns = getBullishImpulseColumns();

  const renderTable = (title: string, subtitle: string, rows: BullishSignal[]) => (
    <DataTable
      title={title}
      subtitle={subtitle}
      data={rows}
      columns={columns}
      rowKey={(signal) => `${signal.ticker}-${signal.tipo}-${signal.detectadaEn}`}
      initialPageSize={10}
      pageSizeOptions={[10, 25, 50]}
      emptyMessage={
        isLoading
          ? UI_TEXT.pages.bullishImpulse.emptyLoading
          : UI_TEXT.pages.bullishImpulse.emptyNoSignals
      }
      mobileRow={(signal, expanded, toggle) =>
        renderBullishMobileRow(signal, expanded, toggle)
      }
      showMobileSort
    />
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-700">
            <Activity size={16} /> {UI_TEXT.pages.bullishImpulse.badgeStrategy}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {UI_TEXT.pages.bullishImpulse.title}
          </h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            {UI_TEXT.pages.bullishImpulse.description}
          </p>
        </div>
        <button
          onClick={runScan}
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          <RefreshCw size={16} className={isPending ? "animate-spin" : ""} />
          {isPending
            ? UI_TEXT.pages.bullishImpulse.recalculating
            : UI_TEXT.pages.bullishImpulse.recalculateButton}
        </button>
      </header>

      {/* Grid adaptativo */}
      <BullishImpulseConfig
        isConfigOpen={isConfigOpen}
        setIsConfigOpen={setIsConfigOpen}
        confirmedCount={confirmed.length}
        earlyCount={early.length}
      />

      {message && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
          {message}
        </div>
      )}

      {renderTable(
        UI_TEXT.pages.bullishImpulse.panels.confirmedTitle,
        UI_TEXT.pages.bullishImpulse.panels.confirmedSubtitle,
        confirmed
      )}
      {renderTable(
        UI_TEXT.pages.bullishImpulse.panels.earlyTitle,
        UI_TEXT.pages.bullishImpulse.panels.earlySubtitle,
        early
      )}

      <p className="text-xs leading-5 text-slate-500">{UI_TEXT.pages.bullishImpulse.footerNote}</p>
    </div>
  );
}