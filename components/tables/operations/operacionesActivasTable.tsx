"use client";

import { useState, useEffect } from "react";
import { Operacion } from "@/domain/models/operacion";
import { cerrarOperacionAction } from "@/app/actions/operaciones.actions";
import { X } from "lucide-react";
import { UI_TEXT } from "@/domain/literales.constantes";

interface OperationsTableProps {
  initialOperaciones: Operacion[];
}

export function OperationsTable({ initialOperaciones }: OperationsTableProps) {
  const [operaciones, setOperaciones] = useState<Operacion[]>(initialOperaciones);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  // Sincroniza las operaciones en tiempo real cuando el componente padre refresca los datos
  useEffect(() => {
    setOperaciones(initialOperaciones);
  }, [initialOperaciones]);

  const handleCerrar = async (id: number, precioActualEstimado: number) => {
    if (!confirm("¿Seguro que deseas cerrar la operación (Vendido)?")) return;
    
    setLoadingId(id);
    const res = await cerrarOperacionAction(id, precioActualEstimado);
    setLoadingId(null);

    if (res.success) {
      setOperaciones(prev => prev.filter(op => op.id !== id));
    } else {
      alert(`Error al cerrar: ${res.error}`);
    }
  };

  if (operaciones.length === 0) {
    return (
      <div className="p-6 text-center border rounded-lg bg-card text-muted-foreground">
        No hay operaciones activas en este momento. Las operaciones que actives aparecerán aquí.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto border rounded-lg bg-card">
      <table className="w-full text-sm text-left">
        <thead className="bg-muted text-muted-foreground border-b">
          <tr>
            <th className="p-3">UI_TEXT.table.columns.company</th>
            <th className="p-3">Entrada</th>
            <th className="p-3">Máx. Alcanzado</th>
            <th className="p-3">Capital</th>
            <th className="p-3">Trailing Stop</th>
            <th className="p-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {operaciones.map((op) => {
            const precioSalidaEstimado = op.max_price ?? op.precio_entrada; 

            return (
              <tr key={op.id} className="border-b hover:bg-muted/50 transition-colors">
                <td className="p-3 font-medium">
                    <div>
                        <div className="font-semibold text-slate-900">{op.ticker ?? `#${op.id}`}</div>
                        <div className="max-w-40 truncate text-xs text-slate-500">
                        {op.nombre ?? `Empresa ID: ${op.empresa_id}`}
                        </div>
                    </div>
                </td>
                <td className="p-3">{op.precio_entrada.toFixed(2)} €</td>
                <td className="p-3 text-emerald-600 font-semibold">{op.max_price?.toFixed(2) ?? "-"} €</td>
                <td className="p-3">{op.capital_invertido.toFixed(2)} €</td>
                <td className="p-3">{op.trailing_stop_pct}%</td>
                <td className="p-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleCerrar(op.id, precioSalidaEstimado)}
                    aria-label="Cerrar"
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}