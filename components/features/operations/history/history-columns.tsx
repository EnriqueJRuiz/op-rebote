"use client";

import { UI_TEXT } from "@/domain/literales.constantes";
import { Operacion } from "@/domain/models/operacion";
import {
  formatOperationCapital,
  formatOperationPrice,
  formatOperationSignedCapital,
  formatOperationSignedPercent,
  getOperationName,
  getOperationTicker,
} from "../shared/operation-cells";
import { Column } from "@/components/ui/core/data-table";

export function getHistoryColumns(): Column<Operacion>[] {
  return [
    {
      header: UI_TEXT.table.columns.company,
      sortValue: getOperationTicker,
      render: (operacion) => (
        <div className="flex flex-col items-start gap-1">
          <div className="font-semibold text-slate-900">{getOperationTicker(operacion)}</div>
          <div className="max-w-48 truncate text-xs text-slate-500">{getOperationName(operacion)}</div>
        </div>
      ),
    },
    {
      header: "Fechas",
      sortValue: (operacion) => operacion.fecha_cierre ?? operacion.fecha_apertura ?? "",
      render: (operacion) => {
        const apertura = operacion.fecha_apertura
          ? new Date(operacion.fecha_apertura).toLocaleDateString("es-ES")
          : "-";
        const cierre = operacion.fecha_cierre
          ? new Date(operacion.fecha_cierre).toLocaleDateString("es-ES")
          : "-";
        return (
          <div className="text-xs text-slate-600">
            <div>In: {apertura}</div>
            <div>Out: {cierre}</div>
          </div>
        );
      },
    },
    {
      header: UI_TEXT.table.columns.entryPrice,
      sortValue: (operacion) => operacion.precio_entrada,
      render: (operacion) => formatOperationPrice(operacion.precio_entrada),
      cellClassName: "whitespace-nowrap tabular-nums",
    },
    {
      header: "Precio Salida",
      sortValue: (operacion) => operacion.precio_salida ?? 0,
      render: (operacion) =>
        operacion.precio_salida != null ? formatOperationPrice(operacion.precio_salida) : "-",
      cellClassName: "whitespace-nowrap tabular-nums",
    },
    {
      header: "Capital",
      sortValue: (operacion) => operacion.capital_invertido,
      render: (operacion) => formatOperationCapital(operacion.capital_invertido),
      cellClassName: "whitespace-nowrap tabular-nums",
    },
    {
      header: "Resultado Neto",
      sortValue: (operacion) => operacion.beneficio_neto ?? 0,
      render: (operacion) => {
        const neto = operacion.beneficio_neto ?? 0;
        const rentabilidad =
          operacion.capital_invertido > 0 ? (neto / operacion.capital_invertido) * 100 : 0;

        const isPositive = neto > 0;
        const isNegative = neto < 0;

        const badgeStyle = isPositive
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : isNegative
          ? "bg-rose-50 text-rose-700 border-rose-200"
          : "bg-slate-50 text-slate-700 border-slate-200";

        return (
          <div className="flex flex-col items-end">
            <span
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold tabular-nums ${badgeStyle}`}
            >
              {formatOperationSignedCapital(neto)}
            </span>
            <span className="mt-0.5 text-[11px] font-medium text-slate-500">
              {formatOperationSignedPercent(rentabilidad)}
            </span>
          </div>
        );
      },
      headerClassName: "text-right",
      cellClassName: "text-right",
    },
  ];
}