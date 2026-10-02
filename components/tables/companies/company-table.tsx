"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { DataTable } from "@/components/tables/core/DataTable";
import { FollowButton } from "@/components/buttons/follow-button";
import { DividendBadge } from "@/components/tables/common/trading-cells";
import { CompanyRecord, CompanyScanQuote } from "@/domain/models/trading";
import { UI_TEXT } from "@/domain/literales.constantes";
import { UI_STYLES } from "@/styles/ui-styles";
import {
  CompanyFilters,
  DividendFilter,
  FILTER_ALL,
  PriceFilter,
} from "./company-filters";
import {
  getCompanyColumns,
  renderCompanyScannedPrice,
} from "./company-columns";

export interface CompanyTableProps {
  empresas: CompanyRecord[];
  title: string;
  scanQuotes: CompanyScanQuote[];
  sectores: string[];
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-ES");
}

function getCompanySector(empresa: CompanyRecord) {
  return empresa.sector?.trim() || UI_TEXT.table.values.unknownSector;
}

export function CompanyTable({
  empresas,
  title,
  scanQuotes,
  sectores,
}: CompanyTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>(FILTER_ALL);
  const [dividendFilter, setDividendFilter] = useState<DividendFilter>(FILTER_ALL);
  const [sectorFilter, setSectorFilter] = useState<string>(FILTER_ALL);

  const scanQuoteByCompanyId = useMemo(
    () => new Map(scanQuotes.map((quote) => [quote.companyId, quote])),
    [scanQuotes]
  );

  const normalizedSearchTerm = normalizeSearch(searchTerm.trim());

  const visibleCompanies = useMemo(() => {
    return empresas.filter((empresa) => {
      const matchesSearch =
        !normalizedSearchTerm ||
        normalizeSearch(`${empresa.nombre} ${empresa.ticker}`).includes(
          normalizedSearchTerm
        );
      if (!matchesSearch) return false;

      if (priceFilter !== FILTER_ALL) {
        const quote = scanQuoteByCompanyId.get(empresa.id);
        if (!quote || !Number.isFinite(quote.price) || quote.price <= 0) {
          return false;
        }
        if (!quote.previousDayPrice || quote.previousDayPrice <= 0) {
          return false;
        }
        const changePercent =
          ((quote.price - quote.previousDayPrice) / quote.previousDayPrice) * 100;
        if (priceFilter === "up" && changePercent <= 0) return false;
        if (priceFilter === "down" && changePercent >= 0) return false;
      }

      if (dividendFilter === "yes" && !empresa.es_dividendo) return false;
      if (dividendFilter === "no" && empresa.es_dividendo) return false;
      if (sectorFilter !== FILTER_ALL && getCompanySector(empresa) !== sectorFilter)
        return false;

      return true;
    });
  }, [
    empresas,
    normalizedSearchTerm,
    priceFilter,
    dividendFilter,
    sectorFilter,
    scanQuoteByCompanyId,
  ]);

  const columns = useMemo(
    () => getCompanyColumns(scanQuoteByCompanyId),
    [scanQuoteByCompanyId]
  );

  return (
    <div className="space-y-3">
      <CompanyFilters
        title={title}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        priceFilter={priceFilter}
        onPriceFilterChange={setPriceFilter}
        sectorFilter={sectorFilter}
        onSectorFilterChange={setSectorFilter}
        dividendFilter={dividendFilter}
        onDividendFilterChange={setDividendFilter}
        sectores={sectores}
      />

      <DataTable
        title={title}
        data={visibleCompanies}
        columns={columns}
        rowKey={(empresa) => empresa.id}
        initialSortIndex={1}
        recordsLabel={UI_TEXT.table.pagination.companyRecords}
        emptyMessage={
          normalizedSearchTerm
            ? UI_TEXT.table.emptyStates.noCompaniesMatchSearch
            : UI_TEXT.table.emptyStates.companies
        }
        mobileRow={(empresa, expanded, toggle) => (
          <div className={UI_STYLES.table.mobileRow}>
            <div className="flex items-center justify-between gap-2">
              <div className="py-2 pl-1">
                <FollowButton ticker={empresa.ticker} />
              </div>
              <button
                type="button"
                onClick={toggle}
                className={`${UI_STYLES.table.mobileRowButton} flex-1`}
                aria-expanded={expanded}
              >
                <span className={UI_STYLES.table.mobileRowTitle}>{empresa.nombre}</span>
                <ChevronDown
                  className={`${UI_STYLES.table.mobileRowIcon} ${expanded ? "rotate-180" : ""}`}
                  size={18}
                />
              </button>
            </div>
            {expanded && (
              <div className={UI_STYLES.table.mobileDetails}>
                <div>
                  <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.ticker}</p>
                  <p className={`mt-1 ${UI_STYLES.badge.ticker}`}>{empresa.ticker}</p>
                </div>
                <div>
                  <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.lastPrice}</p>
                  <p className="mt-1">{renderCompanyScannedPrice(empresa, scanQuoteByCompanyId)}</p>
                </div>
                <div>
                  <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.sector}</p>
                  <p className={UI_STYLES.table.mobileValue}>
                    {empresa.sector || UI_TEXT.table.values.unknownSector}
                  </p>
                </div>
                <div>
                  <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.dividend}</p>
                  <p className="mt-1">
                    <DividendBadge empresa={empresa} />
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      />
    </div>
  );
}
