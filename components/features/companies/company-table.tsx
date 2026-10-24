"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CompanyRecord, CompanyScanQuote } from "@/domain/models/trading";
import { APP_CONFIG, DIVIDEND_TIERS, MARKET_SESSIONS, MarketSessionFilter } from "@/domain/constants";
import { AssetKind } from "@/domain/rules/asset-type.rules";
import { UI_TEXT } from "@/domain/literales.constantes";
import { useMarketClock } from "@/components/common/market-status";
import { getMarketStatus } from "@/domain/rules/market-status.rules";
import {
  CompanyFilters,
  DividendFilter,
  FILTER_ALL,
  MarketStatusFilter,
  PriceFilter,
} from "./company-filters";
import {
  getCompanyColumns,
  getScanQuoteChangePercent,
} from "./company-columns";
import { DataTable } from "@/components/ui/core/data-table";
import { renderCompanyMobileRow } from "./company-mobile-row";

export interface CompanyTableProps {
  empresas: CompanyRecord[];
  title: string;
  scanQuotes: CompanyScanQuote[];
  sectores: string[];
  // Pestaña a la que pertenece la tabla. Por defecto es la de acciones, igual que antes.
  assetKind?: AssetKind;
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
  assetKind = APP_CONFIG.ASSET_TYPES.EQUITY,
}: CompanyTableProps) {
  const router = useRouter();
  const kindText = UI_TEXT.assetKinds[assetKind];
  const isEtfTable = assetKind === APP_CONFIG.ASSET_TYPES.ETF;
  const [searchTerm, setSearchTerm] = useState("");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>(FILTER_ALL);
  const [dividendFilter, setDividendFilter] = useState<DividendFilter>(FILTER_ALL);
  const [sectorFilter, setSectorFilter] = useState<string>(FILTER_ALL);
  const [marketSessionFilter, setMarketSessionFilter] = useState<MarketSessionFilter>("all");
  const [marketStatusFilter, setMarketStatusFilter] = useState<MarketStatusFilter>(FILTER_ALL);
  const marketClock = useMarketClock();
  // Con "Todas" el reloj no interviene: así la lista no se recalcula cada minuto sin necesidad.
  const statusFilterClock = marketStatusFilter === "open" ? marketClock : null;

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

      // FILTRAR POR SESIÓN DE MERCADO ──
      if (marketSessionFilter !== MARKET_SESSIONS.ALL && empresa.sesion_mercado !== marketSessionFilter) {
        return false;
      }

      // Solo cuenta la sesión regular. Sin hora (antes de montar la página) no se puede saber: no se muestra.
      if (marketStatusFilter === "open") {
        if (!statusFilterClock || getMarketStatus(empresa.bolsa, statusFilterClock) !== "REGULAR") return false;
      }

      if (sectorFilter !== FILTER_ALL && getCompanySector(empresa) !== sectorFilter)
        return false;

      return true;
    });
  }, [
    empresas,
    normalizedSearchTerm,
    priceFilter,
    dividendFilter,
    marketSessionFilter,
    marketStatusFilter,
    statusFilterClock,
    sectorFilter,
    scanQuoteByCompanyId,
  ]);

  const columns = useMemo(
    () => getCompanyColumns(scanQuoteByCompanyId, () => router.refresh()),
    [scanQuoteByCompanyId, router]
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
        marketSessionFilter={marketSessionFilter}
        onMarketSessionFilterChange={setMarketSessionFilter}
        marketStatusFilter={marketStatusFilter}
        onMarketStatusFilterChange={setMarketStatusFilter}
        sectores={sectores}
        showEquityFilters={!isEtfTable}
      />

      <DataTable
        title={title}
        data={visibleCompanies}
        columns={columns}
        rowKey={(empresa) => empresa.id}
        initialSortIndex={1}
        recordsLabel={kindText.recordsLabel}
        showMobileSort
        emptyMessage={normalizedSearchTerm ? kindText.emptySearch : kindText.emptyTable}
        mobileRow={(empresa, expanded, toggle) =>
          renderCompanyMobileRow(empresa, expanded, toggle, scanQuoteByCompanyId, () => router.refresh())
        }
      />
    </div>
  );
}