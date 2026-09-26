// components/sync-button.tsx
"use client"; // <-- ¡Esta línea debe estar obligatoriamente en la parte más alta del archivo!

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { handleSyncMarketAction } from "@/app/actions/sync-market";
import { useRouter } from "next/navigation";
import { LoadingOverlay } from "@/components/loading-overlay";
import { UI_TEXT } from "@/domain/literales.constantes";

export function SyncButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleClick = async () => {
  setLoading(true);
  setMessage(null);
  try {
    const result = await handleSyncMarketAction();
    setMessage(result.message);
    
    if (result.success) {
      router.refresh(); // 2. Refresca los datos y la vista de la tabla automáticamente
    }
  } catch {
    setMessage(UI_TEXT.feedback.syncError);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      {loading && <LoadingOverlay message={UI_TEXT.loading.sync} />}
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 shadow-sm transition-colors hover:bg-blue-50 hover:border-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RefreshCw size={16} className={loading ? "animate-spin" : ""} aria-hidden="true" />
        {loading ? UI_TEXT.buttons.syncing : UI_TEXT.buttons.sync}
      </button>
      {message && <p className="text-right text-sm text-slate-500">{message}</p>}
    </div>
  );
}