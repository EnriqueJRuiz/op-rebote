"use client";

import { useMemo, useState } from "react";
import { UI_TEXT } from "@/domain/literales.constantes";
import { Operacion } from "@/domain/models/operacion";
import { CloseOperationDialog } from "../shared/close-operation-dialog";
import { getOperationColumns } from "../active/operation-columns";
import { OperationMobileRow } from "../active/operation-mobile-row";
import { DataTable } from "@/components/ui/core/DataTable";

interface OperationsTableProps {
  operaciones: Operacion[];
  isLoading?: boolean;
  // Avisa al padre de que la operación se ha cerrado para que la quite de su lista.
  onClosed: (id: number) => void;
}

export function OperationsTable({ operaciones, isLoading = false, onClosed }: OperationsTableProps) {
  const [closing, setClosing] = useState<Operacion | null>(null);
  const columns = useMemo(() => getOperationColumns(setClosing), []);

  return (
    <>
      <DataTable
        title={UI_TEXT.operations.activeTitle}
        subtitle={UI_TEXT.operations.activeSubtitle}
        data={operaciones}
        columns={columns}
        rowKey={(operacion) => operacion.id}
        initialPageSize={10}
        pageSizeOptions={[10, 25, 50]}
        recordsLabel={UI_TEXT.table.pagination.operationRecords}
        emptyMessage={isLoading ? UI_TEXT.operations.emptyLoading : UI_TEXT.table.emptyStates.operations}
        showMobileSort
        mobileRow={(operacion, expanded, toggle) => (
          <OperationMobileRow
            operacion={operacion}
            expanded={expanded}
            onToggle={toggle}
            onClose={setClosing}
          />
        )}
      />
      {closing && (
        <CloseOperationDialog
          operacion={closing}
          onClose={() => setClosing(null)}
          onClosed={(id) => {
            setClosing(null);
            onClosed(id);
          }}
        />
      )}
    </>
  );
}
