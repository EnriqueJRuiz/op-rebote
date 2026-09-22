import { SyncButton } from "@/components/sync-button";
import { CompanyTable } from "@/components/tables/companyTable";
import { APP_CONFIG } from "@/domain/constants";
import { createApplicationDependencies } from "@/infrastructure/composition";

export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const revalidate = 0;

export default async function EmpresasRadarPage() {
  const { companiesRepository } = createApplicationDependencies();
  const empresas = await companiesRepository.getCompanies();
  const empresasTop = empresas.filter((empresa) => empresa.categoria === APP_CONFIG.CATEGORIES.TOP);
  const empresasMid = empresas.filter((empresa) => empresa.categoria === APP_CONFIG.CATEGORIES.MID);

  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-800">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold">Empresas radar</h1>
            <p className="text-slate-500">Empresas que se han detectado como candidatas para ser incluidas en el radar.</p>
          </div>
          <SyncButton />
        </div>

        <div className="space-y-10">
          <CompanyTable
            title="Empresas TOP"
            empresas={empresasTop}
          />
          <CompanyTable
            title="Empresas MID"
            empresas={empresasMid}
          />
        </div>
      </div>
    </main>
  );
}