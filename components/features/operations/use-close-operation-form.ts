"use client";

import { FormEvent, useState } from "react";
import { cerrarOperacionAction } from "@/app/actions/operaciones.actions";
import { APP_CONFIG } from "@/domain/constants";
import { UI_TEXT } from "@/domain/literales.constantes";
import { Operacion } from "@/domain/models/operacion";
import { calcularResultadoOperacion } from "@/domain/rules/operacion.rules";

type ExitPriceSource = keyof typeof UI_TEXT.operations.closeDialog.exitPriceHint;
export type ResultTone = "gain" | "loss" | "even";

// Precio de salida propuesto: el último precio conocido; si no hay, el máximo; y si no, la entrada.
function getDefaultExitPrice(operacion: Operacion): { price: number; source: ExitPriceSource } {
  const { precio_actual: last, max_price: max } = operacion;
  if (typeof last === "number" && Number.isFinite(last)) return { price: last, source: "last" };
  if (typeof max === "number" && Number.isFinite(max)) return { price: max, source: "max" };
  return { price: operacion.precio_entrada, source: "entry" };
}

// El signo se decide con el importe redondeado a céntimos, para que el color coincida con lo que se lee.
function getResultTone(netProfit: number | undefined): ResultTone {
  if (netProfit === undefined) return "even";
  const cents = Math.round(netProfit * 100);
  return cents > 0 ? "gain" : cents < 0 ? "loss" : "even";
}

// Una comisión vacía cuenta como 0: los campos son opcionales.
function parseCommission(value: string) {
  return value.trim() === "" ? 0 : Number(value);
}

/**
 * Estado, validación, cálculo del resultado y envío del diálogo de cierre.
 * El diálogo solo pinta lo que devuelve este hook.
 */
export function useCloseOperationForm(operacion: Operacion, onClosed: (id: number) => void) {
  const defaultExit = getDefaultExitPrice(operacion);
  // Los precios de Yahoo arrastran ruido de coma flotante (52.13000106…); 7 cifras significativas lo quitan
  // sin perder precisión en precios muy pequeños (con decimales fijos, 0.00004 acabaría siendo 0).
  const defaultExitInput = String(Number(defaultExit.price.toPrecision(7)));
  const defaultCommissionInput = String(APP_CONFIG.BROKER.COMMISSION_PER_ORDER);

  const [exitInput, setExitInput] = useState(defaultExitInput);
  const [entryCommissionInput, setEntryCommissionInput] = useState(defaultCommissionInput);
  const [exitCommissionInput, setExitCommissionInput] = useState(defaultCommissionInput);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const exitPrice = exitInput.trim() === "" ? NaN : Number(exitInput);
  const validExitPrice = Number.isFinite(exitPrice) && exitPrice > 0;

  const entryCommission = parseCommission(entryCommissionInput);
  const exitCommission = parseCommission(exitCommissionInput);
  const validCommissions = [entryCommission, exitCommission].every(
    (value) => Number.isFinite(value) && value >= 0
  );
  // Redondeado a céntimos para que 0.1 + 0.2 no se guarde como 0.30000000000000004.
  const totalCommission = Math.round((entryCommission + exitCommission) * 100) / 100;

  const canClose = validExitPrice && validCommissions;
  const resultado = canClose ? calcularResultadoOperacion(operacion, exitPrice, totalCommission) : null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canClose) return;
    setLoading(true);
    setError("");

    const texts = UI_TEXT.operations.closeDialog;
    try {
      const result = await cerrarOperacionAction(operacion.id, exitPrice, totalCommission);
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

  return {
    exitInput,
    setExitInput,
    exitPriceEdited: exitInput !== defaultExitInput,
    resetExitPrice: () => setExitInput(defaultExitInput),
    exitPriceSource: defaultExit.source,
    entryCommissionInput,
    setEntryCommissionInput,
    exitCommissionInput,
    setExitCommissionInput,
    resultado,
    resultTone: getResultTone(resultado?.beneficioNeto),
    canClose,
    loading,
    error,
    handleSubmit,
  };
}
