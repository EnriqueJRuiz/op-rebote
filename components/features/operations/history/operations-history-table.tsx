"use client";

import { useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { DataTable } from "@/components/ui/core/DataTable";
import { Operacion } from "@/domain/models/operacion";
import { getHistoryColumns } from "../history/history-columns";
import { UI_STYLES } from "@/styles/ui-styles";
import { UI_TEXT } from "@/domain/literales.constantes";
import { 
  formatOperationCapital, 
  formatOperationPrice, 
  formatOperationSignedCapital, 
  formatOperationSignedPercent, 
  getOperationName, 
  getOperationTicker 
} from "../shared/operation-cells";

interface OperationsHistoryTableProps {
  operaciones: Operacion[];
  isLoading?: boolean;
}

export function OperationsHistoryTable({
  operaciones,
  isLoading = false,
}: OperationsHistoryTableProps) {
  const columns = useMemo(() => getHistoryColumns(), []);

  return (
    <DataTable
      title="Historial de Operaciones"
      subtitle="Registro de operaciones cerradas y sus resultados"
      data={operaciones}
      columns={columns}
      rowKey={(operacion) => operacion.id}
      initialPageSize={10}
      pageSizeOptions={[10, 25, 50]}
      recordsLabel="operaciones cerradas"
      showMobileSort
      emptyMessage={
        isLoading
          ? "Cargando historial..."
          : "No hay operaciones cerradas en el historial."
      }
      mobileRow={(operacion, expanded, toggle) => {
        const neto = operacion.beneficio_neto ?? 0;
        const rentabilidad = operacion.capital_invertido > 0 ? (neto / operacion.capital_invertido) * 100 : 0;
        const isPositive = neto > 0;
        const isNegative = neto < 0;

        const badgeStyle = isPositive
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : isNegative
          ? "bg-rose-50 text-rose-700 border-rose-200"
          : "bg-slate-50 text-slate-700 border-slate-200";

        const apertura = operacion.fecha_apertura ? new Date(operacion.fecha_apertura).toLocaleDateString("es-ES") : "-";
        const cierre = operacion.fecha_cierre ? new Date(operacion.fecha_cierre).toLocaleDateString("es-ES") : "-";

        return (
          <div className={UI_STYLES.table.mobileRow}>
            <div className="flex items-center justify-between gap-2">
              {/* Botón que abarca toda la fila para alternar la expansión, tal y como en el ejemplo[cite: 3] */}
              <button
                type="button"
                onClick={toggle}
                className={`${UI_STYLES.table.mobileRowButton} flex-1 flex items-center justify-between text-left`}
                aria-expanded={expanded}
              >
                {/* Ticker y Nombre de la empresa */}
                <div className="flex flex-col py-1 min-w-0">
                  <span className={UI_STYLES.table.mobileRowTitle}>
                    {getOperationTicker(operacion)}
                  </span>
                  <span className="text-xs text-slate-500 truncate max-w-37.5">
                    {getOperationName(operacion)}
                  </span>
                </div>

                {/* Badge de resultado y flecha de despliegue */}
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold tabular-nums ${badgeStyle}`}>
                    {formatOperationSignedCapital(neto)}
                  </span>
                  <ChevronDown
                    className={`${UI_STYLES.table.mobileRowIcon} ${
                      expanded ? "rotate-180" : ""
                    }`}
                    size={18}
                  />
                </div>
              </button>
            </div>

            {expanded && (
              <div className={UI_STYLES.table.mobileDetails}>
                <div>
                  <p className={UI_STYLES.table.mobileLabel}>
                    {UI_TEXT.table.columns.entryPrice}
                  </p>
                  <p className="mt-1 font-medium text-slate-700 tabular-nums">
                    {formatOperationPrice(operacion.precio_entrada)}
                  </p>
                </div>

                <div>
                  <p className={UI_STYLES.table.mobileLabel}>
                    Precio Salida
                  </p>
                  <p className="mt-1 font-medium text-slate-700 tabular-nums">
                    {operacion.precio_salida != null ? formatOperationPrice(operacion.precio_salida) : "-"}
                  </p>
                </div>

                <div>
                  <p className={UI_STYLES.table.mobileLabel}>
                    Capital
                  </p>
                  <p className="mt-1 font-medium text-slate-700 tabular-nums">
                    {formatOperationCapital(operacion.capital_invertido)}
                  </p>
                </div>

                <div>
                  <p className={UI_STYLES.table.mobileLabel}>
                    Rentabilidad
                  </p>
                  <p className="mt-1 font-medium text-slate-700 tabular-nums">
                    {formatOperationSignedPercent(rentabilidad)}
                  </p>
                </div>

                <div>
                  <p className={UI_STYLES.table.mobileLabel}>
                    Fechas (In / Out)
                  </p>
                  <p className="mt-1 font-medium text-slate-700">
                    {apertura} / {cierre}
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      }}
    />
  );
}