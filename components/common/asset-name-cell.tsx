import { MarketStatusDot } from "@/components/common/market-status";
import { CompanyLogo } from "@/components/features/companies/company-logo";
import { DividendBadge } from "@/components/ui/core/trading-cells";
import { CompanyRecord } from "@/domain/models/trading";
import { getAssetMark } from "@/domain/rules/asset-mark.rules";

export interface AssetNameCellProps {
  name: string;
  ticker: string;
  /** Ficha de la tabla de Mercado: aporta logo, estado de la bolsa, marca ETF/FI y dividendos. Es opcional. */
  empresa?: CompanyRecord | null;
  size?: number;
  /** Oculta el icono de dividendos (Rey/Aristócrata) en tablas donde no aporta. */
  showDividend?: boolean;
  className?: string;
}

/**
 * Celda de identidad de un activo, la misma en todas las tablas y en la barra de las filas móviles:
 * logo o marca ETF/FI, estado de la bolsa, ticker y nombre (hasta 2 líneas) más el icono de dividendos.
 * Sin `empresa` funciona solo con nombre y ticker.
 */
export function AssetNameCell({
  name,
  ticker,
  empresa,
  size = 36,
  showDividend = true,
  className = "",
}: AssetNameCellProps) {
  const assetMark = getAssetMark(empresa?.tipo_activo);

  return (
    <div className={`flex min-w-0 items-center gap-2 ${className}`}>
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        {assetMark ? (
          <span
            aria-label={assetMark === "ETF" ? "ETF" : "Fondo indexado"}
            title={assetMark === "ETF" ? "ETF" : "Fondo indexado"}
            className="inline-flex shrink-0 items-center justify-center rounded-md border border-slate-300 bg-slate-100 font-extrabold leading-none text-slate-600"
            style={{ width: size, height: size, fontSize: assetMark === "ETF" ? 10 : 12 }}
          >
            {assetMark}
          </span>
        ) : (
          <CompanyLogo name={name} ticker={ticker} website={empresa?.web} size={size} />
        )}

        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex min-w-0 items-center gap-1.5">
            <MarketStatusDot bolsa={empresa?.bolsa} />
            <span className="shrink-0 font-mono text-[11px] font-medium tracking-wide text-slate-500">
              {ticker}
            </span>
          </div>
          {/* Hasta 2 líneas y con ancho máximo: un nombre largo no debe quitar sitio a las demás columnas. */}
          <span
            className="line-clamp-2 max-w-72 break-words text-sm font-medium leading-snug text-slate-700"
            title={name}
          >
            {name}
          </span>
        </div>
      </div>

      {showDividend && empresa && <DividendBadge empresa={empresa} hideYield={true} />}
    </div>
  );
}
