import { ChevronDown } from "lucide-react";
import { UI_TEXT } from "@/domain/literales.constantes";
import { StockCandidate } from "@/domain/models/trading";
import { Column, DataTable } from "@/components/tables/core/DataTable";

interface ReboundOpportunitiesProps {
  tier0: StockCandidate[];
  tier1: StockCandidate[];
  top: StockCandidate[];
  mid: StockCandidate[];
}

function getFloorDistancePercent(opportunity: StockCandidate): number | null {
  const { precio, minimoReciente } = opportunity;
  if (!Number.isFinite(precio) || precio <= 0 || !Number.isFinite(minimoReciente) || !minimoReciente || minimoReciente <= 0) {
    return null;
  }

  return ((precio - minimoReciente) / precio) * 100;
}

function FloorDistance({ opportunity }: { opportunity: StockCandidate }) {
  const distance = getFloorDistancePercent(opportunity);
  
  if (distance === null){
    return <span className="text-slate-400">{UI_TEXT.table.values.noData}</span>;
  }

  const label = distance < 0
    ? `${Math.abs(distance).toFixed(1)}% ${UI_TEXT.floor.underMinimum}`
    : `${distance.toFixed(1)}% ${UI_TEXT.floor.overMinimum}`;

  return (
    <span
      className={distance < 0 ? "font-medium text-rose-700" : "font-medium "}
      title={UI_TEXT.floor.description}
    >
      {label}
    </span>
  );
}

function BacktestInfo({ opportunity }: { opportunity: StockCandidate }) {
  const { backtestCasos, backtestExitoPct, backtestPerdidoPct, backtestEstancadoPct, backtestDiasMedios } = opportunity;

  if (backtestCasos === undefined) {
    return <span className="text-slate-400">{UI_TEXT.table.values.noData}</span>;
  }

  const pocaMuestra = backtestCasos < 10;

  return (
    <div className="leading-tight">
      <div className="flex gap-2 font-semibold">
        <span className="text-emerald-700">{backtestExitoPct}% ganó</span>
        <span className="text-amber-600">{backtestEstancadoPct}% estancó</span>
        <span className="text-rose-700">{backtestPerdidoPct}% perdió</span>
      </div>
      <span className="block text-xs text-slate-500">
        {backtestCasos} casos · {backtestDiasMedios}d media
        {pocaMuestra && <span className="ml-1 text-amber-600">(poca muestra)</span>}
      </span>
    </div>
  );
}

function OpportunityBlock({ title, opportunities, subtitle }: { title: string; opportunities: StockCandidate[]; subtitle?: string }) {
  const columns: Column<StockCandidate>[] = [
    { header: UI_TEXT.table.columns.name, sortValue: (opportunity) => opportunity.nombre, render: (opportunity) => opportunity.nombre, cellClassName: "font-bold text-slate-900" },
    { header: UI_TEXT.table.columns.ticker, sortValue: (opportunity) => opportunity.ticker, render: (opportunity) => <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-xs font-semibold text-indigo-700">{opportunity.ticker}</span> },
    { header: UI_TEXT.table.columns.price, sortValue: (opportunity) => opportunity.precio, render: (opportunity) => opportunity.precio.toFixed(2) },
    { header: UI_TEXT.table.columns.rsi, sortValue: (opportunity) => opportunity.rsi, render: (opportunity) => opportunity.rsi.toFixed(2) },
    { header: UI_TEXT.table.columns.volume, sortValue: (opportunity) => opportunity.volumen, render: (opportunity) => opportunity.volumen.toLocaleString() },
    { header: UI_TEXT.table.columns.recentFloor, sortValue: getFloorDistancePercent, render: (opportunity) => <FloorDistance opportunity={opportunity} /> },
    { header: UI_TEXT.table.columns.backtest, sortValue: (opportunity) => opportunity.backtestExitoPct, render: (opportunity) => <BacktestInfo opportunity={opportunity} /> },
  ];

  return <DataTable
    title={title}
    subtitle={subtitle}
    data={opportunities}
    columns={columns}
    rowKey={(opportunity) => opportunity.ticker}
    initialSortIndex={0}
    recordsLabel={UI_TEXT.table.pagination.opportunityRecords}
    emptyMessage={UI_TEXT.table.emptyStates.opportunities}
    containerClassName=""
    mobileRow={(opportunity, expanded, toggle) => (
      <div className="overflow-hidden last:border-b-0">
        <button type="button" onClick={toggle} className="flex w-full cursor-pointer items-center justify-between gap-3 py-4 text-left transition-colors hover:bg-slate-50" aria-expanded={expanded}>
          <span>
            <span className="truncate font-semibold text-slate-800">{opportunity.nombre}</span>
          </span>
          <ChevronDown className={`shrink-0 text-slate-500 transition-transform ${expanded ? "rotate-180" : ""}`} size={18} />
        </button>
        {expanded && <div className="grid grid-cols-2 gap-3 border-t border-slate-200 bg-slate-50/70 px-4 py-4 text-sm">
          <div>
            <p className="text-slate-500">{UI_TEXT.table.columns.ticker}</p>
            <p className="mt-1"><span className="inline-flex rounded-lg bg-indigo-50 px-2 py-1 font-mono text-xs font-bold text-indigo-700">{opportunity.ticker}</span></p>
          </div>
          <div>
            <p className="text-slate-500">{UI_TEXT.table.columns.price}</p>
            <p className="text-slate-700">{opportunity.precio.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-slate-500">{UI_TEXT.table.columns.rsi}</p>
            <p className="text-slate-700">{opportunity.rsi.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-slate-500">{UI_TEXT.table.columns.volume}</p>
            <p className="text-slate-700">{opportunity.volumen.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-slate-500">{UI_TEXT.table.columns.recentFloor}</p>
            <p className="text-slate-700"><FloorDistance opportunity={opportunity} /></p>
          </div>
          <div>
            <p className="text-slate-500">{UI_TEXT.table.columns.backtest}</p>
            <p className="text-slate-700"><BacktestInfo opportunity={opportunity} /></p>
          </div>
        </div>}
      </div>
    )}
  />;
}

export function ReboundOpportunities({ tier0, tier1, top, mid }: ReboundOpportunitiesProps) {
  return (
    <div className="grid gap-6">
      <OpportunityBlock title={UI_TEXT.table.titles.TIER_0} subtitle={UI_TEXT.table.subtitles.TIER_0} opportunities={tier0} />
      <OpportunityBlock title={UI_TEXT.table.titles.TIER_1} opportunities={tier1} />
      <OpportunityBlock title={UI_TEXT.table.titles.TOP} opportunities={top} />
      <OpportunityBlock title={UI_TEXT.table.titles.MID} opportunities={mid} />
    </div>
  );
}
