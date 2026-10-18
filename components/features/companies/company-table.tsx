"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { CompanyRecord, CompanyScanQuote } from "@/domain/models/trading";
import { DIVIDEND_TIERS } from "@/domain/constants";
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
  getScanQuoteChangePercent,
  renderCompanyScannedPrice,
} from "./company-columns";
import { DividendBadge } from "@/components/ui/core/trading-cells";
import { FollowButton } from "@/components/common/follow-button";
import { DataTable } from "@/components/ui/core/DataTable";
import { OperationDialog } from "@/components/features/operations/shared/operation-dialog";
import { OpenOperationButton } from "../operations/shared/open-operation-button";

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
  const router = useRouter();
  const [selectedCompany, setSelectedCompany] = useState<CompanyRecord | null>(null);
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
        const changePercent = getScanQuoteChangePercent(scanQuoteByCompanyId.get(empresa.id));
        if (changePercent === null) return false;
        if (priceFilter === "up" && changePercent <= 0) return false;
        if (priceFilter === "down" && changePercent >= 0) return false;
      }

      // Filtrado ampliado de dividendos
      if (dividendFilter === "yes" && !empresa.es_dividendo) return false;
      if (dividendFilter === "king" && empresa.dividend_tier !== DIVIDEND_TIERS.KING) return false;
      if (dividendFilter === "aristocrat" && empresa.dividend_tier !== DIVIDEND_TIERS.ARISTOCRAT) return false;
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
    () => getCompanyColumns(scanQuoteByCompanyId, setSelectedCompany),
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
        showMobileSort
        emptyMessage={
          normalizedSearchTerm
            ? UI_TEXT.table.emptyStates.noCompaniesMatchSearch
            : UI_TEXT.table.emptyStates.companies
        }
        mobileRow={(empresa, expanded, toggle) => (
          <div className={UI_STYLES.table.mobileRow}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 py-2 pl-1">
                <FollowButton ticker={empresa.ticker} />              
              </div>

              <button
                type="button"
                onClick={toggle}
                className={`${UI_STYLES.table.mobileRowButton} flex-1`}
                aria-expanded={expanded}
              >
                {/* Agrupamos nombre e icono juntos para que mantengan una distancia estrecha */}
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className={UI_STYLES.table.mobileRowTitle}>
                    {empresa.nombre}
                  </span>
                  <DividendBadge empresa={empresa} hideYield={true} />
                </span>

                <ChevronDown
                  className={`${UI_STYLES.table.mobileRowIcon} ${
                    expanded ? "rotate-180" : ""
                  }`}
                  size={18}
                />
              </button>
            </div>

            {expanded && (
              <div className={UI_STYLES.table.mobileDetails}>
                <div>
                  <p className={UI_STYLES.table.mobileLabel}>
                    {UI_TEXT.table.columns.ticker}
                  </p>          <p className={`mt-1 ${UI_STYLES.badge.ticker}`}>
                    {empresa.ticker}
                  </p>
                </div>

                <div>
                  <p className={UI_STYLES.table.mobileLabel}>
                    {UI_TEXT.table.columns.lastPrice}
                  </p>
                  <div className="mt-1">
                    {renderCompanyScannedPrice(empresa, scanQuoteByCompanyId)}
                  </div>
                </div>

                <div>
                  <p className={UI_STYLES.table.mobileLabel}>
                    {UI_TEXT.table.columns.sector}
                  </p>
                  <p className={UI_STYLES.table.mobileValue}>
                    {empresa.sector || UI_TEXT.table.values.unknownSector}
                  </p>
                </div>

                <div>
                  <p className={UI_STYLES.table.mobileLabel}>
                    {UI_TEXT.table.columns.dividend}
                  </p>
                  <p className="mt-1 font-medium text-slate-700">
                    {empresa.es_dividendo ? (
                      empresa.dividend_yield
                        ? `${(empresa.dividend_yield * 100).toFixed(2)}%`
                        : empresa.dividend_rate
                        ? `${empresa.dividend_rate}%`
                        : "Sí"
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </p>
                </div>

                {empresa.ticker === undefined ? null : (
                  <OpenOperationButton
                    ticker={empresa.ticker}
                    onClick={() => setSelectedCompany(empresa)}
                  />
                )}
              </div>
            )}
          </div>
        )}
      />

      {selectedCompany && (
        <OperationDialog
          companyId={selectedCompany.id}
          ticker={selectedCompany.ticker}
          companyName={selectedCompany.nombre}
          precioActual={scanQuoteByCompanyId.get(selectedCompany.id)?.price ?? selectedCompany.precio}
          onClose={() => setSelectedCompany(null)}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
}