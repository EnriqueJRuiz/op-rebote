"use client";

import { ReactNode, useId } from "react";
import { UI_TEXT } from "@/domain/literales.constantes";
import { Operacion } from "@/domain/models/operacion";
import { UI_STYLES } from "@/styles/ui-styles";
import { DialogFrame } from "@/components/ui/core/dialog-frame";
import {
  formatOperationCapital,
  formatOperationPrice,
  formatOperationSignedCapital,
  formatOperationSignedPercent,
  getOperationName,
  getOperationTicker,
} from "../shared/operation-cells";
import { useCloseOperationForm } from "../shared/use-close-operation-form";

const RESULT_TONES = {
  gain: { box: "border-emerald-200 bg-emerald-50/60", text: "text-emerald-700" },
  loss: { box: "border-rose-200 bg-rose-50/60", text: "text-rose-700" },
  even: { box: "border-slate-200 bg-slate-50/70", text: "text-slate-800" },
} as const;

function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium tabular-nums text-slate-800">{children}</dd>
    </div>
  );
}

interface CloseOperationDialogProps {
  operacion: Operacion;
  onClose: () => void;
  onClosed: (id: number) => void;
}

export function CloseOperationDialog({ operacion, onClose, onClosed }: CloseOperationDialogProps) {
  const fieldId = useId();
  const texts = UI_TEXT.operations.closeDialog;
  const form = useCloseOperationForm(operacion, onClosed);
  const { resultado } = form;
  const tone = RESULT_TONES[form.resultTone];

  // Comisiones obtenidas de la base de datos para la operación
  const comisionesBD = operacion.comisiones_broker ?? 0;

  return (
    <DialogFrame
      title={texts.title}
      description={
        <>
          <span className={`${UI_STYLES.badge.ticker} mr-2`}>{getOperationTicker(operacion)}</span>
          {getOperationName(operacion)}
        </>
      }
      busy={form.loading}
      onClose={onClose}
    >
      <form onSubmit={form.handleSubmit} className={UI_STYLES.modal.body}>
        <p className="text-sm text-slate-600">{texts.description}</p>

        <div>
          <label htmlFor={`${fieldId}-exit`} className={UI_STYLES.form.label}>
            {texts.exitPrice}
          </label>
          <div className="flex items-start gap-2">
            <input
              id={`${fieldId}-exit`}
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              required
              value={form.exitInput}
              onChange={(event) => form.setExitInput(event.target.value)}
              aria-describedby={`${fieldId}-exit-hint`}
              className={`${UI_STYLES.form.input} min-w-0 flex-1`}
            />
            {form.exitPriceEdited && (
              <button
                type="button"
                onClick={form.resetExitPrice}
                disabled={form.loading}
                className={UI_STYLES.button.secondary}
              >
                {texts.resetPrice}
              </button>
            )}
          </div>
          <p id={`${fieldId}-exit-hint`} className={UI_STYLES.form.hint}>
            {texts.exitPriceHint[form.exitPriceSource]}
          </p>
        </div>

        {/* Resumen de Datos y Cálculo del Resultado con la fila de Comisiones */}
        <dl className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-slate-50/70 text-sm">
          <SummaryRow label={UI_TEXT.operations.dateFrom}>
            {new Date(operacion.fecha_apertura).toLocaleDateString("es-ES")}
          </SummaryRow>
          <SummaryRow label={UI_TEXT.operations.dateUntilToday}>
            {new Date().toLocaleDateString("es-ES")}
          </SummaryRow>
          <SummaryRow label={UI_TEXT.table.columns.entryPrice}>
            {formatOperationPrice(operacion.precio_entrada)}
          </SummaryRow>
          <SummaryRow label={texts.invested}>{formatOperationCapital(operacion.capital_invertido)}</SummaryRow>
          <SummaryRow label={texts.exitAmount}>
            {resultado ? formatOperationCapital(resultado.importeSalida) : UI_TEXT.table.values.notAvailable}
          </SummaryRow>

          {/* Fila dedicada a los costes/comisiones de la BD */}
          <SummaryRow label={texts.costs}>
            {formatOperationSignedCapital(-comisionesBD)}
          </SummaryRow>
        </dl>

        {/* Caja de Resultado Final con las comisiones descontadas */}
        <div className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-3 ${tone.box}`}>
          <span className="text-sm font-medium text-slate-700">{texts.result}</span>
          <span className={`text-right tabular-nums ${tone.text}`}>
            <span className="block text-lg font-bold">{formatOperationSignedCapital(resultado?.beneficioNeto)}</span>
            {resultado?.rentabilidadPct != null && (
              <span className="block text-xs font-medium">
                {texts.resultPct(formatOperationSignedPercent(resultado.rentabilidadPct))}
              </span>
            )}
          </span>
        </div>

        {form.error && (
          <p role="alert" className={UI_STYLES.form.error}>
            {form.error}
          </p>
        )}

        <div className={UI_STYLES.modal.footer}>
          <button
            type="button"
            onClick={onClose}
            disabled={form.loading}
            className={UI_STYLES.button.secondary}
          >
            {texts.cancel}
          </button>
          <button
            type="submit"
            disabled={form.loading || !form.canClose}
            className={UI_STYLES.button.danger}
          >
            {form.loading ? texts.confirming : texts.confirm}
          </button>
        </div>
      </form>
    </DialogFrame>
  );
}