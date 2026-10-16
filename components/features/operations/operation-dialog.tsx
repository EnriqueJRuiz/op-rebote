"use client";

import { FormEvent, useId, useState } from "react";
import { abrirOperacionAction } from "@/app/actions/operaciones.actions";
import { UI_TEXT } from "@/domain/literales.constantes";
import { UI_STYLES } from "@/styles/ui-styles";
import { OperationDialogFrame } from "./operation-dialog-frame";

export interface OperationDialogProps {
  companyId: number;
  ticker: string;
  companyName: string;
  precioActual: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export function OperationDialog({
  companyId,
  ticker,
  companyName,
  precioActual,
  onClose,
  onSuccess,
}: OperationDialogProps) {
  const fieldId = useId();
  // El diálogo se monta al elegir una señal, así que el precio inicial siempre es el de esa señal.
  const [precioEntrada, setPrecioEntrada] = useState(precioActual.toString());
  const [capital, setCapital] = useState("1000");
  const [trailingStop, setTrailingStop] = useState("2.00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await abrirOperacionAction({
        empresa_id: companyId,
        precio_entrada: Number(precioEntrada), // el precio editado a mano (el del bróker)
        capital_invertido: Number(capital),
        trailing_stop_pct: Number(trailingStop),
      });

      if (result.success) {
        onClose();
        onSuccess?.();
        return;
      }
      setError(UI_TEXT.operations.openDialog.error(String(result.error ?? "")));
    } catch (requestError) {
      setError(UI_TEXT.operations.openDialog.error(requestError instanceof Error ? requestError.message : ""));
    }
    setLoading(false);
  };

  return (
    <OperationDialogFrame
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
            {loading ? UI_TEXT.operations.openDialog.confirming : UI_TEXT.operations.openDialog.confirm}
          </button>
        </div>
      </form>
    </OperationDialogFrame>
  );
}
