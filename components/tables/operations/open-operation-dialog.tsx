"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { abrirOperacionAction } from "@/app/actions/operaciones.actions";

export interface OpenOperationDialogProps {
  companyId: number;
  ticker: string;
  companyName: string;
  precioActual: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function OpenOperationDialog({
  companyId,
  ticker,
  companyName,
  precioActual,
  isOpen,
  onClose,
  onSuccess,
}: OpenOperationDialogProps) {
  const [capital, setCapital] = useState("1000");
  const [trailingStop, setTrailingStop] = useState("2.00");
  const [precioEntrada, setPrecioEntrada] = useState(precioActual.toString());
  const [loading, setLoading] = useState(false);

  // Sincroniza el precio de entrada si cambia el precio actual de la señal
  useEffect(() => {
    setPrecioEntrada(precioActual.toString());
  }, [precioActual]);

  // Manejo de la tecla Escape idéntico a tus otros modales
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await abrirOperacionAction({
      empresa_id: companyId,
      precio_entrada: Number(precioEntrada), // Envía el precio que hayas editado manualmente
      capital_invertido: Number(capital),
      trailing_stop_pct: Number(trailingStop),
    });

    setLoading(false);
    if (res.success) {
      onClose();
      if (onSuccess) onSuccess();
    } else {
      alert(`Error al abrir la operación: ${res.error}`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-2 backdrop-blur-sm sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="open-operation-title"
        className="max-h-[calc(100dvh-1rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)]"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4">
          <h2 id="open-operation-title" className="text-lg font-bold text-slate-900">
            {companyName} <span className="text-sm font-medium text-slate-500">({ticker})</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
              Precio de Entrada (Editable / Bróker)
            </label>
            <input
              type="number"
              step="any"
              value={precioEntrada}
              onChange={(e) => setPrecioEntrada(e.target.value)}
              required
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
              Capital Invertido (€)
            </label>
            <input
              type="number"
              value={capital}
              onChange={(e) => setCapital(e.target.value)}
              required
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
              % Trailing Stop
            </label>
            <input
              type="number"
              step="0.1"
              value={trailingStop}
              onChange={(e) => setTrailingStop(e.target.value)}
              required
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Abriendo..." : "Confirmar y Activar"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}