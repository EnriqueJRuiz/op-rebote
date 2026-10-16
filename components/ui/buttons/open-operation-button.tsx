"use client";

import { Plus } from "lucide-react";
import { UI_STYLES } from "@/styles/ui-styles";

export interface OpenOperationButtonProps {
  onClick: () => void;
  "aria-label": string;
  title?: string;
}

export function OpenOperationButton({
  onClick,
  "aria-label": ariaLabel,
  title = "Abrir operación",
}: OpenOperationButtonProps) {
  return (
    <div className="flex items-center justify-center">
      <button
        type="button"
        onClick={onClick}
        className={UI_STYLES.button.icon}
        aria-label={ariaLabel}
        title={title}
      >
        <Plus size={16} aria-hidden="true" />
      </button>
    </div>
  );
}