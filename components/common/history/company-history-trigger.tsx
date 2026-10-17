"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { UI_TEXT } from "@/domain/literales.constantes";
import { COMPANY_HISTORY_METRICS, CompanyHistoryMetric } from "./company-history.types";
import { CompanyHistoryDialog } from "./company-history-dialog";
import { TradingViewDialog } from "@/components/common/tradingview/tradingview-dialog";
import { CompanyCompareDialog } from "@/components/features/companies/dialog/company-compare-dialog";

interface CompanyHistoryTriggerProps {
  companyId?: number;
  ticker: string;
  companyName: string;
  currency?: string;
  metric: CompanyHistoryMetric;
  children: React.ReactNode;
  showEye?: boolean; // Parámetro opcional para mostrar u ocultar el ojo
}

export function CompanyHistoryTrigger({
  companyId,
  ticker,
  companyName,
  currency,
  metric,
  children,
  showEye = true, // Por defecto se muestra si no se indica lo contrario
}: CompanyHistoryTriggerProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [tradingViewOpen, setTradingViewOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const metricLabel = COMPANY_HISTORY_METRICS.find((item) => item.key === metric)?.label ?? metric;
  const clickable = companyId !== undefined;
  
  const priceOpensTradingView = metric === "precio";
  const open = () => {
    if (!priceOpensTradingView) setHistoryOpen(true);
    else if (window.matchMedia("(min-width: 1024px)").matches) setCompareOpen(true);
    else setTradingViewOpen(true);
  };
  const label = priceOpensTradingView ? UI_TEXT.table.history.openTradingView : `Ver gráfico de ${metricLabel}`;

  const trigger = (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? `${label} de ${ticker}` : undefined}
      onClick={clickable ? open : undefined}
      onKeyDown={clickable ? (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      } : undefined}
      className={clickable
        ? "inline-flex cursor-pointer rounded-sm text-left hover:decoration-teal-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
        : "inline-flex"}
      title={clickable ? label : undefined}
    >
      {children}
    </div>
  );

  return (
    <>
      {priceOpensTradingView && clickable && showEye ? (
        <span className="inline-flex items-center gap-1.5">
          {trigger}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setHistoryOpen(true);
            }}
            aria-label={`${UI_TEXT.table.history.openScanHistory} de ${ticker}`}
            title={UI_TEXT.table.history.openScanHistory}
            className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
          >
            <Eye size={15} aria-hidden="true" />
          </button>
        </span>
      ) : (
        trigger
      )}
      {historyOpen && clickable && (
        <CompanyHistoryDialog
          companyId={companyId}
          ticker={ticker}
          companyName={companyName}
          currency={currency}
          initialMetric={metric}
          onClose={() => setHistoryOpen(false)}
        />
      )}
      {tradingViewOpen && clickable && (
        <TradingViewDialog
          ticker={ticker}
          companyName={companyName}
          onClose={() => setTradingViewOpen(false)}
        />
      )}
      {compareOpen && clickable && (
        <CompanyCompareDialog
          ticker={ticker}
          companyName={companyName}
          onClose={() => setCompareOpen(false)}
        />
      )}
    </>
  );
}