import { AutoRefresh } from "@/components/auto-refresh";
import { SearchReboundsButton } from "@/components/buttons/search-button";
import { ScanStatus, StockCandidate } from "@/domain/models/trading";
import { UI_TEXT } from "@/domain/literales.constantes";
import { createApplicationDependencies } from "@/infrastructure/composition";
import { STRATEGY_CONFIG } from "@/domain/config/strategy.config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OpportunitiesPage() {
  const { scanHistoryRepository } = createApplicationDependencies();

  const [latestOpportunities, scanStatus] = await Promise.all([
    scanHistoryRepository.getLatestOpportunities().catch((error) => {
      console.warn("No se pudo cargar el último lote de oportunidades:", error);
      return [] as StockCandidate[];
    }),
    scanHistoryRepository.getLatestScanStatus().catch((error) => {
      console.warn("No se pudo cargar el estado del último escaneo:", error);
      return null as ScanStatus | null;
    }),
  ]);

  return (
    <main className="min-h-screen p-8">
      <AutoRefresh renderedScannedAt={scanStatus?.scannedAt ?? null} />
      <div className="mx-auto max-w-7xl">
        <SearchReboundsButton
          initialOpportunities={latestOpportunities}
          title={UI_TEXT.pages.opportunities.title}
          description={UI_TEXT.pages.opportunities.description}
          filterThresholds={{
            oversoldRsi: STRATEGY_CONFIG.TRADING.OVERSOLD_THRESHOLD,
            minCurrentRatio: STRATEGY_CONFIG.TRADING.MIN_CURRENT_RATIO,
            maxDebtToEquity: STRATEGY_CONFIG.TRADING.MAX_DEBT_TO_EQUITY,
            minRoe: STRATEGY_CONFIG.TRADING.MIN_ROE,
          }}
        />
      </div>
    </main>
  );
}
