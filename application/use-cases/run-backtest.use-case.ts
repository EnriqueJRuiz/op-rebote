// application/use-cases/run-backtest.use-case.ts
import { MarketRepositoryPort } from "@/application/ports/market-repository.port";
import { BacktestRepositoryPort } from "@/application/ports/backtest-repository.port";
import { BACKTEST_ALGORITHM_VERSION } from "@/domain/models/backtest";
import { runBacktest } from "@/domain/rules/backtest.rules";

export class RunBacktestUseCase {
  constructor(
    private marketRepository: MarketRepositoryPort,
    private backtestRepository: BacktestRepositoryPort
  ) {}

  async execute(idEmpresa: number, ticker: string): Promise<void> {
    const existente = await this.backtestRepository.getBacktest(idEmpresa);
    const hoy = new Date().toISOString().split("T")[0];

    if (
      existente?.fechaActualizacion === hoy &&
      existente.metodologiaVersion === BACKTEST_ALGORITHM_VERSION &&
      existente.comparativasFiltros !== undefined
    ) return;

    // Rebuild from daily OHLC candles; scan history only stores intraday closes.
    await this.rebuild(idEmpresa, ticker);
  }

  private async rebuild(idEmpresa: number, ticker: string): Promise<void> {
    const candles = await this.marketRepository.getHistoricalCandles(ticker);
    const summary = runBacktest(candles);
    await this.backtestRepository.saveInitialBacktest(idEmpresa, summary);
  }
}