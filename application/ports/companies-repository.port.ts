import { CompanyMetadata, CompanyRecord, StockCandidate, UniverseStock } from "@/domain/models/trading";

export interface CompaniesRepositoryPort {
  saveNewCompanies(stocks: UniverseStock[], categoriaPorDefecto?: "TOP" | "MID"): Promise<void>;
  getCompanies(): Promise<CompanyRecord[]>;
  updateCompanyMetadataByTicker(ticker: string, nombre: string, metadata: CompanyMetadata): Promise<void>;
  saveScanResult(companyId: number, stock: StockCandidate, loteId: string): Promise<void>;
  getLatestOpportunities(): Promise<StockCandidate[]>;
}