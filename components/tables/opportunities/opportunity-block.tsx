"use client";

import { useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { DataTable } from "@/components/tables/core/DataTable";
import { FollowButton } from "@/components/buttons/follow-button";
import { StockCandidate } from "@/domain/models/trading";
import { UI_TEXT } from "@/domain/literales.constantes";
import { UI_STYLES } from "@/styles/ui-styles";
import { getOpportunityColumns } from "./opportunity-columns";
import {
  FloorDistance,
  Sma200Distance,
  RelativeVolume,
  BacktestInfo,
} from "@/components/tables/common/trading-cells";

interface OpportunityBlockProps {
  title: string;
  opportunities: StockCandidate[];
  subtitle?: string;
}

export function OpportunityBlock({ title, opportunities, subtitle }: OpportunityBlockProps) {
  const columns = useMemo(() => getOpportunityColumns(), []);

  return (
    <DataTable
      title={title}
      subtitle={subtitle}
      data={opportunities}
      columns={columns}
      rowKey={(opportunity) => opportunity.ticker}
      initialSortIndex={1}
      recordsLabel={UI_TEXT.table.pagination.opportunityRecords}
      emptyMessage={UI_TEXT.table.emptyStates.opportunities}
      containerClassName=""
      mobileRow={(opportunity, expanded, toggle) => (
        <div className={UI_STYLES.table.mobileRow}>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={toggle}
              className={`${UI_STYLES.table.mobileRowButton} flex-1`}
              aria-expanded={expanded}
            >
              <span className={UI_STYLES.table.mobileRowTitle}>{opportunity.nombre}</span>
              <ChevronDown
                className={`${UI_STYLES.table.mobileRowIcon} ${expanded ? "rotate-180" : ""}`}
                size={18}
              />
            </button>
            <div className="py-2 pr-1">
              <FollowButton ticker={opportunity.ticker} />
            </div>
          </div>
          {expanded && (
            <div className={UI_STYLES.table.mobileDetails}>
              <div>
                <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.ticker}</p>
                <p className="mt-1">
                  <span className={UI_STYLES.badge.tickerLarge}>{opportunity.ticker}</span>
                </p>
              </div>
              <div>
                <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.price}</p>
                <p className={UI_STYLES.table.mobileValue}>{opportunity.precio.toFixed(2)}</p>
              </div>
              <div>
                <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.rsi}</p>
                <p className={UI_STYLES.table.mobileValue}>{opportunity.rsi.toFixed(2)}</p>
              </div>
              <div>
                <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.volume}</p>
                <p className={UI_STYLES.table.mobileValue}>{opportunity.volumen.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-500">{UI_TEXT.table.columns.relativeVolume}</p>
                <p className="text-slate-700">
                  <RelativeVolume value={opportunity.volumenRelativo} />
                </p>
              </div>
              <div>
                <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.recentFloor}</p>
                <p className={UI_STYLES.table.mobileValue}>
                  <FloorDistance row={opportunity} />
                </p>
              </div>
              <div>
                <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.sma200}</p>
                <p className={UI_STYLES.table.mobileValue}>
                  <Sma200Distance row={opportunity} />
                </p>
              </div>
              <div>
                <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.backtest}</p>
                <p className={UI_STYLES.table.mobileValue}>
                  <BacktestInfo row={opportunity} />
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    />
  );
}
