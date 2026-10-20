
import { CompanyMetadata, CompanyRecord, UniverseStock } from "@/domain/models/trading";
 
export interface CompaniesRepositoryPort {
  saveNewCompanies(stocks: UniverseStock[], categoriaPorDefecto?: "TOP" | "MID"): Promise<void>;
  getCompanies(): Promise<CompanyRecord[]>;
  getSectors(): Promise<string[]>;
  updateCompanyMetadataByTicker(ticker: string, nombre: string, metadata: CompanyMetadata): Promise<void>;
}