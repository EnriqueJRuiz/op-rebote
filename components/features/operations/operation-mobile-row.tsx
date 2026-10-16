"use client";

import { ChevronDown, X, AlertTriangle, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { UI_TEXT } from "@/domain/literales.constantes";
import { Operacion } from "@/domain/models/operacion";
import { UI_STYLES } from "@/styles/ui-styles";
import {
  formatOperationCapital,
  formatOperationPercent,
  formatOperationPrice,
  getOperationName,
  getOperationTicker,
  MaxPriceValue,
} from "./operation-cells";
import { CompanyHistoryTrigger } from "../companies/history/company-history-trigger";

interface OperationMobileRowProps {
  operacion: Operacion;
  expanded: boolean;
  onToggle: () => void;
  onClose: (operacion: Operacion) => void;
}

export function OperationMobileRow({ operacion, expanded, onToggle, onClose }: OperationMobileRowProps) {
  const ticker = getOperationTicker(operacion);
  const current = operacion.precio_actual ?? null;
  const maxPrice = Math.max(operacion.max_price ?? operacion.precio_entrada, current ?? operacion.precio_entrada);
  const stopPct = operacion.trailing_stop_pct ?? 2;
  const stopPrice = maxPrice * (1 - stopPct / 100);
  const stopHit = current != null && current <= stopPrice;
  const breakEven = operacion.precio_equilibrio_cero_perdidas;
  const tradingLoss = !stopHit && current != null && current <= breakEven;
  const alertLabel = stopHit ? "STOP LOSS" : tradingLoss ? "TRADING LOSS" : null;

  const previous = operacion.precio_anterior_lote;
  const variation = current != null && previous != null && previous > 0 ? ((current - previous) / previous) * 100 : null;
  const trendClass = variation == null ? "text-slate-500" : variation > 0 ? "text-emerald-700" : variation < 0 ? "text-rose-700" : "text-slate-500";
  const TrendIcon = variation == null || variation === 0 ? Minus : variation > 0 ? TrendingUp : TrendingDown;

  const alertBgClass = stopHit
    ? "bg-rose-50 border-rose-200"
    : tradingLoss
      ? "bg-fuchsia-50 border-fuchsia-200"
      : "";

  const closePrice = current ?? operacion.precio_entrada;

  return (
    <div className={`${UI_STYLES.table.mobileRow} ${alertBgClass}`}>
      <button
        type="button"
        onClick={onToggle}
        className={UI_STYLES.table.mobileRowButton}
        aria-expanded={expanded}
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className={`${UI_STYLES.table.mobileRowTitle} block`}>{ticker}</span>
            {alertLabel && (
              <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-extrabold ${
                stopHit ? "bg-rose-200 text-rose-950" : "bg-fuchsia-200 text-fuchsia-950"
              }`}>
                <AlertTriangle size={11} /> {alertLabel}
              </span>
            )}
          </span>
          <span className="block truncate text-xs text-slate-500">{getOperationName(operacion)}</span>
        </span>
        <ChevronDown
          className={`${UI_STYLES.table.mobileRowIcon} ${expanded ? "rotate-180" : ""}`}
          size={18}
          aria-hidden="true"
        />
      </button>
      {expanded && (
        <div className={UI_STYLES.table.mobileDetails}>
          <div>
            <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.entryPrice}</p>
            <p className={`${UI_STYLES.table.mobileValue} tabular-nums`}>
              {formatOperationPrice(operacion.precio_entrada)}
            </p>
          </div>
          <div>
            <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.ultimoPrecio}</p>
            <p className={`${UI_STYLES.table.mobileValue} tabular-nums font-semibold`}>
              {formatOperationPrice(current)}
            </p>
          </div>
          <div>
            <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.variacion}</p>
            <div className="mt-0.5">
              {operacion.empresa_id != null ? (
                <CompanyHistoryTrigger
                  companyId={operacion.empresa_id}
                  ticker={getOperationTicker(operacion)}
                  companyName={getOperationName(operacion)}
                  metric="precio"
                >
                  <span className={`inline-flex items-center gap-1 font-semibold tabular-nums ${trendClass} cursor-pointer`}>
                    <TrendIcon size={14} />
                    {variation == null ? "Sin dato" : `${variation > 0 ? "+" : ""}${variation.toFixed(2)}%`}
                  </span>
                </CompanyHistoryTrigger>
              ) : (
                <span className={`inline-flex items-center gap-1 font-semibold tabular-nums ${trendClass}`}>
                  <TrendIcon size={14} />
                  {variation == null ? "Sin dato" : `${variation > 0 ? "+" : ""}${variation.toFixed(2)}%`}
                </span>
              )}
            </div>
          </div>
          <div>
            <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.maxPrice}</p>
            <MaxPriceValue operacion={operacion} />
          </div>
          <div>
            <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.trailingStop}</p>
            <p className={`${UI_STYLES.table.mobileValue} tabular-nums`}>
              {formatOperationPrice(stopPrice)} ({formatOperationPercent(stopPct)})
            </p>
          </div>
          <div>
            <p className={UI_STYLES.table.mobileLabel}>{UI_TEXT.table.columns.capital}</p>
            <p className={`${UI_STYLES.table.mobileValue} tabular-nums`}>
              {formatOperationCapital(operacion.capital_invertido)}
            </p>
          </div>
          <div className="col-span-2 pt-2">
            <button
              type="button"
              onClick={() => onClose(operacion)}
              aria-label={UI_TEXT.operations.closeAria(ticker)}
              className={`${UI_STYLES.button.secondary} w-full`}
            >
              <X size={16} aria-hidden="true" />
              {UI_TEXT.operations.closeButton}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}