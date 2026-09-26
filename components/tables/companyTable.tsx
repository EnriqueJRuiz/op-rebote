"use client";

import { useState } from "react";
import { ChessBishop, ChevronDown, Crown, RotateCcw, Search } from "lucide-react";
import { Column, DataTable } from "@/components/tables/core/DataTable";
import { DIVIDEND_TIERS } from "@/domain/constants";
import { CompanyRecord, CompanyScanQuote } from "@/domain/models/trading";
import { UI_TEXT } from "@/domain/literales.constantes";

interface CompanyTableProps {
  empresas: CompanyRecord[];
  title: string;
  scanQuotes: CompanyScanQuote[];
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

const FILTER_ALL = "all" as const;

type PriceFilter = typeof FILTER_ALL | "up" | "down";
type DividendFilter = typeof FILTER_ALL | "yes" | "no";

interface FilterOption<Value extends string> {
  value: Value;
  label: string;
}

const PRICE_FILTER_OPTIONS: FilterOption<PriceFilter>[] = [
  { value: FILTER_ALL, label: UI_TEXT.table.filters.priceAll },
  { value: "up", label: UI_TEXT.table.filters.priceUp },
  { value: "down", label: UI_TEXT.table.filters.priceDown },
];

const DIVIDEND_FILTER_OPTIONS: FilterOption<DividendFilter>[] = [
  { value: FILTER_ALL, label: UI_TEXT.table.filters.dividendAll },
  { value: "yes", label: UI_TEXT.table.filters.dividendYes },
  { value: "no", label: UI_TEXT.table.filters.dividendNo },
];

function TableFilterSelect<Value extends string>({
  id,
  label,
  value,
  options,
  onChange,
  className = "",
}: {
  id: string;
  label: string;
  value: Value;
  options: FilterOption<Value>[];
  onChange: (value: Value) => void;
  className?: string;
}) {
  return (
    <div className={`relative min-w-0 ${className}`}>
      <label htmlFor={id} className="sr-only">{label}</label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value as Value)}
        className="h-10 w-full appearance-none rounded-md border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm text-slate-700 shadow-sm outline-none transition-colors hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      >
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} aria-hidden="true" />
    </div>
  );
}

function getCompanySector(empresa: CompanyRecord) {
  return empresa.sector?.trim() || UI_TEXT.table.values.unknownSector;
}


function formatDividendYield(value?: number) {
  if (!Number.isFinite(value) || !value || value <= 0) return UI_TEXT.table.values.notAvailable;
  return `${(value * 100).toFixed(2)}${UI_TEXT.table.formatting.percentageUnit}`;
}

function formatScannedPrice(value: number, currency?: string) {
  const formatted = value.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return currency ? `${formatted} ${currency}` : formatted;
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-ES");
}

