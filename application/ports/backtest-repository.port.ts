import { BacktestSummary } from "@/domain/models/backtest";

/**
 * Registro leído de BD. sobreSma / bajoSma pueden faltar en backtests antiguos
 * (creados antes de la SMA200): en ese caso se reconstruyen desde el histórico.
 */
export interface BacktestRecord extends Omit<BacktestSummary, "sobreSma" | "bajoSma"> {
  fechaActualizacion: string;
  sobreSma?: BacktestSummary["sobreSma"];
  bajoSma?: BacktestSummary["bajoSma"];
}

export interface BacktestRepositoryPort {
  getBacktest(idEmpresa: number): Promise<BacktestRecord | null>;
  saveInitialBacktest(idEmpresa: number, summary: BacktestSummary): Promise<void>;
  updateBacktest(idEmpresa: number, summary: BacktestSummary): Promise<void>;
}