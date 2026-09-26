import { RadarActions } from "@/components/sync-button";
import { CompanyTable } from "@/components/tables/companyTable";
import { APP_CONFIG } from "@/domain/constants";
import { CompanyScanQuote } from "@/domain/models/trading";
import { UI_TEXT } from "@/domain/literales.constantes";
import { createApplicationDependencies } from "@/infrastructure/composition";

export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const revalidate = 0;

export default async function EmpresasRadarPage() {
  const { companiesRepository } = createApplicationDependencies();
  const [empresas, scanQuotes] = await Promise.all([
    companiesRepository.getCompanies(),
    companiesRepository.getLatestScanQuotes().catch((error) => {
      console.warn("No se pudieron cargar los últimos precios escaneados:", error);
      return [] as CompanyScanQuote[];
    }),
  ]);
  const empresasTop = empresas.filter((empresa) => empresa.categoria === APP_CONFIG.CATEGORIES.TOP);
  const empresasMid = empresas.filter((empresa) => empresa.categoria === APP_CONFIG.CATEGORIES.MID);

  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-800">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold">{UI_TEXT.pages.companies.title}</h1>
            <p className="text-slate-500">{UI_TEXT.pages.companies.description}</p>
          </div>
          <RadarActions />
        </div>

        <div className="space-y-10">
          <CompanyTable
            title={UI_TEXT.table.titles.TOP}
            empresas={empresasTop}
            scanQuotes={scanQuotes}
          />
          <CompanyTable
            title={UI_TEXT.table.titles.MID}
            empresas={empresasMid}
            scanQuotes={scanQuotes}
          />
        </div>
      </div>
    </main>
  );
}