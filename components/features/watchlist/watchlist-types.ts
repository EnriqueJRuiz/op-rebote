import { CompanyRecord, CompanyScanQuote, StockCandidate } from "@/domain/models/trading";

export interface WatchlistTableProps {
  candidates: StockCandidate[];
  allCompanies: CompanyRecord[];
  scanQuotes: CompanyScanQuote[];
}

export interface WatchlistRowData {
  // Ficha de la empresa en la tabla de Mercado: aporta logo, bolsa, tipo de activo y dividendos a la celda de nombre.
  empresa?: CompanyRecord;
  idEmpresa?: number;
  ticker: string;
  nombre: string;
  precio: number;
  precioAnterior?: number;
  rsi?: number;
  volumen?: number;
  volumenRelativo?: number;
  minimoReciente?: number;
  distSueloAnteriorPct?: number;
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
