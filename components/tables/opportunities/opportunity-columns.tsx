"use client";

import { Column } from "@/components/tables/core/DataTable";
import { FollowButton } from "@/components/buttons/follow-button";
import { StockCandidate } from "@/domain/models/trading";
import { UI_TEXT } from "@/domain/literales.constantes";
import { UI_STYLES } from "@/styles/ui-styles";
import { CompanyHistoryTrigger } from "@/components/tables/common/company-history-trigger";
import {
  FloorDistance,
  Sma200Distance,
  RelativeVolume,
  RsiTrend,
  BacktestInfo,
  formatCurrencyPrice,
  getFloorDistancePercent,
} from "@/components/tables/common/trading-cells";
import {
  OpportunityFilterThresholds,
  OpportunityFundamentalsInline,
} from "./opportunity-assessment";

export function getOpportunityColumns(filterThresholds: OpportunityFilterThresholds): Column<StockCandidate>[] {
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
          {formatCurrencyPrice(opportunity.precio, opportunity.moneda)}
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
          <CompanyHistoryTrigger companyId={opportunity.idEmpresa} ticker={opportunity.ticker} companyName={opportunity.nombre} currency={opportunity.moneda} metric="volumen">
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
  ];
}
