import { AutoRefresh } from "@/components/ui/layout/auto-refresh";
import { CompanyScanQuote, ScanStatus } from "@/domain/models/trading";
import { UI_TEXT } from "@/domain/literales.constantes";
import { createApplicationDependencies } from "@/infrastructure/composition";
import { AssetsExplorer } from "@/components/features/companies";

export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const revalidate = 0;

// Fecha fija en hora española para que servidor y navegador muestren lo mismo.
const SCAN_DATE_FORMAT = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Madrid",
});

export default async function MercadoPage() {
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
    <main className="flex min-h-screen flex-col bg-slate-50 p-3 text-slate-800 sm:p-6 lg:p-8">
      <AutoRefresh renderedScannedAt={scanStatus?.scannedAt ?? null} />
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-1 text-2xl font-bold sm:mb-2 sm:text-3xl">{UI_TEXT.pages.companies.title}</h1>
          <p className="text-slate-500">{UI_TEXT.pages.companies.description}</p>
          {scanStatus && (
            <p className="mt-1 text-xs text-slate-400">
              {UI_TEXT.pages.companies.lastScan(SCAN_DATE_FORMAT.format(new Date(scanStatus.scannedAt)))}
            </p>
          )}
        </div>

        <AssetsExplorer empresas={empresas} scanQuotes={scanQuotes} sectores={sectores} />
      </div>
    </main>
  );
}
