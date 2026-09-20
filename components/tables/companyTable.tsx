"use client";

import { ArrowDown, ArrowUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { SupabaseCompanyRow } from "@/infrastructure/repositories/upabase-companies.types";

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

const PAGE_SIZE = 10;
type SortKey = "ticker" | "nombre";
type SortDirection = "asc" | "desc";

export function CompanyTable({ empresas, title, subtitle }: CompanyTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("ticker");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const pageCount = Math.max(1, Math.ceil(empresas.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, pageCount);
  const sortedCompanies = [...empresas].sort((first, second) => {
    const comparison = first[sortKey].localeCompare(second[sortKey], "es", {
      sensitivity: "base",
      numeric: true,
    });

    return sortDirection === "asc" ? comparison : -comparison;
  });
  const visibleCompanies = sortedCompanies.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const goToPage = (page: number) => {
    setCurrentPage(page);
    setExpandedId(null);
  };

  const sortBy = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((direction) => direction === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }

    setCurrentPage(1);
    setExpandedId(null);
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return null;

    return sortDirection === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  const renderDividend = (empresa: SupabaseCompanyRow) => (
    <span className={`${STYLES.badgeBase} ${empresa.es_dividendo ? STYLES.badgeTrue : STYLES.badgeFalse}`}>
      {empresa.es_dividendo ? "Sí" : "No"}
    </span>
  );

  return (
    <section className="text-white">
      <h2 className="mb-2 text-2xl font-bold">{title}</h2>
      <p className="mb-6 text-gray-400">{subtitle}</p>

      <div className="hidden overflow-x-auto rounded-lg border border-gray-800 bg-gray-900 shadow-lg md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900/50 text-sm text-gray-400">
              <th className="p-4">
                <button type="button" onClick={() => sortBy("ticker")} className="inline-flex items-center gap-2 hover:text-white" title="Ordenar por ticker">
                  Ticker {renderSortIcon("ticker")}
                </button>
              </th>
              <th className="p-4">
                <button type="button" onClick={() => sortBy("nombre")} className="inline-flex items-center gap-2 hover:text-white" title="Ordenar por nombre">
                  Nombre {renderSortIcon("nombre")}
                </button>
              </th>
              <th className="p-4">Sector</th>
              <th className="p-4">Precio</th>
              <th className="p-4">Volumen</th>
              <th className="p-4">¿Dividendo?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 text-sm">
            {visibleCompanies.map((empresa) => (
              <tr key={empresa.id} className="hover:bg-gray-850">
                <td className="p-4"><span className={STYLES.tickerPill}>{empresa.ticker}</span></td>
                <td className={`p-4 ${STYLES.companyName}`}>{empresa.nombre}</td>
                <td className={`p-4 ${STYLES.secondaryText}`}>{empresa.sector || "Desconocido"}</td>
                <td className={`p-4 ${STYLES.secondaryText}`}>${empresa.precio?.toFixed(2) ?? "0.00"}</td>
                <td className={`p-4 ${STYLES.secondaryText}`}>{empresa.volumen?.toLocaleString() ?? 0}</td>
                <td className="p-4">{renderDividend(empresa)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 md:hidden">
        {visibleCompanies.map((empresa) => {
          const expanded = expandedId === empresa.id;

          return (
            <div key={empresa.id} className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : empresa.id)}
                className="flex w-full items-center justify-between gap-3 p-4 text-left"
                aria-expanded={expanded}
              >
                <span>
                  <span className={STYLES.tickerPill}>{empresa.ticker}</span>
                  <span className="mt-2 block font-semibold text-white">{empresa.nombre}</span>
                </span>
                <ChevronDown className={`shrink-0 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`} size={18} />
              </button>

              {expanded && (
                <div className="grid grid-cols-2 gap-3 border-t border-gray-800 px-4 py-4 text-sm">
                  <div><p className="text-gray-500">Sector</p><p className="text-gray-200">{empresa.sector || "Desconocido"}</p></div>
                  <div><p className="text-gray-500">Precio</p><p className="text-gray-200">${empresa.precio?.toFixed(2) ?? "0.00"}</p></div>
                  <div><p className="text-gray-500">Volumen</p><p className="text-gray-200">{empresa.volumen?.toLocaleString() ?? 0}</p></div>
                  <div><p className="text-gray-500">Dividendo</p><p className="mt-1">{renderDividend(empresa)}</p></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {empresas.length === 0 && (
        <p className="rounded-lg border border-dashed border-gray-700 px-4 py-8 text-center text-sm text-gray-500">
          No hay empresas en esta categoría.
        </p>
      )}

      <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
        <span>{empresas.length} empresas</span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => goToPage(safePage - 1)} disabled={safePage === 1} className="rounded border border-gray-700 p-2 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Página anterior" title="Página anterior">
            <ChevronLeft size={16} />
          </button>
          <span>Página {safePage} de {pageCount}</span>
          <button type="button" onClick={() => goToPage(safePage + 1)} disabled={safePage === pageCount} className="rounded border border-gray-700 p-2 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Página siguiente" title="Página siguiente">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}