// application/use-cases/run-backtest.use-case.ts
import { MarketRepositoryPort } from "@/application/ports/market-repository.port";
import { BacktestRepositoryPort } from "@/application/ports/backtest-repository.port";
import { ScanHistoryRepositoryPort } from "@/application/ports/scan-history-repository.port";
import { runBacktest, continueBacktest } from "@/domain/rules/backtest.rules";

// Backtests creados antes de la SMA200 se reconstruyen (5 años de histórico) de forma gradual:
// como máximo esta cantidad por ejecución, para no pasarse del tiempo máximo de la función.
const MAX_MIGRATION_REBUILDS_PER_RUN = 60;

export class RunBacktestUseCase {
  private migrationRebuilds = 0;

  constructor(
    private marketRepository: MarketRepositoryPort,
    private backtestRepository: BacktestRepositoryPort,
    private scanHistoryRepository: ScanHistoryRepositoryPort
  ) {}

  async execute(idEmpresa: number, ticker: string): Promise<void> {
    const existente = await this.backtestRepository.getBacktest(idEmpresa);
    const hoy = new Date().toISOString().split("T")[0];

    if (!existente) {
      await this.rebuild(idEmpresa, ticker);
      return;
    }

    // Backtest antiguo sin desglose por SMA200: se reconstruye (con presupuesto por ejecución)
    if (!existente.sobreSma || !existente.bajoSma) {
      if (this.migrationRebuilds >= MAX_MIGRATION_REBUILDS_PER_RUN) return;
      this.migrationRebuilds++;
      await this.rebuild(idEmpresa, ticker);
      return;
    }

    if (existente.fechaActualizacion === hoy) return;

    const nuevasFilas = await this.scanHistoryRepository.getScanHistorySince(idEmpresa, existente.fechaActualizacion);
    if (nuevasFilas.length === 0) return;

    const summary = continueBacktest(
      { ...existente, sobreSma: existente.sobreSma, bajoSma: existente.bajoSma },
      nuevasFilas
    );
    await this.backtestRepository.updateBacktest(idEmpresa, summary);
  }

  private async rebuild(idEmpresa: number, ticker: string): Promise<void> {
    const candles = await this.marketRepository.getHistoricalCandles(ticker);
    const summary = runBacktest(candles);
    await this.backtestRepository.saveInitialBacktest(idEmpresa, summary);
  }
}