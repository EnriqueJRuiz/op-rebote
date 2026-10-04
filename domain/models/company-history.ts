export interface CompanyHistoryPoint {
  timestamp: string;
  precio: number | null;
  rsi: number | null;
  volumen: number | null;
  volumen_relativo: number | null;
  rsi_anterior: number | null;
  capitalizacion: number | null;
  minimo_reciente: number | null;
  sma200: number | null;
  dist_sma200_pct: number | null;
  precio_anterior: number | null;
}
