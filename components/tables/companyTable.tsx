"use client";

import { useState } from "react";
import { ChessBishop, ChevronDown, Crown, Search } from "lucide-react";
import { Column, DataTable } from "@/components/tables/core/DataTable";
import { DIVIDEND_TIERS } from "@/domain/constants";
import { CompanyRecord, CompanyScanQuote } from "@/domain/models/trading";
import { UI_TEXT } from "@/domain/literales.constantes";
import { UI_STYLES } from "@/styles/ui-styles";

interface CompanyTableProps {
  empresas: CompanyRecord[];
  title: string;
  scanQuotes: CompanyScanQuote[];
  sectores: string[];
}

// Solo lo que NO tiene equivalente en UI_STYLES (colores propios del tier de dividendo)
const STYLES = {
  companyName: "font-bold text-slate-900",
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
        className={UI_STYLES.filter.select}
      >
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 ${UI_STYLES.filter.icon}`} size={15} aria-hidden="true" />
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

export function CompanyTable({ empresas, title, scanQuotes, sectores }: CompanyTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>(FILTER_ALL);
  const [dividendFilter, setDividendFilter] = useState<DividendFilter>(FILTER_ALL);
  const [sectorFilter, setSectorFilter] = useState<string>(FILTER_ALL);
  const normalizedSearchTerm = normalizeSearch(searchTerm.trim());
  
  const scanQuoteByCompanyId = new Map(scanQuotes.map((quote) => [quote.companyId, quote]));
  const sectorLabel = UI_TEXT.table.columns.sector;
  const sectorOptions: FilterOption<string>[] = [
    { value: FILTER_ALL, label: `${sectorLabel}: Todos` },
    ...sectores.map((sector) => ({ value: sector, label: `${sectorLabel}: ${sector}` })),
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
  
  const renderScannedPrice = (empresa: CompanyRecord) => {
    const quote = scanQuoteByCompanyId.get(empresa.id);
    if (!quote || !Number.isFinite(quote.price) || quote.price <= 0) {
      return <span className={UI_STYLES.text.secondary}>{UI_TEXT.table.values.notAvailable}</span>;
    }

    const changePercent = quote.previousDayPrice && quote.previousDayPrice > 0
      ? ((quote.price - quote.previousDayPrice) / quote.previousDayPrice) * 100
      : undefined;
    const changeStyle = changePercent === undefined
      ? ""
      : changePercent > 0
        ? UI_STYLES.badge.success
        : changePercent < 0
          ? UI_STYLES.badge.danger
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
    { header: UI_TEXT.table.columns.ticker, sortValue: (empresa) => empresa.ticker, render: (empresa) => <span className={UI_STYLES.badge.ticker}>{empresa.ticker}</span> },
    { header: UI_TEXT.table.columns.lastPrice, sortValue: (empresa) => scanQuoteByCompanyId.get(empresa.id)?.price, render: renderScannedPrice },
    { header: UI_TEXT.table.columns.sector, render: (empresa) => empresa.sector || UI_TEXT.table.values.unknownSector, cellClassName: UI_STYLES.text.secondary },
    { header: UI_TEXT.table.columns.dividend, render: renderDividend },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Búsqueda */}
        <div className="relative w-full sm:min-w-60 sm:flex-1">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${UI_STYLES.filter.icon}`} size={16} aria-hidden="true" />

          <label htmlFor={searchInputId} className="sr-only" > {UI_TEXT.table.columns.searchByNameOrTicker} </label>
          <input id={searchInputId} type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder={UI_TEXT.table.columns.searchByNameOrTicker}
            className={UI_STYLES.filter.input}
          />
        </div>

        {/* Último precio */}
        <TableFilterSelect
          id={`company-price-${title.toLowerCase().replace(/\s+/g, "-")}`}
          label={UI_TEXT.table.filters.priceAriaLabel}
          value={priceFilter}
          options={PRICE_FILTER_OPTIONS}
          onChange={setPriceFilter}
          className="sm:min-w-48 sm:flex-none"
        />

        {/* Sector */}
        <TableFilterSelect
          id={sectorInputId}
          label={UI_TEXT.table.filters.sectorAriaLabel}
          value={sectorFilter}
          options={sectorOptions}
          onChange={setSectorFilter}
          className="sm:min-w-48 sm:flex-none"
        />

        {/* Dividendo */}
        <TableFilterSelect
          id={`company-dividend-${title.toLowerCase().replace(/\s+/g, "-")}`}
          label={UI_TEXT.table.filters.dividendAriaLabel}
          value={dividendFilter}
          options={DIVIDEND_FILTER_OPTIONS}
          onChange={setDividendFilter}
          className="sm:min-w-48 sm:flex-none"
        />
      </div>
      <DataTable title={title} data={visibleCompanies} columns={columns} rowKey={(empresa) => empresa.id} initialSortIndex={0} recordsLabel={UI_TEXT.table.pagination.companyRecords} emptyMessage={normalizedSearchTerm ? UI_TEXT.table.emptyStates.noCompaniesMatchSearch : UI_TEXT.table.emptyStates.companies}
        mobileRow={(empresa, expanded, toggle) => (
          <div className={UI_STYLES.table.mobileRow}>
            <button type="button" onClick={toggle} className={UI_STYLES.table.mobileRowButton} aria-expanded={expanded}>
              <span className={UI_STYLES.table.mobileRowTitle}>{empresa.nombre}</span>
              <ChevronDown className={`${UI_STYLES.table.mobileRowIcon} ${expanded ? "rotate-180" : ""}`} size={18} />
            </button>
            {expanded && <div className={UI_STYLES.table.mobileDetails}>
              <div><p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.ticker}</p><p className={`mt-1 ${UI_STYLES.badge.ticker}`}>{empresa.ticker}</p></div>
              <div><p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.lastPrice}</p><p className="mt-1">{renderScannedPrice(empresa)}</p></div>
              <div><p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.sector}</p><p className={UI_STYLES.table.mobileValue}>{empresa.sector || UI_TEXT.table.values.unknownSector}</p></div>
              <div><p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.dividend}</p><p className="mt-1">{renderDividend(empresa)}</p></div>
            </div>}
          </div>
        )}
      />
    </div>
  );
}