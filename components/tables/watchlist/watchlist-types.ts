import { CompanyRecord, CompanyScanQuote, StockCandidate } from "@/domain/models/trading";

export interface WatchlistTableProps {
  candidates: StockCandidate[];
  allCompanies: CompanyRecord[];
  scanQuotes: CompanyScanQuote[];
}

export interface WatchlistRowData {
  idEmpresa?: number;
  ticker: string;
  nombre: string;
  precio: number;
  precioAnterior?: number;
  rsi?: number;
  volumen?: number;
  volumenRelativo?: number;
  minimoReciente?: number;
  sma200?: number;
  distSma200Pct?: number;
  sector?: string;
  moneda?: string;
  categoria?: string;
  esValido?: boolean;
  backtestCasos?: number;
  backtestExitoPct?: number;
  backtestPerdidoPct?: number;
  backtestEstancadoPct?: number;
  backtestDiasMedios?: number;
  backtestSobreSma?: { casos: number; exitoPct: number };
  backtestBajoSma?: { casos: number; exitoPct: number };
}
