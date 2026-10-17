"use client";

import { Plus } from "lucide-react";
import { UI_TEXT } from "@/domain/literales.constantes";
import { UI_STYLES } from "@/styles/ui-styles";

interface OpenOperationButtonProps {
  ticker: string;
  onClick: () => void;
  // Ancho completo para las filas móviles; compacto para las filas de tabla de escritorio.
  fullWidth?: boolean;
}

export function OpenOperationButton({ ticker, onClick, fullWidth = false }: OpenOperationButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={UI_TEXT.operations.openAria(ticker)}
      className={fullWidth ? UI_STYLES.button.primaryFull : `${UI_STYLES.button.primarySm} whitespace-nowrap`}
    >
      <Plus size={fullWidth ? 16 : 14} aria-hidden="true" />
      {UI_TEXT.operations.openButton}
    </button>
  );
}
