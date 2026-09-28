// application/use-cases/run-backtest.use-case.ts
import { MarketRepositoryPort } from "@/application/ports/market-repository.port";
import { BacktestRepositoryPort } from "@/application/ports/backtest-repository.port";
import { ScanHistoryRepositoryPort } from "@/application/ports/scan-history-repository.port"; // <-- cambiado
import { runBacktest, continueBacktest } from "@/domain/rules/backtest.rules";

export class RunBacktestUseCase {
  constructor(
    private marketRepository: MarketRepositoryPort,
    private backtestRepository: BacktestRepositoryPort,
    private scanHistoryRepository: ScanHistoryRepositoryPort // <-- cambiado (antes companiesRepository: CompaniesRepositoryPort)
  ) {}

  async execute(idEmpresa: number, ticker: string): Promise<void> {
    const existente = await this.backtestRepository.getBacktest(idEmpresa);
    const hoy = new Date().toISOString().split("T")[0];

    if (!existente) {
      const candles = await this.marketRepository.getHistoricalCandles(ticker);
      const summary = runBacktest(candles);
      await this.backtestRepository.saveInitialBacktest(idEmpresa, summary);
      return;
    }

    if (existente.fechaActualizacion === hoy) return;

    const nuevasFilas = await this.scanHistoryRepository.getScanHistorySince(idEmpresa, existente.fechaActualizacion); // <-- cambiado
    if (nuevasFilas.length === 0) return;

    const summary = continueBacktest(existente, nuevasFilas);
    await this.backtestRepository.updateBacktest(idEmpresa, summary);
  }
}