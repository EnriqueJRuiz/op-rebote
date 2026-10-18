"use client";

import { useState } from "react";
import { Operacion } from "@/domain/models/operacion";
import { OperationsTable } from "./operations-table";

interface OperationsPanelProps {
  initialOperaciones: Operacion[];
}

export function OperationsPanel({ initialOperaciones }: OperationsPanelProps) {
  const [operaciones, setOperaciones] = useState<Operacion[]>(initialOperaciones);
  const [syncedOperaciones, setSyncedOperaciones] = useState<Operacion[]>(initialOperaciones);

  // router.refresh() (AutoRefresh, volver a la pestaña) manda props nuevas, pero useState solo usa el
  // valor inicial: sin esto la lista se quedaría con las cotizaciones del primer render.
  if (syncedOperaciones !== initialOperaciones) {
    setSyncedOperaciones(initialOperaciones);
    setOperaciones(initialOperaciones);
  }

  return (
    <OperationsTable
      operaciones={operaciones}
      onClosed={(id) => setOperaciones((current) => current.filter((operacion) => operacion.id !== id))}
    />
  );
}
