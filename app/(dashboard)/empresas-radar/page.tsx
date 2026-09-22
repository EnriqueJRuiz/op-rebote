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
    <main className="min-h-screen bg-gray-950 p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-3xl font-bold">Empresas radar</h1>
        <p className="mb-6 text-gray-400">Empresas que han pasado la primera criba.</p>

        <div className="mb-6">
          <SyncButton />
        </div>

        <div className="space-y-10">
          <CompanyTable
            title="Empresas TOP"
            subtitle="Empresas TOP que han pasado la primera criba."
            empresas={empresasTop}
          />
          <CompanyTable
            title="Empresas MID"
            subtitle="Empresas MID que han pasado la primera criba."
            empresas={empresasMid}
          />
        </div>
      </div>
    </main>
  );
}