"use client";

import { StockCandidate } from "@/domain/models/trading";
import { getFloorDistancePercent } from "@/components/tables/common/trading-cells";
import { UI_TEXT } from "@/domain/literales.constantes";

export interface OpportunityFilterThresholds {
  oversoldRsi: number;
  minCurrentRatio: number;
  maxDebtToEquity: number;
  minRoe: number;
}

const MIN_SMA_DISTANCE_PCT = -10;
const MIN_RELATIVE_VOLUME = 1;
const MIN_BACKTEST_CASES = 20;
const MAX_BACKTEST_STAGNATION_PCT = 50;

export function assessOpportunity(candidate: StockCandidate) {
  const floorDistance = getFloorDistancePercent(candidate);
  const holdsRecentFloor = floorDistance !== null && floorDistance >= 0;

  const hasSmaDistance =
    typeof candidate.distSma200Pct === "number" &&
    Number.isFinite(candidate.distSma200Pct);
  const trendNearSma =
    hasSmaDistance && candidate.distSma200Pct! >= MIN_SMA_DISTANCE_PCT;
  const volumeConfirmed =
    typeof candidate.volumenRelativo === "number" &&
    Number.isFinite(candidate.volumenRelativo) &&
    candidate.volumenRelativo >= MIN_RELATIVE_VOLUME;

  const favorableBacktest =
    typeof candidate.backtestCasos === "number" &&
    candidate.backtestCasos >= MIN_BACKTEST_CASES &&
    typeof candidate.backtestExitoPct === "number" &&
    typeof candidate.backtestPerdidoPct === "number" &&
    typeof candidate.backtestEstancadoPct === "number" &&
    candidate.backtestExitoPct > candidate.backtestPerdidoPct &&
    candidate.backtestEstancadoPct <= MAX_BACKTEST_STAGNATION_PCT;

  const score = [holdsRecentFloor, trendNearSma, volumeConfirmed, favorableBacktest]
    .filter(Boolean).length;

  return { score };
}

function getFundamentalFilters(
  candidate: StockCandidate,
  thresholds: OpportunityFilterThresholds
) {
  const formatNumber = (value?: number, digits = 2) =>
    typeof value === "number" && Number.isFinite(value)
      ? value.toLocaleString("es-ES", { minimumFractionDigits: digits, maximumFractionDigits: digits })
      : UI_TEXT.table.values.noData;

  return [
    {
      label: UI_TEXT.table.filterDetails.currentRatio,
      shortLabel: "Liq",
      value: candidate.currentRatio === undefined ? UI_TEXT.table.values.noData : `${formatNumber(candidate.currentRatio)}x`,
      threshold: `≥ ${formatNumber(thresholds.minCurrentRatio)}x`,
      passes: candidate.currentRatio !== undefined && candidate.currentRatio >= thresholds.minCurrentRatio,
    },
    {
      label: UI_TEXT.table.filterDetails.debtToEquity,
      shortLabel: "D/E",
      value: candidate.debtToEquity === undefined ? UI_TEXT.table.values.noData : `${formatNumber(candidate.debtToEquity)}%`,
      threshold: `≤ ${formatNumber(thresholds.maxDebtToEquity)}%`,
      passes: candidate.debtToEquity !== undefined && candidate.debtToEquity <= thresholds.maxDebtToEquity,
    },
    {
      label: UI_TEXT.table.filterDetails.roe,
      shortLabel: "ROE",
      value: candidate.returnOnEquity === undefined ? UI_TEXT.table.values.noData : `${formatNumber(candidate.returnOnEquity * 100)}%`,
      threshold: `> ${formatNumber(thresholds.minRoe * 100)}%`,
      passes: candidate.returnOnEquity !== undefined && candidate.returnOnEquity > thresholds.minRoe,
    },
  ];
}

export function OpportunityFundamentalsInline({
  candidate,
  thresholds,
}: {
  candidate: StockCandidate;
  thresholds: OpportunityFilterThresholds;
}) {
  const filters = getFundamentalFilters(candidate, thresholds);

  return (
    <div className="grid min-w-47.5 grid-cols-3 gap-2">
      {filters.map((filter) => (
        <span
          key={filter.shortLabel}
          title={`${filter.label}: ${filter.value}. ${UI_TEXT.table.filterDetails.threshold} ${filter.threshold}. ${filter.passes ? UI_TEXT.table.filterDetails.pass : UI_TEXT.table.filterDetails.fail}.`}
          className="min-w-0"
        >
          <span className="block text-[10px] font-medium text-slate-500">{filter.shortLabel}</span>
          <span className={`inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold tabular-nums `}>
            {filter.value}
          </span>
        </span>
      ))}
    </div>
  );
}

export function OpportunityFilterDetails({
  candidate,
  thresholds,
}: {
  candidate: StockCandidate;
  thresholds: OpportunityFilterThresholds;
}) {
  const filters = getFundamentalFilters(candidate, thresholds);

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase text-slate-500">
        {UI_TEXT.table.filterDetails.heading}
      </p>
      <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-3">
        {filters.map((filter) => (
          <div key={filter.label} className="min-w-0 border-l border-slate-200 pl-3 first:border-l-0 first:pl-0">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-xs text-slate-500">{filter.label}</span>
              <span className={`shrink-0 text-xs font-semibold ${filter.passes ? "text-emerald-700" : "text-rose-700"}`}>
                {filter.passes ? UI_TEXT.table.filterDetails.pass : UI_TEXT.table.filterDetails.fail}
              </span>
            </div>
            <p className="mt-1 font-semibold tabular-nums text-slate-800">{filter.value}</p>
            <p className="text-xs text-slate-500">{UI_TEXT.table.filterDetails.threshold} {filter.threshold}</p>
          </div>
        ))}
      </div>
    </div>
  );
}