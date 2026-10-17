import { ChevronDown } from "lucide-react";
import { UI_STYLES } from "@/styles/ui-styles";
import { UI_TEXT } from "@/domain/literales.constantes";
import { BullishSignal } from "@/domain/models/bullish-impulse";
import { OpenOperationButton } from "../operations/open-operation-button";
import { CompanyHistoryTrigger } from "@/components/common/history/company-history-trigger";

export function renderBullishMobileRow(
  signal: BullishSignal,
  expanded: boolean,
  toggle: () => void,
  onOpenOperation: (signal: BullishSignal) => void
) {
  const fmt = (date: string) =>
    new Date(date).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });

  return (
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
          <span
            className={`whitespace-nowrap font-medium ${
              signal.variacionBarraPct >= 0 ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {signal.variacionBarraPct.toFixed(2)}%
          </span>
        </CompanyHistoryTrigger>
        <button
          type="button"
          onClick={toggle}
          aria-label={
            expanded
              ? UI_TEXT.pages.bullishImpulse.aria.collapseSignal
              : UI_TEXT.pages.bullishImpulse.aria.expandSignal
          }
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
            <p className={UI_STYLES.table.mobileLabel}>
              {UI_TEXT.pages.bullishImpulse.labels.sampleVariation}
            </p>
            <CompanyHistoryTrigger
              companyId={signal.companyId}
              ticker={signal.ticker}
              companyName={signal.nombre}
              metric="precio"
            >
              <span
                className={signal.variacionBarraPct >= 0 ? "text-emerald-700" : "text-rose-700"}
              >
                {signal.variacionBarraPct.toFixed(2)}%
              </span>
            </CompanyHistoryTrigger>
          </div>
          <div>
            <p className={UI_STYLES.table.mobileLabel}>
              {UI_TEXT.pages.bullishImpulse.labels.relativeVolume}
            </p>
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
          <div className="col-span-2 pt-2">
            <OpenOperationButton
              ticker={signal.ticker}
              onClick={() => onOpenOperation(signal)}
              fullWidth
            />
          </div>
        </div>
      )}
    </div>
  );
}