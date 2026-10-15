"use client";

import { FormEvent, useId, useState } from "react";
import { cerrarOperacionAction } from "@/app/actions/operaciones.actions";
import { UI_TEXT } from "@/domain/literales.constantes";
import { Operacion } from "@/domain/models/operacion";
import { calcularResultadoOperacion } from "@/domain/rules/operacion.rules";
import { UI_STYLES } from "@/styles/ui-styles";
import { CloseOperationSummary } from "./close-operation-summary";
import { OperationDialogFrame } from "./operation-dialog-frame";
import { getOperationName, getOperationTicker } from "./operation-cells";

interface CloseOperationDialogProps {
  operacion: Operacion;
  onClose: () => void;
  onClosed: (id: number) => void;
}

type ExitPriceSource = keyof typeof UI_TEXT.operations.closeDialog.exitPriceHint;

// Precio de salida propuesto: el último precio conocido; si no hay, el máximo; y si no, la entrada.
function getDefaultExitPrice(operacion: Operacion): { price: number; source: ExitPriceSource } {
  const { precio_actual: last, max_price: max } = operacion;
  if (typeof last === "number" && Number.isFinite(last)) return { price: last, source: "last" };
  if (typeof max === "number" && Number.isFinite(max)) return { price: max, source: "max" };
  return { price: operacion.precio_entrada, source: "entry" };
}

export function CloseOperationDialog({ operacion, onClose, onClosed }: CloseOperationDialogProps) {
  const fieldId = useId();
  const texts = UI_TEXT.operations.closeDialog;
  const defaultExit = getDefaultExitPrice(operacion);
  // Los precios de Yahoo arrastran ruido de coma flotante (52.13000106…); 7 cifras significativas lo quitan
  // sin perder precisión en precios muy pequeños (con decimales fijos, 0.00004 acabaría siendo 0).
  const defaultInput = String(Number(defaultExit.price.toPrecision(7)));

  const [exitInput, setExitInput] = useState(defaultInput);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const exitPrice = exitInput.trim() === "" ? NaN : Number(exitInput);
  const validExitPrice = Number.isFinite(exitPrice) && exitPrice > 0;
  const resultado = validExitPrice ? calcularResultadoOperacion(operacion, exitPrice) : null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validExitPrice) return;
    setLoading(true);
    setError("");

    try {
      const result = await cerrarOperacionAction(operacion.id, exitPrice);
      if (result.success) {
        onClosed(operacion.id);
        return;
      }
      setError(texts.error(String(result.error ?? "")));
    } catch (requestError) {
      setError(texts.error(requestError instanceof Error ? requestError.message : ""));
    }
    setLoading(false);
  };

  return (
    <OperationDialogFrame
      title={texts.title}
      description={
        <>
          <span className={`${UI_STYLES.badge.ticker} mr-2`}>{getOperationTicker(operacion)}</span>
          {getOperationName(operacion)}
        </>
      }
      busy={loading}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className={UI_STYLES.modal.body}>
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
              value={exitInput}
              onChange={(event) => setExitInput(event.target.value)}
              aria-describedby={`${fieldId}-exit-hint`}
              className={`${UI_STYLES.form.input} min-w-0 flex-1`}
            />
            {exitInput !== defaultInput && (
              <button
                type="button"
                onClick={() => setExitInput(defaultInput)}
                disabled={loading}
                className={UI_STYLES.button.secondary}
              >
                {texts.resetPrice}
              </button>
            )}
          </div>
          <p id={`${fieldId}-exit-hint`} className={UI_STYLES.form.hint}>
            {texts.exitPriceHint[defaultExit.source]}
          </p>
        </div>

        <CloseOperationSummary operacion={operacion} resultado={resultado} />

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
            {texts.cancel}
          </button>
          <button
            type="submit"
            disabled={loading || !validExitPrice}
            className={UI_STYLES.button.danger}
          >
            {loading ? texts.confirming : texts.confirm}
          </button>
        </div>
      </form>
    </OperationDialogFrame>
  );
}
