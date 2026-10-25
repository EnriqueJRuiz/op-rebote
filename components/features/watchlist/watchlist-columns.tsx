"use client";

import { UI_TEXT } from "@/domain/literales.constantes";
import { WatchlistRowData } from "./watchlist-types";
import {
  PriceCell,
  RsiBadge,
  FloorDistance,
  Sma200Distance,
  BacktestInfo,
  getFloorDistancePercent,
  getRowChangePercent,
} from "./watchlist-cells";
import { Column } from "@/components/ui/core/data-table";
import { FollowButton } from "@/components/common/follow-button";
import { CompanyHistoryTrigger } from "@/components/common/history/company-history-trigger";
import { OpenOperationButton } from "@/components/common/open-operation";
import { AssetNameCell } from "@/components/common/asset-name-cell";

export function getWatchlistColumns(onOperationOpened: () => void): Column<WatchlistRowData>[] {
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
      render: (r) => <AssetNameCell name={r.nombre} ticker={r.ticker} empresa={r.empresa} />,
    },
    {
      header: UI_TEXT.table.columns.lastPrice,
      sortValue: getRowChangePercent,
      sortLabel: UI_TEXT.table.columns.change,
      firstSortDirection: "desc",
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
    {
      header: UI_TEXT.table.columns.operate,
      render: (r) =>
        r.idEmpresa === undefined ? null : (
          <OpenOperationButton
            companyId={r.idEmpresa}
            ticker={r.ticker}
            companyName={r.nombre}
            precioActual={r.precio}
            onSuccess={onOperationOpened}
          />
        ),
      headerClassName: "text-right",
      cellClassName: "text-right",
    },
  ];
}
