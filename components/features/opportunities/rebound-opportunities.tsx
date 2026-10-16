"use client";

import { BookOpenText, ChevronDown, ShieldCheck, TriangleAlert, TrendingUp } from "lucide-react";
import { UI_TEXT } from "@/domain/literales.constantes";
import { StockCandidate } from "@/domain/models/trading";
import { UI_STYLES } from "@/styles/ui-styles";
import { OpportunityBlock } from "./opportunity-block";
import {
  assessOpportunity,
  OpportunityFilterThresholds,
} from "./opportunity-assessment";

export interface ReboundOpportunitiesProps {
  tier0: StockCandidate[];
  tier1: StockCandidate[];
  top: StockCandidate[];
  mid: StockCandidate[];
  filterThresholds: OpportunityFilterThresholds;
}

export function ReboundOpportunities({ tier0, tier1, top, mid, filterThresholds }: ReboundOpportunitiesProps) {
  const hasOpportunities = [tier0, tier1, top, mid].some((rows) => rows.length > 0);
  const allOpportunities = [...tier0, ...tier1, ...top, ...mid];
  const assessments = allOpportunities.map((opportunity) => ({
    opportunity,
    assessment: assessOpportunity(opportunity),
  }));
  const fullScoreCount = assessments.filter(({ assessment }) => assessment.score === 4).length;
  const oneMissingCount = assessments.filter(({ assessment }) => assessment.score === 3).length;

  if (!hasOpportunities) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center py-8">
        <div
          className={`${UI_STYLES.card.empty} w-full max-w-2xl`}
          role="status"
          aria-live="polite"
        >
          <div className={UI_STYLES.card.emptyIcon}>
            <TrendingUp size={28} aria-hidden="true" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-slate-800">
            {UI_TEXT.pages.opportunities.emptyTitle}
          </h2>
          <p className="mx-auto max-w-lg text-slate-500">
            {UI_TEXT.pages.opportunities.emptyDescription}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className={UI_STYLES.card.statTeal}>
          <div className={UI_STYLES.card.iconTeal}>
            <TrendingUp size={22} aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-teal-800">
              {UI_TEXT.pages.opportunities.statValid}
            </p>
            <p className="text-2xl font-bold text-teal-900">{allOpportunities.length}</p>
            <p className="text-xs text-slate-500">{UI_TEXT.pages.opportunities.allPassedFilters}</p>
          </div>
        </div>

        <div className={UI_STYLES.card.statEmerald}>
          <div className={UI_STYLES.card.iconEmerald}>
            <ShieldCheck size={22} aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">
              {UI_TEXT.pages.opportunities.statComplete}
            </p>
            <p className="text-2xl font-bold text-emerald-900">{fullScoreCount}</p>
            <p className="text-xs text-slate-500">4/4 parámetros</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-amber-100 bg-amber-50/50 p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
            <TriangleAlert size={22} aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-amber-800">
              {UI_TEXT.pages.opportunities.statOneMissing}
            </p>
            <p className="text-2xl font-bold text-amber-900">{oneMissingCount}</p>
            <p className="text-xs text-slate-500">3/4 parámetros</p>
          </div>
        </div>
      </div>

      <details className="group mb-5 rounded-lg border border-slate-200 bg-white">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <BookOpenText size={17} className="text-teal-700" aria-hidden="true" />
          <span className="flex-1">{UI_TEXT.table.guide.title}</span>
          <ChevronDown size={16} className="text-slate-500 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="grid gap-3 border-t border-slate-200 px-4 py-4 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
          <p>
            <strong className="text-slate-800">{UI_TEXT.table.guide.rsiTitle}</strong>{" "}
            <br/>{UI_TEXT.table.guide.rsiDescription} {UI_TEXT.table.filterDetails.threshold} ≤ {filterThresholds.oversoldRsi}.
            <br/><span className="font-bold text-emerald-600">▲</span> {UI_TEXT.table.guide.rsiTrendUp};{" "}
            <br/><span className="font-bold text-rose-600">▼</span> {UI_TEXT.table.guide.rsiTrendDown};{" "}
            <br/><span className="font-bold text-slate-500">→</span> {UI_TEXT.table.guide.rsiTrendStable}.
          </p>
          <p>
            <strong className="text-slate-800">{UI_TEXT.table.guide.volumeTitle}</strong>
            <br/>{UI_TEXT.table.guide.volumeDescription}
            <br/><span className="font-bold text-emerald-600">▲</span> {UI_TEXT.table.values.relativeVolumeAboveAverage} (&gt; 1x);{" "}
            <br/><span className="font-bold text-rose-600">▼</span> {UI_TEXT.table.values.relativeVolumeBelowAverage} (&lt; 1x);{" "}
            <br/><span className="font-bold text-slate-500">→</span> {UI_TEXT.table.values.relativeVolumeAtAverage} (= 1x).
          </p>
          <p>
            <strong className="text-slate-800">{UI_TEXT.table.guide.floorTitle}</strong>{" "}
            <br/>{UI_TEXT.table.guide.floorDescription}
          </p>
          <p>
            <strong className="text-slate-800">{UI_TEXT.table.guide.smaTitle}</strong>
            <br/>{UI_TEXT.table.guide.smaDescription}
          </p>
          <p>
            <strong className="text-slate-800">{UI_TEXT.table.guide.currentRatioTitle}</strong>
            <br/>{UI_TEXT.table.guide.currentRatioDescription}
          </p>
          <p>
            <strong className="text-slate-800">{UI_TEXT.table.guide.debtToEquityTitle}</strong> 
            <br/>{UI_TEXT.table.guide.debtToEquityDescription}
          </p>
          <p>
            <strong className="text-slate-800">{UI_TEXT.table.guide.roeTitle}</strong>
            <br/>{UI_TEXT.table.guide.roeDescription}
          </p>
          <p>
            <strong className="text-slate-800">{UI_TEXT.table.guide.backtestTitle}</strong>{" "}
            <br/>{UI_TEXT.table.guide.backtestDescription}
            <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-emerald-600" aria-hidden="true" />
                {UI_TEXT.table.guide.backtestWon}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-amber-500" aria-hidden="true" />
                {UI_TEXT.table.guide.backtestStalled}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-rose-600" aria-hidden="true" />
                {UI_TEXT.table.guide.backtestLost}
              </span>
            </span>
          </p>
          <p className="whitespace-pre-line sm:col-span-2 xl:col-span-4">
            <strong className="text-slate-800">{UI_TEXT.table.guide.scoreTitle}</strong>
            <br/> {UI_TEXT.table.guide.scoreDescription}
          </p>
        </div>
      </details>

      <div className="grid gap-6">
        {tier0.length > 0 && (
          <OpportunityBlock
            title={UI_TEXT.table.titles.TIER_0}
            subtitle={UI_TEXT.table.subtitles.TIER_0}
            opportunities={tier0}
            filterThresholds={filterThresholds}
          />
        )}
        {tier1.length > 0 && (
          <OpportunityBlock title={UI_TEXT.table.titles.TIER_1} opportunities={tier1} filterThresholds={filterThresholds} />
        )}
        {top.length > 0 && (
          <OpportunityBlock title={UI_TEXT.table.titles.TOP} opportunities={top} filterThresholds={filterThresholds} />
        )}
        {mid.length > 0 && (
          <OpportunityBlock title={UI_TEXT.table.titles.MID} opportunities={mid} filterThresholds={filterThresholds} />
        )}
      </div>
    </>
  );
}
