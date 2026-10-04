"use client";

import { useState } from "react";
import { COMPANY_HISTORY_METRICS, CompanyHistoryMetric } from "./company-history.types";
import { CompanyHistoryDialog } from "./company-history-dialog";

interface CompanyHistoryTriggerProps {
  companyId?: number;
  ticker: string;
  companyName: string;
  currency?: string;
  metric: CompanyHistoryMetric;
  children: React.ReactNode;
}

export function CompanyHistoryTrigger({
  companyId,
  ticker,
  companyName,
  currency,
  metric,
  children,
}: CompanyHistoryTriggerProps) {
  const [open, setOpen] = useState(false);
  const metricLabel = COMPANY_HISTORY_METRICS.find((item) => item.key === metric)?.label ?? metric;

  return (
    <>
      <div
        role={companyId !== undefined ? "button" : undefined}
        tabIndex={companyId !== undefined ? 0 : undefined}
        aria-label={companyId !== undefined ? `Ver gráfico de ${metricLabel} de ${ticker}` : undefined}
        onClick={companyId !== undefined ? () => setOpen(true) : undefined}
        onKeyDown={companyId !== undefined ? (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(true);
          }
        } : undefined}
        className={companyId !== undefined
          ? "inline-flex cursor-pointer rounded-sm text-left hover:decoration-teal-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
          : "inline-flex"}
        title={companyId !== undefined ? `Ver gráfico de ${metricLabel}` : undefined}
      >
        {children}
      </div>
      {open && companyId !== undefined && (
        <CompanyHistoryDialog
          companyId={companyId}
          ticker={ticker}
          companyName={companyName}
          currency={currency}
          initialMetric={metric}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
