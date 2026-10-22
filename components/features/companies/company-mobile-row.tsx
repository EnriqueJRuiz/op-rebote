import { ChevronDown } from "lucide-react";
import { UI_STYLES } from "@/styles/ui-styles";
import { UI_TEXT } from "@/domain/literales.constantes";
import { CompanyRecord, CompanyScanQuote } from "@/domain/models/trading";
import { DividendBadge, PriceChange } from "@/components/ui/core/trading-cells";
import { FollowButton } from "@/components/common/follow-button";
import { CompanyAnalyzeButton } from "@/components/common/history/company-analyze-button";
import { OpenOperationButton } from "@/components/common/open-operation";
import { renderCompanyScannedPriceRow } from "./company-columns";
import { CompanyCell } from "./company-cell";
import { CompanyHistoryTrigger } from "@/components/common/history/company-history-trigger";

export function renderCompanyMobileRow(
  empresa: CompanyRecord,
  expanded: boolean,
  toggle: () => void,
  scanQuoteByCompanyId: Map<number, CompanyScanQuote>,
  onRefresh: () => void
) {
  return (
    <div className={UI_STYLES.table.mobileRow}>
      <div className="flex min-w-0 items-center gap-2 py-3">
        <div className="shrink-0">
          <FollowButton ticker={empresa.ticker} size={17} />
        </div>

        <button
          type="button"
          onClick={toggle}
          className="flex min-w-0 flex-1 flex-col gap-1 rounded-md py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          aria-expanded={expanded}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <CompanyCell name={empresa.nombre} ticker={empresa.ticker} website={empresa.web} bolsa={empresa.bolsa} size={32} className="flex-1" />
            <DividendBadge empresa={empresa} hideYield={true} />
          </span>
        </button>

        <div className="min-w-16 shrink-0 pl-1 text-right">
          <CompanyHistoryTrigger
            companyId={empresa.id}
            ticker={empresa.ticker}
            companyName={empresa.nombre}
            currency={empresa.moneda}
            metric="precio"
            showEye={false}
          >
            {(() => {
              const quote = scanQuoteByCompanyId.get(empresa.id);

              return quote && Number.isFinite(quote.price) && quote.price > 0 ? (
                <PriceChange
                  price={quote.price}
                  previousPrice={quote.previousDayPrice}
                  className="justify-end"
                />
              ) : (
                <span className="text-xs text-slate-400">—</span>
              );
            })()}
          </CompanyHistoryTrigger>
        </div>

        <button
          type="button"
          onClick={toggle}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          aria-expanded={expanded}
          aria-label={`${expanded ? "Ocultar detalles de" : "Mostrar detalles de"} ${empresa.nombre}`}
        >
          <ChevronDown
            className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            size={18}
          />
        </button>
      </div>

      {expanded && (
        <div className={UI_STYLES.table.mobileDetails}>
          {/* Fila 1: Precio actual (ocupa todo el ancho o primera sección) */}
          
          <div className="col-span-full flex w-full gap-2 pt-2">
            <div className="col-span-full w-1/3">
                <p className={UI_STYLES.table.mobileLabel}>Precio actual</p>
                <div className="mt-1">
                {renderCompanyScannedPriceRow(empresa, scanQuoteByCompanyId, false)}
                </div>
            </div>
            <div className="col-span-full w-1/3">
                <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.dividend} </p>
                <p className={`${UI_STYLES.table.mobileValue} font-medium tabular-nums`}>
                {empresa.es_dividendo ? (
                    empresa.dividend_yield
                    ? `${(empresa.dividend_yield * 100).toFixed(2)}%`
                    : empresa.dividend_rate
                    ? `${empresa.dividend_rate}%`
                    : "Sí"
                ) : (
                    <span className="text-slate-400">—</span>
                )}
                </p>
            </div>
            <div className="min-w-0 w-1/3">
            <p className={UI_STYLES.table.mobileLabel}>
              {UI_TEXT.table.columns.sector}
            </p>
            <p className={UI_STYLES.table.mobileValue}>
              {empresa.sector || UI_TEXT.table.values.unknownSector}
            </p>
          </div>
         </div>

          {/* Fila 2: Sector y Dividendo */}
          

          

          {/* Fila 3: Botones de acción ocupando todo el ancho inferior */}
          <div className="col-span-full grid grid-cols-2 gap-2 pt-2">
            <div className="flex w-full [&>button]:w-full [&>button]:justify-center">
                <CompanyAnalyzeButton
                companyId={empresa.id}
                ticker={empresa.ticker}
                companyName={empresa.nombre}
                currency={empresa.moneda}
                />
            </div>

            {empresa.ticker !== undefined && (
                <OpenOperationButton
                companyId={empresa.id}
                ticker={empresa.ticker}
                companyName={empresa.nombre}
                precioActual={scanQuoteByCompanyId.get(empresa.id)?.price ?? empresa.precio}
                onSuccess={onRefresh}
                fullWidth
                />
            )}
            </div>
        </div>
      )}
    </div>
  );
}