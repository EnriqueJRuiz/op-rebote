"use client";

import { ChevronDown } from "lucide-react";
import { Column, DataTable } from "@/components/tables/core/DataTable";
import { SupabaseCompanyRow } from "@/infrastructure/repositories/supabase-companies.types";

interface CompanyTableProps {
  empresas: SupabaseCompanyRow[];
  title: string;
  subtitle: string;
}

const STYLES = {
  tickerPill: "inline-flex justify-center items-center w-24 font-mono font-bold text-blue-400 bg-blue-950/40 px-2 py-1 rounded border border-blue-800/50 text-xs",
  companyName: "font-semibold text-white tracking-wide",
  secondaryText: "text-gray-300",
  badgeBase: "px-2 py-1 border rounded text-xs inline-block text-center",
  badgeTrue: "bg-green-900/50 text-green-400 border-green-700",
  badgeFalse: "bg-gray-800 text-gray-400 border-gray-700",
};

function formatMarketCap(value?: number) {
  if (!value) return "-";
  if (value >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(1)} T`;
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} M`;
  return value.toLocaleString("es-ES");
}

export function CompanyTable({ empresas, title, subtitle }: CompanyTableProps) {
  const renderDividend = (empresa: SupabaseCompanyRow) => (
    <span className={`${STYLES.badgeBase} ${empresa.es_dividendo ? STYLES.badgeTrue : STYLES.badgeFalse}`}>
      {empresa.es_dividendo ? "Sí" : "No"}
    </span>
  );

  const columns: Column<SupabaseCompanyRow>[] = [
    { header: "Ticker", sortValue: (empresa) => empresa.ticker, render: (empresa) => <span className={STYLES.tickerPill}>{empresa.ticker}</span> },
    { header: "Nombre", sortValue: (empresa) => empresa.nombre, render: (empresa) => empresa.nombre, cellClassName: STYLES.companyName },
    { header: "Tipo", render: (empresa) => empresa.tipo_activo || "-", cellClassName: STYLES.secondaryText },
    { header: "Sector", render: (empresa) => empresa.sector || "Desconocido", cellClassName: STYLES.secondaryText },
    { header: "Capitalización", render: (empresa) => formatMarketCap(empresa.capitalizacion), cellClassName: STYLES.secondaryText },
    { header: "¿Dividendo?", render: renderDividend },
  ];

  return <DataTable title={title} subtitle={subtitle} data={empresas} columns={columns} rowKey={(empresa) => empresa.id} initialSortIndex={0} recordsLabel="empresas" emptyMessage="No hay empresas en esta categoría."
    mobileRow={(empresa, expanded, toggle) => (
      <div className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
        <button type="button" onClick={toggle} className="flex w-full items-center justify-between gap-3 p-4 text-left" aria-expanded={expanded}>
          <span className="truncate font-semibold text-white">{empresa.nombre}</span>
          <ChevronDown className={`shrink-0 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`} size={18} />
        </button>
        {expanded && <div className="grid grid-cols-2 gap-3 border-t border-gray-800 px-4 py-4 text-sm">
          <div><p className="text-gray-500">Ticker</p><p className="mt-1"><span className={STYLES.tickerPill}>{empresa.ticker}</span></p></div>
          <div><p className="text-gray-500">Sector</p><p className="text-gray-200">{empresa.sector || "Desconocido"}</p></div>
          <div><p className="text-gray-500">Tipo</p><p className="text-gray-200">{empresa.tipo_activo || "-"}</p></div>
          <div><p className="text-gray-500">Capitalización</p><p className="text-gray-200">{formatMarketCap(empresa.capitalizacion)}</p></div>
          <div><p className="text-gray-500">Dividendo</p><p className="mt-1">{renderDividend(empresa)}</p></div>
        </div>}
      </div>
    )}
  />;
}