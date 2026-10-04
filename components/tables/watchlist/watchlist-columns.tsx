"use client";

import { Column } from "@/components/tables/core/DataTable";
import { FollowButton } from "@/components/buttons/follow-button";
import { UI_TEXT } from "@/domain/literales.constantes";
import { UI_STYLES } from "@/styles/ui-styles";
import { WatchlistRowData } from "./watchlist-types";
import { CompanyHistoryTrigger } from "@/components/tables/common/company-history-trigger";
import {
  PriceCell,
  RsiBadge,
  FloorDistance,
  Sma200Distance,
  BacktestInfo,
  getFloorDistancePercent,
} from "./watchlist-cells";

export function getWatchlistColumns(): Column<WatchlistRowData>[] {
  return [
    {
      header: "",
      render: (row) => (
        <div className="flex items-center justify-center">
          <FollowButton ticker={row.ticker} />
        </div>
      ),
      cellClassName: "w-10 px-2 text-center",
    },
    {
      header: UI_TEXT.table.columns.name,
      sortValue: (r) => r.nombre,
      render: (r) => (
        <span className="font-bold text-slate-900">{r.nombre}</span>
      ),
    },
    {
      header: UI_TEXT.table.columns.ticker,
      sortValue: (r) => r.ticker,
      render: (r) => <span className={UI_STYLES.badge.ticker}>{r.ticker}</span>,
    },
    {
      header: UI_TEXT.table.columns.price,
      sortValue: (r) => r.precio,
      render: (r) => <PriceCell row={r} />,
    },
    {
      header: UI_TEXT.table.columns.rsi,
      sortValue: (r) => r.rsi ?? -Infinity,
      render: (r) => (
        <CompanyHistoryTrigger companyId={r.idEmpresa} ticker={r.ticker} companyName={r.nombre} currency={r.moneda} metric="rsi">
          <RsiBadge rsi={r.rsi} />
        </CompanyHistoryTrigger>
      ),
    },
    {
      header: UI_TEXT.table.columns.volume,
      sortValue: (r) => r.volumen ?? -Infinity,
      render: (r) => (
        <div className="flex flex-col items-start">
          <CompanyHistoryTrigger companyId={r.idEmpresa} ticker={r.ticker} companyName={r.nombre} currency={r.moneda} metric="volumen_relativo">
            <span className="text-slate-700">
              {r.volumen ? r.volumen.toLocaleString() : UI_TEXT.table.values.notAvailable}
            </span>
          </CompanyHistoryTrigger>
          {r.volumenRelativo !== undefined && (
            <CompanyHistoryTrigger companyId={r.idEmpresa} ticker={r.ticker} companyName={r.nombre} currency={r.moneda} metric="volumen_relativo">
              <span className="mt-0.5 block text-[11px] font-medium text-slate-500" title="Volumen Relativo">
                RVOL: {r.volumenRelativo.toFixed(2)}x
              </span>
            </CompanyHistoryTrigger>
          )}
        </div>
      ),
    },
    {
      header: UI_TEXT.table.columns.recentFloor,
      sortValue: getFloorDistancePercent,
      render: (r) => (
        <CompanyHistoryTrigger companyId={r.idEmpresa} ticker={r.ticker} companyName={r.nombre} currency={r.moneda} metric="distancia_suelo_pct">
          <FloorDistance row={r} />
        </CompanyHistoryTrigger>
      ),
    },
    {
      header: UI_TEXT.table.columns.sma200,
      sortValue: (r) => r.distSma200Pct ?? -Infinity,
      render: (r) => (
        <CompanyHistoryTrigger companyId={r.idEmpresa} ticker={r.ticker} companyName={r.nombre} currency={r.moneda} metric="dist_sma200_pct">
          <Sma200Distance row={r} />
        </CompanyHistoryTrigger>
      ),
    },
    {
      header: UI_TEXT.table.columns.backtest,
      sortValue: (r) => r.backtestExitoPct ?? -Infinity,
      render: (r) => <BacktestInfo row={r} />,
    },
  ];
}
