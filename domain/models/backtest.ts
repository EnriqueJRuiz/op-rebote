// domain/models/backtest.ts
export interface HistoricalCandle {
  fecha: string;
  precio: number;
  alto: number;
  bajo: number;
  volumen: number;
}

export const BACKTEST_ALGORITHM_VERSION = 2;

export interface RsiSeriesPoint {
  fecha: string;
  precio: number;
  alto?: number;
  bajo?: number;
  volumen: number;
  rsi: number;
  volumenRelativo?: number;
  distanciaSueloPct?: number;
  /** Media móvil simple de 200 sesiones; null si aún no hay 200 sesiones de histórico. */
  sma200?: number | null;
}

export type BacktestFilterId =
  | "rsi25"
  | "rsiRising"
  | "rvolAboveAverage"
  | "nearRecentLow"
  | "aboveSma200"
  | "nearSma200"
  | "belowSma200";

export interface BacktestFilterStats {
  casos: number;
  ganados: number;
  perdidos: number;
  estancados: number;
  diasSuma: number;
}

export interface BacktestComparisonPeriod {
  base: BacktestFilterStats;
  filtros: Record<BacktestFilterId, BacktestFilterStats>;
}

export interface BacktestFilterComparisons {
  fechaInicioValidacion?: string;
  entrenamiento: BacktestComparisonPeriod;
  validacion: BacktestComparisonPeriod;
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
  metodologiaVersion: number;
  comparativasFiltros: BacktestFilterComparisons;
}