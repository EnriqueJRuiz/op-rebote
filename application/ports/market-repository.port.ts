// application/ports/market-repository.port.ts
import { HistoricalCandle } from "@/domain/models/backtest";
import { IntradayBar } from "@/domain/models/intraday";
import { CompanyMetadata, CompanySearchMatch, StockCandidate, UniverseStock } from "@/domain/models/trading";

export interface MarketRepositoryPort {
  // Contrato: Dado un ticker, devuelve los datos necesarios para evaluar el rebote
  getStockData(ticker: string): Promise<StockCandidate>;

  getInitialUniverse(): Promise<UniverseStock[]>;

  searchCompanies(query: string): Promise<CompanySearchMatch[]>;

  getCompanySnapshot(ticker: string, includeMetadata?: boolean): Promise<{
    stock: StockCandidate;
    metadata?: CompanyMetadata;
  }>;

  getHistoricalCandles(ticker: string): Promise<HistoricalCandle[]>;

  // Velas intradía reales (5 min) de los últimos días, con pre-market y after-hours.
  getIntradayBars(ticker: string): Promise<IntradayBar[]>;
}