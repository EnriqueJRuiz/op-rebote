import { WatchlistTable } from "@/components/tables/watchlist/watchlist-table";
import { UI_TEXT } from "@/domain/literales.constantes";
import { CompanyRecord, CompanyScanQuote, StockCandidate } from "@/domain/models/trading";
import { createApplicationDependencies } from "@/infrastructure/composition";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SeguimientoPage() {
  const { companiesRepository, scanHistoryRepository } = createApplicationDependencies();

  const [candidates, allCompanies, scanQuotes] = await Promise.all([
    scanHistoryRepository.getAllLatestScanCandidates().catch((error) => {
      console.warn("No se pudieron cargar los candidatos del último escaneo para seguimiento:", error);
      return [] as StockCandidate[];
    }),
    companiesRepository.getCompanies().catch((error) => {
      console.warn("No se pudieron cargar las empresas para seguimiento:", error);
      return [] as CompanyRecord[];
    }),
    scanHistoryRepository.getLatestScanQuotes().catch((error) => {
      console.warn("No se pudieron cargar las cotizaciones para seguimiento:", error);
      return [] as CompanyScanQuote[];
    }),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-800">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">{UI_TEXT.pages.watchlist.title}</h1>
          <p className="text-slate-500">{UI_TEXT.pages.watchlist.description}</p>
        </div>

        <WatchlistTable
          candidates={candidates}
          allCompanies={allCompanies}
          scanQuotes={scanQuotes}
        />
      </div>
    </main>
  );
}
