import { APP_CONFIG } from "@/domain/constants";
import { RsiSeriesPoint } from "@/domain/models/backtest";
import { CompanyMetadata, CompanyRecord, CompanyScanQuote, StockCandidate, UniverseStock } from "@/domain/models/trading";
 
export interface CompaniesRepositoryPort {
  saveNewCompanies(stocks: UniverseStock[], categoriaPorDefecto?: "TOP" | "MID"): Promise<void>;
  getCompanies(): Promise<CompanyRecord[]>;
  getSectors(): Promise<string[]>;
  updateCompanyMetadataByTicker(ticker: string, nombre: string, metadata: CompanyMetadata): Promise<void>;
}