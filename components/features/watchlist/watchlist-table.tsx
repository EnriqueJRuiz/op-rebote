"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useWatchlist } from "@/context/watchlist-context";
import { UI_TEXT } from "@/domain/literales.constantes";
import { WatchlistRowData, WatchlistTableProps } from "./watchlist-types";
import { WatchlistSummary } from "./watchlist-summary";
import { AssetTypeFilter, WatchlistFilters } from "./watchlist-filters";
import { matchesAssetKind } from "@/domain/rules/asset-type.rules";
import { FILTER_ALL } from "@/components/features/companies/company-filters";
import { WatchlistEmptyState } from "./watchlist-empty-state";
import { getWatchlistColumns } from "./watchlist-columns";
import { renderWatchlistMobileRow } from "./watchlist-mobile-row";
import { DataTable } from "@/components/ui/core/data-table";

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-ES");
}

export function WatchlistTable({ candidates, allCompanies, scanQuotes }: WatchlistTableProps) {
  const router = useRouter();
  const { followedTickers } = useWatchlist();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<AssetTypeFilter>(FILTER_ALL);

  const candidateByTicker = useMemo(() => {
    const map = new Map();
    for (const c of candidates) {
      if (c.ticker) map.set(c.ticker.trim().toUpperCase(), c);
    }
    return map;
  }, [candidates]);

  const companyByTicker = useMemo(() => {
    const map = new Map();
    for (const c of allCompanies) {
      if (c.ticker) map.set(c.ticker.trim().toUpperCase(), c);
    }
    return map;
  }, [allCompanies]);

  const quoteByCompanyId = useMemo(() => {
    return new Map(scanQuotes.map((q) => [q.companyId, q]));
  }, [scanQuotes]);

  const rows: WatchlistRowData[] = useMemo(() => {
    return followedTickers.map((ticker) => {
      const norm = ticker.trim().toUpperCase();
      const cand = candidateByTicker.get(norm);
      const comp = companyByTicker.get(norm);

      if (cand) {
        return {
          empresa: comp,
          idEmpresa: cand.idEmpresa || comp?.id,
          ticker: cand.ticker,
          nombre: cand.nombre,
          precio: cand.precio,
          precioAnterior: cand.precioAnterior,
          rsi: cand.rsi,
          volumen: cand.volumen,
          volumenRelativo: cand.volumenRelativo,
          minimoReciente: cand.minimoReciente,
          distSueloAnteriorPct: cand.distSueloAnteriorPct,
          sma200: cand.sma200,
          distSma200Pct: cand.distSma200Pct,
          sector: cand.sector || comp?.sector,
          moneda: cand.moneda || comp?.moneda,
          categoria: cand.categoria || comp?.categoria,
          esValido: cand.esValido,
          backtestCasos: cand.backtestCasos,
          backtestExitoPct: cand.backtestExitoPct,
          backtestPerdidoPct: cand.backtestPerdidoPct,
          backtestEstancadoPct: cand.backtestEstancadoPct,
          backtestDiasMedios: cand.backtestDiasMedios,
          backtestSobreSma: cand.backtestSobreSma,
          backtestBajoSma: cand.backtestBajoSma,
        };
      }

      if (comp) {
        const quote = quoteByCompanyId.get(comp.id);
        return {
          empresa: comp,
          idEmpresa: comp.id,
          ticker: comp.ticker,
          nombre: comp.nombre,
          precio: quote?.price ?? comp.precio ?? 0,
          precioAnterior: quote?.previousDayPrice,
          sector: comp.sector,
          moneda: comp.moneda,
          categoria: comp.categoria,
        };
      }

      return { ticker: norm, nombre: norm, precio: 0 };
    });
  }, [followedTickers, candidateByTicker, companyByTicker, quoteByCompanyId]);

  const normalizedSearch = normalizeSearch(searchTerm.trim());

  const visibleRows = rows.filter((row) => {
    if (normalizedSearch) {
      const match = normalizeSearch(`${row.nombre} ${row.ticker}`).includes(normalizedSearch);
      if (!match) return false;
    }

    if (typeFilter !== FILTER_ALL && !matchesAssetKind(row.empresa?.tipo_activo, typeFilter)) return false;

    return true;
  });

  const handleOperationOpened = useCallback(() => router.refresh(), [router]);
  const columns = useMemo(() => getWatchlistColumns(handleOperationOpened), [handleOperationOpened]);

  if (followedTickers.length === 0) {
    return <WatchlistEmptyState />;
  }

  return (
    <div className="space-y-6">
      <WatchlistSummary rows={rows} />

      <WatchlistFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
      />

      <DataTable
        title={UI_TEXT.pages.watchlist.title}
        subtitle={`${visibleRows.length} ${UI_TEXT.table.pagination.watchlistRecords}`}
        data={visibleRows}
        columns={columns}
        rowKey={(r) => r.ticker}
        initialSortIndex={1}
        recordsLabel={UI_TEXT.table.pagination.watchlistRecords}
        emptyMessage={
          normalizedSearch || typeFilter !== FILTER_ALL
            ? UI_TEXT.table.emptyStates.watchlistFilter
            : UI_TEXT.table.emptyStates.watchlist
        }
        mobileRow={(r, expanded, toggle) => renderWatchlistMobileRow(r, expanded, toggle, handleOperationOpened)}
      />
    </div>
  );
}
