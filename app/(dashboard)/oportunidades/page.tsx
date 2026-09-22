import { SearchReboundsButton } from "@/components/rebound/search-button";
import { StockCandidate } from "@/domain/models/trading";
import { SupabaseCompaniesRepository } from "@/infrastructure/repositories/supabase-companies.repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OpportunitiesPage() {
  const repository = new SupabaseCompaniesRepository();
  let latestOpportunities: StockCandidate[] = [];

  try {
    latestOpportunities = await repository.getLatestOpportunities();
  } catch (error) {
    console.error("No se pudo cargar el último lote de oportunidades:", error);
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-3xl font-bold">Oportunidades de rebote</h1>
        <p className="mb-8 text-gray-400">Empresas que superen el segundo filtro.</p>
        <SearchReboundsButton initialOpportunities={latestOpportunities} />
      </div>
    </main>
  );
}