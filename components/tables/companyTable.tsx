"use client";

import { Check, ChessBishop, ChevronDown, Crown, X } from "lucide-react";
import { Column, DataTable } from "@/components/tables/core/DataTable";
import { DIVIDEND_TIERS } from "@/domain/constants";
import { CompanyRecord } from "@/domain/models/trading";
import { UI_TEXT } from "@/domain/literales.constantes";

interface CompanyTableProps {
  empresas: CompanyRecord[];
  title: string;
}

const STYLES = {
  ticker: "font-mono text-sm font-medium text-blue-700",
  companyName: "font-semibold text-slate-900",
  secondaryText: "text-slate-600",
  dividendYes: "text-emerald-600",
  dividendNo: "text-rose-600",
  dividendKing: "text-amber-500",
  dividendAristocrat: "text-slate-500",
};

function formatMarketCap(value?: number) {
  if (!value) return UI_TEXT.table.values.notAvailable;
  if (value >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(1)} ${UI_TEXT.table.formatting.marketCapUnits.trillion}`;
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} ${UI_TEXT.table.formatting.marketCapUnits.billion}`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} ${UI_TEXT.table.formatting.marketCapUnits.million}`;
  return value.toLocaleString("es-ES");
}

export function CompanyTable({ empresas, title }: CompanyTableProps) {
  const renderDividend = (empresa: CompanyRecord) => {
    const dividendText = empresa.es_dividendo
      ? UI_TEXT.table.values.dividendYes
      : UI_TEXT.table.values.dividendNo;
    const tierLabel = empresa.dividend_tier === DIVIDEND_TIERS.KING
      ? UI_TEXT.table.values.dividendKing
      : empresa.dividend_tier === DIVIDEND_TIERS.ARISTOCRAT
        ? UI_TEXT.table.values.dividendAristocrat
        : undefined;
    const StatusIcon = empresa.es_dividendo ? Check : X;
    const TierIcon = empresa.dividend_tier === DIVIDEND_TIERS.KING ? Crown : ChessBishop;
    const statusStyle = empresa.es_dividendo ? STYLES.dividendYes : STYLES.dividendNo;
    const tierStyle = empresa.dividend_tier === DIVIDEND_TIERS.KING
      ? STYLES.dividendKing
      : STYLES.dividendAristocrat;

    return (
      <span className="inline-flex items-center gap-1.5">
        <span
          className={statusStyle}
          title={dividendText}
          role="img"
          aria-label={dividendText}
        >
          <StatusIcon size={17} strokeWidth={2.5} aria-hidden="true" />
        </span>
        {empresa.es_dividendo && tierLabel && (
          <span
            className={`inline-flex items-center gap-0.5 ${tierStyle}`}
            title={tierLabel}
            aria-label={tierLabel}
            role="img"
          >
            <TierIcon size={15} aria-hidden="true" />
          </span>
        )}
      </span>
    );
  };

  const columns: Column<CompanyRecord>[] = [
    { header: UI_TEXT.table.columns.name, sortValue: (empresa) => empresa.nombre, render: (empresa) => <span className={STYLES.companyName}>{empresa.nombre}</span> },
    { header: UI_TEXT.table.columns.ticker, sortValue: (empresa) => empresa.ticker, render: (empresa) => <span className={STYLES.ticker}>{empresa.ticker}</span> },
    { header: UI_TEXT.table.columns.type, render: (empresa) => empresa.tipo_activo || UI_TEXT.table.values.notAvailable, cellClassName: STYLES.secondaryText },
    { header: UI_TEXT.table.columns.sector, render: (empresa) => empresa.sector || UI_TEXT.table.values.unknownSector, cellClassName: STYLES.secondaryText },
    { header: UI_TEXT.table.columns.marketCap, render: (empresa) => formatMarketCap(empresa.capitalizacion), cellClassName: STYLES.secondaryText },
    { header: UI_TEXT.table.columns.dividend, render: renderDividend },
  ];

  return <DataTable title={title} data={empresas} columns={columns} rowKey={(empresa) => empresa.id} initialSortIndex={0} recordsLabel={UI_TEXT.table.pagination.companyRecords} emptyMessage={UI_TEXT.table.emptyStates.companies}
    mobileRow={(empresa, expanded, toggle) => (
      <div className="overflow-hidden last:border-b-0">
        <button type="button" onClick={toggle} className="flex w-full cursor-pointer items-center justify-between gap-3 py-4 text-left transition-colors hover:bg-blue-50/45" aria-expanded={expanded}>
          <span className="truncate font-semibold text-slate-800">{empresa.nombre}</span>
          <ChevronDown className={`shrink-0 text-slate-500 transition-transform ${expanded ? "rotate-180" : ""}`} size={18} />
        </button>
        {expanded && <div className="grid grid-cols-2 gap-3 border-t border-slate-200 bg-slate-50/70 px-4 py-4 text-sm">
          <div><p className="text-slate-500">{UI_TEXT.table.columns.ticker}</p><p className={`mt-1 ${STYLES.ticker}`}>{empresa.ticker}</p></div>
          <div><p className="text-slate-500">{UI_TEXT.table.columns.sector}</p><p className="text-slate-700">{empresa.sector || UI_TEXT.table.values.unknownSector}</p></div>
          <div><p className="text-slate-500">{UI_TEXT.table.columns.type}</p><p className="text-slate-700">{empresa.tipo_activo || UI_TEXT.table.values.notAvailable}</p></div>
          <div><p className="text-slate-500">{UI_TEXT.table.columns.marketCap}</p><p className="text-slate-700">{formatMarketCap(empresa.capitalizacion)}</p></div>
          <div><p className="text-slate-500">{UI_TEXT.table.columns.dividend}</p><p className="mt-1">{renderDividend(empresa)}</p></div>
        </div>}
      </div>
    )}
  />;
}