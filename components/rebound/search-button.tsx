"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { handleSearchReboundsAction } from "@/app/actions/search-rebounds";
import { StockCandidate } from "@/domain/models/trading";
import { ReboundOpportunities } from "@/components/tables/opportunitiesTable";
import { LoadingOverlay } from "@/components/loading-overlay";

export function SearchReboundsButton({ initialOpportunities }: { initialOpportunities: StockCandidate[] }) {
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

  return (
    <div className="mb-6 flex flex-col gap-2">
      {loading && <LoadingOverlay message="Buscando oportunidades..." />}
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-fit rounded bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Buscando oportunidades..." : "Buscar nuevas oportunidades"}
      </button>
      {message && <p className="text-sm text-gray-300">{message}</p>}
      <ReboundOpportunities
        top={opportunities.filter((opportunity) => opportunity.categoria === "TOP")}
        mid={opportunities.filter((opportunity) => opportunity.categoria === "MID")}
      />
    </div>
  );
}