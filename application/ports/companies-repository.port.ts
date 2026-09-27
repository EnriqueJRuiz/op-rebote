import { RsiSeriesPoint } from "@/domain/models/backtest";
import { CompanyMetadata, CompanyRecord, CompanyScanQuote, StockCandidate, UniverseStock } from "@/domain/models/trading";
 
export interface CompaniesRepositoryPort {
  saveNewCompanies(stocks: UniverseStock[], categoriaPorDefecto?: "TOP" | "MID"): Promise<void>;
  getCompanies(): Promise<CompanyRecord[]>;
  getSectors(): Promise<string[]>;
  updateCompanyMetadataByTicker(ticker: string, nombre: string, metadata: CompanyMetadata): Promise<void>;
  saveScanResult(companyId: number, stock: StockCandidate, loteId: string): Promise<void>;
  getLatestScanQuotes(): Promise<CompanyScanQuote[]>;
  getLatestOpportunities(): Promise<StockCandidate[]>;
  getScanHistorySince(companyId: number, sinceFecha: string): Promise<RsiSeriesPoint[]>;
}