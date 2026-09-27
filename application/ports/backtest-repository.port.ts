import { BacktestSummary } from "@/domain/models/backtest";

export interface BacktestRecord extends BacktestSummary {
  fechaActualizacion: string;
}

export interface BacktestRepositoryPort {
  getBacktest(idEmpresa: number): Promise<BacktestRecord | null>;
  saveInitialBacktest(idEmpresa: number, summary: BacktestSummary): Promise<void>;
  updateBacktest(idEmpresa: number, summary: BacktestSummary): Promise<void>;
}