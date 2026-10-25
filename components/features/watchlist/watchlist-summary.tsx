"use client";

import { ReactNode } from "react";
import { Bookmark, TrendingUp } from "lucide-react";
import { UI_STYLES } from "@/styles/ui-styles";
import { UI_TEXT } from "@/domain/literales.constantes";
import { getAssetMark } from "@/domain/rules/asset-mark.rules";
import { ASSET_KINDS, matchesAssetKind } from "@/domain/rules/asset-type.rules";
import { WatchlistRowData } from "./watchlist-types";

interface WatchlistSummaryProps {
  rows: WatchlistRowData[];
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className={UI_STYLES.card.statIndigo}>
      <div className={`${UI_STYLES.card.iconIndigo} shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-2xl font-bold tabular-nums text-slate-900">{value}</p>
      </div>
    </div>
  );
}

/** Resumen de lo que se sigue: el total y cuántos son acciones, ETF o indexados (los mismos tipos que el filtro). */
export function WatchlistSummary({ rows }: WatchlistSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      <StatCard
        label={UI_TEXT.pages.watchlist.statTotal}
        value={rows.length}
        icon={<Bookmark size={22} className="fill-indigo-500 text-indigo-600" />}
      />

      {ASSET_KINDS.map((kind) => {
        // Misma marca que la celda de nombre y la barra de pestañas: "ETF" y "FI"; las acciones llevan icono.
        const mark = getAssetMark(kind);
        return (
          <StatCard
            key={kind}
            label={UI_TEXT.assetKinds[kind].tab}
            value={rows.filter((row) => matchesAssetKind(row.empresa?.tipo_activo, kind)).length}
            icon={
              mark ? (
                <span className="text-xs font-extrabold leading-none">{mark}</span>
              ) : (
                <TrendingUp size={22} aria-hidden="true" />
              )
            }
          />
        );
      })}
    </div>
  );
}
