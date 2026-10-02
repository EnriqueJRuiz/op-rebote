// components/sync-button.tsx
"use client"; // <-- ¡Esta línea debe estar obligatoriamente en la parte más alta del archivo!

import { useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import { handleSyncMarketAction } from "@/app/actions/sync-market";
import { handleSearchReboundsAction } from "@/app/actions/search-rebounds";
import { useRouter } from "next/navigation";
import { LoadingOverlay } from "@/components/loading-overlay";
import { AddCompanyButton } from "@/components/buttons/add-company-button";
import { UI_TEXT } from "@/domain/literales.constantes";
import { UI_STYLES } from "@/styles/ui-styles";

type RadarAction = "discover" | "scan";

export function SyncButton() {
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
    <div className="flex w-full flex-col gap-2 xl:w-136 xl:items-stretch">
      {activeAction && <LoadingOverlay message={loadingMessage} />}
      <div className="grid w-full grid-cols-2 gap-2 lg:grid-cols-[1.25fr_1fr_1fr]">
        <button
          type="button"
          onClick={() => handleClick("scan")}
          disabled={activeAction !== null}
          className={`${UI_STYLES.button.primaryFull} col-span-2 lg:col-span-1`}
        >
          <RefreshCw size={16} className={activeAction === "scan" ? "animate-spin" : ""} aria-hidden="true" />
          <span className="whitespace-nowrap">{activeAction === "scan" ? UI_TEXT.buttons.updatingQuotes : UI_TEXT.buttons.updateQuotes}</span>
        </button>
        <button
          type="button"
          onClick={() => handleClick("discover")}
          disabled={activeAction !== null}
          className={UI_STYLES.button.primaryFull}
        >
          <Search size={16} aria-hidden="true" />
          <span className="truncate">{activeAction === "discover" ? UI_TEXT.buttons.syncing : UI_TEXT.buttons.sync}</span>
        </button>
        <AddCompanyButton />
      </div>
      {message && <p className="text-right text-sm text-slate-500">{message}</p>}
    </div>
  );
}