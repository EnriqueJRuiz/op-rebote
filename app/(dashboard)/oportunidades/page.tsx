import { SearchReboundsButton } from "@/components/rebound/search-button";
import { SupabaseCompaniesRepository } from "@/infrastructure/repositories/supabase-companies.repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OpportunitiesPage() {
  const repository = new SupabaseCompaniesRepository();
  const latestOpportunities = await repository.getLatestOpportunities();

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