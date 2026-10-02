"use client";

import { ChessBishop, Crown } from "lucide-react";
import { DIVIDEND_TIERS } from "@/domain/constants";
import { CompanyRecord } from "@/domain/models/trading";
import { UI_TEXT } from "@/domain/literales.constantes";
import { UI_STYLES } from "@/styles/ui-styles";

export interface TechnicalRow {
  precio: number;
  precioAnterior?: number;
  minimoReciente?: number;
  distSma200Pct?: number;
  volumenRelativo?: number;
  rsi?: number;
  moneda?: string;
  backtestCasos?: number;
  backtestExitoPct?: number;
  backtestPerdidoPct?: number;
  backtestEstancadoPct?: number;
  backtestDiasMedios?: number;
  backtestSobreSma?: { casos: number; exitoPct: number };
  backtestBajoSma?: { casos: number; exitoPct: number };
}

export function getFloorDistancePercent(row: { precio: number; minimoReciente?: number }): number | null {
  const { precio, minimoReciente } = row;
  if (!Number.isFinite(precio) || precio <= 0 || !Number.isFinite(minimoReciente) || !minimoReciente || minimoReciente <= 0) {
    return null;
  }
  return ((precio - minimoReciente) / precio) * 100;
}

export function formatCurrencyPrice(price: number, currency?: string): string {
  const formattedNumber = new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);

  if (!currency) return formattedNumber;

  try {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency,
    }).format(price);
  } catch {
    return `${formattedNumber} ${currency}`;
  }
}

export function FloorDistance({ row }: { row: { precio: number; minimoReciente?: number } }) {
  const distance = getFloorDistancePercent(row);
  if (distance === null) {
    return <span className={UI_STYLES.badge.muted}>{UI_TEXT.table.values.noData}</span>;
  }
  const label = `${Math.abs(distance).toFixed(2)}%`
  

  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap ${distance < 0 ? `font-medium ${UI_STYLES.badge.danger}` : "font-medium"}`} title={UI_TEXT.floor.description}>
      {label}
      <span 
        className={`font-bold ${distance < 0 ? "text-rose-600" : "text-emerald-600"}`}
        aria-hidden="true"
      >
      {distance < 0 ? "▼" : "▲"}
</span>
    </span>
  );
}

export function Sma200Distance({ row }: { row: { distSma200Pct?: number; backtestSobreSma?: { casos: number; exitoPct: number }; backtestBajoSma?: { casos: number; exitoPct: number } } }) {
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

export function RelativeVolume({ value }: { value?: number }) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return <span className="text-slate-400">{UI_TEXT.table.values.noData}</span>;
  }

  const trendLabel = value > 1
    ? UI_TEXT.table.values.relativeVolumeAboveAverage
    : value < 1
      ? UI_TEXT.table.values.relativeVolumeBelowAverage
      : UI_TEXT.table.values.relativeVolumeAtAverage;
  const trendArrow = value > 1 ? "▲" : value < 1 ? "▼" : "→";
  const trendStyle = value > 1
    ? UI_STYLES.badge.success
    : value < 1
      ? UI_STYLES.badge.danger
      : UI_STYLES.badge.muted;

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium ${trendStyle}`}
      title={`RVOL ${value.toFixed(2)}x: ${trendLabel}`}
      aria-label={`RVOL ${value.toFixed(2)}x, ${trendLabel}`}
    >
      <span>{value.toFixed(2)}x</span>
      <span aria-hidden="true">{trendArrow}</span>
    </span>
  );
}

