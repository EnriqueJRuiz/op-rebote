"use client";

import { Bookmark, Eye, TrendingUp } from "lucide-react";
import Link from "next/link";
import { APP_ROUTES } from "@/domain/constants";
import { UI_TEXT } from "@/domain/literales.constantes";
import { UI_STYLES } from "@/styles/ui-styles";

export function WatchlistEmptyState() {
  return (
    <div className={UI_STYLES.card.empty}>
      <div className={UI_STYLES.card.emptyIcon}>
        <Bookmark size={28} className="fill-indigo-500 text-indigo-600" />
      </div>
      <h2 className="mb-2 text-xl font-bold text-slate-800">{UI_TEXT.pages.watchlist.title}</h2>
      <p className="mx-auto mb-6 max-w-lg text-slate-500">
        {UI_TEXT.table.emptyStates.watchlist}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href={APP_ROUTES.OPORTUNIDADES} className={UI_STYLES.card.linkPrimary}>
          <TrendingUp size={16} />
          {UI_TEXT.pages.watchlist.goToOpportunities}
        </Link>
        <Link href={APP_ROUTES.EMPRESAS_RADAR} className={UI_STYLES.card.linkSecondary}>
          <Eye size={16} />
          {UI_TEXT.pages.watchlist.goToRadar}
        </Link>
      </div>
    </div>
  );
}
