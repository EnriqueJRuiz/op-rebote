// application/ports/market-repository.port.ts
import { StockCandidate, UniverseStock } from "@/domain/models/trading";

export interface MarketRepositoryPort {
  // Contrato: Dado un ticker, devuelve los datos necesarios para evaluar el rebote
  getStockData(ticker: string): Promise<StockCandidate>;

  getInitialUniverse(): Promise<UniverseStock[]>;
}