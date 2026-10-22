"use client";

import { UI_TEXT } from "@/domain/literales.constantes";
import { getMarketStatus, MarketStatus } from "@/domain/rules/market-status.rules";
import { useMarketClock } from "./use-market-clock";

const DOT_COLORS: Record<MarketStatus | "UNKNOWN", string> = {
  REGULAR: "bg-emerald-500",
  PRE: "bg-amber-400",
  POST: "bg-amber-400",
  CLOSED: "bg-rose-500",
  UNKNOWN: "bg-slate-300",
};

/** Círculo de color con el estado de la bolsa: verde abierta, ámbar premarket/postmarket, rojo cerrada. */
export function MarketStatusDot({ bolsa }: { bolsa?: string | null }) {
  const now = useMarketClock();
  const key = (now ? getMarketStatus(bolsa, now) : null) ?? "UNKNOWN";
  const label = bolsa ? `${UI_TEXT.market.status[key]} (${bolsa})` : UI_TEXT.market.status[key];

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={`inline-block size-2.5 shrink-0 rounded-full ${DOT_COLORS[key]}`}
    />
  );
}
