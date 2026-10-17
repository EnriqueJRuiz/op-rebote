import { Column } from "@/components/ui/core/DataTable";
import { BullishSignal } from "@/domain/models/bullish-impulse";
import { UI_TEXT } from "@/domain/literales.constantes";
import { CompanyHistoryTrigger } from "@/components/common/history/company-history-trigger";
import { OpenOperationButton } from "../operations/open-operation-button";

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
      render: (signal) =>
        signal.volumenRelativo == null ? "—" : `${signal.volumenRelativo.toFixed(2)}×`,
    },
    {
      header: UI_TEXT.pages.bullishImpulse.columns.detected,
      sortValue: (signal) => signal.detectadaEn,
      render: (signal) =>
        new Date(signal.detectadaEn).toLocaleString("es-ES", {
          dateStyle: "short",
          timeStyle: "short",
        }),
      cellClassName: "whitespace-nowrap",
    },
    {
      header: UI_TEXT.table.columns.operate,
      render: (signal) => (
        <OpenOperationButton ticker={signal.ticker} onClick={() => onOpenOperation(signal)} />
      ),
      headerClassName: "text-right",
      cellClassName: "text-right",
    },
  ];
}