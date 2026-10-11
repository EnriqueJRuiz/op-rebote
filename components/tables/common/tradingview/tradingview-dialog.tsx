"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { UI_TEXT } from "@/domain/literales.constantes";
import { TradingViewChart } from "./tradingview-chart";

interface TradingViewDialogProps {
  ticker: string;
  companyName: string;
  onClose: () => void;
}

export function TradingViewDialog({ ticker, companyName, onClose }: TradingViewDialogProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

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
        aria-labelledby="tradingview-dialog-title"
        className="max-h-[calc(100dvh-1rem)] w-full max-w-6xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)]"
      >
        <header className="flex items-start justify-between gap-2 border-b border-slate-200 px-3 py-2 sm:gap-4 sm:px-5 sm:py-4">
          <h2 id="tradingview-dialog-title" className="min-w-0 flex-1 truncate text-xl font-bold text-slate-900 sm:text-2xl">
            {companyName} <span className="text-sm font-medium text-slate-500">({ticker})</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={UI_TEXT.table.history.close}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="p-2 sm:p-7">
          <div className="rounded-xl border border-slate-100 bg-white p-1 sm:p-2">
            <TradingViewChart
              ticker={ticker}
              className="h-[min(70dvh,560px)] min-h-80 w-full sm:h-[min(72vh,720px)] sm:min-h-96"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
