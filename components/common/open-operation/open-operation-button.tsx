"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";
import { UI_TEXT } from "@/domain/literales.constantes";
import { UI_STYLES } from "@/styles/ui-styles";
import { OpenOperationDialog, type OpenOperationDialogProps } from "./open-operation-dialog";

type OpenOperationButtonProps = Omit<OpenOperationDialogProps, "onClose"> & {
  // Ancho completo para las filas móviles; compacto para las filas de tabla de escritorio.
  fullWidth?: boolean;
};

/**
 * Botón "Abrir operación" autocontenido: lleva su propio diálogo, así que cualquier pantalla solo tiene
 * que pasarle los datos de la empresa. El diálogo se pinta en document.body (portal) para que no le
 * afecten el overflow ni el apilado de la tabla donde esté el botón.
 */
export function OpenOperationButton({ fullWidth = false, ...dialogProps }: OpenOperationButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={UI_TEXT.operations.openAria(dialogProps.ticker)}
        className={fullWidth ? UI_STYLES.button.primaryFull : `${UI_STYLES.button.primarySm} whitespace-nowrap`}
      >
        <Plus size={fullWidth ? 16 : 14} aria-hidden="true" />
        {UI_TEXT.operations.openButton}
      </button>
      {open &&
        createPortal(<OpenOperationDialog {...dialogProps} onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}
