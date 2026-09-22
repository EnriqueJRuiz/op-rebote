// application/ports/market-repository.port.ts
import { CompanyMetadata, StockCandidate, UniverseStock } from "@/domain/models/trading";

export interface MarketRepositoryPort {
  // Contrato: Dado un ticker, devuelve los datos necesarios para evaluar el rebote
  getStockData(ticker: string): Promise<StockCandidate>;

  getInitialUniverse(): Promise<UniverseStock[]>;

  getCompanySnapshot(ticker: string, includeMetadata?: boolean): Promise<{
    stock: StockCandidate;
    metadata?: CompanyMetadata;
  }>;
}