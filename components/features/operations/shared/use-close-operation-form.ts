"use client";

import { FormEvent, useState } from "react";
import { cerrarOperacionAction } from "@/app/actions/operaciones.actions";
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

/**
 * Estado, validación, cálculo del resultado y envío del diálogo de cierre.
 * Utiliza las comisiones registradas en la base de datos al abrir la operación.
 */
export function useCloseOperationForm(operacion: Operacion, onClosed: (id: number) => void) {
  const defaultExit = getDefaultExitPrice(operacion);
  // Los precios de Yahoo arrastran ruido de coma flotante; 7 cifras significativas lo quitan
  const defaultExitInput = String(Number(defaultExit.price.toPrecision(7)));

  const [exitInput, setExitInput] = useState(defaultExitInput);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const exitPrice = exitInput.trim() === "" ? NaN : Number(exitInput);
  const validExitPrice = Number.isFinite(exitPrice) && exitPrice > 0;

  // Tomamos las comisiones totales directamente de la base de datos de la operación
  const totalCommission = operacion.comisiones_broker ?? 0;

  const canClose = validExitPrice;
  const resultado = canClose ? calcularResultadoOperacion(operacion, exitPrice, totalCommission) : null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canClose) return;
    setLoading(true);
    setError("");

    const texts = UI_TEXT.operations.closeDialog;
    try {
      // Al no pasar comisiones adicionales, la acción cerrará usando las comisiones que ya tiene guardadas
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

  return {
    exitInput,
    setExitInput,
    exitPriceEdited: exitInput !== defaultExitInput,
    resetExitPrice: () => setExitInput(defaultExitInput),
    exitPriceSource: defaultExit.source,
    resultado,
    resultTone: getResultTone(resultado?.beneficioNeto),
    canClose,
    loading,
    error,
    handleSubmit,
  };
}