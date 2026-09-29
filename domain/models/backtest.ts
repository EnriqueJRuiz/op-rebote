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
  /** Media móvil simple de 200 sesiones; null si aún no hay 200 sesiones de histórico. */
  sma200?: number | null;
}

/** Resultados acumulados de un grupo de señales (por encima o por debajo de la SMA200). */
export interface BacktestGroup {
  casos: number;
  ganados: number;
  perdidos: number;
  estancados: number;
  diasSuma: number;
}

export interface PendingSignal {
  fecha: string;
  precio: number;
  /** true = precio >= SMA200 al dar la señal, false = por debajo, null = sin dato de SMA200. */
  sobreSma: boolean | null;
}

export interface BacktestSummary {
  casosTotales: number;
  ganados: number;
  perdidos: number;
  estancados: number;
  diasSuma: number;
  pendientes: PendingSignal[];
  sobreSma: BacktestGroup;
  bajoSma: BacktestGroup;
}