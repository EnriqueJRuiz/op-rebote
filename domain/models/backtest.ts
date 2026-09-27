export interface HistoricalCandle {
  fecha: string;
  precio: number;
  alto: number;
  bajo: number;
  volumen: number;
}

export interface RsiSeriesPoint {
  fecha: string;
  precio: number;
  volumen: number;
  rsi: number;
}

export interface BacktestSummary {
  casosTotales: number;
  ganados: number;
  perdidos: number;
  estancados: number;
  diasSuma: number;
  pendientes: { fecha: string; precio: number }[];
}