import { AutoRefresh } from "@/components/ui/layout/auto-refresh";
import { CompanyScanQuote, ScanStatus } from "@/domain/models/trading";
import { UI_TEXT } from "@/domain/literales.constantes";
import { createApplicationDependencies } from "@/infrastructure/composition";
import { CompanyTable, SyncButton } from "@/components/features/companies";

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
    <main className="min-h-screen bg-slate-50 p-3 text-slate-800 sm:p-6 lg:p-8">
      <AutoRefresh renderedScannedAt={scanStatus?.scannedAt ?? null} />
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-col gap-4 sm:mb-8 sm:gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="mb-1 text-2xl font-bold sm:mb-2 sm:text-3xl">{UI_TEXT.pages.companies.title}</h1>
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
