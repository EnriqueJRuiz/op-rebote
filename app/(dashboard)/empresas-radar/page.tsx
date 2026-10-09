import { AutoRefresh } from "@/components/auto-refresh";
import { SyncButton } from "@/components/buttons/sync-button";
import { CompanyTable } from "@/components/tables/companies/company-table";
import { CompanyScanQuote, ScanStatus } from "@/domain/models/trading";
import { UI_TEXT } from "@/domain/literales.constantes";
import { createApplicationDependencies } from "@/infrastructure/composition";

export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const revalidate = 0;

// Fecha fija en hora española para que servidor y navegador muestren lo mismo.
const SCAN_DATE_FORMAT = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Madrid",
});

export default async function EmpresasRadarPage() {
  const { companiesRepository, scanHistoryRepository } = createApplicationDependencies();
  const [empresas, scanQuotes, sectores, scanStatus] = await Promise.all([
    companiesRepository.getCompanies(),
    scanHistoryRepository.getLatestScanQuotes().catch((error) => {
      console.warn("No se pudieron cargar los últimos precios escaneados:", error);
      return [] as CompanyScanQuote[];
    }),
    companiesRepository.getSectors().catch((error) => {
      console.warn("No se pudieron cargar los sectores:", error);
      return [] as string[];
    }),
    scanHistoryRepository.getLatestScanStatus().catch((error) => {
      console.warn("No se pudo cargar el estado del último escaneo:", error);
      return null as ScanStatus | null;
    }),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-800">
      <AutoRefresh renderedScannedAt={scanStatus?.scannedAt ?? null} />
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold">{UI_TEXT.pages.companies.title}</h1>
            <p className="text-slate-500">{UI_TEXT.pages.companies.description}</p>
            {scanStatus && (
              <p className="mt-1 text-xs text-slate-400">
                {UI_TEXT.pages.companies.lastScan(SCAN_DATE_FORMAT.format(new Date(scanStatus.scannedAt)))}
              </p>
            )}
          </div>
          <SyncButton />
        </div>

        <CompanyTable
          title={UI_TEXT.table.titles.ALL}
          empresas={empresas}
          scanQuotes={scanQuotes}
          sectores={sectores}
        />
      </div>
    </main>
  );
}