export function CompanyTable({ empresas, title, scanQuotes }: CompanyTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>(FILTER_ALL);
  const [dividendFilter, setDividendFilter] = useState<DividendFilter>(FILTER_ALL);
  const [sectorFilter, setSectorFilter] = useState(FILTER_ALL);
  const normalizedSearchTerm = normalizeSearch(searchTerm.trim());
  
  const scanQuoteByCompanyId = new Map(scanQuotes.map((quote) => [quote.companyId, quote]));
  const sectors = [...new Set(empresas.map(getCompanySector))]
    .sort((first, second) => first.localeCompare(second, "es"));
  const sectorOptions: FilterOption<string>[] = [
    { value: FILTER_ALL, label: UI_TEXT.table.filters.sectorAll },
    ...sectors.map((sector) => ({ value: sector, label: sector })),
  ];

  const visibleCompanies = empresas.filter((empresa) => {
    const matchesSearch = !normalizedSearchTerm || normalizeSearch(`${empresa.nombre} ${empresa.ticker}`).includes(normalizedSearchTerm);
    if (!matchesSearch) return false;

    if (priceFilter !== "all") {
      const quote = scanQuoteByCompanyId.get(empresa.id);
      if (!quote || !Number.isFinite(quote.price) || quote.price <= 0) {
        return false;
      }
      if (!quote.previousDayPrice || quote.previousDayPrice <= 0) {
        return false;
      }
      const changePercent = ((quote.price - quote.previousDayPrice) / quote.previousDayPrice) * 100;
      if (priceFilter === "up" && changePercent <= 0) return false;
      if (priceFilter === "down" && changePercent >= 0) return false;
    }

    if (dividendFilter === "yes" && !empresa.es_dividendo) return false;
    if (dividendFilter === "no" && empresa.es_dividendo) return false;
    if (sectorFilter !== FILTER_ALL && getCompanySector(empresa) !== sectorFilter) return false;

    return true;
  });
  const searchInputId = `company-search-${title.toLowerCase().replace(/\s+/g, "-")}`;
  const sectorInputId = `company-sector-${title.toLowerCase().replace(/\s+/g, "-")}`;
  const hasActiveFilters = Boolean(normalizedSearchTerm)
    || priceFilter !== FILTER_ALL
    || dividendFilter !== FILTER_ALL
    || sectorFilter !== FILTER_ALL;

  const clearFilters = () => {
    setSearchTerm("");
    setPriceFilter(FILTER_ALL);
    setDividendFilter(FILTER_ALL);
    setSectorFilter(FILTER_ALL);
  };

  const renderScannedPrice = (empresa: CompanyRecord) => {
    const quote = scanQuoteByCompanyId.get(empresa.id);
    if (!quote || !Number.isFinite(quote.price) || quote.price <= 0) {
      return <span className={STYLES.secondaryText}>{UI_TEXT.table.values.notAvailable}</span>;
    }

    const changePercent = quote.previousDayPrice && quote.previousDayPrice > 0
      ? ((quote.price - quote.previousDayPrice) / quote.previousDayPrice) * 100
      : undefined;
    const changeStyle = changePercent === undefined
      ? ""
      : changePercent > 0
        ? "text-emerald-700"
        : changePercent < 0
          ? "text-rose-700"
          : "text-slate-500";

    return (
      <span className="inline-flex items-center whitespace-nowrap">
        {/* Precio */}
        <span className="inline-block w-22.5 text-right font-medium text-slate-800">
          {formatScannedPrice(quote.price, empresa.moneda)}
        </span>

        {/* Variación */}
        {changePercent !== undefined && (
          <span
            className={`ml-2 inline-flex w-14.5 items-center gap-0.5 text-xs font-medium ${changeStyle}`}
            title={UI_TEXT.table.columns.previousDayChange}
            aria-label={`${UI_TEXT.table.columns.previousDayChange}: ${changePercent.toFixed(2)}%`}
          >
            <span aria-hidden="true">
              {changePercent >= 0 ? "▲" : "▼"}
            </span>
            {Math.abs(changePercent).toFixed(2)}%
          </span>
        )}
      </span>
    );
  };

  const renderDividend = (empresa: CompanyRecord) => {
    const tierLabel =
      empresa.dividend_tier === DIVIDEND_TIERS.KING
        ? UI_TEXT.table.values.dividendKing
        : empresa.dividend_tier === DIVIDEND_TIERS.ARISTOCRAT
          ? UI_TEXT.table.values.dividendAristocrat
          : undefined;

    const TierIcon =
      empresa.dividend_tier === DIVIDEND_TIERS.KING
        ? Crown
        : ChessBishop;

    const tierStyle =
      empresa.dividend_tier === DIVIDEND_TIERS.KING
        ? STYLES.dividendKing
        : STYLES.dividendAristocrat;

    return (
      <span className="inline-flex w-22.5 items-center justify-center">
        {empresa.es_dividendo ? (
          <>
            <span
              className="w-13 text-right text-sm tabular-nums text-slate-700"
              title={UI_TEXT.table.columns.dividendYield}
            >
              {formatDividendYield(empresa.dividend_yield)}
            </span>

            <span className="ml-2 flex w-4 justify-center">
              {tierLabel && (
                <span
                  className={tierStyle}
                  title={tierLabel}
                  aria-label={tierLabel}
                >
                  <TierIcon size={14} aria-hidden="true" />
                </span>
              )}
            </span>
          </>
        ) : (
          <span className="w-13 text-center text-slate-400">
            —
          </span>
        )}
      </span>
    );
  };

  const columns: Column<CompanyRecord>[] = [
    { header: UI_TEXT.table.columns.name, sortValue: (empresa) => empresa.nombre, render: (empresa) => <span className={STYLES.companyName}>{empresa.nombre}</span> },
    { header: UI_TEXT.table.columns.ticker, sortValue: (empresa) => empresa.ticker, render: (empresa) => <span className={STYLES.ticker}>{empresa.ticker}</span> },
    { header: UI_TEXT.table.columns.lastPrice, sortValue: (empresa) => scanQuoteByCompanyId.get(empresa.id)?.price, render: renderScannedPrice },
    { header: UI_TEXT.table.columns.sector, render: (empresa) => empresa.sector || UI_TEXT.table.values.unknownSector, cellClassName: STYLES.secondaryText },
    { header: UI_TEXT.table.columns.dividend, render: renderDividend },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Búsqueda */}
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} aria-hidden="true" />

          <label htmlFor={searchInputId} className="sr-only" > {UI_TEXT.table.columns.searchByNameOrTicker} </label>
          <input id={searchInputId} type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder={UI_TEXT.table.columns.searchByNameOrTicker}
            className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Último precio */}
        <select value={priceFilter} onChange={(event) =>  setPriceFilter(event.target.value as "all" | "up" | "down") }
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          aria-label="Filtrar por último precio"
        >
          <option value="all">Último precio: Todos</option>
          <option value="up">Último precio: Subida</option>
          <option value="down">Último precio: Bajada</option>
        </select>

        {/* Dividendo */}
        <select value={dividendFilter} onChange={(event) => setDividendFilter(event.target.value as "all" | "yes" | "no") }
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          aria-label="Filtrar por dividendo"
        >
          <option value="all">Dividendo: Todos</option>
          <option value="yes">Dividendo: Sí</option>
          <option value="no">Dividendo: No</option>
        </select>
      </div>
      <DataTable title={title} data={visibleCompanies} columns={columns} rowKey={(empresa) => empresa.id} initialSortIndex={0} recordsLabel={UI_TEXT.table.pagination.companyRecords} emptyMessage={normalizedSearchTerm ? UI_TEXT.table.emptyStates.noCompaniesMatchSearch : UI_TEXT.table.emptyStates.companies}
        mobileRow={(empresa, expanded, toggle) => (
          <div className="overflow-hidden last:border-b-0">
            <button type="button" onClick={toggle} className="flex w-full cursor-pointer items-center justify-between gap-3 py-4 text-left transition-colors hover:bg-blue-50/45" aria-expanded={expanded}>
              <span className="truncate font-semibold text-slate-800">{empresa.nombre}</span>
              <ChevronDown className={`shrink-0 text-slate-500 transition-transform ${expanded ? "rotate-180" : ""}`} size={18} />
            </button>
            {expanded && <div className="grid grid-cols-2 gap-3 border-t border-slate-200 bg-slate-50/70 px-4 py-4 text-sm">
              <div><p className="text-slate-500">{UI_TEXT.table.columns.ticker}</p><p className={`mt-1 ${STYLES.ticker}`}>{empresa.ticker}</p></div>
              <div><p className="text-slate-500">{UI_TEXT.table.columns.lastPrice}</p><p className="mt-1">{renderScannedPrice(empresa)}</p></div>
              <div><p className="text-slate-500">{UI_TEXT.table.columns.sector}</p><p className="text-slate-700">{empresa.sector || UI_TEXT.table.values.unknownSector}</p></div>
              <div><p className="text-slate-500">{UI_TEXT.table.columns.dividend}</p><p className="mt-1">{renderDividend(empresa)}</p></div>
            </div>}
          </div>
        )}
      />
    </div>
  );
}