import { ScanMarketUseCase } from "@/application/use-cases/scan-market.use-case";
import { SyncMarketUniverseUseCase } from "@/application/use-cases/sync-market-universe.use-case";
import { SupabaseCompaniesRepository } from "@/infrastructure/repositories/supabase-companies.repository";
import { YahooFinanceAdapter } from "@/infrastructure/yahoo-finance/yahoo-finance.adapter";
import { SupabaseBacktestRepository } from "@/infrastructure/repositories/supabase-backtest.repository";
import { RunBacktestUseCase } from "@/application/use-cases/run-backtest.use-case";
import { SupabaseScanHistoryRepository } from "./repositories/supabase-scan-history.repository";
import { SupabaseOperacionesRepository } from "@/infrastructure/repositories/supabase-operaciones.repository";
import { GetActiveOperationsUseCase } from "@/application/use-cases/get-active-operations.use-case";
import { OpenOperationUseCase } from "@/application/use-cases/open-operation.use-case";
import { CloseOperationUseCase , GetClosedOperationsUseCase} from "@/application/use-cases/close-operation.use-case";
import { ScanReboundsUseCase } from "@/application/use-cases/scan-rebounds.use-case";

export function createApplicationDependencies() {
  const marketRepository = new YahooFinanceAdapter();
  const companiesRepository = new SupabaseCompaniesRepository();
  const scanHistoryRepository = new SupabaseScanHistoryRepository();
  const backtestRepository = new SupabaseBacktestRepository();
  const operacionesRepository = new SupabaseOperacionesRepository();

  return {
    marketRepository,
    companiesRepository,
    scanHistoryRepository,
    scanMarket: new ScanMarketUseCase(marketRepository),
    syncMarketUniverse: new SyncMarketUniverseUseCase(marketRepository, companiesRepository),
    runBacktest: new RunBacktestUseCase(marketRepository, backtestRepository),
    getActiveOperations: new GetActiveOperationsUseCase(operacionesRepository, scanHistoryRepository),
    getClosedOperations: new GetClosedOperationsUseCase(operacionesRepository),
    openOperation: new OpenOperationUseCase(operacionesRepository),
    closeOperation: new CloseOperationUseCase(operacionesRepository), // <-- Utiliza aquí la clase importada
    scanRebounds: new ScanReboundsUseCase(
      marketRepository,
      companiesRepository,
      scanHistoryRepository,
      new ScanMarketUseCase(marketRepository),
      new RunBacktestUseCase(marketRepository, backtestRepository),
    ),
  };
}