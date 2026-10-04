import { CompanyScanQuote, StockCandidate } from "@/domain/models/trading";
import { CompanyHistoryPoint } from "@/domain/models/company-history";

export interface ScanHistoryRepositoryPort {
  saveScanResult(companyId: number, stock: StockCandidate, loteId: string): Promise<void>;
  saveScanResults(rows: { companyId: number; stock: StockCandidate; loteId: string }[]): Promise<void>;
  getLatestScanQuotes(): Promise<CompanyScanQuote[]>;
  getRecentCompanyHistory(companyId: number): Promise<CompanyHistoryPoint[]>;
  getLatestOpportunities(): Promise<StockCandidate[]>;
  getAllLatestScanCandidates(): Promise<StockCandidate[]>;
}