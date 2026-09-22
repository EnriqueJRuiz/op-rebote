import { ScanMarketUseCase } from "@/application/use-cases/scan-market.use-case";
import { SyncMarketUniverseUseCase } from "@/application/use-cases/sync-market-universe.use-case";
import { SupabaseCompaniesRepository } from "@/infrastructure/repositories/supabase-companies.repository";
import { YahooFinanceAdapter } from "@/infrastructure/yahoo-finance/yahoo-finance.adapter";

export function createApplicationDependencies() {
  const marketRepository = new YahooFinanceAdapter();
  const companiesRepository = new SupabaseCompaniesRepository();

  return {
    marketRepository,
    companiesRepository,
    scanMarket: new ScanMarketUseCase(marketRepository),
    syncMarketUniverse: new SyncMarketUniverseUseCase(marketRepository, companiesRepository),
  };
}
