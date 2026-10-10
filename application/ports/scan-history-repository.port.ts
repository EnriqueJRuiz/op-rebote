import { CompanyScanQuote, ScanStatus, StockCandidate } from "@/domain/models/trading";
import { CompanyHistoryPoint } from "@/domain/models/company-history";
import { BullishImpulseSample } from "@/domain/models/bullish-impulse";

export interface ScanHistoryRepositoryPort {
  saveScanResult(companyId: number, stock: StockCandidate, loteId: string): Promise<void>;
  saveScanResults(rows: { companyId: number; stock: StockCandidate; loteId: string }[]): Promise<void>;
  getLatestScanQuotes(): Promise<CompanyScanQuote[]>;
  getLatestScanStatus(): Promise<ScanStatus | null>;
  getRecentCompanyHistory(companyId: number): Promise<CompanyHistoryPoint[]>;
  getRecentBullishImpulseSamples(since: string): Promise<BullishImpulseSample[]>;
  getLatestOpportunities(): Promise<StockCandidate[]>;
  getAllLatestScanCandidates(): Promise<StockCandidate[]>;
}