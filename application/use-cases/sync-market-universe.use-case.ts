// application/use-cases/sync-market-universe.use-case.ts
import { MarketRepositoryPort } from "@/application/ports/market-repository.port";
import { CompaniesRepositoryPort } from "@/application/ports/companies-repository.port";

export class SyncMarketUniverseUseCase {
  constructor(
    private readonly marketRepository: MarketRepositoryPort,
    private readonly companiesRepository: CompaniesRepositoryPort
  ) {}

  async execute(): Promise<number> {
    // 1. Obtenemos el universo actual mediante el puerto (que por debajo usa Yahoo)
    const universe = await this.marketRepository.getInitialUniverse();

    // 2. Guardamos en Supabase únicamente las que no existan
    await this.companiesRepository.saveNewCompanies(universe);
    return universe.length;
  }
}