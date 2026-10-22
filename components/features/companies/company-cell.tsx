import { MarketStatusDot } from "@/components/common/market-status";
import { CompanyLogo } from "./company-logo";

export interface CompanyCellProps {
  name: string;
  ticker: string;
  website?: string | null;
  // Bolsa donde cotiza; decide el color del círculo (abierta, premarket/postmarket, cerrada).
  bolsa?: string | null;
  size?: number;
  className?: string;
}

/** Identidad visual compartida de una empresa para celdas de escritorio y móvil. */
export function CompanyCell({
  name,
  ticker,
  website,
  bolsa,
  size = 36,
  className = "",
}: CompanyCellProps) {
  return (
    <div className={`flex min-w-0 items-center gap-2.5 ${className}`}>
      <CompanyLogo name={name} ticker={ticker} website={website} size={size} />
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <MarketStatusDot bolsa={bolsa} />
          <span className="shrink-0 font-mono text-[11px] font-medium tracking-wide text-slate-500">
            {ticker}
          </span>
        </div>
        <span className="block truncate text-sm font-medium leading-snug text-slate-700" title={name}>
          {name}
        </span>
      </div>
    </div>
  );
}
