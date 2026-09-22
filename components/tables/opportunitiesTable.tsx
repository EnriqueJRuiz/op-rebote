import { StockCandidate } from "@/domain/models/trading";
import { ChevronDown } from "lucide-react";
import { Column, DataTable } from "@/components/tables/core/DataTable";

interface ReboundOpportunitiesProps {
  top: StockCandidate[];
  mid: StockCandidate[];
}

function OpportunityBlock({ title, opportunities }: { title: string; opportunities: StockCandidate[] }) {
  const columns: Column<StockCandidate>[] = [
    { header: "Ticker", sortValue: (opportunity) => opportunity.ticker, render: (opportunity) => opportunity.ticker, cellClassName: "font-bold" },
    { header: "Nombre", sortValue: (opportunity) => opportunity.nombre, render: (opportunity) => opportunity.nombre },
    { header: "Precio", sortValue: (opportunity) => opportunity.precio, render: (opportunity) => opportunity.precio.toFixed(2) },
    { header: "RSI", sortValue: (opportunity) => opportunity.rsi, render: (opportunity) => opportunity.rsi.toFixed(2) },
    { header: "Volumen", sortValue: (opportunity) => opportunity.volumen, render: (opportunity) => opportunity.volumen.toLocaleString() },
  ];

  return <DataTable
    title={title}
    data={opportunities}
    columns={columns}
    rowKey={(opportunity) => opportunity.ticker}
    initialSortIndex={0}
    recordsLabel="oportunidades"
    emptyMessage="No hay oportunidades que cumplan el segundo filtro."
    containerClassName="rounded-lg border border-gray-800 bg-gray-900 p-6"
    mobileRow={(opportunity, expanded, toggle) => (
      <div className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
        <button type="button" onClick={toggle} className="flex w-full items-center justify-between gap-3 p-4 text-left" aria-expanded={expanded}>
          <span>
            <span className="truncate font-semibold text-white">{opportunity.nombre}</span>
          </span>
          <ChevronDown className={`shrink-0 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`} size={18} />
        </button>
        {expanded && <div className="grid grid-cols-2 gap-3 border-t border-gray-800 px-4 py-4 text-sm">
          <div><p className="text-gray-500">Ticker</p><p className="mt-1"><span className="inline-flex rounded border border-blue-800/50 bg-blue-950/40 px-2 py-1 font-mono text-xs font-bold text-blue-400">{opportunity.ticker}</span></p></div>
          <div><p className="text-gray-500">Precio</p><p className="text-gray-200">{opportunity.precio.toFixed(2)}</p></div>
          <div><p className="text-gray-500">RSI</p><p className="text-gray-200">{opportunity.rsi.toFixed(2)}</p></div>
          <div><p className="text-gray-500">Volumen</p><p className="text-gray-200">{opportunity.volumen.toLocaleString()}</p></div>
        </div>}
      </div>
    )}
  />;
}

export function ReboundOpportunities({ top, mid }: ReboundOpportunitiesProps) {
  return (
    <div className="grid gap-6">
      <OpportunityBlock title="TOP" opportunities={top} />
      <OpportunityBlock title="MID" opportunities={mid} />
    </div>
  );
}
