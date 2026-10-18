"use client";

import { FormEvent, useState } from "react";
import { abrirOperacionAction } from "@/app/actions/operaciones.actions";
import { UI_TEXT } from "@/domain/literales.constantes";

interface UseOpenOperationFormParams {
  companyId: number;
  precioActual: number;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Estado, cálculos en tiempo real y envío del diálogo de apertura de una operación.
 * El diálogo solo pinta lo que devuelve este hook.
 */
export function useOpenOperationForm({ companyId, precioActual, onClose, onSuccess }: UseOpenOperationFormParams) {
  const [precioEntrada, setPrecioEntrada] = useState(precioActual.toString());
  const [capital, setCapital] = useState("1000");
  const [trailingStop, setTrailingStop] = useState("2.00");
  const [targetPct, setTargetPct] = useState("5.00");

  // Comisiones editables por separado
  const [comisionEntrada, setComisionEntrada] = useState("1.00");
  const [comisionSalida, setComisionSalida] = useState("1.00");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- CÁLCULOS EN TIEMPO REAL ---
  const numPrecio = parseFloat(precioEntrada) || 0;
  const numCapital = parseFloat(capital) || 0;
  const numTrailing = parseFloat(trailingStop) || 0;
  const numTarget = parseFloat(targetPct) || 0;
  const numComisionEntrada = parseFloat(comisionEntrada) || 0;
  const numComisionSalida = parseFloat(comisionSalida) || 0;

  // 1. Acciones (soporta fraccionadas)
  const numAcciones = numPrecio > 0 ? numCapital / numPrecio : 0;

  // 2. Stop Loss
  const stopLossPrice = numPrecio > 0 ? numPrecio * (1 - numTrailing / 100) : 0;
  const stopLossMoney = numCapital > 0 ? numCapital * (numTrailing / 100) : 0;

  // 3. Objetivo de éxito
  const targetPrice = numPrecio > 0 ? numPrecio * (1 + numTarget / 100) : 0;
  const targetMoney = numCapital > 0 ? numCapital * (numTarget / 100) : 0;

  // 4. Break-even exacto según las comisiones de entrada y salida especificadas
  const totalCommissions = numComisionEntrada + numComisionSalida;
  const capitalConComision = numCapital + totalCommissions;
  const breakEvenPrice = numAcciones > 0 ? capitalConComision / numAcciones : 0;
  const breakEvenPct = numCapital > 0 ? (totalCommissions / numCapital) * 100 : 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await abrirOperacionAction({
        empresa_id: companyId,
        precio_entrada: Number(precioEntrada),
        capital_invertido: Number(capital),
        trailing_stop_pct: Number(trailingStop),
        objetivo_pct: Number(targetPct),
        comision_entrada: Number(comisionEntrada),
        comision_salida: Number(comisionSalida),
      });

      if (result.success) {
        onClose();
        onSuccess?.();
        return;
      }
      setError(UI_TEXT.operations.openDialog.error(String(result.error ?? "")));
    } catch (requestError) {
      setError(
        UI_TEXT.operations.openDialog.error(
          requestError instanceof Error ? requestError.message : ""
        )
      );
    }
    setLoading(false);
  };

  return {
    precioEntrada,
    setPrecioEntrada,
    capital,
    setCapital,
    trailingStop,
    setTrailingStop,
    targetPct,
    setTargetPct,
    comisionEntrada,
    setComisionEntrada,
    comisionSalida,
    setComisionSalida,
    numTrailing,
    numTarget,
    stopLossPrice,
    stopLossMoney,
    targetPrice,
    targetMoney,
    breakEvenPrice,
    breakEvenPct,
    loading,
    error,
    handleSubmit,
  };
}
