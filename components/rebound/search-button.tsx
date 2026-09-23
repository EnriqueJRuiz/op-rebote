"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

import { handleSearchReboundsAction } from "@/app/actions/search-rebounds";
import { StockCandidate } from "@/domain/models/trading";
import { ReboundOpportunities } from "@/components/tables/opportunitiesTable";
import { LoadingOverlay } from "@/components/loading-overlay";

interface SearchReboundsButtonProps {
  initialOpportunities: StockCandidate[];
  title: string;
  description: string;
}

export function SearchReboundsButton({ initialOpportunities, title, description }: SearchReboundsButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [opportunities, setOpportunities] = useState<StockCandidate[]>(initialOpportunities);
  const router = useRouter();

  const handleClick = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const result = await handleSearchReboundsAction();
      setMessage(result.message);
      setOpportunities(result.opportunities ?? []);
      if (result.success) router.refresh();
    } catch {
      setMessage("Error al buscar oportunidades.");
    } finally {
      setLoading(false);
    }
  };

   const tier0 = opportunities.filter(
    (opportunity) => opportunity.tier === "TIER_0"
  );

  const tier1 = opportunities.filter(
    (opportunity) => opportunity.tier === "TIER_1"
  );

  const top = opportunities.filter(
    (opportunity) => opportunity.tier === "TOP"
  );

  const mid = opportunities.filter(
    (opportunity) => opportunity.tier === "MID"
  );

  return (
    <div>
      {loading && <LoadingOverlay message="Buscando oportunidades..." />}
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">{title}</h1>
          <p className="text-slate-500">{description}</p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <button
            onClick={handleClick}
            disabled={loading}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} aria-hidden="true" />
            {loading ? "Buscando..." : "Actualizar oportunidades"}
          </button>
          {message && <p className="text-right text-sm text-slate-500">{message}</p>}
        </div>
      </div>
      <ReboundOpportunities
        tier0={tier0}
        tier1={tier1}
        top={top}
        mid={mid}
      />
    </div>
  );
}