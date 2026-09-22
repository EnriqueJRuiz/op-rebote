import { CompanyMetadata, StockCandidate, UniverseStock } from "@/domain/models/trading";
import { SupabaseCompanyRow } from "@/infrastructure/repositories/supabase-companies.types";

export interface CompaniesRepositoryPort {
  saveNewCompanies(stocks: UniverseStock[], categoriaPorDefecto?: "TOP" | "MID"): Promise<void>;
  getCompanies(): Promise<SupabaseCompanyRow[]>;
  updateCompanyMetadataByTicker(ticker: string, nombre: string, metadata: CompanyMetadata): Promise<void>;
  saveScanResult(companyId: number, stock: StockCandidate, loteId: string): Promise<void>;
  getLatestOpportunities(): Promise<StockCandidate[]>;
}