import { UI_STYLES } from "@/styles/ui-styles";
import { UI_TEXT } from "@/domain/literales.constantes";
import { CompanyAnalyzeButton } from "@/components/common/history/company-analyze-button";
import { CompanyHistoryTrigger } from "@/components/common/history/company-history-trigger";
import { OpenOperationButton } from "@/components/common/open-operation";
import { MobileRowHeader, MobileRowPriceChange } from "@/components/common/mobile/mobile-row-header";
import { WatchlistRowData } from "./watchlist-types";
import { BacktestInfo, FloorDistance, PriceCell, RsiBadge, Sma200Distance } from "./watchlist-cells";

/** Fila móvil de Seguimiento: misma barra y mismos botones finales que la de Mercado, con los indicadores propios del seguimiento. */
export function renderWatchlistMobileRow(
  row: WatchlistRowData,
  expanded: boolean,
  toggle: () => void,
  onRefresh: () => void
) {
  return (
    <div className={UI_STYLES.table.mobileRow}>
      <MobileRowHeader
        ticker={row.ticker}
        name={row.nombre}
        empresa={row.empresa}
        expanded={expanded}
        onToggle={toggle}
        trailing={
          <MobileRowPriceChange
            companyId={row.idEmpresa}
            ticker={row.ticker}
            name={row.nombre}
            currency={row.moneda}
            price={row.precio}
            previousPrice={row.precioAnterior}
          />
        }
      />

      {expanded && (
        <div className={UI_STYLES.table.mobileDetails}>
          {/* Grupo 1, mercado: dónde cotiza y cuánto se mueve */}
          <div className="min-w-0">
            <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.price}</p>
            <div className="mt-1">
              <PriceCell row={row} showChange={false} showEye={false} />
            </div>
          </div>
          <div className="min-w-0">
            <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.volume}</p>
            <div className={`${UI_STYLES.table.mobileValue} mt-1 flex flex-col items-start tabular-nums`}>
              <CompanyHistoryTrigger companyId={row.idEmpresa} ticker={row.ticker} companyName={row.nombre} currency={row.moneda} metric="volumen_relativo">
                {row.volumen?.toLocaleString() ?? "-"}
              </CompanyHistoryTrigger>
              {row.volumenRelativo !== undefined && (
                <CompanyHistoryTrigger companyId={row.idEmpresa} ticker={row.ticker} companyName={row.nombre} currency={row.moneda} metric="volumen_relativo">
                  <span className="mt-0.5 text-xs text-slate-500">RVOL {row.volumenRelativo.toFixed(2)}x</span>
                </CompanyHistoryTrigger>
              )}
            </div>
          </div>

          {/* Grupo 2, señales del rebote: los tres indicadores que decide la estrategia, en una sola fila */}
          <div className="col-span-2 grid grid-cols-3 gap-3 border-t border-slate-200 pt-3">
            <div className="min-w-0">
              <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.rsi}</p>
              <div className="mt-1">
                <CompanyHistoryTrigger companyId={row.idEmpresa} ticker={row.ticker} companyName={row.nombre} currency={row.moneda} metric="rsi">
                  <RsiBadge rsi={row.rsi} />
                </CompanyHistoryTrigger>
              </div>
            </div>
            <div className="min-w-0">
              <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.recentFloor}</p>
              <div className={`${UI_STYLES.table.mobileValue} mt-1 tabular-nums`}>
                <CompanyHistoryTrigger companyId={row.idEmpresa} ticker={row.ticker} companyName={row.nombre} currency={row.moneda} metric="distancia_suelo_pct">
                  <FloorDistance row={row} />
                </CompanyHistoryTrigger>
              </div>
            </div>
            <div className="min-w-0">
              <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.sma200}</p>
              <div className={`${UI_STYLES.table.mobileValue} mt-1 tabular-nums`}>
                <CompanyHistoryTrigger companyId={row.idEmpresa} ticker={row.ticker} companyName={row.nombre} currency={row.moneda} metric="dist_sma200_pct">
                  <Sma200Distance row={row} />
                </CompanyHistoryTrigger>
              </div>
            </div>
          </div>

          {/* Grupo 3, historial: qué pasó otras veces con esta señal */}
          <div className="col-span-2 border-t border-slate-200 pt-3">
            <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.backtest}</p>
            <div className="mt-1">
              <BacktestInfo row={row} />
            </div>
          </div>

          {/* Botones finales: solo si la fila corresponde a una empresa de la tabla de Mercado */}
          {row.idEmpresa !== undefined && (
            <div className="col-span-full grid grid-cols-2 gap-2 pt-2">
              <div className="flex w-full [&>button]:w-full [&>button]:justify-center">
                <CompanyAnalyzeButton
                  companyId={row.idEmpresa}
                  ticker={row.ticker}
                  companyName={row.nombre}
                  currency={row.moneda}
                />
              </div>
              <OpenOperationButton
                companyId={row.idEmpresa}
                ticker={row.ticker}
                companyName={row.nombre}
                precioActual={row.precio}
                onSuccess={onRefresh}
                fullWidth
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
