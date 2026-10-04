"use client";

import { useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { DataTable } from "@/components/tables/core/DataTable";
import { FollowButton } from "@/components/buttons/follow-button";
import { StockCandidate } from "@/domain/models/trading";
import { UI_TEXT } from "@/domain/literales.constantes";
import { UI_STYLES } from "@/styles/ui-styles";
import { CompanyHistoryTrigger } from "@/components/tables/common/company-history-trigger";
import { getOpportunityColumns } from "./opportunity-columns";
import {
  FloorDistance,
  Sma200Distance,
  RelativeVolume,
  RsiTrend,
  BacktestInfo,
  formatCurrencyPrice,
} from "@/components/tables/common/trading-cells";
import {
  assessOpportunity,
  OpportunityFundamentalsInline,
  OpportunityFilterThresholds,
} from "./opportunity-assessment";

interface OpportunityBlockProps {
  title: string;
  opportunities: StockCandidate[];
  filterThresholds: OpportunityFilterThresholds;
  subtitle?: string;
}

export function OpportunityBlock({ title, opportunities, filterThresholds, subtitle }: OpportunityBlockProps) {
  const columns = useMemo(() => getOpportunityColumns(filterThresholds), [filterThresholds]);

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
      rowClassName={(opportunity) => {
        const score = assessOpportunity(opportunity).score;
        if (score === 4) return "bg-emerald-50/70 hover:bg-emerald-100/70";
        if (score === 3) return "bg-amber-50/70 hover:bg-amber-100/70";
        return "hover:bg-slate-50";
      }}
      mobileRow={(opportunity, expanded, toggle) => (
        <div className={UI_STYLES.table.mobileRow}>
          <div className="flex items-center justify-between gap-2">
            <div className="py-2 pl-1">
              <FollowButton ticker={opportunity.ticker} />
            </div>
            <button
              type="button"
              onClick={toggle}
              className={`${UI_STYLES.table.mobileRowButton} flex-1`}
              aria-expanded={expanded}
            >
              <span className={`${UI_STYLES.table.mobileRowTitle} min-w-0 flex-1`}>
                {opportunity.nombre}
              </span>
              <ChevronDown
                className={`${UI_STYLES.table.mobileRowIcon} ${expanded ? "rotate-180" : ""}`}
                size={18}
              />
            </button>
          </div>
          {expanded && (
            <div className={UI_STYLES.table.mobileDetails}>
              <div className="col-span-2 border-b border-slate-200 pb-3">
                <OpportunityFundamentalsInline candidate={opportunity} thresholds={filterThresholds} />
              </div>
              <div>
                <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.price}</p>
                <div className={`${UI_STYLES.table.mobileValue} text-left font-medium tabular-nums`}>
                  <CompanyHistoryTrigger companyId={opportunity.idEmpresa} ticker={opportunity.ticker} companyName={opportunity.nombre} currency={opportunity.moneda} metric="precio">
                    {formatCurrencyPrice(opportunity.precio, opportunity.moneda)}
                  </CompanyHistoryTrigger>
                </div>
              </div>
              <div>
                <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.rsi}</p>
                <div className={UI_STYLES.table.mobileValue}>
                  <CompanyHistoryTrigger companyId={opportunity.idEmpresa} ticker={opportunity.ticker} companyName={opportunity.nombre} currency={opportunity.moneda} metric="rsi">
                    <RsiTrend
                      value={opportunity.rsi}
                      previousValue={opportunity.rsiAnterior}
                      oversoldThreshold={filterThresholds.oversoldRsi}
                    />
                  </CompanyHistoryTrigger>
                </div>
              </div>
              <div>
                <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.volumeAndRelative}</p>
                <div className={`${UI_STYLES.table.mobileValue} mt-1 flex flex-col items-start leading-tight`}>
                  <CompanyHistoryTrigger companyId={opportunity.idEmpresa} ticker={opportunity.ticker} companyName={opportunity.nombre} currency={opportunity.moneda} metric="volumen_relativo">
                    {opportunity.volumen.toLocaleString("es-ES")}
                  </CompanyHistoryTrigger>
                  <CompanyHistoryTrigger companyId={opportunity.idEmpresa} ticker={opportunity.ticker} companyName={opportunity.nombre} currency={opportunity.moneda} metric="volumen_relativo">
                    <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500">
                      RVOL <RelativeVolume value={opportunity.volumenRelativo} />
                    </span>
                  </CompanyHistoryTrigger>
                </div>
              </div>
              <div>
                <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.recentFloor}</p>
                <div className={UI_STYLES.table.mobileValue}>
                  <CompanyHistoryTrigger companyId={opportunity.idEmpresa} ticker={opportunity.ticker} companyName={opportunity.nombre} currency={opportunity.moneda} metric="distancia_suelo_pct">
                    <FloorDistance row={opportunity} />
                  </CompanyHistoryTrigger>
                </div>
              </div>
              <div>
                <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.sma200}</p>
                <div className={UI_STYLES.table.mobileValue}>
                  <CompanyHistoryTrigger companyId={opportunity.idEmpresa} ticker={opportunity.ticker} companyName={opportunity.nombre} currency={opportunity.moneda} metric="dist_sma200_pct">
                    <Sma200Distance row={opportunity} />
                  </CompanyHistoryTrigger>
                </div>
              </div>
              <div>
                <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.backtest}</p>
                <p className={UI_STYLES.table.mobileValue}>
                  <BacktestInfo row={opportunity} compact />
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    />
  );
}
