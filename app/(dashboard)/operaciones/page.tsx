import { obtenerOperacionesActivasAction } from "@/app/actions/operaciones.actions";
import { OperationsPanel } from "@/components/features/operations";
import { AutoRefresh } from "@/components/ui/layout/auto-refresh";

import { UI_TEXT } from "@/domain/literales.constantes";
import { ScanStatus } from "@/domain/models/trading";
import { createApplicationDependencies } from "@/infrastructure/composition";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OperacionesPage() {
  const { scanHistoryRepository } = createApplicationDependencies();

  const [operaciones, scanStatus] = await Promise.all([
    obtenerOperacionesActivasAction(),
    scanHistoryRepository.getLatestScanStatus().catch((error) => {
      console.warn("No se pudo cargar el estado del último escaneo:", error);
      return null as ScanStatus | null;
    }),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-800">
      <AutoRefresh renderedScannedAt={scanStatus?.scannedAt ?? null} />
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">{UI_TEXT.pages.operations.title}</h1>
          <p className="text-slate-500">{UI_TEXT.pages.operations.description}</p>
        </div>

        <OperationsPanel initialOperaciones={operaciones} />
      </div>
    </main>
  );
}
