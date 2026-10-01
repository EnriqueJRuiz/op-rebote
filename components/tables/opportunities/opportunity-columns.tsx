"use client";

import { Column } from "@/components/tables/core/DataTable";
import { FollowButton } from "@/components/buttons/follow-button";
import { StockCandidate } from "@/domain/models/trading";
import { UI_TEXT } from "@/domain/literales.constantes";
import { UI_STYLES } from "@/styles/ui-styles";
import {
  FloorDistance,
  Sma200Distance,
  RelativeVolume,
  BacktestInfo,
  getFloorDistancePercent,
} from "@/components/tables/common/trading-cells";

export function getOpportunityColumns(): Column<StockCandidate>[] {
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
      header: UI_TEXT.table.columns.ticker,
      sortValue: (opportunity) => opportunity.ticker,
      render: (opportunity) => (
        <span className={UI_STYLES.badge.ticker}>{opportunity.ticker}</span>
      ),
    },
    {
      header: UI_TEXT.table.columns.price,
      sortValue: (opportunity) => opportunity.precio,
      render: (opportunity) => opportunity.precio.toFixed(2),
    },
    {
      header: UI_TEXT.table.columns.rsi,
      sortValue: (opportunity) => opportunity.rsi,
      render: (opportunity) => opportunity.rsi.toFixed(2),
    },
    {
      header: UI_TEXT.table.columns.volume,
      sortValue: (opportunity) => opportunity.volumen,
      render: (opportunity) => opportunity.volumen.toLocaleString(),
    },
    {
      header: UI_TEXT.table.columns.relativeVolume,
      sortValue: (opportunity) => opportunity.volumenRelativo ?? -Infinity,
      render: (opportunity) => (
        <RelativeVolume value={opportunity.volumenRelativo} />
      ),
    },
    {
      header: UI_TEXT.table.columns.recentFloor,
      sortValue: getFloorDistancePercent,
      render: (opportunity) => <FloorDistance row={opportunity} />,
    },
    {
      header: UI_TEXT.table.columns.sma200,
      sortValue: (opportunity) => opportunity.distSma200Pct ?? -Infinity,
      render: (opportunity) => <Sma200Distance row={opportunity} />,
    },
    {
      header: UI_TEXT.table.columns.backtest,
      sortValue: (opportunity) => opportunity.backtestExitoPct,
      render: (opportunity) => <BacktestInfo row={opportunity} />,
    },
  ];
}
