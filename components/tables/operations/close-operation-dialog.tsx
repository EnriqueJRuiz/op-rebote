"use client";

import { useState } from "react";
import { cerrarOperacionAction } from "@/app/actions/operaciones.actions";
import { UI_TEXT } from "@/domain/literales.constantes";
import { Operacion } from "@/domain/models/operacion";
import { UI_STYLES } from "@/styles/ui-styles";
import { OperationDialogFrame } from "./operation-dialog-frame";
import { formatOperationPrice, formatOperationCapital, getOperationName, getOperationTicker } from "./operation-cells";

interface CloseOperationDialogProps {
  operacion: Operacion;
  onClose: () => void;
  onClosed: (id: number) => void;
}

export function CloseOperationDialog({ operacion, onClose, onClosed }: CloseOperationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Usamos el precio actual (último precio) como salida estimada, con fallback al máximo o entrada.
  const exitPrice = operacion.precio_actual ?? operacion.max_price ?? operacion.precio_entrada;

  // Cálculos precisos de variación y cantidad ganada/perdida
  const diff = exitPrice - operacion.precio_entrada;
  const variationPct = operacion.precio_entrada > 0 ? (diff / operacion.precio_entrada) * 100 : 0;
  const profitAmount = typeof operacion.capital_invertido === "number" ? operacion.capital_invertido * (variationPct / 100) : null;

  const isPositive = diff > 0;
  const isNegative = diff < 0;
  const colorClass = isPositive 
    ? "text-emerald-700 font-semibold" 
    : isNegative 
      ? "text-rose-700 font-semibold" 
      : "text-slate-800 font-semibold";

  const handleConfirm = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await cerrarOperacionAction(operacion.id, exitPrice);
      if (result.success) {
        onClosed(operacion.id);
        return;
      }
      setError(UI_TEXT.operations.closeDialog.error(String(result.error ?? "")));
    } catch (requestError) {
      setError(UI_TEXT.operations.closeDialog.error(requestError instanceof Error ? requestError.message : ""));
    }
    setLoading(false);
  };

  return (
    <OperationDialogFrame
      title={UI_TEXT.operations.closeDialog.title}
      description={
        <>
          <span className={`${UI_STYLES.badge.ticker} mr-2`}>{getOperationTicker(operacion)}</span>
          {getOperationName(operacion)}
        </>
      }
      busy={loading}
      onClose={onClose}
    >
      <div className={UI_STYLES.modal.body}>
        <p className="text-sm text-slate-600">{UI_TEXT.operations.closeDialog.description}</p>

        <dl className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-slate-50/70 text-sm">
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            <dt className="text-slate-500">{UI_TEXT.table.columns.entryPrice}</dt>
            <dd className="font-medium tabular-nums text-slate-800">
              {formatOperationPrice(operacion.precio_entrada)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            <dt className="text-slate-500">{UI_TEXT.operations.closeDialog.exitPrice}</dt>
            <dd className="font-medium tabular-nums text-slate-800">{formatOperationPrice(exitPrice)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            <dt className="text-slate-500">Resultado estimado</dt>
            <dd className={`tabular-nums ${colorClass}`}>
              {isPositive ? "+" : ""}{variationPct.toFixed(2)}%
              {profitAmount !== null && (
                <span className="ml-2">
                  ({isPositive ? "+" : ""}{formatOperationCapital(profitAmount)})
                </span>
              )}
            </dd>
          </div>
        </dl>
        <p className={UI_STYLES.form.hint}>{UI_TEXT.operations.closeDialog.exitPriceHint}</p>

        {error && (
          <p role="alert" className={UI_STYLES.form.error}>
            {error}
          </p>
        )}

        <div className={UI_STYLES.modal.footer}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={UI_STYLES.button.secondary}
          >
            {UI_TEXT.operations.closeDialog.cancel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={UI_STYLES.button.danger}
          >
            {loading ? UI_TEXT.operations.closeDialog.confirming : UI_TEXT.operations.closeDialog.confirm}
          </button>
        </div>
      </div>
    </OperationDialogFrame>
  );
}