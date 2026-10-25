import { UI_STYLES } from "@/styles/ui-styles";
import { UI_TEXT } from "@/domain/literales.constantes";
import { CompanyRecord, CompanyScanQuote } from "@/domain/models/trading";
import { CompanyAnalyzeButton } from "@/components/common/history/company-analyze-button";
import { OpenOperationButton } from "@/components/common/open-operation";
import { renderCompanyScannedPriceRow } from "./company-columns";
import { MobileRowHeader, MobileRowPriceChange } from "@/components/common/mobile/mobile-row-header";

export function renderCompanyMobileRow(
  empresa: CompanyRecord,
  expanded: boolean,
  toggle: () => void,
  scanQuoteByCompanyId: Map<number, CompanyScanQuote>,
  onRefresh: () => void
) {
  return (
    <div className={UI_STYLES.table.mobileRow}>
      <MobileRowHeader
        ticker={empresa.ticker}
        name={empresa.nombre}
        empresa={empresa}
        expanded={expanded}
        onToggle={toggle}
        trailing={
          <MobileRowPriceChange
            companyId={empresa.id}
            ticker={empresa.ticker}
            name={empresa.nombre}
            currency={empresa.moneda}
            price={scanQuoteByCompanyId.get(empresa.id)?.price}
            previousPrice={scanQuoteByCompanyId.get(empresa.id)?.previousDayPrice}
          />
        }
      />

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