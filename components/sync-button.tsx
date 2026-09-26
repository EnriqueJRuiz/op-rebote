// components/sync-button.tsx
"use client"; // <-- ¡Esta línea debe estar obligatoriamente en la parte más alta del archivo!

import { useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import { handleSyncMarketAction } from "@/app/actions/sync-market";
import { handleSearchReboundsAction } from "@/app/actions/search-rebounds";
import { useRouter } from "next/navigation";
import { LoadingOverlay } from "@/components/loading-overlay";
import { UI_TEXT } from "@/domain/literales.constantes";

type RadarAction = "discover" | "scan";

export function RadarActions() {
  const [activeAction, setActiveAction] = useState<RadarAction | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleClick = async (action: RadarAction) => {
    setActiveAction(action);
    setMessage(null);

    try {
      if (action === "discover") {
        const result = await handleSyncMarketAction();
        setMessage(result.message);
        if (result.success) router.refresh();
      } else {
        const result = await handleSearchReboundsAction();
        setMessage(result.success ? UI_TEXT.feedback.radarScanComplete : result.message);
        if (result.success) router.refresh();
      }
    } catch {
      setMessage(action === "discover" ? UI_TEXT.feedback.syncError : UI_TEXT.feedback.searchError);
    } finally {
      setActiveAction(null);
    }
  };

  const loadingMessage = activeAction === "discover"
    ? UI_TEXT.loading.sync
    : UI_TEXT.loading.updateQuotes;

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
      {activeAction && <LoadingOverlay message={loadingMessage} />}
      <div className="grid w-full grid-cols-2 gap-2 sm:w-auto">
        <button
          type="button"
          onClick={() => handleClick("discover")}
          disabled={activeAction !== null}
          className="inline-flex w-full min-w-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          <Search size={16} aria-hidden="true" />
          <span className="truncate">{activeAction === "discover" ? UI_TEXT.buttons.syncing : UI_TEXT.buttons.sync}</span>
        </button>
        <button
          type="button"
          onClick={() => handleClick("scan")}
          disabled={activeAction !== null}
          className="inline-flex w-full min-w-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          <RefreshCw size={16} className={activeAction === "scan" ? "animate-spin" : ""} aria-hidden="true" />
          <span className="truncate">{activeAction === "scan" ? UI_TEXT.buttons.updatingQuotes : UI_TEXT.buttons.updateQuotes}</span>
        </button>
      </div>
      {message && <p className="text-right text-sm text-slate-500">{message}</p>}
    </div>
  );
}