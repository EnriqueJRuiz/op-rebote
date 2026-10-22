"use client";

import { X, AlertTriangle } from "lucide-react";
import { UI_TEXT } from "@/domain/literales.constantes";
import { Operacion } from "@/domain/models/operacion";
import { UI_STYLES } from "@/styles/ui-styles";
import {
  formatOperationCapital,
  formatOperationPrice,
  getOperationName,
  getOperationTicker,
  MaxPriceValue,
  BatchPriceCell,
  VariationCell,
  TrailingStopCell,
} from "../shared/operation-cells";
import { Column } from "@/components/ui/core/data-table";

export function getOperationColumns(onClose: (operacion: Operacion) => void): Column<Operacion>[] {
  return [
    {
      header: UI_TEXT.table.columns.company,
      sortValue: getOperationTicker,
      render: (operacion) => {
        const current = operacion.precio_actual ?? null;

        // El precio máximo debe tomar como suelo tu precio de entrada o el máximo real de la operación activa
        const maxPrice = Math.max(operacion.precio_entrada, operacion.max_price ?? operacion.precio_entrada, current ?? operacion.precio_entrada);

        const stopPct = operacion.trailing_stop_pct ?? 2;
        const stopPrice = maxPrice * (1 - stopPct / 100);
        const stopHit = current != null && current <= stopPrice;

        // El precio de equilibrio o referencia de pérdida debe evaluarse estrictamente 
        // respecto a tu precio de entrada, evitando que un dato histórico antiguo marque pérdida al iniciar.
        const breakEven = operacion.precio_equilibrio_cero_perdidas ?? operacion.precio_entrada;

        // Solo hay trading loss si el precio actual es estrictamente menor que tu precio de entrada 
        // (o que el punto de equilibrio real de tu posición) y no ha tocado el stop principal.
        const tradingLoss = !stopHit && current != null && current < operacion.precio_entrada;
        const alertLabel = stopHit ? "STOP LOSS" : tradingLoss ? "TRADING LOSS" : null;

        return (
          <div className="flex flex-col items-start gap-1">
            <div className="font-semibold text-slate-900">{getOperationTicker(operacion)}</div>
            <div className="max-w-48 truncate text-xs text-slate-500">{getOperationName(operacion)}</div>
            {alertLabel && (
              <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-extrabold tracking-wide ${
                stopHit 
                  ? "border-rose-400 bg-rose-200 text-rose-950" 
                  : "border-fuchsia-400 bg-fuchsia-200 text-fuchsia-950"
              }`}>
                <AlertTriangle size={13} /> {alertLabel}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: UI_TEXT.operations.daysOpenHeader,
      sortValue: (operacion) => {
        const openedAt = new Date(operacion.fecha_apertura).getTime();
        return Number.isNaN(openedAt) ? -1 : Math.max(0, Math.floor((Date.now() - openedAt) / 86400000));
      },
      render: (operacion) => {
        const openedAt = new Date(operacion.fecha_apertura).getTime();
        if (Number.isNaN(openedAt)) return <span className="whitespace-nowrap text-sm tabular-nums">-</span>;
        const days = Math.max(0, Math.floor((Date.now() - openedAt) / 86400000));
        return <span className="whitespace-nowrap text-sm tabular-nums">{UI_TEXT.operations.daysOpen(days)}</span>;
      },
      cellClassName: "whitespace-nowrap tabular-nums",
    },
    {
      header: UI_TEXT.table.columns.entryPrice,
      sortValue: (operacion) => operacion.precio_entrada,
      render: (operacion) => formatOperationPrice(operacion.precio_entrada),
      cellClassName: "whitespace-nowrap tabular-nums",
    },
    {
      header: UI_TEXT.table.columns.ultimoPrecio ,
      sortValue: (operacion) => operacion.precio_actual,
      render: (operacion) => <BatchPriceCell operacion={operacion} />,
    },
    {
      header: UI_TEXT.table.columns.variacion,
      sortValue: (operacion) => {
        const c = operacion.precio_actual;
        const p = operacion.precio_anterior_lote;
        return c && p && p > 0 ? (c - p) / p : 0;
      },
      render: (operacion) => <VariationCell operacion={operacion} />,
    },
    {
      header: UI_TEXT.table.columns.maxPrice,
      sortValue: (operacion) => operacion.max_price,
      render: (operacion) => <MaxPriceValue operacion={operacion} />,
    },
    {
      header: UI_TEXT.table.columns.trailingStop,
      sortValue: (operacion) => operacion.trailing_stop_pct,
      render: (operacion) => <TrailingStopCell operacion={operacion} />,
    },
    {
      header: UI_TEXT.table.columns.actions,
      render: (operacion) => {
        const closePrice = operacion.precio_actual ?? operacion.precio_entrada;
        return (
          <button
            type="button"
            onClick={() => onClose(operacion)}
            aria-label={UI_TEXT.operations.closeAria(getOperationTicker(operacion))}
            className={`${UI_STYLES.button.secondarySm} whitespace-nowrap`}
          >
            <X size={14} aria-hidden="true" />
            {UI_TEXT.operations.closeButton}
          </button>
        );
      },
      headerClassName: "text-right",
      cellClassName: "text-right",
    },
  ];
}