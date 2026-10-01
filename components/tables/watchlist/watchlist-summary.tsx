"use client";

import { Bookmark, AlertCircle, ShieldCheck } from "lucide-react";
import { UI_STYLES } from "@/styles/ui-styles";
import { UI_TEXT } from "@/domain/literales.constantes";
import { WatchlistRowData } from "./watchlist-types";
import { getFloorDistancePercent } from "./watchlist-cells";

interface WatchlistSummaryProps {
  rows: WatchlistRowData[];
}

export function WatchlistSummary({ rows }: WatchlistSummaryProps) {
  const oversoldTotal = rows.filter((r) => r.rsi !== undefined && r.rsi <= 30).length;
  const holdingFloorTotal = rows.filter((r) => {
    const dist = getFloorDistancePercent(r);
    return dist !== null && dist >= 0;
  }).length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className={UI_STYLES.card.statIndigo}>
        <div className={UI_STYLES.card.iconIndigo}>
          <Bookmark size={22} className="fill-indigo-500 text-indigo-600" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {UI_TEXT.pages.watchlist.statTotal}
          </p>
          <p className="text-2xl font-bold text-slate-900">{rows.length}</p>
        </div>
      </div>

      <div className={UI_STYLES.card.statEmerald}>
        <div className={UI_STYLES.card.iconEmerald}>
          <AlertCircle size={22} />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">
            {UI_TEXT.pages.watchlist.statOversold}
          </p>
          <p className="text-2xl font-bold text-emerald-900">{oversoldTotal}</p>
        </div>
      </div>

      <div className={UI_STYLES.card.statTeal}>
        <div className={UI_STYLES.card.iconTeal}>
          <ShieldCheck size={22} />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-teal-800">
            {UI_TEXT.pages.watchlist.statAboveFloor}
          </p>
          <p className="text-2xl font-bold text-teal-900">{holdingFloorTotal}</p>
        </div>
      </div>
    </div>
  );
}
