import { APP_CONFIG } from "../constants";

export interface Company {
  ticker: string;
  nombre: string;
  precio: number;
  volumen: number;
}

export interface StockCandidate extends Company {
  rsi: number;
  esValido: boolean;
  motivoDescarte?: string;
}

export interface UniverseStock extends Company {
  pais?: string;
  sector?: string;
  industria?: string;
  marketCap: number;
  volumenMedio?: number;
  exchange?: string;
  quoteType?: string;
  categoria?: typeof APP_CONFIG.CATEGORIES.TOP | typeof APP_CONFIG.CATEGORIES.MID;
}