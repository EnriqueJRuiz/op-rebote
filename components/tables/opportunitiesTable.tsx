import { ChevronDown } from "lucide-react";
import { UI_TEXT } from "@/domain/literales.constantes";
import { StockCandidate } from "@/domain/models/trading";
import { Column, DataTable } from "@/components/tables/core/DataTable";
import { UI_STYLES } from "@/styles/ui-styles";

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
    return <span className={UI_STYLES.badge.muted}>{UI_TEXT.table.values.noData}</span>;
  }

  const label = distance < 0
    ? `${Math.abs(distance).toFixed(2)}% ${UI_TEXT.floor.underMinimum}`
    : `${distance.toFixed(2)}% ${UI_TEXT.floor.overMinimum}`;

  return (
    <span className={distance < 0 
      ? `font-medium ${UI_STYLES.badge.danger}` 
      : "font-medium"} title={UI_TEXT.floor.description} 
    >
      {label}
    </span>
  );
}

function Sma200Distance({ opportunity }: { opportunity: StockCandidate }) {
  const distance = opportunity.distSma200Pct;

  if (distance === undefined || !Number.isFinite(distance)) {
    return <span className={UI_STYLES.badge.muted}>{UI_TEXT.table.values.noData}</span>;
  }

  const label = `${distance >= 0 ? "+" : ""}${distance.toFixed(2)}%`;

  return (
    <span
      className={distance < 0 ? `font-medium ${UI_STYLES.badge.danger}` : `font-medium ${UI_STYLES.badge.success}`}
      title="Distancia del precio a la media móvil de 200 sesiones"
    >
      {label}
    </span>
  );
}

function RelativeVolume({ opportunity }: { opportunity: StockCandidate }) {
  const value = opportunity.volumenRelativo;

  if (!Number.isFinite(value)) {
    return (
      <span className="text-slate-400">
        {UI_TEXT.table.values.noData}
      </span>
    );
  }

  return (
    <span className="font-medium text-slate-700">
      {typeof value === "number" && Number.isFinite(value)
        ? `${value.toFixed(2)}x`
        : UI_TEXT.table.values.noData}
    </span>
  );
}

function BacktestInfo({ opportunity }: { opportunity: StockCandidate }) {
  const { backtestCasos, backtestExitoPct, backtestPerdidoPct, backtestEstancadoPct, backtestDiasMedios, backtestSobreSma, backtestBajoSma } = opportunity;
  const formatGroup = (group?: { casos: number; exitoPct: number }) =>
    group ? `${group.exitoPct}% (${group.casos})` : "s/d";

  if (backtestCasos === undefined) {
    return <span className={UI_STYLES.badge.muted}>{UI_TEXT.table.values.noData}</span>;
  }

  const pocaMuestra = backtestCasos < 10;

  return (
    <div className="leading-tight">
      <div className="flex gap-2 font-semibold">
        <span className={UI_STYLES.badge.success}>{backtestExitoPct}% ganó</span>
        <span className={UI_STYLES.badge.warning}>{backtestEstancadoPct}% estancó</span>
        <span className={UI_STYLES.badge.danger}>{backtestPerdidoPct}% perdió</span>
      </div>
      <span className={`block text-xs ${UI_STYLES.text.muted}`}>
        {backtestCasos} casos · {backtestDiasMedios}d media
        {pocaMuestra && <span className={`ml-1 ${UI_STYLES.badge.warning}`}>(poca muestra)</span>}
      </span>
      {(backtestSobreSma || backtestBajoSma) && (
        <span
          className={`block text-xs ${UI_STYLES.text.muted}`}
          title="% de señales ganadoras (y nº de casos) según el precio estuviera por encima o por debajo de la SMA200 al dar la señal"
        >
          SMA200: sobre {formatGroup(backtestSobreSma)} · bajo {formatGroup(backtestBajoSma)}
        </span>
      )}
    </div>
  );
}

