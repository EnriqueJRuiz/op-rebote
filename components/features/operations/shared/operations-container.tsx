"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Operacion } from "@/domain/models/operacion";
import { OperationsTable } from "../active/operations-table";
import { OperationsHistoryTable } from "../history/operations-history-table";

interface OperationsContainerProps {
  activas: Operacion[];
  cerradas: Operacion[];
  onClosed?: (id: number) => void; // <-- Añadimos el interrogante '?' para hacerlo opcional
}

export function OperationsContainer({ activas, cerradas, onClosed }: OperationsContainerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"activas" | "historial">("activas");

  const handleClosed = (id: number) => {
    if (onClosed) {
      onClosed(id);
    } else {
      router.refresh(); // Refresca automáticamente los Server Components si no se pasa función externa
    }
  };

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------- */}
      {/* VISTA MÓVIL / TABLET: Pestañas (Tabs)                 */}
      {/* ---------------------------------------------------- */}
      <div className="lg:hidden">
        <div className="flex rounded-xl bg-slate-100 p-1 mb-4 text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("activas")}
            className={`flex-1 rounded-lg py-2 text-center transition-all ${
              activeTab === "activas"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Activas ({activas.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("historial")}
            className={`flex-1 rounded-lg py-2 text-center transition-all ${
              activeTab === "historial"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Historial ({cerradas.length})
          </button>
        </div>

        {activeTab === "activas" ? (
          <OperationsTable operaciones={activas} onClosed={handleClosed} />
        ) : (
          <OperationsHistoryTable operaciones={cerradas} />
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* VISTA PORTÁTIL / ESCRITORIO: Ambas tablas apiladas    */}
      {/* ---------------------------------------------------- */}
      <div className="hidden lg:block space-y-8">
        <OperationsTable operaciones={activas} onClosed={handleClosed} />
        <OperationsHistoryTable operaciones={cerradas} />
      </div>
    </div>
  );
}