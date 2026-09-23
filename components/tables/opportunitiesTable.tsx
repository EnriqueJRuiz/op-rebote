import { StockCandidate } from "@/domain/models/trading";
import { ChevronDown } from "lucide-react";
import { Column, DataTable } from "@/components/tables/core/DataTable";

interface ReboundOpportunitiesProps {
  tier0: StockCandidate[];
  tier1: StockCandidate[];
  top: StockCandidate[];
  mid: StockCandidate[];
}

function OpportunityBlock({ title, opportunities }: { title: string; opportunities: StockCandidate[] }) {
  const columns: Column<StockCandidate>[] = [
    { header: "Ticker", sortValue: (opportunity) => opportunity.ticker, render: (opportunity) => <span className="font-mono font-bold text-blue-700">{opportunity.ticker}</span> },
    { header: "Nombre", sortValue: (opportunity) => opportunity.nombre, render: (opportunity) => opportunity.nombre, cellClassName: "font-semibold text-slate-800" },
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
    containerClassName=""
    mobileRow={(opportunity, expanded, toggle) => (
      <div className="overflow-hidden last:border-b-0">
        <button type="button" onClick={toggle} className="flex w-full cursor-pointer items-center justify-between gap-3 py-4 text-left transition-colors hover:bg-blue-50/45" aria-expanded={expanded}>
          <span>
            <span className="truncate font-semibold text-slate-800">{opportunity.nombre}</span>
          </span>
          <ChevronDown className={`shrink-0 text-slate-500 transition-transform ${expanded ? "rotate-180" : ""}`} size={18} />
        </button>
        {expanded && <div className="grid grid-cols-2 gap-3 border-t border-slate-200 bg-slate-50/70 px-4 py-4 text-sm">
          <div><p className="text-slate-500">Ticker</p><p className="mt-1"><span className="inline-flex rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 font-mono text-xs font-bold text-blue-700">{opportunity.ticker}</span></p></div>
          <div><p className="text-slate-500">Precio</p><p className="text-slate-700">{opportunity.precio.toFixed(2)}</p></div>
          <div><p className="text-slate-500">RSI</p><p className="text-slate-700">{opportunity.rsi.toFixed(2)}</p></div>
          <div><p className="text-slate-500">Volumen</p><p className="text-slate-700">{opportunity.volumen.toLocaleString()}</p></div>
        </div>}
      </div>
    )}
  />;
}

export function ReboundOpportunities({ tier0, tier1, top, mid }: ReboundOpportunitiesProps) {
  return (
    <div className="grid gap-6">
      <OpportunityBlock title="TIER_0" opportunities={tier0} />
      <OpportunityBlock title="TIER_1" opportunities={tier1} />
      <OpportunityBlock title="TOP" opportunities={top} />
      <OpportunityBlock title="MID" opportunities={mid} />
    </div>
  );
}
