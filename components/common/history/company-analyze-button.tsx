"use client";

import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { CompanyHistoryDialog } from "./company-history-dialog";

interface CompanyAnalyzeButtonProps {
  companyId: number;
  ticker: string;
  companyName: string;
  currency?: string;
}

/** Abre el mismo análisis histórico que antes se abría desde el icono del ojo. */
export function CompanyAnalyzeButton({
  companyId,
  ticker,
  companyName,
  currency,
}: CompanyAnalyzeButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
        aria-label={`Analizar ${ticker}`}
      >
        <BarChart3 size={16} aria-hidden="true" />
        Analizar
      </button>
      {open && (
        <CompanyHistoryDialog
          companyId={companyId}
          ticker={ticker}
          companyName={companyName}
          currency={currency}
          initialMetric="precio"
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