function OpportunityBlock({ title, opportunities, subtitle }: { title: string; opportunities: StockCandidate[]; subtitle?: string }) {
  const columns: Column<StockCandidate>[] = [
    { 
      header: UI_TEXT.table.columns.name
      , sortValue: (opportunity) => opportunity.nombre
      , render: (opportunity) => opportunity.nombre
      , cellClassName: UI_STYLES.text.primary + " font-bold" 
    },
    { 
      header: UI_TEXT.table.columns.ticker
      , sortValue: (opportunity) => opportunity.ticker
      , render: (opportunity) => <span className={UI_STYLES.badge.ticker}>{opportunity.ticker}</span> 
    },
    { header: UI_TEXT.table.columns.price
      , sortValue: (opportunity) => opportunity.precio
      , render: (opportunity) => opportunity.precio.toFixed(2) 
    },
    { 
      header: UI_TEXT.table.columns.rsi
      , sortValue: (opportunity) => opportunity.rsi
      , render: (opportunity) => opportunity.rsi.toFixed(2) 
    },
    { 
      header: UI_TEXT.table.columns.volume
      , sortValue: (opportunity) => opportunity.volumen
      , render: (opportunity) => opportunity.volumen.toLocaleString() 
    },
    {
      header: UI_TEXT.table.columns.relativeVolume,
      sortValue: (opportunity) => opportunity.volumenRelativo ?? -Infinity,
      render: (opportunity) => (
        <RelativeVolume opportunity={opportunity} />
      ),
    },
    { 
      header: UI_TEXT.table.columns.recentFloor
      , sortValue: getFloorDistancePercent
      , render: (opportunity) => <FloorDistance opportunity={opportunity} /> 
    },
    {
      header: UI_TEXT.table.columns.sma200,
      sortValue: (opportunity) => opportunity.distSma200Pct ?? -Infinity,
      render: (opportunity) => <Sma200Distance opportunity={opportunity} />,
    },
    { 
      header: UI_TEXT.table.columns.backtest
      , sortValue: (opportunity) => opportunity.backtestExitoPct
      , render: (opportunity) => <BacktestInfo opportunity={opportunity} /> 
    },
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
      <div className={UI_STYLES.table.mobileRow}>
        <button type="button" onClick={toggle} className={UI_STYLES.table.mobileRowButton} aria-expanded={expanded}>
          <span>
            <span className={UI_STYLES.table.mobileRowTitle}>{opportunity.nombre}</span>
          </span>
          <ChevronDown className={`${UI_STYLES.table.mobileRowIcon} ${expanded ? "rotate-180" : ""}`} size={18} />
        </button>
        {expanded && <div className={UI_STYLES.table.mobileDetails}>
          <div>
            <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.ticker}</p>
            <p className="mt-1"><span className={UI_STYLES.badge.tickerLarge}>{opportunity.ticker}</span></p>
          </div>
          <div>
            <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.price}</p>
            <p className={UI_STYLES.table.mobileValue}>{opportunity.precio.toFixed(2)}</p>
          </div>
          <div>
            <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.rsi}</p>
            <p className={UI_STYLES.table.mobileValue}>{opportunity.rsi.toFixed(2)}</p>
          </div>
          <div>
            <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.volume}</p>
            <p className={UI_STYLES.table.mobileValue}>{opportunity.volumen.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-slate-500">{UI_TEXT.table.columns.relativeVolume}</p>
            <p className="text-slate-700"><RelativeVolume opportunity={opportunity} /></p>
          </div>
          <div>
            <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.recentFloor}</p>
            <p className={UI_STYLES.table.mobileValue}><FloorDistance opportunity={opportunity} /></p>
          </div>
          <div>
            <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.sma200}</p>
            <p className={UI_STYLES.table.mobileValue}><Sma200Distance opportunity={opportunity} /></p>
          </div>
          <div>
            <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.backtest}</p>
            <p className={UI_STYLES.table.mobileValue}><BacktestInfo opportunity={opportunity} /></p>
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