export function RsiTrend({
  value,
  previousValue,
  oversoldThreshold,
}: {
  value: number;
  previousValue?: number;
  oversoldThreshold: number;
}) {
  const change = previousValue === undefined ? 0 : value - previousValue;
  const rising = change > 0;
  const falling = change < 0;
  const recoveringFromOversold =
    previousValue !== undefined &&
    previousValue <= oversoldThreshold &&
    value > oversoldThreshold;
  const possibleTurn =
    previousValue !== undefined &&
    value <= oversoldThreshold &&
    rising;
  const status = recoveringFromOversold
    ? UI_TEXT.table.values.rsiRecovering
    : possibleTurn
      ? UI_TEXT.table.values.rsiPossibleTurn
      : rising
        ? UI_TEXT.table.values.rsiRising
        : falling
          ? UI_TEXT.table.values.rsiFalling
          : UI_TEXT.table.values.rsiUnchanged;
  const trendStyle = rising
    ? UI_STYLES.badge.success
    : falling
      ? UI_STYLES.badge.danger
      : UI_STYLES.badge.muted;

  return (
    <span
      className={trendStyle}
      title={previousValue === undefined ? UI_TEXT.table.values.rsiNoPreviousValue : `${status} (${previousValue.toFixed(2)} → ${value.toFixed(2)})`}
      aria-label={previousValue === undefined ? `${value.toFixed(2)}, ${UI_TEXT.table.values.rsiNoComparison}` : `${value.toFixed(2)}, ${status}`}
    >
      <span className="inline-flex items-center gap-1">
        <span>{value.toFixed(2)}</span>
        {previousValue !== undefined && (
          <span aria-hidden="true">{rising ? "▲" : falling ? "▼" : "→"}</span>
        )}
      </span>
      {possibleTurn && (
        <span className="block text-[10px] font-normal">{UI_TEXT.table.values.possibleTurn}</span>
      )}
    </span>
  );
}

export function BacktestInfo({ row, compact = false }: { row: { backtestCasos?: number; backtestExitoPct?: number; backtestPerdidoPct?: number; backtestEstancadoPct?: number; backtestDiasMedios?: number }; compact?: boolean }) {
  const { backtestCasos, backtestExitoPct, backtestPerdidoPct, backtestEstancadoPct, backtestDiasMedios } = row;
  if (backtestCasos === undefined) {
    return <span className={UI_STYLES.badge.muted}>{UI_TEXT.table.values.noData}</span>;
  }
  const pocaMuestra = backtestCasos < 10;

  return (
    <div className="leading-tight">
      <div className="flex gap-2 font-semibold">
        <span className={UI_STYLES.badge.success} title="Señales históricas que alcanzaron el objetivo" aria-label={`${backtestExitoPct}% ganó`}>{backtestExitoPct}%{compact ? "" : " ganó"}</span>
        <span className={UI_STYLES.badge.warning} title="Señales históricas que terminaron estancadas" aria-label={`${backtestEstancadoPct}% estancó`}>{backtestEstancadoPct}%{compact ? "" : " estancó"}</span>
        <span className={UI_STYLES.badge.danger} title="Señales históricas que alcanzaron el stop" aria-label={`${backtestPerdidoPct}% perdió`}>{backtestPerdidoPct}%{compact ? "" : " perdió"}</span>
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

export function DividendBadge({ empresa }: { empresa: CompanyRecord }) {
  const tierLabel =
    empresa.dividend_tier === DIVIDEND_TIERS.KING
      ? UI_TEXT.table.values.dividendKing
      : empresa.dividend_tier === DIVIDEND_TIERS.ARISTOCRAT
        ? UI_TEXT.table.values.dividendAristocrat
        : undefined;

  const TierIcon =
    empresa.dividend_tier === DIVIDEND_TIERS.KING
      ? Crown
      : ChessBishop;

  const tierStyle =
    empresa.dividend_tier === DIVIDEND_TIERS.KING
      ? "text-amber-500"
      : "text-slate-500";

  const formatDividendYield = (val?: number) => {
    if (!Number.isFinite(val) || !val || val <= 0) return UI_TEXT.table.values.notAvailable;
    return `${(val * 100).toFixed(2)}${UI_TEXT.table.formatting.percentageUnit}`;
  };

  return (
    <span className="inline-flex w-22.5 items-center justify-center">
      {empresa.es_dividendo ? (
        <>
          <span
            className="w-13 text-right text-sm tabular-nums text-slate-700"
            title={UI_TEXT.table.columns.dividendYield}
          >
            {formatDividendYield(empresa.dividend_yield)}
          </span>

          <span className="ml-2 flex w-4 justify-center">
            {tierLabel && (
              <span className={tierStyle} title={tierLabel} aria-label={tierLabel}>
                <TierIcon size={14} aria-hidden="true" />
              </span>
            )}
          </span>
        </>
      ) : (
        <span className="w-13 text-center text-slate-400">—</span>
      )}
    </span>
  );
}
