import { Column } from "@/components/ui/core/DataTable";
import { BullishSignal } from "@/domain/models/bullish-impulse";
import { UI_TEXT } from "@/domain/literales.constantes";
import { UI_STYLES } from "@/styles/ui-styles";
import { CompanyHistoryTrigger } from "../companies/history/company-history-trigger";
import { Plus } from "lucide-react";

interface GetBullishColumnsProps {
  onOpenOperation: (signal: BullishSignal) => void;
}

export function getBullishImpulseColumns({
  onOpenOperation,
}: GetBullishColumnsProps): Column<BullishSignal>[] {
  return [
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
    {
      header: UI_TEXT.pages.bullishImpulse.columns.operate,
      render: (signal) => (
        <button
          type="button"
          onClick={() => onOpenOperation(signal)}
          aria-label={UI_TEXT.operations.openAria(signal.ticker)}
          className={`${UI_STYLES.button.primarySm} whitespace-nowrap`}
        >
          <Plus size={14} aria-hidden="true" />
          {UI_TEXT.operations.openButton}
        </button>
      ),
      headerClassName: "text-right",
      cellClassName: "text-right",
    },
  ];
}