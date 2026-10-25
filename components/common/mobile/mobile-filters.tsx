"use client";

import { ReactNode, useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

interface MobileFiltersProps {
  /** Cuántos filtros están activos: se muestra como número en el botón. */
  activeCount: number;
  children: ReactNode;
}

/**
 * Botón "Filtros" y panel inferior de los filtros en móvil, con el mismo aspecto que el de Mercado.
 * Dentro van los campos como `MobileFilterField`. En pantallas grandes no se muestra nada.
 */
export function MobileFilters({ activeCount, children }: MobileFiltersProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:hidden"
        aria-expanded={open}
        aria-label="Abrir filtros"
      >
        <SlidersHorizontal size={16} className="text-slate-500" />
        <span>Filtros</span>
        {activeCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-semibold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 sm:hidden">
          <div className="fixed inset-0" onClick={() => setOpen(false)} />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filtros de búsqueda"
            className="relative z-10 max-h-[85vh] w-full space-y-4 overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl animate-in slide-in-from-bottom duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-slate-700" />
                <h3 className="text-base font-semibold text-slate-800">Filtros de búsqueda</h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label="Cerrar filtros"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3.5 pt-1">{children}</div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full rounded-md bg-blue-600 py-2.5 text-center text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Un campo del panel de filtros móvil: etiqueta pequeña encima y el selector debajo. */
export function MobileFilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      {children}
    </div>
  );
}
