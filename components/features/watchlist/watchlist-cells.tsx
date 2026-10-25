"use client";

import { UI_TEXT } from "@/domain/literales.constantes";
import { UI_STYLES } from "@/styles/ui-styles";
import { WatchlistRowData } from "./watchlist-types";
import { getFloorDistanceTrend, PriceChange } from "@/components/ui/core/trading-cells";
import { CompanyHistoryTrigger } from "@/components/common/history/company-history-trigger";
import { formatScannedPrice } from "@/components/features/companies/company-columns";

/** Variación diaria en %, o null si no hay precio actual o previo válidos. Sirve para ordenar la columna de precio. */
export function getRowChangePercent(row: WatchlistRowData): number | null {
  if (!Number.isFinite(row.precio) || row.precio <= 0) return null;
  if (!row.precioAnterior || row.precioAnterior <= 0) return null;
  return ((row.precio - row.precioAnterior) / row.precioAnterior) * 100;
}

export function getFloorDistancePercent(row: WatchlistRowData): number | null {
  const { precio, minimoReciente } = row;
  if (!Number.isFinite(precio) || precio <= 0 || !Number.isFinite(minimoReciente) || !minimoReciente || minimoReciente <= 0) {
    return null;
  }
  return ((precio - minimoReciente) / precio) * 100;
}

export function FloorDistance({ row }: { row: WatchlistRowData }) {
  const distance = getFloorDistancePercent(row);
  if (distance === null) {
    return <span className={UI_STYLES.badge.muted}>{UI_TEXT.table.values.noData}</span>;
  }
  const trend = getFloorDistanceTrend(distance, row.distSueloAnteriorPct);
  const trendLabel = trend === "up"
    ? UI_TEXT.floor.trendUp
    : trend === "down"
      ? UI_TEXT.floor.trendDown
      : trend === "unchanged"
        ? UI_TEXT.floor.trendUnchanged
        : UI_TEXT.floor.description;
  const arrow = trend === "up" ? "↑" : trend === "down" ? "↓" : trend === "unchanged" ? "→" : undefined;

  return (
    <span className="inline-flex items-center gap-1 font-medium text-slate-700" title={trendLabel}>
      {`${distance.toFixed(2)}%`}
      {arrow && <span className="text-slate-500" aria-label={trendLabel}>{arrow}</span>}
    </span>
  );
}

export function Sma200Distance({ row }: { row: WatchlistRowData }) {
  const distance = row.distSma200Pct;
  const hasDistance = distance !== undefined && Number.isFinite(distance);
  const label = hasDistance
    ? `${distance >= 0 ? "+" : ""}${distance.toFixed(2)}%`
    : UI_TEXT.table.values.noData;

  return (
    <div className="leading-tight">
      <span
        className={hasDistance
          ? distance < 0 ? `font-medium ${UI_STYLES.badge.danger}` : `font-medium ${UI_STYLES.badge.success}`
          : UI_STYLES.badge.muted}
        title="Distancia del precio a la media móvil de 200 sesiones"
      >
        {label}
      </span>
      {(row.backtestSobreSma || row.backtestBajoSma) && (
        <span className={`mt-1 block text-[10px] ${UI_STYLES.text.muted}`} title={UI_TEXT.table.backtestBySmaTitle}>
          {row.backtestSobreSma && (
            <span className="block">Sobre {row.backtestSobreSma.exitoPct}% ({row.backtestSobreSma.casos})</span>
          )}
          {row.backtestBajoSma && (
            <span className="block">Bajo {row.backtestBajoSma.exitoPct}% ({row.backtestBajoSma.casos})</span>
          )}
        </span>
      )}
    </div>
  );
}

export function BacktestInfo({ row }: { row: WatchlistRowData }) {
  const { backtestCasos, backtestExitoPct, backtestPerdidoPct, backtestEstancadoPct, backtestDiasMedios } = row;
  if (backtestCasos === undefined) {
    return <span className={UI_STYLES.badge.muted}>{UI_TEXT.table.values.noData}</span>;
  }
  const pocaMuestra = backtestCasos < 10;

  return (
    <div className="leading-tight">
      <div className="flex gap-2 font-semibold">
        <span className={UI_STYLES.badge.success}>{backtestExitoPct}% ganó</span>
        <span className={UI_STYLES.badge.warning}>{backtestEstancadoPct}% estancó</span>
        <span className={UI_STYLES.badge.danger}>{backtestPerdidoPct}% perdió</span>
      </div>
      <span className={`block text-xs ${UI_STYLES.text.muted}`}>
        {backtestCasos} casos · {backtestDiasMedios}d media
        {pocaMuestra && <span className={`ml-1 ${UI_STYLES.badge.warning}`}>(poca muestra)</span>}
      </span>
    </div>
  );
}

export function RsiBadge({ rsi }: { rsi?: number }) {
  if (rsi === undefined || !Number.isFinite(rsi)) {
    return <span className={UI_STYLES.badge.muted}>{UI_TEXT.table.values.noData}</span>;
  }

  let colorClass = "bg-slate-100 text-slate-700 border-slate-200";
  let statusText = "RSI > 30";

  if (rsi <= 25) {
    colorClass = "bg-rose-50 text-rose-700 border-rose-200 font-bold";
    statusText = "RSI ≤ 25 (Extrema)";
  } else if (rsi <= 30) {
    colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold";
    statusText = "RSI ≤ 30 (Sobreventa)";
  }

  return (
    <div className="leading-tight">
      <span className="font-semibold text-slate-800">{rsi.toFixed(2)}</span>
      <span className={`mt-0.5 block rounded px-1.5 py-0.5 text-[10px] border ${colorClass}`} title={`RSI (14): ${rsi.toFixed(2)}`}>
        {statusText}
      </span>
    </div>
  );
}

interface PriceCellProps {
  row: WatchlistRowData;
  // En la tabla se muestra la variación sobre el precio; en la fila móvil ya aparece en la barra.
  showChange?: boolean;
  showEye?: boolean;
}

export function PriceCell({ row, showChange = true, showEye = true }: PriceCellProps) {
  const price = row.precio;
  if (!Number.isFinite(price) || price <= 0) {
    return <span className={UI_STYLES.text.secondary}>{UI_TEXT.table.values.notAvailable}</span>;
  }

  return (
    <CompanyHistoryTrigger
      companyId={row.idEmpresa}
      ticker={row.ticker}
      companyName={row.nombre}
      currency={row.moneda}
      metric="precio"
      showEye={showEye}
    >
      <span className="inline-flex flex-col items-end whitespace-nowrap">
        {showChange && (
          <PriceChange
            price={price}
            previousPrice={row.precioAnterior}
            className="mt-0.5 justify-end"
          />
        )}
        <span className="inline-block w-22.5 text-right font-medium text-slate-800">
          {formatScannedPrice(price, row.moneda)}
        </span>
      </span>
    </CompanyHistoryTrigger>
  );
}
