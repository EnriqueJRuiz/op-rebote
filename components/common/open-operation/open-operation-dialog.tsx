"use client";

import { useId } from "react";
import { UI_TEXT } from "@/domain/literales.constantes";
import { UI_STYLES } from "@/styles/ui-styles";
import { DialogFrame } from "@/components/ui/core/dialog-frame";
import { ShieldAlert, Target, Scale } from "lucide-react";
import { useOpenOperationForm } from "./use-open-operation-form";

export interface OpenOperationDialogProps {
  companyId: number;
  ticker: string;
  companyName: string;
  precioActual: number;
  onClose: () => void;
  onSuccess?: () => void;
}

// Formato es-ES con decimales fijos.
const formatCurrency = (val: number, decimals = 2) =>
  val.toLocaleString("es-ES", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

export function OpenOperationDialog({
  companyId,
  ticker,
  companyName,
  precioActual,
  onClose,
  onSuccess,
}: OpenOperationDialogProps) {
  const fieldId = useId();
  const {
    precioEntrada, setPrecioEntrada, capital, setCapital,
    trailingStop, setTrailingStop, targetPct, setTargetPct,
    comisionEntrada, setComisionEntrada, comisionSalida, setComisionSalida,
    numTrailing, numTarget, stopLossPrice, targetPrice,
    breakEvenPrice, breakEvenPct, loading, error,
    handleSubmit,
  } = useOpenOperationForm({ companyId, precioActual, onClose, onSuccess });

  return (
    <DialogFrame
      title={UI_TEXT.operations.openDialog.title}
      description={
        <>
          <span className={`${UI_STYLES.badge.ticker} mr-2`}>{ticker}</span>
          {companyName}
        </>
      }
      busy={loading}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className={UI_STYLES.modal.body}>
        <div>
          <label htmlFor={`${fieldId}-entry`} className={UI_STYLES.form.label}>
            {UI_TEXT.operations.openDialog.entryPrice}
          </label>
          <input
            id={`${fieldId}-entry`}
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            required
            value={precioEntrada}
            onChange={(event) => setPrecioEntrada(event.target.value)}
            aria-describedby={`${fieldId}-entry-hint`}
            className={UI_STYLES.form.input}
          />
          <p id={`${fieldId}-entry-hint`} className={UI_STYLES.form.hint}>
            {UI_TEXT.operations.openDialog.entryPriceHint}
          </p>
        </div>

        <div>
          <label htmlFor={`${fieldId}-capital`} className={UI_STYLES.form.label}>
            {UI_TEXT.operations.openDialog.capital}
          </label>
          <input
            id={`${fieldId}-capital`}
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            required
            value={capital}
            onChange={(event) => setCapital(event.target.value)}
            className={UI_STYLES.form.input}
          />
        </div>

        {/* Inputs de Porcentajes */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${fieldId}-trailing`} className={UI_STYLES.form.label}>
              {UI_TEXT.operations.openDialog.trailingStop}
            </label>
            <input
              id={`${fieldId}-trailing`}
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              max="100"
              required
              value={trailingStop}
              onChange={(event) => setTrailingStop(event.target.value)}
              className={UI_STYLES.form.input}
            />
          </div>

          <div>
            <label htmlFor={`${fieldId}-target`} className={UI_STYLES.form.label}>
              Objetivo éxito (%)
            </label>
            <input
              id={`${fieldId}-target`}
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              max="1000"
              required
              value={targetPct}
              onChange={(event) => setTargetPct(event.target.value)}
              className={UI_STYLES.form.input}
            />
          </div>
        </div>

        {/* Inputs para Costes/Comisiones de Entrada y Salida */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${fieldId}-fee-entry`} className={UI_STYLES.form.label}>
              Coste Entrada (€)
            </label>
            <input
              id={`${fieldId}-fee-entry`}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              required
              value={comisionEntrada}
              onChange={(event) => setComisionEntrada(event.target.value)}
              className={UI_STYLES.form.input}
            />
          </div>

          <div>
            <label htmlFor={`${fieldId}-fee-exit`} className={UI_STYLES.form.label}>
              Coste Salida (€)
            </label>
            <input
              id={`${fieldId}-fee-exit`}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              required
              value={comisionSalida}
              onChange={(event) => setComisionSalida(event.target.value)}
              className={UI_STYLES.form.input}
            />
          </div>
        </div>

        {/* --- PANEL DE CÁLCULOS IMPORTANTES --- */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 text-xs">
          <div className="font-semibold text-slate-800 mb-1">Resumen y Estimaciones</div>

          {/* Stop Loss solo con precio por acción */}
          <div className="flex items-center justify-between text-rose-700">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldAlert size={14} /> Stop Loss ({numTrailing.toFixed(1)}%):
            </span>
            <span className="font-semibold tabular-nums">
              {formatCurrency(stopLossPrice, 3)} €
            </span>
          </div>

          {/* Objetivo Éxito solo con precio por acción */}
          <div className="flex items-center justify-between text-emerald-700">
            <span className="flex items-center gap-1.5 font-medium">
              <Target size={14} /> Objetivo (+{numTarget.toFixed(1)}%):
            </span>
            <span className="font-semibold tabular-nums">
              {formatCurrency(targetPrice, 3)} €
            </span>
          </div>

          {/* Break-even exacto según las comisiones especificados */}
          <div className="flex items-center justify-between text-slate-700 pt-1 border-t border-slate-200">
            <span className="flex items-center gap-1.5 font-medium">
              <Scale size={14} /> Precio a 0 (Subida +{formatCurrency(breakEvenPct, 2)}%):
            </span>
            <span className="font-semibold tabular-nums text-slate-900">
              {formatCurrency(breakEvenPrice, 3)} €
            </span>
          </div>
        </div>
        {/* ------------------------------------- */}

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
            {UI_TEXT.operations.openDialog.cancel}
          </button>
          <button type="submit" disabled={loading} className={UI_STYLES.button.primary}>
            {loading
              ? UI_TEXT.operations.openDialog.confirming
              : UI_TEXT.operations.openDialog.confirm}
          </button>
        </div>
      </form>
    </DialogFrame>
  );
}