"use client";

import { ReactNode, useEffect, useId } from "react";
import { X } from "lucide-react";
import { UI_TEXT } from "@/domain/literales.constantes";
import { UI_STYLES } from "@/styles/ui-styles";

interface DialogFrameProps {
  title: string;
  description?: ReactNode;
  // Mientras hay una petición en curso no se puede cerrar el diálogo (Escape, clic fuera ni la X).
  busy?: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function DialogFrame({
  title,
  description,
  busy = false,
  onClose,
  children,
}: DialogFrameProps) {
  const titleId = useId();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [busy, onClose]);

  return (
    <div
      className={UI_STYLES.modal.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={UI_STYLES.modal.panel}
      >
        <header className={UI_STYLES.modal.header}>
          <div className="min-w-0">
            <h2 id={titleId} className={UI_STYLES.modal.title}>
              {title}
            </h2>
            {description && <p className={UI_STYLES.modal.description}>{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label={UI_TEXT.operations.aria.closeDialog}
            title={UI_TEXT.operations.aria.closeDialog}
            className={UI_STYLES.modal.closeButton}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
