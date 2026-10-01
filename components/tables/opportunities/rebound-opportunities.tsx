"use client";

import { UI_TEXT } from "@/domain/literales.constantes";
import { StockCandidate } from "@/domain/models/trading";
import { OpportunityBlock } from "./opportunity-block";

export interface ReboundOpportunitiesProps {
  tier0: StockCandidate[];
  tier1: StockCandidate[];
  top: StockCandidate[];
  mid: StockCandidate[];
}

export function ReboundOpportunities({ tier0, tier1, top, mid }: ReboundOpportunitiesProps) {
  return (
    <div className="grid gap-6">
      <OpportunityBlock
        title={UI_TEXT.table.titles.TIER_0}
        subtitle={UI_TEXT.table.subtitles.TIER_0}
        opportunities={tier0}
      />
      <OpportunityBlock title={UI_TEXT.table.titles.TIER_1} opportunities={tier1} />
      <OpportunityBlock title={UI_TEXT.table.titles.TOP} opportunities={top} />
      <OpportunityBlock title={UI_TEXT.table.titles.MID} opportunities={mid} />
    </div>
  );
}
