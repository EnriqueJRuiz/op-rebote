import { CompanyScanQuote, StockCandidate } from "@/domain/models/trading";
import { RsiSeriesPoint } from "@/domain/models/backtest";

export interface ScanHistoryRepositoryPort {
  saveScanResult(companyId: number, stock: StockCandidate, loteId: string): Promise<void>;
  saveScanResults(rows: { companyId: number; stock: StockCandidate; loteId: string }[]): Promise<void>;
  getLatestScanQuotes(): Promise<CompanyScanQuote[]>;
  getLatestOpportunities(): Promise<StockCandidate[]>;
  getAllLatestScanCandidates(): Promise<StockCandidate[]>;
  getScanHistorySince(companyId: number, sinceFecha: string): Promise<RsiSeriesPoint[]>;
}