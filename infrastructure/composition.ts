import { ScanMarketUseCase } from "@/application/use-cases/scan-market.use-case";
import { SyncMarketUniverseUseCase } from "@/application/use-cases/sync-market-universe.use-case";
import { SupabaseCompaniesRepository } from "@/infrastructure/repositories/supabase-companies.repository";
import { YahooFinanceAdapter } from "@/infrastructure/yahoo-finance/yahoo-finance.adapter";
import { SupabaseBacktestRepository } from "@/infrastructure/repositories/supabase-backtest.repository";
import { RunBacktestUseCase } from "@/application/use-cases/run-backtest.use-case";
import { SupabaseScanHistoryRepository } from "./repositories/supabase-scan-history.repository";

export function createApplicationDependencies() {
  const marketRepository = new YahooFinanceAdapter();
  const companiesRepository = new SupabaseCompaniesRepository();
  const scanHistoryRepository = new SupabaseScanHistoryRepository();
  const backtestRepository = new SupabaseBacktestRepository();

  return {
    marketRepository,
    companiesRepository,
    scanHistoryRepository,
    scanMarket: new ScanMarketUseCase(marketRepository),
    syncMarketUniverse: new SyncMarketUniverseUseCase(marketRepository, companiesRepository),
    runBacktest: new RunBacktestUseCase(marketRepository, backtestRepository),
  };
}

