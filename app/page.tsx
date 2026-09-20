import { SyncButton } from "@/components/sync-button";
import { CompanyTable } from "@/components/tables/companyTable";
import { SupabaseCompaniesRepository } from "@/infrastructure/repositories/supabase-companies.repository";

export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

export default async function Home() {
  // 1. Obtenemos las empresas directamente desde Supabase en el servidor
  const repository = new SupabaseCompaniesRepository();
  const empresas = await repository.getCompanies();

  return (
    <main className="min-h-screen p-8 bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Panel de Control - Op Rebote</h1>
        <p className="text-gray-400 mb-6">Gestión de universo y oportunidades de swing trading</p>

        <div className="mb-6">
          <SyncButton />
        </div>

        {/* 2. Mostramos tu tabla de empresas ya integrada */}
        <div className="border border-gray-800 rounded-lg bg-gray-900 overflow-hidden shadow-lg">
          <CompanyTable empresas={empresas} />
        </div>
      </div>
    </main>
  );
}