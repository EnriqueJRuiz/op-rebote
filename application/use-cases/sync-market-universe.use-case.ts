// application/use-cases/sync-market-universe.use-case.ts
import { MarketRepositoryPort } from "@/application/ports/market-repository.port";
import { SupabaseCompaniesRepository } from "@/infrastructure/repositories/supabase-companies.repository";

export class SyncMarketUniverseUseCase {
  constructor(
    private readonly marketRepository: MarketRepositoryPort,
    private readonly companiesRepository: SupabaseCompaniesRepository
  ) {}

  async execute(): Promise<void> {
    // 1. Obtenemos el universo actual mediante el puerto (que por debajo usa Yahoo)
    const universe = await this.marketRepository.getInitialUniverse();

    // 2. Guardamos en Supabase únicamente las que no existan
    await this.companiesRepository.saveNewCompanies(universe);
  }
}