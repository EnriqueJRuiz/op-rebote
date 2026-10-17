"use client";

import { StockCandidate } from "@/domain/models/trading";
import { UI_TEXT } from "@/domain/literales.constantes";
import { UI_STYLES } from "@/styles/ui-styles";
import {
  FloorDistance,
  Sma200Distance,
  RelativeVolume,
  RsiTrend,
  BacktestInfo,
  formatCurrencyPrice,
  getFloorDistancePercent,
  PriceChange,
} from "@/components/ui/core/trading-cells";
import {
  OpportunityFilterThresholds,
  OpportunityFundamentalsInline,
} from "./opportunity-assessment";
import { Column } from "@/components/ui/core/DataTable";
import { FollowButton } from "@/components/common/follow-button";
import { OpenOperationButton } from "../operations/open-operation-button";
import { CompanyHistoryTrigger } from "@/components/common/history/company-history-trigger";

export function getOpportunityColumns(
  filterThresholds: OpportunityFilterThresholds,
  getOpportunityColumns: (opportunity: StockCandidate) => void
): Column<StockCandidate>[] {
  return [
    {
      header: "",
      render: (opportunity) => (
        <div className="flex items-center justify-center">
          <FollowButton ticker={opportunity.ticker} />
        </div>
      ),
      cellClassName: "w-10 px-2 text-center",
    },
    {
      header: UI_TEXT.table.columns.name,
      sortValue: (opportunity) => opportunity.nombre,
      render: (opportunity) => opportunity.nombre,
      cellClassName: `${UI_STYLES.text.primary} font-bold`,
    },
    {
      header: UI_TEXT.table.columns.price,
      sortValue: (opportunity) => opportunity.precio,
      render: (opportunity) => (
        <CompanyHistoryTrigger companyId={opportunity.idEmpresa} ticker={opportunity.ticker} companyName={opportunity.nombre} currency={opportunity.moneda} metric="precio">
          <span className="inline-flex flex-col items-end whitespace-nowrap">
            <span className="inline-block w-22.5 text-right font-medium text-slate-800">
              {formatCurrencyPrice(opportunity.precio, opportunity.moneda)}
            </span>
            <PriceChange
              price={opportunity.precio}
              previousPrice={opportunity.precioAnterior}
              className="mt-0.5 justify-end"
            />
          </span>
        </CompanyHistoryTrigger>
      ),
      cellClassName: "whitespace-nowrap text-right font-medium tabular-nums",
      headerClassName: "text-right",
    },
    {
      header: UI_TEXT.table.columns.rsi,
      sortValue: (opportunity) => opportunity.rsi,
      render: (opportunity) => (
        <CompanyHistoryTrigger companyId={opportunity.idEmpresa} ticker={opportunity.ticker} companyName={opportunity.nombre} currency={opportunity.moneda} metric="rsi">
          <RsiTrend
            value={opportunity.rsi}
            previousValue={opportunity.rsiAnterior}
            oversoldThreshold={filterThresholds.oversoldRsi}
          />
        </CompanyHistoryTrigger>
      ),
    },
    {
      header: UI_TEXT.table.columns.volumeAndRelative,
      sortValue: (opportunity) => opportunity.volumen,
      render: (opportunity) => (
        <div className="flex flex-col items-start whitespace-nowrap leading-tight">
          <CompanyHistoryTrigger companyId={opportunity.idEmpresa} ticker={opportunity.ticker} companyName={opportunity.nombre} currency={opportunity.moneda} metric="volumen_relativo">
            <span>{opportunity.volumen.toLocaleString("es-ES")}</span>
          </CompanyHistoryTrigger>
          <CompanyHistoryTrigger companyId={opportunity.idEmpresa} ticker={opportunity.ticker} companyName={opportunity.nombre} currency={opportunity.moneda} metric="volumen_relativo">
            <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500">
              RVOL
              <RelativeVolume value={opportunity.volumenRelativo} />
            </span>
          </CompanyHistoryTrigger>
        </div>
      ),
    },
    {
      header: UI_TEXT.table.columns.recentFloor,
      sortValue: getFloorDistancePercent,
      render: (opportunity) => (
        <CompanyHistoryTrigger companyId={opportunity.idEmpresa} ticker={opportunity.ticker} companyName={opportunity.nombre} currency={opportunity.moneda} metric="distancia_suelo_pct">
          <FloorDistance row={opportunity} />
        </CompanyHistoryTrigger>
      ),
    },
    {
      header: UI_TEXT.table.columns.sma200,
      sortValue: (opportunity) => opportunity.distSma200Pct ?? -Infinity,
      render: (opportunity) => (
        <CompanyHistoryTrigger companyId={opportunity.idEmpresa} ticker={opportunity.ticker} companyName={opportunity.nombre} currency={opportunity.moneda} metric="dist_sma200_pct">
          <Sma200Distance row={opportunity} />
        </CompanyHistoryTrigger>
      ),
    },
    {
      header: UI_TEXT.table.columns.fundamentals,
      render: (opportunity) => (
        <OpportunityFundamentalsInline candidate={opportunity} thresholds={filterThresholds} />
      ),
      cellClassName: "min-w-[220px]",
    },
    {
      header: UI_TEXT.table.columns.backtest,
      sortValue: (opportunity) => opportunity.backtestExitoPct,
      render: (opportunity) => <BacktestInfo row={opportunity} compact />,
    },
    {
      header: UI_TEXT.table.columns.operate,
      // Sin idEmpresa no se puede abrir una operación, así que la celda queda vacía.
      render: (opportunity) =>
        opportunity.idEmpresa === undefined ? null : (
          <OpenOperationButton ticker={opportunity.ticker} onClick={() => getOpportunityColumns(opportunity)} />
        ),
      headerClassName: "text-right",
      cellClassName: "text-right",
    },
  ];
}
