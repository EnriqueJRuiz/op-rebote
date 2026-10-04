"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { DataTable } from "@/components/tables/core/DataTable";
import { FollowButton } from "@/components/buttons/follow-button";
import { useWatchlist } from "@/context/watchlist-context";
import { UI_TEXT } from "@/domain/literales.constantes";
import { UI_STYLES } from "@/styles/ui-styles";
import { WatchlistRowData, WatchlistTableProps } from "./watchlist-types";
import { WatchlistSummary } from "./watchlist-summary";
import { WatchlistFilters } from "./watchlist-filters";
import { WatchlistEmptyState } from "./watchlist-empty-state";
import { getWatchlistColumns } from "./watchlist-columns";
import { CompanyHistoryTrigger } from "@/components/tables/common/company-history-trigger";
import {
  PriceCell,
  RsiBadge,
  FloorDistance,
  Sma200Distance,
  BacktestInfo,
} from "./watchlist-cells";

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-ES");
}

export function WatchlistTable({ candidates, allCompanies, scanQuotes }: WatchlistTableProps) {
  const { followedTickers } = useWatchlist();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
          idEmpresa: cand.idEmpresa || comp?.id,
          ticker: cand.ticker,
          nombre: cand.nombre,
          precio: cand.precio,
          precioAnterior: cand.precioAnterior,
          rsi: cand.rsi,
          volumen: cand.volumen,
          volumenRelativo: cand.volumenRelativo,
          minimoReciente: cand.minimoReciente,
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

    if (statusFilter === "oversold" && (row.rsi === undefined || row.rsi > 30)) return false;
    if (statusFilter === "out_oversold" && (row.rsi === undefined || row.rsi <= 30)) return false;

    return true;
  });

  const columns = useMemo(() => getWatchlistColumns(), []);

  if (followedTickers.length === 0) {
    return <WatchlistEmptyState />;
  }

  return (
    <div className="space-y-6">
      <WatchlistSummary rows={rows} />

      <WatchlistFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
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
          normalizedSearch || statusFilter !== "all"
            ? UI_TEXT.table.emptyStates.watchlistFilter
            : UI_TEXT.table.emptyStates.watchlist
        }
        mobileRow={(r, expanded, toggle) => (
          <div className={UI_STYLES.table.mobileRow}>
            <div className="flex items-center justify-between gap-2">
              <div className="py-2 pl-1">
                <FollowButton ticker={r.ticker} />
              </div>
              <button
                type="button"
                onClick={toggle}
                className={`${UI_STYLES.table.mobileRowButton} flex-1`}
                aria-expanded={expanded}
              >
                <span className={UI_STYLES.table.mobileRowTitle}>{r.nombre}</span>
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
                  <p className="mt-1">
                    <span className={UI_STYLES.badge.tickerLarge}>{r.ticker}</span>
                  </p>
                </div>
                <div>
                  <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.price}</p>
                  <div className="mt-1">
                    <PriceCell row={r} />
                  </div>
                </div>
                <div>
                  <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.rsi}</p>
                  <div className="mt-1">
                    <CompanyHistoryTrigger companyId={r.idEmpresa} ticker={r.ticker} companyName={r.nombre} currency={r.moneda} metric="rsi">
                      <RsiBadge rsi={r.rsi} />
                    </CompanyHistoryTrigger>
                  </div>
                </div>
                <div>
                  <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.volume}</p>
                  <p className={UI_STYLES.table.mobileValue}>
                    {r.volumen?.toLocaleString() ?? "-"}
                  </p>
                  {r.volumenRelativo !== undefined && (
                    <CompanyHistoryTrigger companyId={r.idEmpresa} ticker={r.ticker} companyName={r.nombre} currency={r.moneda} metric="volumen_relativo">
                      <span className="text-xs text-slate-500">RVOL {r.volumenRelativo.toFixed(2)}x</span>
                    </CompanyHistoryTrigger>
                  )}
                </div>
                <div>
                  <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.recentFloor}</p>
                  <div className={`${UI_STYLES.table.mobileValue} mt-1`}>
                    <CompanyHistoryTrigger companyId={r.idEmpresa} ticker={r.ticker} companyName={r.nombre} currency={r.moneda} metric="distancia_suelo_pct">
                      <FloorDistance row={r} />
                    </CompanyHistoryTrigger>
                  </div>
                </div>
                <div>
                  <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.sma200}</p>
                  <div className={`${UI_STYLES.table.mobileValue} mt-1`}>
                    <CompanyHistoryTrigger companyId={r.idEmpresa} ticker={r.ticker} companyName={r.nombre} currency={r.moneda} metric="dist_sma200_pct">
                      <Sma200Distance row={r} />
                    </CompanyHistoryTrigger>
                  </div>
                </div>
                <div className="col-span-2">
                  <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.backtest}</p>
                  <div className="mt-1">
                    <BacktestInfo row={r} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      />
    </div>
  );
}
