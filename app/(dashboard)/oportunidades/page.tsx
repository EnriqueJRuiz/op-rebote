import { SearchReboundsButton } from "@/components/rebound/search-button";
import { StockCandidate } from "@/domain/models/trading";
import { UI_TEXT } from "@/domain/literales.constantes";
import { createApplicationDependencies } from "@/infrastructure/composition";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OpportunitiesPage() {
  const { companiesRepository } = createApplicationDependencies();
  let latestOpportunities: StockCandidate[] = [];

  try {
    latestOpportunities = await companiesRepository.getLatestOpportunities();
  } catch (error) {
    console.warn("No se pudo cargar el último lote de oportunidades:", error);
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-5xl">
        <SearchReboundsButton
          initialOpportunities={latestOpportunities}
          title={UI_TEXT.pages.opportunities.title}
          description={UI_TEXT.pages.opportunities.description}
        />
      </div>
    </main>
  );
}