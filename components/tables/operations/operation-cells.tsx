"use client";

import { APP_CONFIG } from "@/domain/constants";
import { UI_TEXT } from "@/domain/literales.constantes";
import { Operacion } from "@/domain/models/operacion";
import { UI_STYLES } from "@/styles/ui-styles";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { CompanyHistoryTrigger } from "@/components/tables/common/company-history-trigger";

const CAPITAL_FORMAT = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: APP_CONFIG.BASE_CURRENCY,
});

// Para resultados: muestra + o - salvo en cero.
const SIGNED_CAPITAL_FORMAT = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: APP_CONFIG.BASE_CURRENCY,
  signDisplay: "exceptZero",
});

const SIGNED_PERCENT_FORMAT = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
});

type Nullable = number | null | undefined;

function isNumber(value: Nullable): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function formatOperationPrice(value: Nullable) {
  if (!isNumber(value)) return UI_TEXT.table.values.notAvailable;
  return value.toLocaleString("es-ES", { maximumFractionDigits: 3 });
}

export function formatOperationCapital(value: Nullable) {
  if (!isNumber(value)) return UI_TEXT.table.values.notAvailable;
  return CAPITAL_FORMAT.format(value);
}

export function formatOperationSignedCapital(value: Nullable) {
  if (!isNumber(value)) return UI_TEXT.table.values.notAvailable;
  return SIGNED_CAPITAL_FORMAT.format(value);
}

export function formatOperationSignedPercent(value: Nullable) {
  if (!isNumber(value)) return UI_TEXT.table.values.notAvailable;
  return `${SIGNED_PERCENT_FORMAT.format(value)}${UI_TEXT.table.formatting.percentageUnit}`;
}

export function formatOperationPercent(value: Nullable) {
  if (!isNumber(value)) return UI_TEXT.table.values.notAvailable;
  return `${value.toLocaleString("es-ES", { maximumFractionDigits: 2 })}${UI_TEXT.table.formatting.percentageUnit}`;
}

export function getOperationTicker(operacion: Operacion) {
  return operacion.ticker || UI_TEXT.operations.fallbackTicker(operacion.id);
}

export function getOperationName(operacion: Operacion) {
  if (operacion.nombre) return operacion.nombre;
  return operacion.empresa_id == null ? "" : UI_TEXT.operations.fallbackName(operacion.empresa_id);
}

export function MaxPriceValue({ operacion }: { operacion: Operacion }) {
  const { max_price: maxPrice, precio_entrada: entryPrice } = operacion;
  const aboveEntry = isNumber(maxPrice) && maxPrice > entryPrice;

  return (
    <span
      className={`whitespace-nowrap font-semibold tabular-nums ${
        aboveEntry ? UI_STYLES.badge.success : UI_STYLES.text.primary
      }`}
    >
      {formatOperationPrice(maxPrice)}
    </span>
  );
}

export function BatchPriceCell({ operacion }: { operacion: Operacion }) {
  return (
    <span className="whitespace-nowrap font-semibold tabular-nums">
      {formatOperationPrice(operacion.precio_actual)}
    </span>
  );
}

export function VariationCell({ operacion }: { operacion: Operacion }) {
  const current = operacion.precio_actual;
  // Usamos el precio de entrada como base para que al comprar empiece en 0%
  const entry = operacion.precio_entrada;
  
  const variation = isNumber(current) && isNumber(entry) && entry > 0 
    ? ((current - entry) / entry) * 100 
    : null;

  const trendClass = !isNumber(variation) ? "text-slate-500" : variation > 0 ? "text-emerald-700" : variation < 0 ? "text-rose-700" : "text-slate-500";
  const TrendIcon = !isNumber(variation) || variation === 0 ? Minus : variation > 0 ? TrendingUp : TrendingDown;

  const content = (
    <span className={`inline-flex items-center gap-1 font-semibold tabular-nums ${trendClass} cursor-pointer hover:opacity-80 transition-opacity`}>
      <TrendIcon size={16} />
      {!isNumber(variation) ? "Sin dato" : `${variation > 0 ? "+" : ""}${variation.toFixed(2)}%`}
    </span>
  );

  if (!operacion.empresa_id) return content;

  return (
    <CompanyHistoryTrigger
      companyId={operacion.empresa_id}
      ticker={getOperationTicker(operacion)}
      companyName={getOperationName(operacion)}
      metric="precio"
      showEye={false}
    >
      {content}
    </CompanyHistoryTrigger>
  );
}

export function TrailingStopCell({ operacion }: { operacion: Operacion }) {
  const maxPrice = Math.max(operacion.max_price ?? operacion.precio_entrada, operacion.precio_actual ?? operacion.precio_entrada);
  const stopPct = operacion.trailing_stop_pct ?? 2;
  const stopPrice = maxPrice * (1 - stopPct / 100);

  return (
    <div className="whitespace-nowrap tabular-nums">
      <span className="font-semibold">{formatOperationPrice(stopPrice)}</span>
      <span className="ml-1 text-xs text-slate-500">({formatOperationPercent(stopPct)})</span>
    </div>
  );
}