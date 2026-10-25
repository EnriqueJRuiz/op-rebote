import { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { CompanyRecord } from "@/domain/models/trading";
import { PriceChange } from "@/components/ui/core/trading-cells";
import { FollowButton } from "@/components/common/follow-button";
import { CompanyHistoryTrigger } from "@/components/common/history/company-history-trigger";
import { AssetNameCell } from "../asset-name-cell";

interface MobileRowHeaderProps {
  ticker: string;
  name: string;
  empresa?: CompanyRecord | null;
  expanded: boolean;
  onToggle: () => void;
  /** Botón de seguir a la izquierda. Se puede quitar en pantallas donde no tenga sentido. */
  showFollow?: boolean;
  /** Lo que va a la derecha de la barra: variación, resultado de la operación, etc. */
  trailing?: ReactNode;
}

/** Barra de una fila móvil: seguir, identidad del activo, un dato a la derecha y la flecha para desplegar. */
export function MobileRowHeader({
  ticker,
  name,
  empresa,
  expanded,
  onToggle,
  showFollow = true,
  trailing,
}: MobileRowHeaderProps) {
  return (
    <div className="flex min-w-0 items-center gap-2 py-3">
      {showFollow && (
        <div className="shrink-0">
          <FollowButton ticker={ticker} size={17} />
        </div>
      )}

      <button
        type="button"
        onClick={onToggle}
        className="flex min-w-0 flex-1 flex-col gap-1 rounded-md py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
        aria-expanded={expanded}
      >
        <AssetNameCell name={name} ticker={ticker} empresa={empresa} size={32} className="flex-1" />
      </button>

      {trailing && <div className="min-w-16 shrink-0 pl-1 text-right">{trailing}</div>}

      <button
        type="button"
        onClick={onToggle}
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
        aria-expanded={expanded}
        aria-label={`${expanded ? "Ocultar detalles de" : "Mostrar detalles de"} ${name}`}
      >
        <ChevronDown
          className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          size={18}
        />
      </button>
    </div>
  );
}

interface MobileRowPriceChangeProps {
  companyId?: number;
  ticker: string;
  name: string;
  currency?: string;
  price?: number;
  previousPrice?: number;
}

/** Variación diaria para el lado derecho de la barra; al pulsarla abre el histórico de precio. */
export function MobileRowPriceChange({
  companyId,
  ticker,
  name,
  currency,
  price,
  previousPrice,
}: MobileRowPriceChangeProps) {
  const hasPrice = price !== undefined && Number.isFinite(price) && price > 0;

  return (
    <CompanyHistoryTrigger
      companyId={companyId}
      ticker={ticker}
      companyName={name}
      currency={currency}
      metric="precio"
      showEye={false}
    >
      {hasPrice ? (
        <PriceChange price={price} previousPrice={previousPrice} className="justify-end" />
      ) : (
        <span className="text-xs text-slate-400">—</span>
      )}
    </CompanyHistoryTrigger>
  );
}
