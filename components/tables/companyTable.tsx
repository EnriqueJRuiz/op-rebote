"use client";

import { ChevronDown } from "lucide-react";
import { Column, DataTable } from "@/components/tables/core/DataTable";
import { CompanyRecord } from "@/domain/models/trading";

interface CompanyTableProps {
  empresas: CompanyRecord[];
  title: string;
}

const STYLES = {
  tickerPill: "inline-flex w-24 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 font-mono text-xs font-bold text-blue-700",
  companyName: "font-semibold tracking-wide text-slate-800",
  secondaryText: "text-slate-600",
  badgeBase: "inline-block rounded-lg border px-2 py-1 text-center text-xs",
  badgeTrue: "border-emerald-200 bg-emerald-50 text-emerald-700",
  badgeFalse: "border-slate-200 bg-slate-50 text-slate-500",
};

function formatMarketCap(value?: number) {
  if (!value) return "-";
  if (value >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(1)} T`;
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} M`;
  return value.toLocaleString("es-ES");
}

export function CompanyTable({ empresas, title }: CompanyTableProps) {
  const renderDividend = (empresa: CompanyRecord) => (
    <span className={`${STYLES.badgeBase} ${empresa.es_dividendo ? STYLES.badgeTrue : STYLES.badgeFalse}`}>
      {empresa.es_dividendo ? "Sí" : "No"}
    </span>
  );

  const columns: Column<CompanyRecord>[] = [
    { header: "Ticker", sortValue: (empresa) => empresa.ticker, render: (empresa) => <span className={STYLES.tickerPill}>{empresa.ticker}</span> },
    { header: "Nombre", sortValue: (empresa) => empresa.nombre, render: (empresa) => empresa.nombre, cellClassName: STYLES.companyName },
    { header: "Tipo", render: (empresa) => empresa.tipo_activo || "-", cellClassName: STYLES.secondaryText },
    { header: "Sector", render: (empresa) => empresa.sector || "Desconocido", cellClassName: STYLES.secondaryText },
    { header: "Capitalización", render: (empresa) => formatMarketCap(empresa.capitalizacion), cellClassName: STYLES.secondaryText },
    { header: "¿Dividendo?", render: renderDividend },
  ];

  return <DataTable title={title} data={empresas} columns={columns} rowKey={(empresa) => empresa.id} initialSortIndex={0} recordsLabel="empresas" emptyMessage="No hay empresas en esta categoría."
    mobileRow={(empresa, expanded, toggle) => (
      <div className="overflow-hidden last:border-b-0">
        <button type="button" onClick={toggle} className="flex w-full cursor-pointer items-center justify-between gap-3 py-4 text-left transition-colors hover:bg-blue-50/45" aria-expanded={expanded}>
          <span className="truncate font-semibold text-slate-800">{empresa.nombre}</span>
          <ChevronDown className={`shrink-0 text-slate-500 transition-transform ${expanded ? "rotate-180" : ""}`} size={18} />
        </button>
        {expanded && <div className="grid grid-cols-2 gap-3 border-t border-slate-200 bg-slate-50/70 px-4 py-4 text-sm">
          <div><p className="text-slate-500">Ticker</p><p className="mt-1"><span className={STYLES.tickerPill}>{empresa.ticker}</span></p></div>
          <div><p className="text-slate-500">Sector</p><p className="text-slate-700">{empresa.sector || "Desconocido"}</p></div>
          <div><p className="text-slate-500">Tipo</p><p className="text-slate-700">{empresa.tipo_activo || "-"}</p></div>
          <div><p className="text-slate-500">Capitalización</p><p className="text-slate-700">{formatMarketCap(empresa.capitalizacion)}</p></div>
          <div><p className="text-slate-500">Dividendo</p><p className="mt-1">{renderDividend(empresa)}</p></div>
        </div>}
      </div>
    )}
  />;
}